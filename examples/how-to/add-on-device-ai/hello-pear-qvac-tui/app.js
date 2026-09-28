const FramedStream = require('framed-stream')
const PearRuntime = require('pear-runtime')
const ReadyResource = require('ready-resource')

module.exports = class App extends ReadyResource {
  constructor({ dir, app, updates, version, upgrade, name }) {
    super()

    this.dir = dir
    this.app = app
    this.updates = updates
    this.version = version
    this.upgrade = upgrade
    this.name = name

    this.IPC = null
    this.pipe = null

    // `wire()` from bare-tui-updater reads this when announcing a staged
    // build. hello-pear-worker doesn't forward the version, so it stays null
    // and the banner just says "update ready" without a number.
    this.nextVersion = null

    // Resolves when the worker confirms the staged build was applied.
    this._applying = null
  }

  _open() {
    this.IPC = PearRuntime.run(require.resolve('./workers/main.js'), [
      String(this.updates),
      this.version,
      this.upgrade,
      this.name,
      this.dir,
      this.app || ''
    ])
    this.pipe = new FramedStream(this.IPC)

    this.pipe.on('data', (data) => this._onmessage(data))
    this.pipe.on('error', (err) => this.emit('error', err))
    this.IPC.on('error', (err) => this.emit('error', err))
    this.IPC.on('exit', (code) => {
      if (code === 0 || this.closing !== null || this.closed) return
      this.emit('error', new Error(`Updates worker exited with code ${code}`))
    })
  }

  _close() {
    const pipe = this.pipe
    const IPC = this.IPC

    this.pipe = null
    this.IPC = null

    pipe?.destroy()
    IPC?.destroy()
  }

  _onmessage(data) {
    const message = data.toString()

    if (message === 'updating') {
      this.emit('updating')
      return
    }

    if (message === 'updated') {
      // Deliberately *not* applied here. The UI shows a banner and the user
      // decides — see applyUpdate(). Auto-applying would swap the build out
      // from under someone mid-conversation.
      this.emit('updated')
      return
    }

    if (message === 'pear:updateApplied') {
      this.emit('update-applied')
      this._applying?.resolve()
      this._applying = null
      return
    }

    this.emit('message', message)
  }

  // Apply the staged update, resolving once the worker confirms. The updater
  // banner awaits this to decide between "applying…" and "restart to use it".
  applyUpdate() {
    if (this._applying) return this._applying.promise

    if (this.pipe === null) return Promise.reject(new Error('updater worker is not running'))

    let resolve
    const promise = new Promise((r) => {
      resolve = r
    })
    this._applying = { promise, resolve }

    this._send('pear:applyUpdate')

    return promise
  }

  _send(message) {
    if (this.pipe === null) return
    this.pipe.write(message)
  }

  async exit(code = 0) {
    Bare.exitCode = code
    await this.close()
  }
}
