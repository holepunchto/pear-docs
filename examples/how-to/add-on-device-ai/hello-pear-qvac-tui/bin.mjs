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
  flag('--no-updates', 'disable OTA updates for this run')
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

const inference = new Inference({ model, ctxSize })

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
inference.on('answer-error', (id, message) => program.send({ type: 'qvac.error', id, message }))
inference.on('error', (err) => program.send({ type: 'qvac.error', message: err.message }))

inference.on('loaded', (loadedModel, loadedCtx) => {
  // llama.cpp/ggml write their banner ("ggml_vulkan: Found 1 Vulkan devices…")
  // straight to fd 2 with fprintf, below any JS logger — the SDK's `logger`
  // option and `modelConfig.verbosity` don't gate them, and Bare has no dup2 to
  // redirect the fd. Sharing our thread, they land on the alt-screen. Nothing
  // can stop that, so repair it instead: drop the renderer's cache once the
  // model is up and the next frame repaints every row.
  program.renderer.clear()
  program.send({ type: 'qvac.loaded', model: loadedModel, ctxSize: loadedCtx })
})

if (app) {
  // App emits the same events pear-runtime's updater does ('updating',
  // 'updated', 'error') plus a `nextVersion`, which is the whole contract
  // wire() needs — so the banner drives itself from here on.
  wire(ui.updater, { updater: app, send: program.send.bind(program) })

  app.on('message', (text) => program.send({ type: 'app.notice', text }))
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
