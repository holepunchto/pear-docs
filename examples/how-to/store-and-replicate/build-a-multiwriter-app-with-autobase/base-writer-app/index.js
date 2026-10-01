import process from 'bare-process'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Autobase from 'autobase'
import Pipe from 'bare-pipe'
import b4a from 'b4a'

const store = new Corestore('./base-writer-storage')
const swarm = new Hyperswarm()
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// Create the view. Derive it only from the store passed in, never from outside state.
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

// bootstrap is null, so this call creates a new Autobase rather than loading one.
const base = new Autobase(store, null, { valueEncoding: 'json', open, apply })
await base.ready()

swarm.on('connection', (conn) => store.replicate(conn))

// Announce the topic before advertising the key, so a peer that looks it up
// straight away finds this writer.
const discovery = swarm.join(base.discoveryKey)
await discovery.flushed()

console.log('base key:', b4a.toString(base.key, 'hex'))

base.on('update', () => printView())

await base.append({ from: 'writer', text: 'first message' })

const stdin = new Pipe(0)

// `add <writer-key>` grants write access. Anything else is appended as a message.
stdin.on('data', (data) => {
  const line = b4a.toString(data).trim()
  if (!line.length) return
  if (line.startsWith('add ')) {
    const key = line.slice(4).trim()
    base.append({ addWriter: key }).then(() => console.log('added writer:', key), console.error)
    return
  }
  base.append({ from: 'writer', text: line }).catch(console.error)
})

async function printView () {
  const lines = []
  for (let i = 0; i < base.view.length; i++) {
    const entry = await base.view.get(i)
    lines.push(`  ${i} ${entry.from}: ${entry.text}`)
  }
  console.log(`view (${base.view.length} entries):\n${lines.join('\n')}`)
}
