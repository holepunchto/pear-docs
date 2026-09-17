const Corestore = require('corestore')
const fs = require('bare-fs')
const idEnc = require('hypercore-id-encoding')
const Hyperswarm = require('hyperswarm')
const path = require('bare-path')
const ReadyResource = require('ready-resource')

const DriveRoom = require('./drive-room')

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

    this.myDrivePath = path.join(this.storage, 'my-drive')
    this.sharedDrivesPath = path.join(this.storage, 'shared-drives')
    this.room = new DriveRoom(
      this.myDrivePath,
      this.sharedDrivesPath,
      this.store,
      this.swarm,
      this.invite,
      { name: this.name }
    )

    this.intervalFiles = null
  }

  async _open () {
    await this.store.ready()
    await this.room.ready()

    await fs.promises.mkdir(this.myDrivePath, { recursive: true })
    await fs.promises.mkdir(this.sharedDrivesPath, { recursive: true })

    this.pipe.on('data', async (data) => {
      let message
      try {
        message = JSON.parse(data)
      } catch {
        return
      }
      if (message.type === 'add-file') {
        await fs.promises.copyFile(message.uri, path.join(this.myDrivePath, message.name))
      }
    })

    this.intervalFiles = setInterval(() => this._drives(), 1000)

    this.pipe.write(JSON.stringify({ type: 'invite', invite: await this.room.getInvite() }))
  }

  async _close () {
    clearInterval(this.intervalFiles)
    await this.room.close()
    await this.swarm.destroy()
    await this.store.close()
  }

  async _drives () {
    const rawDrives = await this.room.getDrives()
    const drives = await Promise.all(rawDrives.map(async (drive) => {
      const key = idEnc.normalize(drive.key)
      const dir = path.join(this.sharedDrivesPath, key)
      await fs.promises.mkdir(dir, { recursive: true })
      const files = await fs.promises.readdir(dir, { recursive: true }).catch((err) => {
        if (err.code === 'ENOENT') return []
        throw err
      })
      const isMyDrive = key === idEnc.normalize(this.room.myDrive.key)
      return {
        ...drive,
        info: {
          ...drive.info,
          isMyDrive,
          uri: `file://${isMyDrive ? this.myDrivePath : dir}`,
          files: files.map((name) => ({ name, uri: `file://${path.join(dir, name)}` }))
        }
      }
    }))
    drives.sort((a, b) => {
      if (a.info.isMyDrive && !b.info.isMyDrive) return -1
      if (!a.info.isMyDrive && b.info.isMyDrive) return 1
      return a.info.name.localeCompare(b.info.name)
    })
    this.pipe.write(JSON.stringify({ type: 'drives', drives }))
  }
}

module.exports = WorkerTask
