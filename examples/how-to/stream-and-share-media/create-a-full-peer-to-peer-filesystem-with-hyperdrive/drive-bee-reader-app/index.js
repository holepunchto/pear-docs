
import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import b4a from 'b4a'

const key = Bare.argv[2]

if (!key) throw new Error('provide a key')

const store = new Corestore('./drive-bee-reader-storage')

const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

swarm.on('connection', conn => store.replicate(conn))

const drive = new Hyperdrive(store, b4a.from(key, 'hex'))
await drive.ready()
await drive.db.ready()

// Hyperdrive stores file metadata in the "files" sub-bee.
const files = drive.db.sub('files', { keyEncoding: 'utf-8' })

const discovery = swarm.join(drive.discoveryKey, { client: true, server: false })
await discovery.flushed()

let dbEntry = null
for (let attempt = 0; attempt < 60; attempt++) {
  await drive.update()
  dbEntry = await files.peek()
  if (dbEntry) break
  await new Promise(resolve => setTimeout(resolve, 500))
}

if (!dbEntry) throw new Error('expected at least one file entry to appear in drive.db')

const driveEntry = await drive.entry(dbEntry.key)

console.log('hyperbee entry:', JSON.stringify({
  key: dbEntry.key,
  value: dbEntry.value
}))

console.log('drive entry:', JSON.stringify({
  key: driveEntry.key,
  value: driveEntry.value
}))

await swarm.destroy()
await drive.close()