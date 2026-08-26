const fs = require('bare-fs')
const fsx = require('fs-native-extensions')
const daemon = require('bare-daemon')
const path = require('bare-path')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const PearRuntime = require('pear-runtime')
const ReadyResource = require('ready-resource')

module.exports = class App extends ReadyResource {
  static spawnUpdater(dir, app, entrypoint, updateWindow) {
    const args = entrypoint === null ? [] : [entrypoint]
    args.push('--updater', '--storage', dir)
    if (updateWindow !== undefined) {
      args.push('--update-window', String(updateWindow))
    }
    return daemon.spawn(app, args)
  }

  constructor({ dir, app, updates, version, upgrade, name }) {
    super()

    fs.mkdirSync(dir, { recursive: true })

    this.dir = dir
    this.app = app
    this.updates = updates
    this.version = version
    this.upgrade = upgrade
    this.name = name

    this.store = null
    this.swarm = null
    this.pear = null
    this.timeout = null
    this.lock = null
    this.downloading = false
  }

  async _open() {
    const store = new Corestore(path.join(this.dir, 'pear-runtime', 'corestore'))
    const swarm = new Hyperswarm()

    this.store = store
    this.swarm = swarm

    try {
      const pear = new PearRuntime({
        dir: this.dir,
        app: this.app,
        updates: this.updates,
        version: this.version,
        upgrade: this.upgrade,
        name: this.name,
        store,
        swarm
      })

      this.pear = pear

      pear.on('error', (err) => this.emit('error', err))
      pear.updater.on('error', (err) => this.emit('error', err))

      if (this.updates !== false) {
        pear.updater.on('updating', () => {
          this.downloading = true
          clearTimeout(this.timeout)
          this.timeout = null
          this.emit('updating')
        })
        pear.updater.on('updating-delta', (delta) => this.emit('updating-delta', delta))
        pear.updater.on('updated', () => {
          this.downloading = false
          this._applyUpdate()
        })
      }

      await pear.ready()

      if (this.updates === false) return
      swarm.on('connection', (connection) => store.replicate(connection))
      swarm.join(pear.updater.drive.core.discoveryKey, {
        client: true,
        server: false
      })
    } catch (err) {
      await this._teardown().catch(noop)
      throw err
    }
  }

  async _close() {
    await this._teardown()
  }

  async _teardown() {
    clearTimeout(this.timeout)
    this.timeout = null
    this.downloading = false

    const store = this.store
    const swarm = this.swarm
    const pear = this.pear
    const lock = this.lock

    this.store = null
    this.swarm = null
    this.pear = null
    this.lock = null

    try {
      await swarm?.destroy()
      await pear?.close()
      await store?.close()
    } finally {
      if (lock !== null) {
        fsx.unlock(lock)
        fs.closeSync(lock)
      }
    }
  }

  async _applyUpdate() {
    this.emit('updated')
    const pear = this.pear
    if (pear === null) return

    try {
      await pear.updater.applyUpdate()
      this.emit('update-applied')
    } catch (err) {
      this.emit('error', err)
    }
  }

  async updater(wait = 30_000) {
    if (this.updates === false) return

    const lock = fs.openSync(path.join(this.dir, 'updater.lock'), 'a+')
    if (fsx.tryLock(lock) === false) {
      fs.closeSync(lock)
      return
    }
    this.lock = lock

    let completed = false
    let resolveCompletion
    const completion = new Promise((resolve) => {
      resolveCompletion = resolve
    })
    const complete = () => {
      completed = true
      clearTimeout(this.timeout)
      this.timeout = null
      resolveCompletion()
    }

    this.once('update-applied', complete)
    this.once('error', complete)
    this.once('close', complete)

    try {
      await this.ready()
      if (completed === false && this.downloading === false) {
        this.timeout = setTimeout(complete, wait)
      }
      await completion
    } finally {
      this.removeListener('update-applied', complete)
      this.removeListener('error', complete)
      this.removeListener('close', complete)
    }
  }

  async exit(code = 0) {
    Bare.exitCode = code
    await this.close()
  }
}

function noop() {}
