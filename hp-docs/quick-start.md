# Quick start

A primer on Holepunch's modular building blocks

* [Setup](quick-start.md#setup)
* [Hyperswarm's DHT: Connecting Two Peers by Key](quick-start.md#hyperswarms-dht-connecting-two-peers-by-key)
* [Hyperswarm: Connecting to Many Peers by Topic](quick-start.md#hyperswarm-connecting-to-many-peers-by-topic)
* [Hypercore: The Basics](quick-start.md#hypercore-the-basics)
* [Corestore: Working with Many Hypercores](quick-start.md#corestore-working-with-many-hypercores)
* [Hyperbee: Sharing Append-Only Databases](quick-start.md#hyperbee-sharing-append-only-databases)
* [Hyperdrive: A Full P2P Filesystem](quick-start.md#hyperdrive-a-full-p2p-filesystem)

### Setup

> ⚠️ Before beginning the setup, ensure sure the system is running on Node v16 or greater.


Download the [Holepunch examples repo](https://github.com/holepunchto/examples)

```bash
git clone https://github.com/holepunchto/examples
```

Install the required dependencies:

```bash
cd examples
npm install
```


```bash
npm install hyperswarm hypercore corestore hyperbee hyperdrive localdrive b4a debounceify graceful-goodbye --save
```

> ℹ️ Every code example in this page is meant to be run standalone, so copy/paste each example into a JS file, and run it with NodeJS.

### Hyperswarm's DHT: Connecting Two Peers by Key

[Hyperswarm](building-blocks/hyperswarm.md) helps to find and connect to peers who are announcing a common 'topic'. The swarm topic can be anything. The HyperDHT uses a series of holepunching techniques to establish direct connections between peers, even if they're located on home networks with tricky NATs.

In the HyperDHT, peers are identified by a public key, not by an IP address. With the public key, users can connect to each other irrespective of their location, even if they move between different networks.

> ℹ️ Hyperswarm's holepunching will fail if both the client peer and the server peer are on randomizing NATs, in which case the connection must be relayed through a third peer. Hyperswarm does not do any relaying by default.
>
> For example, Keet implements its relaying system wherein other call participants can serve as relays -- the more participants in the call, the stronger overall connectivity becomes.


Use the HyperDHT to create a basic CLI chat app where a client peer connects to a server peer by public key. This example consists of two files: `client.mjs` and `server.mjs`.

`server.mjs` will create a key pair and then start a server that will listen on the generated key pair. The public key is logged into the console. Copy it for instantiating the client.


```javascript
server.mjs
import DHT from 'hyperdht'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const dht = new DHT()

// This keypair is your peer identifier in the DHT
const keyPair = DHT.keyPair()

const server = dht.createServer(conn => {
  console.log('got connection!')
  process.stdin.pipe(conn).pipe(process.stdout)
})

server.listen(keyPair).then(() => {
  console.log('listening on:', b4a.toString(keyPair.publicKey, 'hex'))
})

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
goodbye(() => server.close())
```



`client.mjs` will spin up a client, and the public key copied earlier must be supplied as a command line argument for connecting to the server. The client process will log `got connection` into the console when it connects to the server.

Once it's connected, try typing in both terminals!



``` javascript
client.mjs
import DHT from 'hyperdht'
import b4a from 'b4a'

console.log('Connecting to:', process.argv[2])
const publicKey = b4a.from(process.argv[2], 'hex')

const dht = new DHT()
const conn = dht.connect(publicKey)
conn.once('open', () => console.log('got connection!'))

process.stdin.pipe(conn).pipe(process.stdout)
```


### Hyperswarm: Connecting to Many Peers by Topic

In the above example, two peers connected directly using the first peer's public key. Hyperswarm helps to discover peers swarming a common topic, and connect to as many of them as possible. This will become clearer in the Hypercore example, but it's the best way to distribute peer-to-peer data structures.

The [Hyperswarm](building-blocks/hyperswarm.md) module provides a higher-level interface over the underlying DHT, abstracting away the mechanics of establishing and maintaining connections. Instead, 'join' topics, and the swarm discovers peers automatically. It also handles reconnections in the event of failures.

In the previous example, we needed to explicitly indicate which peer was the server and which was the client. By using Hyperswarm, we create two peers, have them join a common topic, and let the swarm deal with connections.

This example consists of a single file, `peer.mjs`. In one terminal, type `node peer.mjs`, it will display the topic. Copy/paste that topic into N additional terminals with `node peer.mjs (topic)`. Each peer will log information about the other connected peers.

Start typing into any terminal, and it will be broadcast to all connected peers!



```javascript
peer.mjs
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// Keep track of all connections and console.log incoming data
const conns = []
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', name, '*')
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', data => console.log(`${name}: ${data}`))
})

// Broadcast stdin to all connections
process.stdin.on('data', d => {
  for (const conn of conns) {
    conn.write(d)
  }
})

// Join a common topic
const topic = process.argv[2] ? b4a.from(process.argv[2], 'hex') : crypto.randomBytes(32)
const discovery = swarm.join(topic, { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
  console.log('joined topic:', b4a.toString(topic, 'hex'))
})
```

### Hypercore: The Basics

In the Hyperswarm examples, peers can exchange chat messages so long as both are online at the same time and directly connected, and those messages are not persistent (they will be lost if the recipient is offline). Hypercore fixes all of these problems.

[hypercore.md](building-blocks/hypercore.md) is a secure, distributed append-only log. It is built for sharing enormous datasets and streams of real-time data. It has a secure transport protocol, making it easy to build fast and scalable peer-to-peer applications.

Now extend the ephemeral chat example above but using Hypercore to add many significant new features:

1. **Persistence**: The owner of the Hypercore can add messages at any time, and they'll be persisted to disk. Whenever they come online, readers can replicate these messages over Hyperswarm.
2. **Many Readers:** New messages added to the Hypercore will be broadcast to interested readers. The owner gives each reader a reading capability (`core.key`) and a corresponding discovery key (`core.discoveryKey`). The former is used to authorize the reader, ensuring that they have permission to read messages, and the latter is used to discover the owner (and other readers) on the swarm.

The following example consists of two files: `reader.mjs` and `writer.mjs`. When these two files are executed (run using node), two peers are created and connected. A Hypercore is used to store the data entered into the command line.

`writer.mjs` stores the data entered into the command line to the Hypercore instance. The Hypercore instance is replicated with other peers using Hyperswarm.



```javascript
writer.mjs
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


`reader.mjs` uses Hyperswarm to connect to the previously initiated peer and synchronize the local Hypercore instance with the Hypercore instance of the writer.



```javascript
reader.mjs
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


### Corestore: Working with Many Hypercores

An append-only log is powerful on its own, but it's most useful as a building block for constructing larger data structures, such as databases or filesystems. Building these data structures often requires many cores, each with different responsibilities. For example, Hyperdrive uses one core to store file metadata and another to store file contents.

[corestore.md](helpers/corestore.md) is a Hypercore factory that makes it easier to manage large collections of named Hypercores. A simple example below demonstrates a pattern often in use: co-replicating many cores using Corestore, where several 'internal cores' are linked to from a primary core. Only the primary core is announced on the swarm -- the keys for the others are recorded inside of that core.

This example consists of two files: `writer.mjs` and `reader.mjs`. In the previous example, we replicated only a single Hypercore instance. But in this example, we will replicate a single Corestore instance, which will internally manage the replication of a collection of Hypercores.

The file `writer.mjs` uses a Corestore instance to create three Hypercores, which are then replicated with other peers using Hyperswarm. The keys for the second and third cores are stored in the first core (the first core 'bootstraps' the system). Messages entered into the command line are written into the second and third cores, depending on the length of the message. To execute `reader.mjs`, copy the main core key logged into the command line.


```javascript
writer.mjs
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./writer-storage')
const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// A name is a purely-local, and maps to a key pair. It's not visible to readers.
// Since a name always corresponds to a key pair, these are all writable
const core1 = store.get({ name: 'core-1', valueEncoding: 'json' })
const core2 = store.get({ name: 'core-2' })
const core3 = store.get({ name: 'core-3' })
await Promise.all([core1.ready(), core2.ready(), core3.ready()])

console.log('main core key:', b4a.toString(core1.key, 'hex'))

// Here we'll only join the swarm with the core1's discovery key
// We don't need to announce core2 and core3, because they'll replicated with core1
swarm.join(core1.discoveryKey)

// Corestore replication internally manages to replicate every loaded core
// Corestore *does not* exchange keys (read capabilities) during replication.
swarm.on('connection', conn => store.replicate(conn))

// Since Corestore does not exchange keys, they need to be exchanged elsewhere.
// Here, we'll record the other keys in the first block of core1.
if (core1.length === 0) {
  await core1.append({
    otherKeys: [core2, core3].map(core => b4a.toString(core.key, 'hex'))
  })
}

// Record all short messages in core2, and all long ones in core3
process.stdin.on('data', data => {
  if (data.length < 5) {
    console.log('appending short data to core2')
    core2.append(data)
  } else {
    console.log('appending long data to core3')
    core3.append(data)
  }
})
```


`reader.mjs` connects to the previous peer with Hyperswarm and replicates the local Corestore instance to receive the data from it. This requires the copied key to be supplied as an argument when executing the file, which will then be used to create a core with the same public key as the other peer (i.e., the same discovery key for both the reader and writer peers).


```javascript
reader.mjs
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

// pass the key as a command line argument
const key = b4a.from(process.argv[2], 'hex')

// creation of a Corestore instance
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of corestore instance on every connection
swarm.on('connection', conn => store.replicate(conn))

// creation/getting of a hypercore instance using the key passed
const core = store.get({ key, valueEncoding: 'json' })
// wait till all the properties of the hypercore instance are initialized
await core.ready()

const foundPeers = store.findingPeers()
// join a topic
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

// update the meta-data of the hypercore instance
await core.update()

if (core.length === 0) {
  console.log('Could not connect to the writer peer')
  process.exit(1)
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
```

### Hyperbee: Sharing Append-Only Databases

[hyperbee.md](building-blocks/hyperbee.md) is an append-only B-tree based on Hypercore. It provides a key/value-store API with methods to insert and get key/value pairs, perform atomic batch insertions, and create sorted iterators.

The example consists of three files: `writer.mjs` , `bee-reader.mjs` and `core-reader.mjs`.

`writer.mjs` stores 100k entries from a given dictionary file into a Hyperbee instance. The Corestore instance used to create the Hyperbee instance is replicated using Hyperswarm. This enables other peers to replicate their Corestore instance and download the dictionary data into their local Hyperbee instances.

> ℹ️ Download the `dict.json.gz` compressed file from the [GitHub repository](https://github.com/holepunchto/examples/blob/main/quick-start/hyperbee/dict.json.gz) to the folder where the `writer.mjs`is present. The compressed file contains 100K dictionary words.

```javascript
writer.mjs
import fs from 'fs'
import zlib from 'zlib'

import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

// create a corestore instance with the given location
const store = new Corestore('./writer-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of corestore instance
swarm.on('connection', conn => store.replicate(conn))

// creation of Hypercore instance (if not already created)
const core = store.get({ name: 'my-bee-core' })

// creation of Hyperbee instance using the core instance 
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

// wait till all the properties of the hypercore are initialized
await core.ready()

// join a topic
const discovery = swarm.join(core.discoveryKey)

// Only display the key once the Hyperbee has been announced to the DHT
discovery.flushed().then(() => {
  console.log('bee key:', b4a.toString(core.key, 'hex'))
})

// Only import the dictionary the first time this script is executed
// The first block will always be the Hyperbee header block
if (core.length <= 1) {
  console.log('importing dictionary...')
  const dict = await loadDictionary()
  const batch = bee.batch()
  for (const { key, value } of dict) {
    await batch.put(key, value)
  }
  await batch.flush()
} else {
  // Otherwise just seed the previously-imported dictionary
  console.log('seeding dictionary...')
}

async function loadDictionary() {
  const compressed = await fs.promises.readFile('./dict.json.gz')
  return new Promise((resolve, reject) => {
  // unzip the compressed file and return the content
    zlib.unzip(compressed, (err, dict) => {
      if (err) return reject(err)
      return resolve(JSON.parse(b4a.toString(dict)))
    })
  })
}
```


`bee-reader.mjs` creates a Corestore instance and replicates it using the Hyperswarm instance to the same topic as the above file. On every word entered in the command line, it will download the respective data to the local Hyperbee instance.

Try looking at disk space the `reader-storage` directory is using after each query. notice that it's significantly smaller than `writer-storage`! This is because Hyperbee only downloads the Hypercore blocks it needs to satisfy each query, a feature we call **sparse downloading.**

```javascript
bee-reader.mjs
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

// creation of a corestore instance 
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(process.argv[2], 'hex') })

// create a hyperbee instance using the hypercore instance
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

// wait till the hypercore properties to be intialized
await core.ready()

// logging the public key of the hypercore instance
console.log('core key here is:', core.key.toString('hex'))

// Attempt to connect to peers
swarm.join(core.discoveryKey)

// Do a single Hyperbee.get for every line of stdin data
// Each `get` will only download the blocks necessary to satisfy the query
process.stdin.setEncoding('utf-8')
process.stdin.on('data', data => {
  const word = data.trim()
  if (!word.length) return
  bee.get(word).then(node => {
    if (!node || !node.value) console.log(`No dictionary entry for ${data}`)
    else console.log(`${data} -> ${node.value}`)
  }, err => console.error(err))
})
```

Importantly, a Hyperbee is **just** a Hypercore, where the tree nodes are stored as Hypercore blocks. Now examine the Hyperbee as if it were just a Hypercore and log out a few blocks.

`core-reader.mjs` will continually download and log the last block of the Hypercore containing the Hyperbee data. Note that these blocks are encoded using Hyperbee's Node encoding, which we can easily import and use.


```javascript
core-reader.mjs
import Hypercore from 'hypercore'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

import { Node } from 'hyperbee/lib/messages.js'

// creation of a corestore instance 
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(process.argv[2], 'hex') })
// wait till the properties of the hypercore instance are initialized
await core.ready()

const foundPeers = store.findingPeers()
// join a topic
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

// update the meta-data information of the hypercore instance
await core.update()

const seq = core.length - 1
const lastBlock = await core.get(core.length - 1)

// print the information about the last block or the latest block of the hypercore instance
console.log(`Raw Block ${seq}:`, lastBlock)
console.log(`Decoded Block ${seq}`, Node.decode(lastBlock))
```

### Hyperdrive: A Full P2P Filesystem

[hyperdrive.md](building-blocks/hyperdrive.md) is a secure, real-time distributed file system designed for easy P2P file sharing. In the same way that a Hyperbee is just a wrapper around a Hypercore, a Hyperdrive is a wrapper around two Hypercores: one is a Hyperbee index for storing file metadata, and the other is used to store file contents.

Now mirror a local directory into a Hyperdrive, replicate it with a reader peer, who then mirrors it into their own local copy. When the writer modifies its drive, by adding, removing, or changing files, the reader's local copy will be updated to reflect that. To do this, use two additional tools: [mirrordrive.md](helpers/mirrordrive.md) and [localdrive.md](helpers/localdrive.md), which handle all interactions between Hyperdrives and the local filesystem.

This example consists of three files: `writer.mjs`, `drive-reader.mjs` and `bee-reader.mjs`.

`writer.mjs` creates a local drive instance for a local directory and then mirrors the local drive into the Hyperdrive instance. The store used to create the Hyperdrive instance is replicated using Hyperswarm to make the data of Hyperdrive accessible to other peers. Copy the drive key logged into the command line for the `reader.mjs` execution.


```javascript
writer.js
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import debounce from 'debounceify'
import b4a from 'b4a'

// create a Corestore instance 
const store = new Corestore('./writer-storage')
const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// A local drive provides a Hyperdrive interface to a local directory
const local = new Localdrive('./writer-dir')

// A Hyperdrive takes a Corestore because it needs to create many cores
// One for a file metadata Hyperbee, and one for a content Hypercore
const drive = new Hyperdrive(store)

// wait till the properties of the hyperdrive instance are initialized
await drive.ready()

// Import changes from the local drive into the Hyperdrive
const mirror = debounce(mirrorDrive)

const discovery = swarm.join(drive.discoveryKey)
await discovery.flushed()

console.log('drive key:', b4a.toString(drive.key, 'hex'))

// start the mirroring process (i.e copying) of content from writer-dir to the drive
// whenever something is entered (other than '/n' or Enter )in the command-line
process.stdin.setEncoding('utf-8')
process.stdin.on('data', (d) => {
  if (!d.match('\n')) return
  mirror()
})

// this function copies the contents from writer-dir directory to the drive
async function mirrorDrive () {
  console.log('started mirroring changes from \'./writer-dir\' into the drive...')
  const mirror = local.mirror(drive)
  await mirror.done()
  console.log('finished mirroring:', mirror.count)
}
```

`drive-reader.mjs` creates a local drive instance for a local directory and then mirrors the contents of the local Hyperdrive instance into the local drive instance (which will write the contents to the local directory).

Try running `node drive-reader.mjs (key-from-above)`, then add/remove/modify files inside `writer-dir` then press `Enter` in the writer's terminal (to import the local changes into the writer's drive). Observe that all new changes mirror into `reader-dir`.


```javascript
drive-reader.mjs
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import debounce from 'debounceify'
import b4a from 'b4a'

// create a Corestore instance
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replication of store on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create a local copy of the remote drive
const local = new Localdrive('./reader-dir')

// create a hyperdrive using the public key passed as a command-line argument
const drive = new Hyperdrive(store, b4a.from(process.argv[2], 'hex'))

// wait till all the properties of the drive are initialized
await drive.ready()

const mirror = debounce(mirrorDrive)

// call the mirror function whenever content gets appended 
// to the Hypercore instance of the hyperdrive
drive.core.on('append', mirror)

const foundPeers = store.findingPeers()

// join a topic
swarm.join(drive.discoveryKey, { client: true, server: false })
swarm.flush().then(() => foundPeers())

// start the mirroring process (i.e copying the contents from remote drive to local dir)
mirror()

async function mirrorDrive () {
  console.log('started mirroring remote drive into \'./reader-dir\'...')
  const mirror = drive.mirror(local)
  await mirror.done()
  console.log('finished mirroring:', mirror.count)
}
```


Just as a Hyperbee is **just** a Hypercore, a Hyperdrive is **just** a Hyperbee (which is **just** a Hypercore). Now inspect the Hyperdrive as though it were a Hyperbee, and log out some file metadata.

`bee-reader.mjs` creates a Hyperbee instance using the Hypercore instance created with the copied public key. Every time the Hyperbee is updated (an `append` event is emitted on the underlying Hypercore), all file metadata nodes will be logged out.

Try adding or removing a few files from the writer's data directory, then pressing `Enter` in the writer's terminal to mirror the changes.


```javascript
bee-reader.mjs
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import debounce from 'debounceify'
import b4a from 'b4a'

// create a Corestore instance 
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// replicate corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create/get the hypercore instance using the public key supplied as command-line arg
const core = store.get({ key: b4a.from(process.argv[2], 'hex') })

// create a hyperbee instance using the hypercore instance
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'json'
})

// wait till the properties of the hypercore instance are initialized
await core.ready()

const foundPeers = store.findingPeers()
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

// execute the listBee function whenever the data is appended to the underlying hypercore
core.on('append', listBee)

listBee()

// listBee function will list the key-value pairs present in the hyperbee instance
async function listBee () {
  console.log('\n***************')
  console.log('hyperbee contents are now:')
  for await (const node of bee.createReadStream()) {
    console.log('  ', node.key, '->', node.value)
  }
}
```

