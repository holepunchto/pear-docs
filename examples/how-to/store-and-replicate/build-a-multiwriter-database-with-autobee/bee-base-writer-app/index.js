import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Autobee from 'autobee'
import Pipe from 'bare-pipe'
import b4a from 'b4a'

const store = new Corestore('./bee-writer-storage')
const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// Reduce the linearized nodes into the Hyperbee view. Deterministic, and
// mutates only the `view` it is handed.
async function apply (nodes, view, host) {
  for (const node of nodes) {
    // apply replays this node on every peer, forever, including on restart.
    // A malformed value (bad JSON, a bad typo, or a hostile peer) must not
    // throw here — that would crash every peer that ever processes it.
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

// key is null, so this call creates a new Autobee rather than joining one.
const db = new Autobee(store, null, { apply, update })
await db.ready()

// db.replicate, not store.replicate: it also registers the wakeup stream.
swarm.on('connection', (conn) => db.replicate(conn))

// Announce the topic before advertising the key, so a peer that looks it up
// straight away finds this writer.
const discovery = swarm.join(db.discoveryKey)
await discovery.flushed()

console.log('db key:', db.id)

await db.append(encode({ key: 'greeting', value: 'hello from the first writer' }))

const stdin = new Pipe(0)

// `add <writer-id>` grants write access. `key=value` writes a record.
stdin.on('data', (data) => {
  const line = b4a.toString(data).trim()
  if (!line.length) return
  if (line.startsWith('add ')) {
    const id = line.slice(4).trim()
    db.append(encode({ addWriter: id })).then(() => console.log('added writer:', id), console.error)
    return
  }
  const i = line.indexOf('=')
  if (i === -1) return console.log('usage: <key>=<value>  or  add <writer-id>')
  db.append(encode({ key: line.slice(0, i), value: line.slice(i + 1) })).catch(console.error)
})

function encode (op) {
  return b4a.from(JSON.stringify(op))
}
