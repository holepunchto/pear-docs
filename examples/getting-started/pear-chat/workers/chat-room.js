const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const HyperDB = require('hyperdb')
const ReadyResource = require('ready-resource')
const z32 = require('z32')

const ChatDispatch = require('../spec/dispatch')
const ChatDb = require('../spec/db')

class ChatRoom extends ReadyResource {
  constructor (store, swarm, invite) {
    super()

    this.store = store
    this.swarm = swarm
    this.invite = invite

    this.pairing = new BlindPairing(swarm)

    /** @type {{ add: function(string, function(any, { view: HyperDB, base: Autobase })) }} */
    this.router = new ChatDispatch.Router()
    this._setupRouter()

    this.localBase = Autobase.getLocalCore(this.store)
    this.base = null
    this.pairMember = null
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
        const inv = await this.view.findOne('@pear-chat/invites', { id: request.inviteId })
        if (!inv) return
        request.open(inv.publicKey)
        await this.addWriter(request.userData)
        request.confirm({
          key: this.base.key,
          encryptionKey: this.base.encryptionKey
        })
      }
    })
  }

  async _close () {
    await this.pairMember?.close()
    await this.base?.close()
    await this.localBase.close()
    await this.pairing.close()
  }

  _openBase (store) {
    return HyperDB.bee(store.get('view'), ChatDb, { extension: false, autoUpdate: true })
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
    this.router.add('@pear-chat/add-writer', async (data, context) => {
      await context.base.addWriter(data.key)
    })
    this.router.add('@pear-chat/add-invite', async (data, context) => {
      await context.view.insert('@pear-chat/invites', data)
    })
    this.router.add('@pear-chat/add-message', async (data, context) => {
      await context.view.insert('@pear-chat/messages', data)
    })
  }

  /** @type {HyperDB} */
  get view () {
    return this.base.view
  }

  async getInvite () {
    const existing = await this.view.findOne('@pear-chat/invites', {})
    if (existing) {
      return z32.encode(existing.invite)
    }
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      ChatDispatch.encode('@pear-chat/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter (key) {
    await this.base.append(
      ChatDispatch.encode('@pear-chat/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  async getMessages ({ reverse = true, limit = 100 } = {}) {
    return await this.view.find('@pear-chat/messages', { reverse, limit }).toArray()
  }

  async addMessage (text, info) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(
      ChatDispatch.encode('@pear-chat/add-message', { id, text, info })
    )
  }
}

module.exports = ChatRoom
