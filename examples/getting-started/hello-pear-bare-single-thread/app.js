const path = require('bare-path')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
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

    this.store = null
    this.swarm = null
    this.pear = null
  }

  _open() {
    const store = new Corestore(path.join(this.dir, 'pear-runtime', 'corestore'))
    const swarm = new Hyperswarm()

    this.store = store
    this.swarm = swarm

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

    if (this.updates === false) return

    pear.updater.on('updating', () => this.emit('updating'))
    pear.updater.on('updating-delta', (delta) => this.emit('updating-delta', delta))
    pear.updater.on('updated', () => this._applyUpdate())

    swarm.on('connection', (connection) => store.replicate(connection))
    swarm.join(pear.updater.drive.core.discoveryKey, {
      client: true,
      server: false
    })
  }

  async _close() {
    const store = this.store
    const swarm = this.swarm
    const pear = this.pear

    this.store = null
    this.swarm = null
    this.pear = null

    await swarm?.destroy()
    await pear?.close()
    await store?.close()
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

  async exit(code = 0) {
    Bare.exitCode = code
    await this.close()
  }
}
