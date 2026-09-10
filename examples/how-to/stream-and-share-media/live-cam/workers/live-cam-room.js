const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const Hyperblobs = require('hyperblobs')
const BlobServer = require('hypercore-blob-server')
const idEnc = require('hypercore-id-encoding')
const HyperDB = require('hyperdb')
const ReadyResource = require('ready-resource')
const z32 = require('z32')

const LiveCamDispatch = require('../spec/dispatch')
const LiveCamDb = require('../spec/db')

class LiveCamRoom extends ReadyResource {
  constructor (store, swarm, invite) {
    super()

    this.store = store
    this.swarm = swarm
    this.invite = invite

    this.pairing = new BlindPairing(swarm)

    /** @type {{ add: function(string, function(any, { view: HyperDB, base: Autobase })) }} */
    this.router = new LiveCamDispatch.Router()
    this._setupRouter()

    this.localBase = Autobase.getLocalCore(this.store)
    this.base = null
    this.pairMember = null

    this.blobs = new Hyperblobs(this.store.get({ name: 'blobs' }))
    this.blobServer = new BlobServer(this.store.session())
    this.blobsCores = {}

    // The autobase log is append-only and persists across restarts, so every
    // `npm start` would otherwise reuse fragIdx 0,1,2... and the player would
    // splice unrelated recordings together. Tag each process with a unique
    // session id and reset fragIdx per session so playback can lock onto one.
    this.session = Date.now()
    this.fragIdx = 0
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
        const inv = await this.view.findOne('@pear-live-cam/invites', { id: request.inviteId })
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
    return HyperDB.bee(store.get('view'), LiveCamDb, { extension: false, autoUpdate: true })
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
    this.router.add('@pear-live-cam/add-writer', async (data, context) => {
      await context.base.addWriter(data.key)
    })
    this.router.add('@pear-live-cam/add-invite', async (data, context) => {
      await context.view.insert('@pear-live-cam/invites', data)
    })
    this.router.add('@pear-live-cam/add-video', async (data, context) => {
      await context.view.insert('@pear-live-cam/videos', data)
    })
    this.router.add('@pear-live-cam/add-message', async (data, context) => {
      await context.view.insert('@pear-live-cam/messages', data)
    })
  }

  /** @type {HyperDB} */
  get view () {
    return this.base.view
  }

  async getInvite () {
    const existing = await this.view.findOne('@pear-live-cam/invites', {})
    if (existing) {
      return z32.encode(existing.invite)
    }
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      LiveCamDispatch.encode('@pear-live-cam/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter (key) {
    await this.base.append(
      LiveCamDispatch.encode('@pear-live-cam/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  async getMessages ({ reverse = true, limit = 100 } = {}) {
    return await this.view.find('@pear-live-cam/messages', { reverse, limit }).toArray()
  }

  async addMessage (text, info) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(
      LiveCamDispatch.encode('@pear-live-cam/add-message', { id, text, info })
    )
  }

  async getVideos ({ limit = 100 } = {}) {
    const videos = await this.view.find('@pear-live-cam/videos', { limit }).toArray()
    for (const item of videos) {
      if (!this.blobsCores[item.blob.key]) {
        const blobsCore = this.store.get({ key: idEnc.decode(item.blob.key) })
        this.blobsCores[item.blob.key] = blobsCore
        await blobsCore.ready()
        this.swarm.join(blobsCore.discoveryKey)
      }
    }
    return videos.map(item => {
      const link = this.blobServer.getLink(item.blob.key, { blob: item.blob })
      return { ...item, info: { ...item.info, link } }
    }).sort((a, b) => (a.info.session - b.info.session) || (a.info.fragIdx - b.info.fragIdx))
  }

  async addFragment (frag) {
    const ws = this.blobs.createWriteStream()
    ws.write(frag)
    ws.end()
    await new Promise((resolve) => ws.on('close', resolve))

    const blob = { key: idEnc.normalize(this.blobs.core.key), ...ws.id }

    const id = Math.random().toString(16).slice(2)
    await this.base.append(
      LiveCamDispatch.encode('@pear-live-cam/add-video', { id, blob, info: { session: this.session, fragIdx: this.fragIdx } })
    )
    if (this.fragIdx % 30 === 0) console.log('[live-cam] fragments uploaded: ' + (this.fragIdx + 1))
    this.fragIdx += 1
  }
}

module.exports = LiveCamRoom
