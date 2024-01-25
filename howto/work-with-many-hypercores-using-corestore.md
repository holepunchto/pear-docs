
# How to work with many Hypercores using Corestore

Get setup by creating a project folder and installing dependencies:

```bash
mkdir many-cores
cd many-cores
pear init -y -t terminal
npm install corestore hyperswarm b4a graceful-goodbye
```

An append-only log is powerful on its own, but it's most useful as a building block for constructing larger data structures, such as databases or filesystems. Building these data structures often requires many cores, each with different responsibilities. For example, Hyperdrive uses one core to store file metadata and another to store file contents.

[corestore.md](../helpers/corestore.md) is a Hypercore factory that makes it easier to manage large collections of named Hypercores. A simple example below demonstrates a pattern often in use: co-replicating many cores using Corestore, where several 'internal cores' are linked to from a primary core. Only the primary core is announced on the swarm -- the keys for the others are recorded inside of that core.

This example consists of two files: `writer.js` and `reader.js`. In the previous example, we replicated only a single Hypercore instance. But in this example, we will replicate a single Corestore instance, which will internally manage the replication of a collection of Hypercores.

The file `writer.js` uses a Corestore instance to create three Hypercores, which are then replicated with other peers using Hyperswarm. The keys for the second and third cores are stored in the first core (the first core 'bootstraps' the system). Messages entered into the command line are written into the second and third cores, depending on the length of the message. To execute `reader.js`, copy the main core key logged into the command line.


```javascript
//writer.js
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

`reader.js` connects to the previous peer with Hyperswarm and replicates the local Corestore instance to receive the data from it. This requires the copied key to be supplied as an argument when executing the file, which will then be used to create a core with the same public key as the other peer (i.e., the same discovery key for both the reader and writer peers).


```javascript
//reader.js
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
