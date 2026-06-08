const b4a = require('b4a')
const Corestore = require('corestore')
const debounce = require('debounceify')
const Hyperswarm = require('hyperswarm')
const ReadyResource = require('ready-resource')

const LiveCamRoom = require('./live-cam-room')

// The renderer talks to the worker over a single FramedStream. Each frame is
// tagged with a one-byte kind so small JSON control messages and large binary
// video fragments can share the same pipe without base64-bloating the frames:
//   0x00  JSON control/event message
//   0x01  raw WebM video fragment (creator -> worker -> autobase blob)
const KIND_JSON = 0x00
const KIND_FRAGMENT = 0x01

class WorkerTask extends ReadyResource {
  constructor (pipe, storage, opts = {}) {
    super()

    this.pipe = pipe
    this.storage = storage
    this.invite = opts.invite
    this.name = opts.name || `User ${Date.now()}`
    this.role = opts.invite ? 'viewer' : 'creator'

    this.store = new Corestore(storage)
    this.swarm = new Hyperswarm()
    this.swarm.on('connection', (conn) => this.store.replicate(conn))

    this.room = new LiveCamRoom(this.store, this.swarm, this.invite)
    this.debounceVideos = debounce(() => this._videos())
    this.debounceMessages = debounce(() => this._messages())
    this.room.on('update', async () => {
      await this.debounceVideos()
      await this.debounceMessages()
    })
  }

  async _open () {
    await this.store.ready()
    await this.room.ready()

    this.pipe.on('data', async (data) => {
      const kind = data[0]
      const body = data.subarray(1)
      if (kind === KIND_FRAGMENT) {
        await this.room.addFragment(body)
        return
      }
      let message
      try {
        message = JSON.parse(b4a.toString(body))
      } catch {
        return
      }
      if (message.type === 'add-message') {
        await this.room.addMessage(message.text, { name: this.name, at: Date.now() })
      }
    })

    this._send({ type: 'invite', invite: await this.room.getInvite() })
    this._send({ type: 'role', role: this.role })
    await this.debounceVideos()
    await this.debounceMessages()
  }

  async _close () {
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  _send (message) {
    const json = b4a.from(JSON.stringify(message))
    this.pipe.write(b4a.concat([b4a.from([KIND_JSON]), json]))
  }

  async _videos () {
    const videos = await this.room.getVideos()
    this._send({ type: 'videos', videos })
  }

  async _messages () {
    const messages = await this.room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    this._send({ type: 'messages', messages })
  }
}

module.exports = WorkerTask
