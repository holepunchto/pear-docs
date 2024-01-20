

### Hyperdrive: A Full P2P Filesystem

Get setup by creating a project folder and installing dependencies:

```bash
mkdir p2p-filesystem
cd p2p-filesystem
pear init -y -t terminal
npm install hyperswarm hyperdrive localdrive corestore debounceify b4a graceful-goodbye
```

[hyperdrive.md](../building-blocks/hyperdrive.md) is a secure, real-time distributed file system designed for easy P2P file sharing. In the same way that a Hyperbee is just a wrapper around a Hypercore, a Hyperdrive is a wrapper around two Hypercores: one is a Hyperbee index for storing file metadata, and the other is used to store file contents.

Now mirror a local directory into a Hyperdrive, replicate it with a reader peer, who then mirrors it into their own local copy. When the writer modifies its drive, by adding, removing, or changing files, the reader's local copy will be updated to reflect that. To do this, use two additional tools: [mirrordrive.md](../helpers/mirrordrive.md) and [localdrive.md](../helpers/localdrive.md), which handle all interactions between Hyperdrives and the local filesystem.

This example consists of three files: `writer.js`, `drive-reader.js` and `bee-reader.js`.

`writer.js` creates a local drive instance for a local directory and then mirrors the local drive into the Hyperdrive instance. The store used to create the Hyperdrive instance is replicated using Hyperswarm to make the data of Hyperdrive accessible to other peers. Copy the drive key logged into the command line for the `reader.mjs` execution.


```javascript
//writer.js
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
//drive-reader.js
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
//bee-reader.js
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

