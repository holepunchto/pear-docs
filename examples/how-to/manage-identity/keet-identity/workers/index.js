const FramedStream = require('framed-stream')
const fs = require('bare-fs')
const goodbye = require('graceful-goodbye')
const Identity = require('keet-identity-key')
const { command, flag } = require('paparam')
const path = require('bare-path')

const WorkerTask = require('./worker-task.js')

const cmd = command('pear-chat-identity',
  flag('--invite|-i <invite>', 'Room invite'),
  flag('--name|-n <name>', 'Your name'),
  flag('--mnemonic|-m <mnemonic>', 'Identity mnemonic (24 words)'),
  flag('--reset', 'Reset')
)

const appStorage = Bare.argv[2]
const storage = path.join(appStorage, 'corestore')
cmd.parse(Bare.argv.slice(3))

async function main () {
  if (cmd.flags.reset) {
    await fs.promises.rm(storage, { recursive: true, force: true })
  }
  await fs.promises.mkdir(appStorage, { recursive: true })

  let mnemonic = cmd.flags.mnemonic
  const mnemonicPath = path.join(appStorage, 'identity-mnemonic.txt')
  if (!mnemonic) {
    mnemonic = await fs.promises.readFile(mnemonicPath, 'utf-8').catch((err) => {
      if (err.code !== 'ENOENT') throw err
    })
    mnemonic = mnemonic || Identity.generateMnemonic()
  }
  await fs.promises.writeFile(mnemonicPath, mnemonic)

  const pipe = new FramedStream(Bare.IPC)
  pipe.pause()

  const workerTask = new WorkerTask(pipe, storage, mnemonic, cmd.flags)
  goodbye(() => workerTask.close())

  await workerTask.ready()
  pipe.resume()

  console.log(`Storage: ${storage}`)
  console.log(`Name: ${workerTask.name}`)
  console.log(`Mnemonic (24 words): ${workerTask.mnemonic}`)
  console.log(`Invite: ${await workerTask.room.getInvite()}`)
}

main().catch((err) => {
  console.error(err)
  Bare.exit(1)
})
