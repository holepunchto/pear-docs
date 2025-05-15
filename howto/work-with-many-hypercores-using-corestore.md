# How to work with many Hypercores using Corestore

An append-only log is powerful on its own, but it's most useful as a building block for constructing larger data structures, such as databases or filesystems. Building these data structures often requires many cores, each with different responsibilities. For example, Hyperdrive uses one core to store file metadata and another to store file contents.

[`Corestore`](../helpers/corestore.md) is a Hypercore factory that makes it easier to manage large collections of named Hypercores. This how-to demonstrates a pattern often in use: co-replicating many cores using Corestore, where several 'internal cores' are linked to from a primary core. Only the primary core is announced on the swarm -- the keys for the others are recorded inside of that core.

In [How to replicate and persist with Hypercore](./replicate-and-persist-with-hypercore.md), only single Hypercore instance was replicated. But in this how-to, we will replicate a single Corestore instance, which will internally manage the replication of a collection of Hypercores. We will achieve this with two Pear Terminal Applications: `multicore-writer-app` and `multicore-reader-app`.

> Only one Corestore per application is needed. This is the recommended best practices to make managing Hypercores efficient and to avoid pitfalls from having multiple Corestores. A single Corestore will:
> - Manage multiple sessions for the same Hypercore.
> - Requires only one replication stream per peer connection.
> - Simplifies referring to Hypercores by a name.

Create the `multicore-writer-app` project with these commands:

```
mkdir multicore-writer-app
cd multicore-writer-app
pear init -y -t terminal
npm install bare-process corestore hyperswarm b4a
```

Alter the generated `multicore-writer-app/index.js` file to the following

```javascript
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import b4a from 'b4a'
import process from 'bare-process'

const store = new Corestore(Pear.config.storage)
const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// A name is a purely-local, and maps to a key pair. It's not visible to readers.
// Since a name always corresponds to a key pair, these are all writable
const core1 = store.get({ name: 'core-1', valueEncoding: 'json' })
const core2 = store.get({ name: 'core-2' })
const core3 = store.get({ name: 'core-3' })
await Promise.all([core1.ready(), core2.ready(), core3.ready()])

console.log('main core key:', b4a.toString(core1.key, 'hex'))

// Here we'll only join the swarm with the core1's discovery key
// We don't need to announce core2 and core3, because they'll be replicated with core1
swarm.join(core1.discoveryKey)

// Corestore replication internally manages to replicate every loaded core
// Corestore *does not* exchange keys (read capabilities) during replication.
swarm.on('connection', (conn) => store.replicate(conn))

// Since Corestore does not exchange keys, they need to be exchanged elsewhere.
// Here, we'll record the other keys in the first block of core1.
if (core1.length === 0) {
  await core1.append({
    otherKeys: [core2, core3].map((core) => b4a.toString(core.key, 'hex'))
  })
}

// Record all short messages in core2, and all long ones in core3
process.stdin.on('data', (data) => {
  if (data.length < 5) {
    console.log('appending short data to core2')
    core2.append(data)
  } else {
    console.log('appending long data to core3')
    core3.append(data)
  }
})
```

The `multicore-writer-app` uses a Corestore instance to create three Hypercores, which are then replicated with other peers using `Hyperswarm`. The keys for the second and third cores are stored in the first core (the first core bootstraps the system). Messages entered into the command line are written into the second and third cores, depending on the length of the message. The main core key logged into the command line so that it can be passed to the `multicore-reader-app`.

The `multicore-reader-app` connects to the previous peer with `Hyperswarm` and replicates the local `Corestore` instance to receive the data from it. This requires the copied key to be supplied as an argument when executing the file, which will then be used to create a core with the same public key as the other peer (i.e., the same discovery key for both the reader and writer peers).

```
mkdir multicore-reader-app
cd multicore-reader-app
pear init -y -t terminal
npm install corestore hyperswarm b4a
```

Alter the generated `multicore-reader-app/index.js` file to the following

```javascript
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'

if (!Pear.config.args[0]) throw new Error('provide a key')

const key = b4a.from(Pear.config.args[0], 'hex')

const store = new Corestore(Pear.config.storage)
await store.ready()

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// replication of corestore instance on every connection
swarm.on('connection', (conn) => store.replicate(conn))

// creation/getting of a hypercore instance using the key passed
const core = store.get({ key, valueEncoding: 'json' })
// wait till all the properties of the hypercore instance are initialized
await core.ready()

swarm.join(core.discoveryKey)
await swarm.flush()

// update the meta-data of the hypercore instance
await core.update()

if (core.length === 0) {
  throw new Error('Could not connect to the writer peer')
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

In one terminal, open `multicore-writer-app` with `pear run --dev .`.

```
cd  multicore-writer-app
pear run --dev .
```

The `multicore-writer-app` will output the main core key.

In another terminal, open the `multicore-reader-app` and pass it the key:

```
cd multicore-reader-app
pear run --dev . <SUPPLY THE KEY HERE>
```

As inputs are made to the terminal running the writer application, outputs should be shown in the terminal running the reader application.
