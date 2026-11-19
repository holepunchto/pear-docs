const Corestore = require('corestore')
const debounce = require('debounceify')
const Hyperswarm = require('hyperswarm')
const ReadyResource = require('ready-resource')

const VideoRoom = require('./video-room')

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

    this.room = new VideoRoom(this.store, this.swarm, this.invite)
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
      let message
      try {
        message = JSON.parse(data)
      } catch {
        return
      }
      if (message.type === 'add-video') {
        await this.room.addVideo(message.filePath, { name: this.name, at: Date.now() })
      } else if (message.type === 'add-message') {
        await this.room.addMessage(message.text, { ...message.info, name: this.name, at: Date.now() })
      }
    })
    await this.debounceVideos()
    await this.debounceMessages()

    this.pipe.write(JSON.stringify({ type: 'invite', invite: await this.room.getInvite() }))
  }

  async _close () {
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  async _videos () {
    const videos = await this.room.getVideos()
    videos.sort((a, b) => a.info.at - b.info.at)
    this.pipe.write(JSON.stringify({ type: 'videos', videos }))
  }

  async _messages () {
    const messages = await this.room.getMessages()
    messages.sort((a, b) => a.info.at - b.info.at)
    this.pipe.write(JSON.stringify({ type: 'messages', messages }))
  }
}

module.exports = WorkerTask
