import process from 'bare-process'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'

if (!Bare.argv[2]) throw new Error('provide a key')

const key = b4a.from(Bare.argv[2], 'hex')

const store = new Corestore('./multicore-reader-storage')
await store.ready()

const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// replication of corestore instance on every connection
swarm.on('connection', (conn) => store.replicate(conn))

// creation/getting of a hypercore instance using the key passed
const core = store.get({ key, valueEncoding: 'json' })
// wait till all the properties of the hypercore instance are initialized
await core.ready()

swarm.join(core.discoveryKey)
await swarm.flush()

// core.get(0) blocks until the writer's first block (the bootstrap key list) has
// replicated from a connected peer — unlike core.update(), it waits for the data
// itself rather than just peer discovery. The timeout surfaces a clear error if
// the writer is never reachable, instead of leaving the reader hanging forever.
let firstBlock
try {
  firstBlock = await core.get(0, { timeout: 30000 })
} catch {
  throw new Error('Could not connect to the writer peer')
}

// read the bootstrap key list (the other core keys) from the first block
const { otherKeys } = firstBlock
for (const key of otherKeys) {
  const core = store.get({ key: b4a.from(key, 'hex') })
  // on every append to the hypercore, 
  // download the latest block of the core and log it to the console
  core.on('append', () => {
    const seq = core.length - 1
    core.get(seq).then(block => {
      console.log(`Block ${seq} in Core ${key}: ${block}`) 
    })
  })
}