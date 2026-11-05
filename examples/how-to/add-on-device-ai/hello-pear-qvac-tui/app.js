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

    // 'update-scheduled <ms>' — the updater saw the app's drive change and is
    // holding the check for <ms> before it downloads anything. That wait is a
    // random draw of up to an hour, so a fleet of installs doesn't hit the
    // seeder the instant a release is staged. Surfacing it is the difference
    // between "waiting" and "broken"; see CLAUDE.md before shortening it.
    if (message.startsWith('update-scheduled ')) {
      this.emit('update-scheduled', Number(message.slice('update-scheduled '.length)))
      return
    }

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

    // 'pear:updateFailed <message>' — applying the staged build did not work.
    // Rejecting is what the banner needs: bare-tui-updater turns a rejected
    // onAccept into 'update.error' and says so. Leaving the promise pending
    // instead would park the banner on "Applying update…" for good.
    if (message.startsWith('pear:updateFailed')) {
      const reason = message.slice('pear:updateFailed'.length).trim()
      const err = new Error(reason || 'update failed')
      this.emit('update-failed', err)
      this._applying?.reject(err)
      this._applying = null
      return
    }

    // 'updater-error <message>' — the updater failed in the background: a check
    // that couldn't complete, no build published for this host. Distinct from
    // 'pear:updateFailed', which answers an apply the user actually asked for.
    if (message.startsWith('updater-error ')) {
      this.emit('updater-error', new Error(message.slice('updater-error '.length)))
      return
    }

    this.emit('message', message)
  }

  // Apply the staged update, resolving once the worker confirms and rejecting
  // if it couldn't. The updater banner awaits this to decide between
  // "applying…", "restart to use it" and "update failed".
  applyUpdate() {
    if (this._applying) return this._applying.promise

    if (this.pipe === null) return Promise.reject(new Error('updater worker is not running'))

    let resolve
    let reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    this._applying = { promise, resolve, reject }

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
