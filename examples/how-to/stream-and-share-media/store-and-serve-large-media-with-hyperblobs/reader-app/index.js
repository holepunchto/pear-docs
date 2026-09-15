import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperblobs from 'hyperblobs'
import BlobServer from 'hypercore-blob-server'
import idEnc from 'hypercore-id-encoding'
import process from 'bare-process'

// { key, byteOffset, blockOffset, blockLength, byteLength }
const blob = JSON.parse(process.argv[2])

const store = new Corestore('./reader-store')
const swarm = new Hyperswarm()
swarm.on('connection', (conn) => store.replicate(conn))

const core = store.get({ key: idEnc.decode(blob.key) })
await core.ready()
swarm.join(core.discoveryKey, { client: true, server: false })

// Option A — read the raw bytes.
const blobs = new Hyperblobs(core)
const bytes = await blobs.get({
  byteOffset: blob.byteOffset,
  blockOffset: blob.blockOffset,
  blockLength: blob.blockLength,
  byteLength: blob.byteLength
})
console.log('read bytes:', bytes.byteLength)

// Option B — serve over local HTTP so a <video>/<img> can stream it with range requests.
const server = new BlobServer(store.session())
await server.listen()
const link = server.getLink(blob.key, { blob, type: 'video/mp4' })
console.log('stream from:', link)

// Close the server and blobs before the swarm and store on exit.
process.once('SIGINT', async () => {
  await server.close()
  await blobs.close()
  await swarm.destroy()
  await store.close()
  process.exit(0)
})
