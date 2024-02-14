# How to replicate and persist with Hypercore

In the HyperDHT How-to ([Connect Two Peers](./connect-two-peers-by-key-with-hyperdht.md)) and the Hyperswarm How-to ([Connect Many Peers](./connect-to-many-peers-by-topic-with-hyperswarm.md)), peers can exchange chat messages so long as both are online at the same time and directly connected. The application is ephemeral, the messages are not persisted - they will be lost if the recipient is offline. Hypercore provides the persistence.

[`Hypercore`](../building-blocks/hypercore.md) is a secure, distributed append-only log. It is built for sharing enormous datasets and streams of real-time data. It has a secure transport protocol, making it easy to build fast and scalable peer-to-peer applications.

{% embed url="https://www.youtube.com/watch?v=5t2mOi0BeDg" %} Build with Pear - Episode 05: Replication and Persistence {% embeded %}

In this guide we'll extend the ephemeral chat example in [Connect Many Peers](./connect-to-many-peers-by-topic-with-hyperswarm.md) but using Hypercore to add many significant new features:

* **Persistence**: The owner of the Hypercore can add messages at any time, and they'll be persisted to disk. Whenever they come online, readers can replicate these messages over Hyperswarm.
* **Many Readers:** New messages added to the Hypercore will be broadcast to interested readers. The owner gives each reader a reading capability (`core.key`) and a corresponding discovery key (`core.discoveryKey`). The former is used to authorize the reader, ensuring that they have permission to read messages, and the latter is used to discover the owner (and other readers) on the swarm.

The following example consists of two Pear Terminal Applications: `reader-app` and `writer-app`. When these two applications are opened, two peers are created and connected to each other. A Hypercore is used to store the data entered into the command line.

The `writer-app` code stores the data entered into the command line to the Hypercore instance. The Hypercore instance is replicated with other peers using Hyperswarm.


Create the `writer-app` project with these commands:

```
mkdir writer-app
cd writer-app
pear init -y -t terminal
npm install bare-path bare-process hypercore hyperswarm b4a
```

Alter the generated `writer-app/index.js` file to the following:

```javascript
  import path from 'bare-path'
  import process from 'bare-process'
  import Hyperswarm from 'hyperswarm'
  import Hypercore from 'hypercore'
  import b4a from 'b4a'

  const swarm = new Hyperswarm()
  Pear.teardown(() => swarm.destroy())

  const core = new Hypercore(path.join(Pear.config.storage, 'writer-storage'))

  // core.key and core.discoveryKey will only be set after core.ready resolves
  await core.ready()
  console.log('hypercore key:', b4a.toString(core.key, 'hex'))

  // Append all stdin data as separate blocks to the core
  process.stdin.on('data', (data) => core.append(data))

  // core.discoveryKey is *not* a read capability for the core
  // It's only used to discover other peers who *might* have the core
  swarm.join(core.discoveryKey)
  swarm.on('connection', conn => core.replicate(conn))
```


The `reader-app` uses Hyperswarm to connect to the previously initiated peer and synchronize the local Hypercore instance with the Hypercore instance of the writer.

Create the `reader-app` project with these commands:

```
mkdir reader-app
cd reader-app
pear init -y -t terminal
npm install bare-path hypercore hyperswarm
```

Alter the generated `reader-app/index.js` file to the following:


```javascript
import path from 'bare-path'
import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

const core = new Hypercore(path.join(Pear.config.storage, 'reader-storage'), Pear.config.args[0])
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

In one terminal, open `writer-app` with `pear dev`.

```
cd writer-app
pear dev
```

The `writer-app` will output the Hypercore key.

In another terminal, open the `reader-app` and pass it the key:

```
cd reader-app
pear dev -- <SUPPLY THE KEY HERE>
```

As inputs are made to the terminal running the writer application, outputs should be shown in the terminal running the reader application.
