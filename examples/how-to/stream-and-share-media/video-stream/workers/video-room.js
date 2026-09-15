const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const fs = require('bare-fs')
const getMimeType = require('get-mime-type')
const Hyperblobs = require('hyperblobs')
const BlobServer = require('hypercore-blob-server')
const idEnc = require('hypercore-id-encoding')
const HyperDB = require('hyperdb')
const path = require('bare-path')
const ReadyResource = require('ready-resource')
const z32 = require('z32')

const VideoDispatch = require('../spec/dispatch')
const VideoDb = require('../spec/db')

class VideoRoom extends ReadyResource {
  constructor (store, swarm, invite) {
    super()

    this.store = store
    this.swarm = swarm
    this.invite = invite

    this.pairing = new BlindPairing(swarm)

    /** @type {{ add: function(string, function(any, { view: HyperDB, base: Autobase })) }} */
    this.router = new VideoDispatch.Router()
    this._setupRouter()

    this.localBase = Autobase.getLocalCore(this.store)
    this.base = null
    this.pairMember = null

    this.blobs = new Hyperblobs(this.store.get({ name: 'blobs' }))
    this.blobServer = new BlobServer(this.store.session())
    this.blobsCores = {}
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
      /** @type {function(import('blind-pairing-core').MemberRequest)} */
      onadd: async (request) => {
        const inv = await this.view.findOne('@pear-video-stream/invites', { id: request.inviteId })
        if (!inv) return
        request.open(inv.publicKey)
        await this.addWriter(request.userData)
        request.confirm({
          key: this.base.key,
          encryptionKey: this.base.encryptionKey
        })
      }
    })

    await this.blobs.ready()
    await this.blobServer.listen()
  }

  async _close () {
    await this.blobServer.close()
    await this.blobs.close()
    await this.pairMember?.close()
    await this.base?.close()
    await this.localBase.close()
    await this.pairing.close()
  }

  _openBase (store) {
    return HyperDB.bee(store.get('view'), VideoDb, { extension: false, autoUpdate: true })
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
    this.router.add('@pear-video-stream/add-writer', async (data, context) => {
      await context.base.addWriter(data.key)
    })
    this.router.add('@pear-video-stream/add-invite', async (data, context) => {
      await context.view.insert('@pear-video-stream/invites', data)
    })
    this.router.add('@pear-video-stream/add-video', async (data, context) => {
      await context.view.insert('@pear-video-stream/videos', data)
    })
    this.router.add('@pear-video-stream/add-message', async (data, context) => {
      await context.view.insert('@pear-video-stream/messages', data)
    })
  }

  /** @type {HyperDB} */
  get view () {
    return this.base.view
  }

  async getInvite () {
    const existing = await this.view.findOne('@pear-video-stream/invites', {})
    if (existing) {
      return z32.encode(existing.invite)
    }
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      VideoDispatch.encode('@pear-video-stream/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter (key) {
    await this.base.append(
      VideoDispatch.encode('@pear-video-stream/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  async getVideos ({ reverse = true, limit = 100 } = {}) {
    const videos = await this.view.find('@pear-video-stream/videos', { reverse, limit }).toArray()
    for (const item of videos) {
      if (!this.blobsCores[item.blob.key]) {
        const blobsCore = this.store.get({ key: idEnc.decode(item.blob.key) })
        this.blobsCores[item.blob.key] = blobsCore
        await blobsCore.ready()
        this.swarm.join(blobsCore.discoveryKey)
      }
    }
    return videos.map(item => {
      const link = this.blobServer.getLink(item.blob.key, { blob: item.blob, type: item.type })
      return { ...item, info: { ...item.info, link } }
    })
  }

  async addVideo (filePath, info) {
    const name = path.basename(filePath)
    const type = getMimeType(name)
    if (!type || !type.startsWith('video/')) {
      throw new Error('Only video files are allowed')
    }

    const rs = fs.createReadStream(filePath)
    const ws = this.blobs.createWriteStream()
    await new Promise((resolve, reject) => {
      ws.on('error', reject)
      ws.on('close', resolve)
      rs.pipe(ws)
    })
    const blob = { key: idEnc.normalize(this.blobs.core.key), ...ws.id }

    const id = Math.random().toString(16).slice(2)
    await this.base.append(
      VideoDispatch.encode('@pear-video-stream/add-video', { id, name, type, blob, info })
    )
  }

  async getMessages ({ reverse = true, limit = 100 } = {}) {
    return await this.view.find('@pear-video-stream/messages', { reverse, limit }).toArray()
  }

  async addMessage (text, info) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(
      VideoDispatch.encode('@pear-video-stream/add-message', { id, text, info })
    )
  }
}

module.exports = VideoRoom
