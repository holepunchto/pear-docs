const FramedStream = require('framed-stream')
const fs = require('bare-fs')
const goodbye = require('graceful-goodbye')
const { command, flag } = require('paparam')
const path = require('bare-path')

const WorkerTask = require('./worker-task.js')

const cmd = command('pear-live-cam',
  flag('--invite|-i <invite>', 'Room invite'),
  flag('--name|-n <name>', 'Your name'),
  flag('--reset', 'Reset')
)

const storage = path.join(Bare.argv[2], 'corestore')
cmd.parse(Bare.argv.slice(3))

async function main () {
  if (cmd.flags.reset) {
    await fs.promises.rm(storage, { recursive: true, force: true })
  }

  const pipe = new FramedStream(Bare.IPC)
  pipe.pause()

  const workerTask = new WorkerTask(pipe, storage, cmd.flags)
  goodbye(() => workerTask.close())

  await workerTask.ready()
  pipe.resume()

  const invite = await workerTask.room.getInvite()
  const role = cmd.flags.invite ? 'viewer' : 'creator'

  console.log(`Storage: ${storage}`)
  console.log(`Name: ${workerTask.name}`)
  console.log(`Role: ${role}`)
  console.log(`Invite: ${invite}`)
}

main().catch((err) => {
  console.error(err)
  Bare.exit(1)
})
