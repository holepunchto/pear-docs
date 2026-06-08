
import path from 'bare-path'
import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'
import b4a from 'b4a'

const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

const core = new Hypercore(path.join('./storage', 'writer-storage'))

// core.key and core.discoveryKey will only be set after core.ready resolves
await core.ready()
console.log('hypercore key:', b4a.toString(core.key, 'hex'))

// Append all stdin data as separate blocks to the core
process.stdin.on('data', (data) => core.append(data))

// core.discoveryKey is *not* a read capability for the core
// It's only used to discover other peers who *might* have the core
swarm.join(core.discoveryKey)
swarm.on('connection', conn => core.replicate(conn))