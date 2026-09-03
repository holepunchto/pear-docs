const BlindPeering = require('blind-peering')
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
    this.blindPeerKeys = opts.blindPeerKey || []
    this.invite = opts.invite
    this.name = opts.name || `User ${Date.now()}`

    this.store = new Corestore(storage)
    this.swarm = new Hyperswarm()
    this.swarm.on('connection', (conn) => this.store.replicate(conn))

    this.blindPeering = new BlindPeering(this.swarm.dht, this.store.namespace('blind-peering'), {
      keys: this.blindPeerKeys
    })

    this.room = new ChatRoom(this.store, this.swarm, this.invite)
    this.debounceMessages = debounce(() => this._messages())
    this.room.on('update', () => this.debounceMessages())
  }

  async _open () {
    await this.store.ready()
    await this.room.ready()

    await this.blindPeering.addAutobase(this.room.base)

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
    await this.debounceMessages()

    this.pipe.write(JSON.stringify({ type: 'invite', invite: await this.room.getInvite() }))
  }

  async _close () {
    await this.blindPeering.close()
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  async _messages () {
    const messages = await this.room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    this.pipe.write(JSON.stringify({ type: 'messages', messages }))
  }
}

module.exports = WorkerTask
