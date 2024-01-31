
# How to share Append-Only Databases with Hyperbee

[Hyperbee](../building-blocks/hyperbee.md) is an append-only B-tree based on Hypercore. It provides a key/value-store API with methods to insert and get key/value pairs, perform atomic batch insertions, and create sorted iterators.

The example consists of three files: `writer.js` , `bee-reader.js` and `core-reader.js`.

`writer.js` stores 100k entries from a given dictionary file into a Hyperbee instance. The Corestore instance used to create the Hyperbee instance is replicated using Hyperswarm. This enables other peers to replicate their Corestore instance and download the dictionary data into their local Hyperbee instances.

> Download the `dict.json.gz` compressed file from the [GitHub repository](https://github.com/holepunchto/examples/blob/main/quick-start/hyperbee/dict.json.gz) to the folder where the `writer.js`is present. The compressed file contains 100K dictionary words.

```javascript
//writer.js
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


`bee-reader.js` creates a Corestore instance and replicates it using the Hyperswarm instance to the same topic as `writer.js`. On every word entered in the command line, it will download the respective data to the local Hyperbee instance.

Try looking at disk space the `reader-storage` directory is using after each query. notice that it's significantly smaller than `writer-storage`! This is because Hyperbee only downloads the Hypercore blocks it needs to satisfy each query, a feature we call **sparse downloading.**

```javascript
bee-reader.js
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

`core-reader.js` will continually download and log the last block of the Hypercore containing the Hyperbee data. Note that these blocks are encoded using Hyperbee's Node encoding, which we can easily import and use.


```javascript
core-reader.js
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