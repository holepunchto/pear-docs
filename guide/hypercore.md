### Hypercore: The Basics

Get setup by creating a project folder and installing dependencies:

```bash
mkdir hypercore-basics
cd hypercore-basics
pear init -y -t terminal
npm install hyperswarm hypercore b4a graceful-goodbye
```

In the Hyperswarm examples, peers can exchange chat messages so long as both are online at the same time and directly connected, and those messages are not persistent (they will be lost if the recipient is offline). Hypercore fixes all of these problems.

[hypercore.md](../building-blocks/hypercore.md) is a secure, distributed append-only log. It is built for sharing enormous datasets and streams of real-time data. It has a secure transport protocol, making it easy to build fast and scalable peer-to-peer applications.

Now extend the ephemeral chat example above but using Hypercore to add many significant new features:

1. **Persistence**: The owner of the Hypercore can add messages at any time, and they'll be persisted to disk. Whenever they come online, readers can replicate these messages over Hyperswarm.
2. **Many Readers:** New messages added to the Hypercore will be broadcast to interested readers. The owner gives each reader a reading capability (`core.key`) and a corresponding discovery key (`core.discoveryKey`). The former is used to authorize the reader, ensuring that they have permission to read messages, and the latter is used to discover the owner (and other readers) on the swarm.

The following example consists of two files: `reader.js` and `writer.js`. When these two files are executed (run using node), two peers are created and connected. A Hypercore is used to store the data entered into the command line.

The `writer.js` code stores the data entered into the command line to the Hypercore instance. The Hypercore instance is replicated with other peers using Hyperswarm.


```javascript
//writer.js
import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

const core = new Hypercore('./writer-storage')

// core.key and core.discoveryKey will only be set after core.ready resolves
await core.ready()
console.log('hypercore key:', b4a.toString(core.key, 'hex'))

// Append all stdin data as separate blocks to the core
process.stdin.on('data', data => core.append(data))

// core.discoveryKey is *not* a read capability for the core
// It's only used to discover other peers who *might* have the core
swarm.join(core.discoveryKey)
swarm.on('connection', conn => core.replicate(conn))
```


`reader.js` uses Hyperswarm to connect to the previously initiated peer and synchronize the local Hypercore instance with the Hypercore instance of the writer.

```javascript
//reader.js
import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'
import goodbye from 'graceful-goodbye'

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

const core = new Hypercore('./reader-storage', process.argv[2])
await core.ready()

const foundPeers = core.findingPeers()
swarm.join(core.discoveryKey)
swarm.on('connection', conn => core.replicate(conn))

// swarm.flush() will wait until *all* discoverable peers have been connected to
// It might take a while, so don't await it
// Instead, use core.findingPeers() to mark when the discovery process is completed
swarm.flush().then(() => foundPeers())

// This won't resolve until either
//    a) the first peer is found
// or b) no peers could be found
await core.update()

let position = core.length
console.log(`Skipping ${core.length} earlier blocks...`)
for await (const block of core.createReadStream({ start: core.length, live: true })) {
  console.log(`Block ${position++}: ${block}`)
}
```

