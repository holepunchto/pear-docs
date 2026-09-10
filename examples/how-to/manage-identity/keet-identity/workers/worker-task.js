const Corestore = require('corestore')
const debounce = require('debounceify')
const crypto = require('hypercore-crypto')
const Hyperswarm = require('hyperswarm')
const Identity = require('keet-identity-key')
const ReadyResource = require('ready-resource')

const ChatRoomIdentity = require('./chat-room-identity')

class WorkerTask extends ReadyResource {
  constructor (pipe, storage, mnemonic, opts = {}) {
    super()

    this.pipe = pipe
    this.storage = storage
    this.mnemonic = mnemonic
    this.invite = opts.invite
    this.name = opts.name || `User ${Date.now()}`

    this.store = new Corestore(storage)
    this.swarm = new Hyperswarm()
    this.swarm.on('connection', (conn) => this.store.replicate(conn))

    this.room = new ChatRoomIdentity(this.store, this.swarm, this.invite)
    this.debounceMessages = debounce(() => this._messages())
    this.room.on('update', () => this.debounceMessages())

    this.identity = null
    this.deviceKeyPair = null
    this.deviceProof = null
  }

  async _open () {
    this.identity = await Identity.from({ mnemonic: this.mnemonic })
    this.deviceKeyPair = crypto.keyPair()
    this.deviceProof = await this.identity.bootstrap(this.deviceKeyPair.publicKey)

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
        const proof = Identity.attestData(Buffer.from(message.text), this.deviceKeyPair, this.deviceProof)
        await this.room.addMessage(message.text, proof, { name: this.name, at: Date.now() })
      }
    })
    await this.debounceMessages()

    this.pipe.write(JSON.stringify({ type: 'invite', invite: await this.room.getInvite() }))
  }

  async _close () {
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  async _messages () {
    const messages = await this.room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    for (const msg of messages) {
      const res = Identity.verify(msg.proof, Buffer.from(msg.text), {
        expectedIdentity: this.identity.identityPublicKey
      })
      msg.info.verified = !!res
    }
    this.pipe.write(JSON.stringify({ type: 'messages', messages }))
  }
}

module.exports = WorkerTask
