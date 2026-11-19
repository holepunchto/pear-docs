import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Autobase from 'autobase'
import b4a from 'b4a'

const key = Bare.argv[2]

if (!key) throw new Error('provide a base key')

const store = new Corestore('./base-peer-storage')
const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// `open` and `apply` must match the writer's byte for byte, or the peers derive
// different views from the same nodes.
function open (viewStore) {
  return viewStore.get({ name: 'chat', valueEncoding: 'json' })
}

// Reduce the linearized nodes into the view. Deterministic, and mutates only `view`.
async function apply (nodes, view, host) {
  for (const { value } of nodes) {
    // apply replays this node on every peer, forever, including on restart.
    // A malformed value (a bad typo, or a hostile peer) must not throw here —
    // that would crash every peer that ever processes it. Skip and move on.
    try {
      if (value.addWriter) {
        await host.addWriter(b4a.from(value.addWriter, 'hex'), { indexer: false })
        continue
      }
      await view.append(value)
    } catch (err) {
      console.error('skipping malformed node:', err.message)
    }
  }
}

// Passing the bootstrap key loads the existing Autobase instead of creating one.
const base = new Autobase(store, b4a.from(key, 'hex'), { valueEncoding: 'json', open, apply })
await base.ready()

// base.local is this peer's own writer core. Its key is what the writer app adds.
console.log('writer key:', b4a.toString(base.local.key, 'hex'))

swarm.on('connection', (conn) => store.replicate(conn))
swarm.join(base.discoveryKey)

base.on('update', () => printView())

// Wait for the topic lookup to settle before deciding this peer is read-only.
await swarm.flush()
await base.update()

if (!base.writable) {
  console.log('read-only, waiting to be added as a writer')
  await new Promise((resolve) => base.once('writable', resolve))
}

console.log('now writable')

await base.append({ from: 'peer', text: 'hello from the second writer' })

async function printView () {
  const lines = []
  for (let i = 0; i < base.view.length; i++) {
    const entry = await base.view.get(i)
    lines.push(`  ${i} ${entry.from}: ${entry.text}`)
  }
  console.log(`view (${base.view.length} entries):\n${lines.join('\n')}`)
}
