// Inference worker — owns the QVAC SDK and the loaded model.
//
// This runs in its own Bare thread (see lib/inference.js), for two reasons:
//
//   1. Loading a GGUF model blocks the thread it runs on for seconds. Off the
//      UI thread, the spinner keeps spinning and keys keep responding.
//   2. A native addon that crashes takes down its thread, not the terminal.
//
// It speaks the same framed-JSON dialect as workers/main.js: one JSON object
// per frame, `t` is the tag.
//
//   in   { t: 'ask',    id, history }   history is [{ role, content }, ...]
//        { t: 'cancel', id }
//        { t: 'close' }                 unload and shut down
//
//   out  { t: 'progress', percentage }  model download, 0-100
//        { t: 'loaded',   model, ctxSize }
//        { t: 'thinking', id, text }    reasoning from a thinking model
//        { t: 'delta',    id, text }    one token (or token run) of the answer
//        { t: 'end',      id, stopReason }
//        { t: 'error',    id, message }
//        { t: 'closed' }                safe to terminate the thread
const FramedStream = require('framed-stream')
const { isBareKit } = require('which-runtime')
const fs = require('bare-fs')
const os = require('bare-os')
const path = require('bare-path')
const process = require('bare-process')

// Mobile has no argv[0]/argv[1], so the offset differs — same trick the
// updater worker uses to stay portable.
const argv = (index) => Bare.argv[index + (isBareKit ? 0 : 2)]

const modelName = argv(0) || 'LLAMA_3_2_1B_INST_Q4_0'

// The addon's default context window is 1024 tokens, which is small enough
// that a couple of turns of history leave no room for a reply and answers stop
// mid-sentence. Everything the model may hold at once — system prompt, the
// whole conversation, its reasoning, and the answer it is writing — has to fit
// in here, so this is the single most important knob in the template.
const ctxSize = Number(argv(1)) || 8192

// Verbose engine and native (llama.cpp/ggml) logging. It goes to stderr, where
// llama.cpp's own banner already goes, and where it can be redirected away with
// `2> qvac.log`: stdout is the TUI's, and bare-tui aborts the moment it is not a
// TTY, so these can never share it. Left on the terminal it paints over the
// alt-screen, so this is a diagnostic mode, not something to leave on.
const verbose = argv(2) === '1'

const pipe = new FramedStream(Bare.IPC)
const send = (msg) => pipe.write(JSON.stringify(msg))

// Best-effort: diagnostics must never take the worker down.
function log(line) {
  if (!verbose) return
  try {
    console.error(`[qvac] ${line}`)
  } catch {}
}

// ── ggml CPU backend ──────────────────────────────────────────────────────
//
// In a bundled build -- `bare-build --standalone`, or any `bare-pack` bundle --
// @qvac/llm-llamacpp derives its ggml backends directory from `__dirname`,
// which inside a bundle is a path *in* the bundle rather than a real directory.
// ggml's existence check on it fails, so it never enumerates the directory and
// never scores and selects a CPU variant. The only CPU libraries built are
// microarch-tagged (`-alderlake`, `-zen4`, ...), so the plain-name fallback
// finds nothing either and no CPU backend registers at all. llama.cpp needs a
// CPU device for host buffers even when every layer is offloaded to the GPU, so
// the load then fails -- reported, misleadingly, as "failed to fit params to
// free device memory", one line after a healthy Vulkan banner.
//
// ggml reads GGML_BACKEND_PATH regardless of that directory and loads the one
// backend library it names, which restores the missing CPU device without
// touching the addon.
//
// Which library to load is per-architecture: no host ships a plain
// `libqvac-ggml-cpu.so`, only microarch-tagged builds, and the tags differ by
// architecture. What the addon actually carries:
//
//   x64    (14)  x64, sse42, sandybridge, ivybridge, haswell, skylakex,
//                alderlake, zen4, piledriver, cannonlake, cascadelake,
//                cooperlake, icelake, sapphirerapids
//   arm64   (5)  armv8.0_1, armv8.2_1, armv8.2_2, armv8.6_1, armv9.2_1
//                and, on android, the same list prefixed `android_`
//
// Take the baseline for the architecture -- the build with the lowest ISA
// requirement, which every CPU of that architecture can run. Measured here:
// with the default `gpu_layers: 99` llama.cpp reports "offloaded 17/17 layers
// to GPU" and an identical 205.49 MiB CPU_Mapped buffer whichever variant is
// loaded, so the CPU device supplies host buffers and computes no layer, and a
// microarch-tuned build gains nothing. On a machine with no usable GPU the
// compute does fall back to the CPU; set GGML_BACKEND_PATH explicitly there,
// which is honoured below.
const CPU_BASELINES = {
  x64: ['x64'],
  arm64: ['armv8.0_1', 'android_armv8.0_1']
}

// Says, in one greppable place, whether a CPU device is actually available --
// the question behind the misleading "failed to fit params to free device
// memory". Without a CPU backend llama.cpp has nowhere to put host buffers and
// the load fails however healthy the GPU looks.
function logBackendVerdict() {
  if (!verbose) return

  for (const line of loadedBackends) log(`backend: ${line}`)

  if (loadedBackends.length === 0) {
    log('cpu backend: UNKNOWN -- the engine reported no backend loads at all')
  } else if (loadedBackends.some((line) => /cpu backend/i.test(line))) {
    log('cpu backend: OK -- a CPU device is registered')
  } else {
    log(
      'cpu backend: NOT LOADED -- this CPU does not support the pinned library, ' +
        'or the path is wrong; set GGML_BACKEND_PATH to a variant this machine supports'
    )
  }
}

// Returns a line worth logging, or null when there was nothing to do.
function selectCpuBackend() {
  // An explicit setting wins -- the escape hatch for a CPU-only machine.
  if (process.env.GGML_BACKEND_PATH) {
    return `GGML_BACKEND_PATH already set, leaving it alone: ${process.env.GGML_BACKEND_PATH}`
  }

  // Only linux and android ship the ggml backends as sibling .so files. Apple
  // and Windows targets link them into the addon and were never affected.
  const platform = os.platform()
  if (platform !== 'linux' && platform !== 'android') return null

  // Does the addon's own `__dirname`-derived guess land on a real directory?
  // Unbundled it does, and ggml enumerates and scores the variants by itself,
  // so this stays out of the way -- and switches itself off for good once a
  // fixed @qvac/llm-llamacpp ships.
  let pkgDir
  try {
    pkgDir = path.dirname(require.resolve('@qvac/llm-llamacpp'))
  } catch {
    return null
  }
  if (fs.existsSync(path.join(pkgDir, 'prebuilds'))) return null

  // IMPORTANT: keep this a literal `require.addon.resolve(...)` call. bare-pack
  // resolves addons by *statically* traversing this expression at pack time;
  // hoisting it into a variable or calling it indirectly makes the traversal
  // miss it, and the call then throws ADDON_NOT_FOUND at runtime in a bundle.
  let addonPath
  try {
    addonPath = require.addon.resolve('@qvac/llm-llamacpp')
  } catch (err) {
    return `could not resolve the llamacpp addon (${err.message}); leaving ggml to its own search`
  }

  log(`addon (bundled) resolves to ${addonPath}`)
  log(`addon package dir in the bundle is ${pkgDir} (has no real prebuilds/)`)

  const arch = os.arch()
  const baselines = CPU_BASELINES[arch]
  if (baselines === undefined) {
    return `no known ggml CPU baseline for ${platform}-${arch}; leaving ggml to its own search`
  }

  // <...>/prebuilds/<host>/qvac__llm-llamacpp.bare -- the .so files sit in the
  // sibling directory of the same name, or, depending on how the bundle laid
  // them out, directly beside the addon.
  const hostDir = path.dirname(addonPath)
  const so = [path.join(hostDir, path.basename(addonPath).replace(/\.bare$/, '')), hostDir]
    .flatMap((dir) => baselines.map((name) => path.join(dir, `libqvac-ggml-cpu-${name}.so`)))
    .find((candidate) => fs.existsSync(candidate))

  // Nothing matched: a host whose CPU builds are named differently again. ggml's
  // own search still has a chance, and a library for the wrong ISA would not.
  if (so === undefined) {
    return `no ${arch} ggml CPU baseline beside ${addonPath}; leaving ggml to its own search`
  }

  process.env.GGML_BACKEND_PATH = so
  return `bundled build: ggml CPU backend pinned to ${so}`
}

// The QVAC SDK is ESM-only and this worker is CommonJS, so it comes in through
// a dynamic import. Resolved once in boot(), then reused.
let sdk = null
let modelId = null
let unsubscribeLogs = null

// ggml's own `load_backend:` lines, collected from the engine log stream. They
// are the only direct confirmation that a backend library was accepted for this
// machine: pinning a path only says the file exists, while a library built for
// an ISA this CPU lacks fails here, at dlopen/score time.
const loadedBackends = []

// id -> requestId, so `cancel` can target one specific in-flight completion
// rather than every request on the model.
const inflight = new Map()

async function boot() {
  sdk = await import('@qvac/inference')
  const { llmPlugin } = await import('@qvac/inference/llamacpp-completion/plugin')

  // Plugins are explicit in QVAC: register the engine you intend to use and
  // nothing else is linked in. Swap this pair of lines to run a different
  // engine (whispercpp-transcription, llamacpp-embedding, tts-ggml, ...).
  sdk.registerPlugin(llmPlugin)

  // After registerPlugin, always: subscribeServerLogs opens a stream on the
  // engine, and the engine rejects every call made before a plugin is
  // registered. Wrapped whole because the logging surface moves between SDK
  // versions, and a diagnostic must not take the model load down with it.
  if (verbose) {
    try {
      // Level control lives on the ./logging subpath, not the SDK root.
      const logging = await import('@qvac/inference/logging')
      logging.setGlobalLogLevel?.('debug')
    } catch (err) {
      log(`could not raise the SDK log level: ${err.message}`)
    }

    try {
      // One stream carries the engine's own logs and the per-model addon logs.
      // The addon's "Creating addon with configuration:" line is the one that
      // matters here — it prints the absolute gguf path and the backendsDir the
      // addon actually resolved.
      unsubscribeLogs = sdk.subscribeServerLogs((entry) => {
        const message = String(entry.message ?? '')
        if (message.includes('load_backend:')) loadedBackends.push(message.trim())
        log(`[${entry.level}] ${entry.id} ${entry.namespace}: ${message}`)
      })
    } catch (err) {
      log(`could not subscribe to engine logs: ${err.message}`)
    }
  }

  const modelSrc = sdk[modelName]
  if (!modelSrc) throw new Error(`Unknown model: ${modelName}`)

  log(`loading ${modelName} (ctx_size=${ctxSize}) from ${JSON.stringify(modelSrc)}`)

  modelId = await sdk.loadModel({
    modelSrc,
    // verbosity is the addon's own native log level: 0=ERROR (default), 3=DEBUG.
    modelConfig: { ctx_size: ctxSize, ...(verbose && { verbosity: 3 }) },
    onProgress: ({ percentage }) => send({ t: 'progress', percentage })
  })

  logBackendVerdict()
  log(`model loaded as ${modelId}`)
  send({ t: 'loaded', model: modelName, ctxSize })
}

async function ask(id, history) {
  // `completion` returns synchronously; `requestId` is available immediately so
  // a cancel that arrives mid-answer can find this run.
  //
  // captureThinking splits a reasoning model's `<think>` block out of the
  // answer. Without it the tags arrive verbatim in the content — shown to the
  // user, and then fed back as history, where they burn context for nothing.
  const run = sdk.completion({ modelId, history, captureThinking: true })
  inflight.set(id, run.requestId)

  try {
    for await (const event of run.events) {
      if (event.type === 'contentDelta') send({ t: 'delta', id, text: event.text })
      else if (event.type === 'thinkingDelta') send({ t: 'thinking', id, text: event.text })
    }

    // `run.events` ends normally even when the run failed or was cut short at
    // the context limit — the reason only surfaces here. Reporting a bare
    // "finished" after the loop is what makes a truncated answer look complete.
    const final = await run.final
    send({ t: 'end', id, stopReason: final.stopReason || 'eos' })
  } catch (err) {
    // Cancelling rejects `final` with the partial answer attached; that's an
    // outcome, not a failure.
    if (err instanceof sdk.InferenceCancelledError) {
      send({ t: 'end', id, stopReason: 'cancelled' })
    } else {
      send({ t: 'error', id, message: err.message })
    }
  } finally {
    inflight.delete(id)
  }
}

function cancel(id) {
  const requestId = inflight.get(id)
  if (requestId) sdk.cancel({ requestId }).catch(noop)
}

// A resident model holds native handles that keep this thread — and so the
// whole process — alive. Unload before going away, or the app hangs on exit
// instead of quitting.
let closing = null
function shutdown() {
  if (closing) return closing

  closing = (async () => {
    try {
      unsubscribeLogs?.()
      if (sdk) {
        if (modelId) await sdk.unloadModel({ modelId })
        await sdk.close()
      }
    } catch {
      // Shutting down anyway — a failure here must not strand the caller.
    }
    send({ t: 'closed' })
  })()

  return closing
}

pipe.on('data', (data) => {
  let msg
  try {
    msg = JSON.parse(data.toString())
  } catch {
    return
  }

  if (msg.t === 'ask') ask(msg.id, msg.history).catch(noop)
  else if (msg.t === 'cancel') cancel(msg.id)
  else if (msg.t === 'close') shutdown()
})

// Must run before the SDK — and so the addon — is imported: ggml reads
// GGML_BACKEND_PATH when it first registers its backends.
try {
  const selected = selectCpuBackend()
  if (selected) log(selected)
} catch (err) {
  log(`CPU backend selection failed (${err.message}); leaving ggml to its own search`)
}

boot().catch((err) => {
  // The verdict matters most here: this is the failure it explains.
  logBackendVerdict()
  log(`boot failed: ${err.stack || err.message}`)
  send({ t: 'error', message: err.message })
})

function noop() {}
