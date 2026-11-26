const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const debounce = require('debounceify')
const HyperDB = require('hyperdb')
const ReadyResource = require('ready-resource')
const z32 = require('z32')

const ChatDispatch = require('../spec/dispatch')
const ChatDb = require('../spec/db')
const ChatRoom = require('./chat-room')

class ChatAccount extends ReadyResource {
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

    /** @type {Record<string, ChatRoom>} */
    this.rooms = {}
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
        const inv = await this.view.findOne('@pear-chat-multi-rooms/invites', { id: request.inviteId })
        if (!inv) return
        request.open(inv.publicKey)
        await this.addWriter(request.userData)
        request.confirm({
          key: this.base.key,
          encryptionKey: this.base.encryptionKey
        })
      }
    })

    await this.openRooms()
  }

  async _close () {
    await Promise.all(Object.values(this.rooms).map(room => room.close()))
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
    this.router.add('@pear-chat-multi-rooms/add-writer', async (data, context) => {
      await context.base.addWriter(data.key)
    })
    this.router.add('@pear-chat-multi-rooms/add-invite', async (data, context) => {
      await context.view.insert('@pear-chat-multi-rooms/invites', data)
    })
    this.router.add('@pear-chat-multi-rooms/add-room', async (data, context) => {
      await context.view.insert('@pear-chat-multi-rooms/rooms', data)
    })
    this.router.add('@pear-chat-multi-rooms/add-message', async () => {
      throw new Error('Invalid op')
    })
  }

  /** @type {HyperDB} */
  get view () {
    return this.base.view
  }

  async getInvite () {
    const existing = await this.view.findOne('@pear-chat-multi-rooms/invites', {})
    if (existing) {
      return z32.encode(existing.invite)
    }
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      ChatDispatch.encode('@pear-chat-multi-rooms/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter (key) {
    await this.base.append(
      ChatDispatch.encode('@pear-chat-multi-rooms/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  async openRooms () {
    const rooms = await this.view.find('@pear-chat-multi-rooms/rooms', { reverse: true, limit: 100 }).toArray()
    await Promise.all(rooms.map(async (item) => {
      const roomStore = this.store.namespace(item.id)
      const room = new ChatRoom(roomStore, this.swarm, { name: item.name, info: item.info, invite: item.invite })
      this.rooms[item.id] = room

      this._watchMessages(item.id)
      await room.ready()

      await this._messages(item.id)
    }))
  }

  async addRoom (name, info) {
    const id = Math.random().toString(16).slice(2)

    const roomStore = this.store.namespace(id)
    const room = new ChatRoom(roomStore, this.swarm, { name, info })
    this.rooms[id] = room

    this._watchMessages(id)
    await room.ready()

    await room.addRoomInfo()
    await this.base.append(
      ChatDispatch.encode('@pear-chat-multi-rooms/add-room', { id, name: room.name, invite: room.invite, info: room.info })
    )
  }

  async joinRoom (invite) {
    const id = Math.random().toString(16).slice(2)

    const roomStore = this.store.namespace(id)
    const room = new ChatRoom(roomStore, this.swarm, { invite })
    this.rooms[id] = room

    room.on('update', async () => {
      const remoteRoom = await room.getRoomInfo()

      if (remoteRoom && remoteRoom.name !== room.name) {
        room.name = remoteRoom.name
        room.info = remoteRoom.info
        await this.base.append(
          ChatDispatch.encode('@pear-chat-multi-rooms/add-room', { id, name: room.name, invite, info: room.info })
        )
      }
    })
    this._watchMessages(id)
    await room.ready()
  }

  async addMessage (roomId, text, info) {
    const room = this.rooms[roomId]
    if (!room) throw new Error('Room not found')
    await room.addMessage(text, info)
  }

  async _messages (roomId) {
    const room = this.rooms[roomId]
    if (!room) throw new Error('Room not found')
    const messages = await room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    this.emit('messages', roomId, messages)
  }

  _watchMessages (roomId) {
    const room = this.rooms[roomId]
    if (!room) throw new Error('Room not found')
    const debounceMessages = debounce(() => this._messages(roomId))
    room.on('update', async () => debounceMessages())
  }
}

module.exports = ChatAccount
