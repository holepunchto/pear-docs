import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperblobs from 'hyperblobs'
import idEnc from 'hypercore-id-encoding'
import fs from 'bare-fs'
import process from 'bare-process'

const store = new Corestore('./writer-store')
const swarm = new Hyperswarm()
swarm.on('connection', (conn) => store.replicate(conn))

const blobs = new Hyperblobs(store.get({ name: 'blobs' }))
await blobs.ready()

// Announce the blobs core so readers can discover and replicate it.
swarm.join(blobs.core.discoveryKey, { server: true, client: false })

// Store a local file as a blob.
const ws = blobs.createWriteStream()
fs.createReadStream('./clip.mp4').pipe(ws)
await new Promise((resolve, reject) => {
  ws.on('error', reject)
  ws.on('close', resolve)
})

// Share this with readers — the core key plus the blob id.
const blob = { key: idEnc.normalize(blobs.core.key), ...ws.id }
console.log('blob:', JSON.stringify(blob))

// Keep seeding until interrupted, then tear down cleanly.
process.once('SIGINT', async () => {
  await blobs.close()
  await swarm.destroy()
  await store.close()
  process.exit(0)
})
