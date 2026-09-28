import { command, flag, summary } from 'paparam'
import { persistent } from 'bare-storage'
import { Program } from 'bare-tui'
import { wire } from 'bare-tui-updater/pear'
import process from 'bare-process'
import os from 'bare-os'
import { isWindows } from 'which-runtime'
import path from 'bare-path'
import pkg from './package.json'
import App from './app.js'
import Inference from './lib/inference.js'
import { App as UI } from './ui/app.js'

const appName = pkg.productName || pkg.name
const isDev = path.basename(Bare.argv[0]) === (isWindows ? 'bare.exe' : 'bare')

const cmd = command(
  appName,
  summary(pkg.description),
  flag('--version|-v', 'Print the current version'),
  flag('--storage <dir>', 'custom storage directory'),
  flag('--model <name>', 'QVAC model constant to load'),
  flag('--ctx <tokens>', 'context window in tokens (default 8192)'),
  flag('--no-updates', 'disable OTA updates for this run'),
  flag('--verbose', 'log engine and native addon detail to stderr')
)

cmd.parse(Bare.argv.slice(isDev ? 2 : 1))
if (cmd.flags.help) Bare.exit()
if (cmd.flags.version) {
  console.log(`${appName} v${pkg.version}`)
  Bare.exit()
}

const updates = cmd.flags.updates
const storage = cmd.flags.storage || (isDev ? null : path.join(persistent(), appName))
const dir = storage || path.join(os.tmpdir(), 'pear', appName)
const model = cmd.flags.model || pkg.qvac.model
const ctxSize = Number(cmd.flags.ctx) || pkg.qvac.ctxSize

const verbose = cmd.flags.verbose === true

// The updater needs a real Pear key. Until you publish and paste yours into
// package.json's "upgrade", running it would throw inside the worker thread —
// and pear-runtime turns a worker throw into a hard process exit, which no
// try/catch here could catch. So skip it and say so in the transcript.
const configured = !pkg.upgrade.includes('<')
const updating = updates !== false && configured

// Two workers, same pattern: OTA updates and inference each run in their own
// Bare thread and talk over a FramedStream.
const app = updating
  ? new App({
      dir,
      app: isDev ? null : os.execPath(),
      updates,
      version: pkg.version,
      upgrade: pkg.upgrade,
      name: isWindows ? appName + '.exe' : appName
    })
  : null

const inference = new Inference({ model, ctxSize, verbose })

const ui = new UI({
  inference,
  model,
  version: pkg.version,
  // The banner is the confirm gate: app.js stages the update but never applies
  // it, so nothing swaps out from under a conversation until the user says so.
  onApplyUpdate: app ? () => app.applyUpdate() : null
})
const program = new Program(ui, { mouse: true })

// ── bridge ────────────────────────────────────────────────────────────────
//
// Everything the outside world has to say reaches the UI as a message. The UI
// model stays pure and synchronous; this is the only place the two meet.

inference.on('progress', (percentage) => program.send({ type: 'qvac.progress', percentage }))
inference.on('thinking', (id, text) => program.send({ type: 'qvac.thinking', id, text }))
inference.on('delta', (id, text) => program.send({ type: 'qvac.delta', id, text }))
inference.on('end', (id, stopReason) => program.send({ type: 'qvac.end', id, stopReason }))
inference.on('answer-error', (id, message) => repaint({ type: 'qvac.error', id, message }))
inference.on('error', (err) => repaint({ type: 'qvac.error', message: err.message }))

// Send a Msg *and* force the next frame to repaint every row.
//
// llama.cpp/ggml write their banner ("ggml_vulkan: Found 1 Vulkan devices…")
// straight to fd 2 with fprintf, below any JS logger — the SDK's `logger`
// option and `modelConfig.verbosity` don't gate them, and Bare has no dup2 to
// redirect the fd. The updates worker logs to fd 1 the same way. Sharing our
// thread, they land on the alt-screen, and an alt-screen that scrolled puts
// every absolute row address the renderer uses permanently out — a row whose
// text doesn't change again is then never repainted, so the screen keeps
// showing state that is long gone. Nothing can stop the writes, so repair the
// display instead, at every point where the outside world has just finished
// talking to the same fd.
function repaint(msg) {
  program.renderer.clear()
  program.send(msg)
}

inference.on('loaded', (loadedModel, loadedCtx) => {
  repaint({ type: 'qvac.loaded', model: loadedModel, ctxSize: loadedCtx })
})

if (app) {
  // The banner has to be readable at the exact moment the updates worker has
  // been logging to fd 1, so announce its state changes with a repaint. Not
  // the progress deltas though — one full repaint per downloaded block is a
  // lot of writing for a line that says the same thing each time.
  const announce = (msg) => (msg.type === 'update.progress' ? program.send(msg) : repaint(msg))

  // App emits the same events pear-runtime's updater does ('updating',
  // 'updated', 'error') plus a `nextVersion`, which is the whole contract
  // wire() needs — so the banner drives itself from here on.
  wire(ui.updater, { updater: app, send: announce })

  app.on('message', (text) => announce({ type: 'app.notice', text }))

  // A staged update is not downloaded on sight — the updater defers the check
  // by a random delay of up to an hour so a released fleet doesn't stampede the
  // seeder. Say so, or the app looks inert for that whole window while it is in
  // fact just waiting.
  //
  // `ms` is an upper bound, not the wait: an append inside the updater's 60s
  // boot grace period is checked with no delay at all, but the event still
  // carries the full random draw. Hence "within", and hence the restart hint —
  // restarting lands inside that window, which is why stopping and starting the
  // app is what makes a staged update show up.
  app.on('update-scheduled', (ms) =>
    announce({
      type: 'app.notice',
      text: `An update is scheduled within ${humanize(ms)}, or restart to claim it`
    })
  )

  // Background updater trouble. It costs a transcript line rather than the
  // banner: a check that can't complete tends to repeat, and a banner that
  // flaps is worse than one that stays quiet until there is something to take.
  app.on('updater-error', (err) =>
    announce({ type: 'app.notice', text: `[updater] ${line(err.message)}` })
  )

  // app.js emits 'error' for a pipe or IPC failure and for a non-zero worker
  // exit. ready() below only covers the opening handshake; an 'error' with no
  // listener is rethrown as an uncaught exception, which no try/catch can
  // reach and which takes the whole app down. Losing OTA updates should cost
  // a line in the transcript, not the session.
  app.on('error', (err) => announce({ type: 'app.notice', text: `[updater] ${line(err.message)}` }))
}

// One transcript entry is one line of chrome: a newline smuggled in from an
// error message would add a row the layout never budgeted for.
function line(text) {
  return String(text).replace(/\s+/g, ' ').trim()
}

// Coarse on purpose: the delay is a random draw the user can do nothing about,
// so the useful part is the order of magnitude, not the seconds.
function humanize(ms) {
  const mins = Math.round(ms / 60000)
  if (mins < 1) return `${Math.max(1, Math.round(ms / 1000))}s`
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  return mins % 60 === 0 ? `${hrs}h` : `${hrs}h ${mins % 60}m`
}

// ── lifecycle ─────────────────────────────────────────────────────────────

function teardown() {
  return Promise.allSettled([inference.close(), app ? app.close() : null])
}

async function shutdown(code = 0) {
  Bare.exitCode = code
  program.quit()
  await teardown()
}

process.on('SIGHUP', () => shutdown(129))
process.on('SIGINT', () => shutdown(130))
process.on('SIGQUIT', () => shutdown(131))
process.on('SIGTERM', () => shutdown(143))

try {
  // Kick the workers off without waiting — the TUI paints its loading state
  // immediately and fills in as the model arrives.
  if (app) {
    app.ready().catch((err) => program.send({ type: 'app.notice', text: `[app] ${err.message}` }))
  } else if (updates !== false) {
    program.send({
      type: 'app.notice',
      text: '[updater] disabled — set "upgrade" in package.json to your pear:// key'
    })
  }

  inference.ready().catch((err) => program.send({ type: 'qvac.error', message: err.message }))

  await program.run()
} finally {
  await teardown()
}
