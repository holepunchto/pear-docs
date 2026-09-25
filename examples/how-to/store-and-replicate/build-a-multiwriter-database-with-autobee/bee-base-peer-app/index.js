import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Autobee from 'autobee'
import b4a from 'b4a'

const key = Bare.argv[2]

if (!key) throw new Error('provide a db key')

const store = new Corestore('./bee-peer-storage')
const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// Identical to the writer app's handler: both peers must derive the same view
// from the same nodes. apply replays this node forever, including on
// restart, so a malformed value must not throw here — skip and move on.
async function apply (nodes, view, host) {
  for (const node of nodes) {
    try {
      const op = JSON.parse(b4a.toString(node.value))

      if (op.addWriter) {
        await host.addWriter(op.addWriter)
        continue
      }

      const batch = view.write()
      batch.tryPut(b4a.from(op.key), b4a.from(op.value))
      await batch.flush()
    } catch (err) {
      console.error('skipping malformed node:', err.message)
    }
  }
}

// Autobee has no view-changed event: this handler is the hook that fires
// after apply, once per cycle that changed something.
async function update (view) {
  const entries = []
  for await (const entry of view.createReadStream()) {
    entries.push(`  ${b4a.toString(entry.key)}: ${b4a.toString(entry.value)}`)
  }
  console.log(`view (${entries.length} entries):\n${entries.join('\n')}`)
}

// Passing the key joins the existing Autobee instead of creating one.
const db = new Autobee(store, key, { apply, update })
await db.ready()

// db.local is this peer's own writer core. Its id is what the writer app adds.
console.log('writer id:', db.local.id)

swarm.on('connection', (conn) => db.replicate(conn))
swarm.join(db.discoveryKey)

// Wait for the topic lookup to settle before deciding this peer is read-only.
await swarm.flush()
await db.update()

if (!db.writable) {
  console.log('read-only, waiting to be added as a writer')
  await new Promise((resolve) => db.once('writable', resolve))
}

console.log('now writable')

await db.append(b4a.from(JSON.stringify({ key: 'reply', value: 'hello from the second writer' })))
