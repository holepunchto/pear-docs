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

const pipe = new FramedStream(Bare.IPC)
const send = (msg) => pipe.write(JSON.stringify(msg))

// The QVAC SDK is ESM-only and this worker is CommonJS, so it comes in through
// a dynamic import. Resolved once in boot(), then reused.
let sdk = null
let modelId = null

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

  const modelSrc = sdk[modelName]
  if (!modelSrc) throw new Error(`Unknown model: ${modelName}`)

  modelId = await sdk.loadModel({
    modelSrc,
    modelConfig: { ctx_size: ctxSize },
    onProgress: ({ percentage }) => send({ t: 'progress', percentage })
  })

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

boot().catch((err) => send({ t: 'error', message: err.message }))

function noop() {}
