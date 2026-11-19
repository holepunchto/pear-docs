const Corestore = require('corestore')
const debounce = require('debounceify')
const Hyperswarm = require('hyperswarm')
const ReadyResource = require('ready-resource')

const ChatRoom = require('./chat-room')

class WorkerTask extends ReadyResource {
  constructor (pipe, storage, opts = {}) {
    super()

    this.pipe = pipe
    this.storage = storage
    this.invite = opts.invite
    this.name = opts.name || `User ${Date.now()}`
    this.peers = 0

    this.store = new Corestore(storage)
    this.swarm = new Hyperswarm()
    this.swarm.on('connection', (conn) => {
      this.store.replicate(conn)
      this._peers(1)
      conn.once('close', () => this._peers(-1))
    })

    this.room = new ChatRoom(this.store, this.swarm, this.invite)
    this.debounceMessages = debounce(() => this._messages())
    this.room.on('update', () => this.debounceMessages())
  }

  async _open () {
    await this.store.ready()
    await this.room.ready()

    this.pipe.on('data', async (data) => {
      let message
      try {
        message = JSON.parse(data)
      } catch {
        return
      }
      if (message.type === 'add-message') {
        await this.room.addMessage(message.text, { name: this.name, at: Date.now() })
      }
    })

    // Push the room invite so the renderer can show its "copy invite" button.
    this.pipe.write(JSON.stringify({ type: 'invite', invite: await this.room.getInvite() }))
    await this.debounceMessages()
  }

  async _close () {
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  _peers (delta) {
    this.peers += delta
    this.pipe.write(JSON.stringify({ type: 'peers', count: this.peers }))
  }

  async _messages () {
    const messages = await this.room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    this.pipe.write(JSON.stringify({ type: 'messages', messages }))
  }
}

module.exports = WorkerTask
