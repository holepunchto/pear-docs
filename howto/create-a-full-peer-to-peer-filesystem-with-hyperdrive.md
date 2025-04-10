# How to create a full peer-to-peer filesystem with Hyperdrive

[`Hyperdrive`](../building-blocks/hyperdrive.md) is a secure, real-time distributed file system designed for easy peer-to-peer file sharing. In the same way that a Hyperbee is just a wrapper around a Hypercore, a Hyperdrive is a wrapper around two Hypercores: one is a Hyperbee index for storing file metadata, and the other is used to store file contents.

This How-to consists of three applications: `drive-writer-app`, `drive-reader-app` and `drive-bee-reader-app`.

Now let's mirror a local directory into a Hyperdrive, replicate it with a reader peer, who then mirrors it into their own local copy. When the writer modifies its drive, by adding, removing, or changing files, the reader's local copy will be updated to reflect that. To do this, we'll use two additional tools: [`MirrorDrive`](../helpers/mirrordrive.md) and [`LocalDrive`](../helpers/localdrive.md), which handle all interactions between Hyperdrives and the local filesystem.

Start by creating the `drive-writer-app` project with these commands:

```
mkdir drive-writer-app
cd drive-writer-app
pear init -y -t terminal
npm install corestore localdrive hyperswarm hyperdrive debounceify b4a pear-stdio
```

Alter `driver-writer-app/index.js` to the following:

```javascript
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import debounce from 'debounceify'
import b4a from 'b4a'
import stdio from 'pear-stdio'

// create a Corestore instance 
const store = new Corestore(Pear.config.storage)
const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

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
stdio.in.setEncoding('utf-8')
stdio.in.on('data', (data) => {
  if (!data.match('\n')) return
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

Open the `drive-writer-app` with:

```
pear run --dev .
```

The `drive-writer-app` creates a `LocalDrive` instance for a local directory and then mirrors the `LocalDrive` into the Hyperdrive instance. 

The store used to create the Hyperdrive instance is replicated using Hyperswarm to make the data of Hyperdrive accessible to other peers. 

It outputs a key which will be passed to `drive-reader-app` upon execution.

Leave the `driver-writer-app` running and in a new terminal create the `drive-reader-app` project with these commands:

```
mkdir drive-reader-app
cd drive-reader-app
pear init -y -t terminal
npm install corestore localdrive hyperswarm hyperdrive debounceify b4a
```

Adjust the `drive-reader-app/index.js` file to:

```javascript
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import debounce from 'debounceify'
import b4a from 'b4a'

const key = Pear.config.args[0]

if (!key) throw new Error('provide a key')

// create a Corestore instance
const store = new Corestore(Pear.config.storage)

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// replication of store on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create a local copy of the remote drive
const local = new Localdrive('./reader-dir')

// create a hyperdrive using the public key passed as a command-line argument
const drive = new Hyperdrive(store, b4a.from(key, 'hex'))

// wait till all the properties of the drive are initialized
await drive.ready()

const mirror = debounce(mirrorDrive)

// call the mirror function whenever content gets appended 
// to the Hypercore instance of the hyperdrive
drive.core.on('append', mirror)

// join a topic
swarm.join(drive.discoveryKey, { client: true, server: false })

// start the mirroring process (i.e copying the contents from remote drive to local dir)
mirror()

async function mirrorDrive () {
  console.log('started mirroring remote drive into \'./reader-dir\'...')
  const mirror = drive.mirror(local)
  await mirror.done()
  console.log('finished mirroring:', mirror.count)
}
```

The `drive-reader-app` creates a `LocalDrive` instance for a local directory and then mirrors the contents of the local Hyperdrive instance into the `LocalDrive` instance (which will write the contents to the local directory).

Run the `drive-reader-app` with `pear run --dev .`, passing the key that the `drive-writer-app` already output:

```
pear run --dev . <SUPPLY_KEY_HERE>
```

`LocalDrive` does not create the directory passed to it until something has been written, so create the `drive-writer-app/writer-dir` (`mkdir writer-dir`) and then add/remove/modify files inside `drive-writer-app/writer-dir` then press `Enter` in the writer's terminal (to import the local changes into the writer's drive). Observe that all new changes mirror into `reader-app/reader-dir`.

Just as a Hyperbee is **just** a Hypercore, a Hyperdrive is **just** a Hyperbee - which is **just** a Hypercore.

In a new terminal, create the `drive-bee-reader-app` project with these commands:

```
mkdir drive-bee-reader-app
cd drive-bee-reader-app
pear init -y -t terminal
npm install corestore hyperswarm hyperdrive hyperbee b4a
```

Adjust the `drive-bee-reader-app/index.js` file to:

```javascript
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

const key = Pear.config.args[0]
if (!key) throw new Error('provide a key')

// create a Corestore instance 
const store = new Corestore(Pear.config.storage)

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// replicate corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create/get the hypercore instance using the public key supplied as command-line arg
const core = store.get({ key: b4a.from(key, 'hex') })

// create a hyperbee instance using the hypercore instance
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'json'
})

// wait till the properties of the hypercore instance are initialized
await core.ready()

swarm.join(core.discoveryKey)
await swarm.flush()

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

Now the Hyperdrive can be inspected as though it were a Hyperbee, and log out some file metadata.

Execute the `drive-bee-reader-app` with `pear run --dev .`, passing it the key output by the `driver-writer-app`:

```
pear run --dev . <SUPPLY_KEY_HERE>
```

The `drive-bee-reader-app` creates a Hyperbee instance using the Hypercore instance created with the copied public key. Every time the Hyperbee is updated (an `append` event is emitted on the underlying Hypercore), all file metadata nodes will be logged out.

Try adding or removing a few files from the writer's data directory, then pressing `Enter` in the writer's terminal to mirror the changes.
