
import path from 'bare-path'
import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'

const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

const core = new Hypercore(path.join('./storage', 'reader-storage'), Bare.argv[2])
await core.ready()

swarm.join(core.discoveryKey)
swarm.on('connection', conn => core.replicate(conn))

// swarm.flush() will wait until *all* discoverable peers have been connected to
await swarm.flush()

await core.update()

let position = core.length
console.log(`Skipping ${core.length} earlier blocks...`)
for await (const block of core.createReadStream({ start: core.length, live: true })) {
  console.log(`Block ${position++}: ${block}`)
}