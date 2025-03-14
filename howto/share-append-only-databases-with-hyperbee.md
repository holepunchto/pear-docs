
# How to share Append-Only Databases with Hyperbee

[Hyperbee](../building-blocks/hyperbee.md) is an append-only B-tree based on Hypercore. It provides a key/value-store API with methods to insert and get key/value pairs, perform atomic batch insertions, and create sorted iterators.

This How-to consists of three applications: `bee-writer-app` , `bee-reader-app` and `core-reader-app`.

The `bee-writer-app` stores 100k entries from a given dictionary file into a Hyperbee instance. The Corestore instance used to create the Hyperbee instance is replicated using Hyperswarm. This enables other peers to replicate their Corestore instance and sparsely (on-demand) download the dictionary data into their local Hyperbee instances.

Start the `bee-writer-app` project with the following commands:

```
mkdir bee-writer-app
cd bee-writer-app
pear init -y -t terminal
npm install corestore hyperswarm hyperbee b4a bare-fs
```

[Click here to save `dict.json`](../assets/dict.json).

Save it into `bee-writer-app` directory. The `dict.json` file contains 100K dictionary words.

Alter the generated `bee-writer-app/index.js` file to the following

```javascript
import fsp from 'bare-fs/promises'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
// create a corestore instance with the given location
const store = new Corestore(Pear.config.storage)

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

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
  const dict = JSON.parse(await fsp.readFile('./dict.json'))
  const batch = bee.batch()
  for (const { key, value } of dict) {
    await batch.put(key, value)
  }
  await batch.flush()
} else {
  // Otherwise just seed the previously-imported dictionary
  console.log('seeding dictionary...')
}
```

Run the app with:

```
pear run --dev .
```

Start the `bee-reader-app` project in a new terminal with the following commands:

```
mkdir bee-reader-app
cd bee-reader-app
pear init -y -t terminal
npm install corestore hyperswarm hyperbee b4a bare-pipe
```

The `bee-reader-app` creates a `Corestore` instance and replicates it using the `Hyperswarm` instance to the same topic as `bee-writer-app`. On every word entered in the command line, it will download the respective data to the local `Hyperbee` instance.


Alter the generated `bee-reader-app/index.js` file to the following

```javascript
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import Pipe from 'bare-pipe'
import b4a from 'b4a'

const key = Pear.config.args[0]

if (!key) throw new Error('provide a key')

// creation of a corestore instance 
const store = new Corestore(Pear.config.storage)

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// replication of the corestore instance on connection with other peers
swarm.on('connection', (conn) => store.replicate(conn))

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(key, 'hex') })

// create a hyperbee instance using the hypercore instance
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

// wait till the hypercore properties to be initialized
await core.ready()

// logging the public key of the hypercore instance
console.log('core key here is:', core.key.toString('hex'))

// Attempt to connect to peers
swarm.join(core.discoveryKey)

const stdin = new Pipe(0)

stdin.on('data', (data) => {
  const word = data.toString().trim()
  if (!word.length) return
  bee.get(word).then(node => {
    if (!node || !node.value) console.log(`No dictionary entry for ${word}`)
    else console.log(`${word} -> ${node.value}`)
    setImmediate(console.log) // flush hack
  }, console.error)
})
```

Open the `bee-reader-app` and pass it the core key:

```
pear run --dev . <SUPPLY KEY HERE>
```

Query the database by entering a key to lookup into the `bee-reader-app` terminal and hitting return.

Each application has dedicated storage at `Pear.config.storage`. Try logging out `Pear.config.storage` for the `bee-reader-app` and then look at the disk space for that storage path after each query. Notice that it's significantly smaller than `bee-writer-app`! This is because Hyperbee only downloads the Hypercore blocks it needs to satisfy each query, a feature we call **sparse downloading.**

Importantly, a Hyperbee is **just** a Hypercore, where the tree nodes are stored as Hypercore blocks.

Finally create a `core-reader-app` project:

```
mkdir core-reader-app
cd core-reader-app
pear init -y -t terminal
npm install corestore hyperswarm hyperbee b4a
```


Alter the generated `core-reader-app/index.js` file to the following

```javascript
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import b4a from 'b4a'

import { Node } from 'hyperbee/lib/messages.js'

const key = Pear.config.args[0]
if (!key) throw new Error('provide a key')

// creation of a corestore instance 
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(key, 'hex') })
// wait till the properties of the hypercore instance are initialized
await core.ready()

// join a topic
swarm.join(core.discoveryKey)
await swarm.flush()

// update the meta-data information of the hypercore instance
await core.update()

const seq = core.length - 1
const lastBlock = await core.get(core.length - 1)

// print the information about the last block or the latest block of the hypercore instance
console.log(`Raw Block ${seq}:`, lastBlock)
console.log(`Decoded Block ${seq}`, Node.decode(lastBlock))
```

Open the `core-reader-app` with `pear run --dev .`, passing the core key to it:

```
pear run --dev . <SUPPLY KEY HERE>
```

Now we can examine the Hyperbee as if it were just a Hypercore.

The `core-reader-app` will continually download and log the last block of the Hypercore containing the Hyperbee data. Note that these blocks are encoded using Hyperbee's `Node` encoding, which has been imported directly from `Hyperbee` here for the purposes of explanation.
