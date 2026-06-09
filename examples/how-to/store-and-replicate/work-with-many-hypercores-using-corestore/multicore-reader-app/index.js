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
// swarm.flush() only resolves the swarm announce. findingPeers() keeps
// core.update() waiting until a connected peer has actually supplied the
// latest length, so we don't read an empty core before replication catches up.
const done = core.findingPeers()
swarm.flush().then(done, done)
await core.update()

if (core.length === 0) {
  throw new Error('Could not connect to the writer peer')
}

// getting cores using the keys stored in the first block of main core
const { otherKeys } = await core.get(0)
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