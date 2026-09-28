// Inference — the UI-side handle on workers/qvac.js.
//
// Deliberately the same shape as app.js (the OTA updater client): a
// ReadyResource that runs a worker, wraps the IPC in a FramedStream, and turns
// frames into events. If you've read one, you've read both.
//
//   const inference = new Inference({ model: 'LLAMA_3_2_1B_INST_Q4_0' })
//   inference.on('progress', (pct) => ...)      // downloading
//   inference.on('loaded', (model, ctx) => ...)  // ready to answer
//   inference.on('thinking', (id, text) => ...)  // reasoning, if the model does it
//   inference.on('delta', (id, text) => ...)     // streaming answer tokens
//   inference.on('end', (id, stopReason) => ...)
//   await inference.ready()
//
//   const id = inference.ask([{ role: 'user', content: 'hi' }])
//   inference.cancel(id)
const FramedStream = require('framed-stream')
const PearRuntime = require('pear-runtime')
const ReadyResource = require('ready-resource')

module.exports = class Inference extends ReadyResource {
  constructor({ model, ctxSize, gracePeriod } = {}) {
    super()

    this.model = model || 'LLAMA_3_2_1B_INST_Q4_0'
    this.ctxSize = ctxSize || 8192
    this.gracePeriod = gracePeriod ?? 5000
    this.loaded = false
    this.percentage = 0

    this.IPC = null
    this.pipe = null

    this._seq = 0

    // Resolves when the worker confirms it has unloaded, or when the grace
    // period runs out — a wedged native unload must not block quitting.
    this._onclosed = null
    this._closed = new Promise((resolve) => {
      this._onclosed = resolve
    })
  }

  _open() {
    this.IPC = PearRuntime.run(require.resolve('../workers/qvac.js'), [
      this.model,
      String(this.ctxSize)
    ])
    this.pipe = new FramedStream(this.IPC)

    this.pipe.on('data', (data) => this._onmessage(data))
    this.pipe.on('error', (err) => this.emit('error', err))
    this.IPC.on('error', (err) => this.emit('error', err))
    this.IPC.on('exit', (code) => {
      if (code === 0 || this.closing !== null || this.closed) return
      this.emit('error', new Error(`Inference worker exited with code ${code}`))
    })
  }

  // Ask the worker to unload the model before tearing the thread down. A
  // resident GGUF holds native handles that keep the process alive, so a bare
  // destroy() here leaves the app hanging at exit instead of quitting.
  async _close() {
    const pipe = this.pipe
    const IPC = this.IPC

    if (pipe !== null) {
      this._send({ t: 'close' })
      await Promise.race([this._closed, timeout(this.gracePeriod)])
    }

    this.pipe = null
    this.IPC = null

    pipe?.destroy()
    IPC?.destroy()
  }

  _onmessage(data) {
    let msg

    try {
      msg = JSON.parse(data.toString())
    } catch {
      return
    }

    switch (msg.t) {
      case 'progress':
        this.percentage = msg.percentage
        this.emit('progress', msg.percentage)
        break
      case 'loaded':
        this.loaded = true
        this.ctxSize = msg.ctxSize || this.ctxSize
        // Not 'ready' — ReadyResource already owns that event name.
        this.emit('loaded', msg.model, this.ctxSize)
        break
      case 'thinking':
        this.emit('thinking', msg.id, msg.text)
        break
      case 'delta':
        this.emit('delta', msg.id, msg.text)
        break
      case 'end':
        this.emit('end', msg.id, msg.stopReason)
        break
      case 'closed':
        this._onclosed()
        break
      case 'error':
        this.emit('answer-error', msg.id, msg.message)
        break
    }
  }

  // Returns the id that every later delta/end/error for this answer carries.
  ask(history) {
    const id = ++this._seq
    this._send({ t: 'ask', id, history })
    return id
  }

  cancel(id) {
    this._send({ t: 'cancel', id })
  }

  _send(msg) {
    if (this.pipe === null) return
    this.pipe.write(JSON.stringify(msg))
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
