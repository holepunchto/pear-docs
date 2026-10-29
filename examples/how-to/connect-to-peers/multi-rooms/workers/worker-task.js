const Corestore = require('corestore')
const debounce = require('debounceify')
const Hyperswarm = require('hyperswarm')
const ReadyResource = require('ready-resource')

const ChatAccount = require('./chat-account')

class WorkerTask extends ReadyResource {
  constructor (pipe, storage, opts = {}) {
    super()

    this.pipe = pipe
    this.storage = storage
    this.invite = opts.invite
    this.name = opts.name || `User ${Date.now()}`

    this.store = new Corestore(storage)
    this.swarm = new Hyperswarm()
    this.swarm.on('connection', (conn) => this.store.replicate(conn))

    this.account = new ChatAccount(this.store, this.swarm)
    this.debounceRooms = debounce(() => this._rooms())
    this.account.on('update', () => this.debounceRooms())
    this.account.on('messages', (roomId, messages) => {
      this.pipe.write(JSON.stringify({ type: 'messages', roomId, messages }))
    })
  }

  async _open () {
    await this.store.ready()
    await this.account.ready()

    if (this.invite) {
      await this.account.joinRoom(this.invite)
    }

    this.pipe.on('data', async (data) => {
      let message
      try {
        message = JSON.parse(data)
      } catch {
        return
      }
      if (message.type === 'add-room') {
        await this.account.addRoom(message.name, { at: Date.now() })
      } else if (message.type === 'join-room') {
        await this.account.joinRoom(message.invite)
      } else if (message.type === 'add-message') {
        await this.account.addMessage(message.roomId, message.text, { name: this.name, at: Date.now() })
      }
    })
    await this.debounceRooms()
  }

  async _close () {
    await this.account.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  async _rooms () {
    const rooms = Object.entries(this.account.rooms).map(([id, room]) => ({
      id,
      name: room.name,
      invite: room.invite,
      info: room.info
    }))
    // A just-joined room has no `info` yet — it only arrives once its
    // ChatAccount 'update' syncs the room metadata from the peer who created
    // it (see joinRoom in chat-account.js). If _rooms() runs in that window,
    // `.info` is undefined and a bare `.at` access throws, taking the whole
    // worker down.
    rooms.sort((a, b) => (a.info?.at ?? 0) - (b.info?.at ?? 0))
    this.pipe.write(JSON.stringify({ type: 'rooms', rooms }))
  }
}

module.exports = WorkerTask
