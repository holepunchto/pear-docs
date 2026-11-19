const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const debounce = require('debounceify')
const idEnc = require('hypercore-id-encoding')
const HyperDB = require('hyperdb')
const Hyperdrive = require('hyperdrive')
const LocalDrive = require('localdrive')
const path = require('bare-path')
const ReadyResource = require('ready-resource')
const z32 = require('z32')

const DriveDispatch = require('../spec/dispatch')
const DriveDb = require('../spec/db')

class DriveRoom extends ReadyResource {
  constructor (myDrivePath, sharedDrivesPath, store, swarm, invite, opts = {}) {
    super()

    this.myDrivePath = myDrivePath
    this.sharedDrivesPath = sharedDrivesPath
    this.store = store
    this.swarm = swarm
    this.invite = invite
    this.name = opts.name

    this.pairing = new BlindPairing(swarm)

    this.router = new DriveDispatch.Router()
    this._setupRouter()

    this.localBase = Autobase.getLocalCore(this.store)
    this.base = null
    this.pairMember = null

    this.myLocalDrive = new LocalDrive(myDrivePath)
    this.myDrive = new Hyperdrive(this.store)
    this.uploadInterval = null

    this.localDrives = {}
    this.drives = {}
  }

  async _open () {
    await this.localBase.ready()
    const localKey = this.localBase.key
    const isEmpty = this.localBase.length === 0

    let key
    let encryptionKey
    if (isEmpty && this.invite) {
      const res = await new Promise((resolve) => {
        this.pairing.addCandidate({
          invite: z32.decode(this.invite),
          userData: localKey,
          onadd: resolve
        })
      })
      key = res.key
      encryptionKey = res.encryptionKey
    }

    // if base is not initialized, key and encryptionKey must be provided
    // if base is already initialized in this store namespace, key and encryptionKey can be omitted
    await this.localBase.close()
    this.base = new Autobase(this.store, key, {
      encrypt: true,
      encryptionKey,
      open: this._openBase.bind(this),
      close: this._closeBase.bind(this),
      apply: this._applyBase.bind(this)
    })

    const writablePromise = new Promise((resolve) => {
      this.base.on('update', () => {
        if (this.base.writable) resolve()
        if (!this.base._interrupting) this.emit('update')
      })
    })
    await this.base.ready()
    this.swarm.join(this.base.discoveryKey)
    if (!this.base.writable) await writablePromise

    this.view.core.download({ start: 0, end: -1 })

    this.pairMember = this.pairing.addMember({
      discoveryKey: this.base.discoveryKey,
      onadd: async (request) => {
        const inv = await this.view.findOne('@pear-file-sharing/invites', { id: request.inviteId })
        if (!inv) return
        request.open(inv.publicKey)
        await this.addWriter(request.userData)
        request.confirm({
          key: this.base.key,
          encryptionKey: this.base.encryptionKey
        })
      }
    })

    const downloadSharedDrives = debounce(() => this._downloadSharedDrives())
    this.on('update', () => downloadSharedDrives())
    await downloadSharedDrives()
    await this._uploadMyDrive()
  }

  async _close () {
    clearInterval(this.uploadInterval)
    await this.pairMember?.close()
    await this.base?.close()
    await this.localBase.close()
    await this.pairing.close()
  }

  _openBase (store) {
    return HyperDB.bee(store.get('view'), DriveDb, { extension: false, autoUpdate: true })
  }

  async _closeBase (view) {
    await view.close()
  }

  async _applyBase (nodes, view, base) {
    for (const node of nodes) {
      await this.router.dispatch(node.value, { view, base })
    }
    await view.flush()
  }

  _setupRouter () {
    this.router.add('@pear-file-sharing/add-writer', async (data, context) => {
      await context.base.addWriter(data.key)
    })
    this.router.add('@pear-file-sharing/add-invite', async (data, context) => {
      await context.view.insert('@pear-file-sharing/invites', data)
    })
    this.router.add('@pear-file-sharing/add-drive', async (data, context) => {
      await context.view.insert('@pear-file-sharing/drives', data)
    })
  }

  async _downloadSharedDrives () {
    const drives = await this.getDrives()
    await Promise.all(drives.map(async (item) => {
      const key = idEnc.normalize(item.key)
      if (this.drives[key]) return

      const local = new LocalDrive(path.join(this.sharedDrivesPath, key))
      this.localDrives[key] = local
      const drive = key === idEnc.normalize(this.myDrive.key) ? this.myDrive : new Hyperdrive(this.store, item.key)
      this.drives[key] = drive

      const mirror = debounce(() => drive.mirror(local).done())
      drive.core.on('append', () => mirror())

      await drive.ready()
      this.swarm.join(drive.discoveryKey)
    }))
  }

  async _uploadMyDrive () {
    await this.myDrive.ready()
    this.addDrive(this.myDrive.key, { name: this.name })
    this.swarm.join(this.myDrive.discoveryKey)

    const mirror = debounce(() => this.myLocalDrive.mirror(this.myDrive).done())
    this.uploadInterval = setInterval(() => mirror(), 1000)
  }

  get view () {
    return this.base.view
  }

  async getInvite () {
    const existing = await this.view.findOne('@pear-file-sharing/invites', {})
    if (existing) {
      return z32.encode(existing.invite)
    }
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      DriveDispatch.encode('@pear-file-sharing/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter (key) {
    await this.base.append(
      DriveDispatch.encode('@pear-file-sharing/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  async getDrives ({ reverse = true, limit = 100 } = {}) {
    return await this.view.find('@pear-file-sharing/drives', { reverse, limit }).toArray()
  }

  async addDrive (key, info) {
    await this.base.append(
      DriveDispatch.encode('@pear-file-sharing/add-drive', { key, info })
    )
  }
}

module.exports = DriveRoom
