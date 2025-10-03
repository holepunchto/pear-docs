# Hypercore

Hypercore is a secure, distributed append-only log built for sharing large datasets and streams of real-time data. It comes with a secure transport protocol, making it easy to build fast and scalable peer-to-peer applications.

Notable features include:

* Improved fork detection in the replication protocol, to improve resilience.
* Optional on-disk encryption for blocks (in addition to the existing transport encryption).
* A write-ahead log in the storage layer to ensure that power loss or unexpected shutdown cannot lead to data corruption.
* The [`session`](#core.session-options) and [`snapshot`](#core.snapshot-options) methods for providing multiple views over the same underlying Hypercore, which simplifies resource management.
* A [`truncate`](#await-core.truncate-newlength-forkid) method for intentionally creating a new fork, starting at a given length. We use this method extensively in [`autobase`](../building-blocks/autobase.md).

> [GitHub (Hypercore)](https://github.com/holepunchto/hypercore)

* [Hypercore](../building-blocks/hypercore.md)
  * [Creating a new instance](hypercore.md#installation)
  * Basic:
    * Properties:
      * [core.writable](hypercore.md#core.writable)
      * [core.readable](hypercore.md#core.readable)
      * [core.id](hypercore.md#core.id)
      * [core.key](hypercore.md#core.key)
      * [core.keyPair](hypercore.md#core.keypair)
      * [core.discoveryKey](hypercore.md#core.discoverykey)
      * [core.encryptionKey](hypercore.md#core.encryptionkey)
      * [core.length](hypercore.md#core.length)
      * [core.contiguousLength](hypercore.md#core.contiguouslength)
      * [core.fork](hypercore.md#core.fork)
      * [core.padding](hypercore.md#core.padding)
    * Methods:
      * [core.append(block)](hypercore.md#core.append)
      * [core.get(index, \[options\])](hypercore.md#core.get)
      * [core.has(start, \[end\])](hypercore.md#core.has)
      * [core.update()](hypercore.md#core.update)
      * [core.seek(byteOffset)](hypercore.md#core.seek)
      * [core.createReadStream(\[options\])](hypercore.md#core.createreadstream)
      * [core.createByteStream(\[options\])](hypercore.md#core.createbytestream)
      * [core.clear(start, \[end\], \[options\])](hypercore.md#core.clear)
      * [core.truncate(newLength, \[forkId\])](hypercore.md#core.truncate)
      * [core.purge()](hypercore.md#core.purge)
      * [core.treeHash(\[length\])](hypercore.md#core.treehash)
      * [core.download(\[range\])](hypercore.md#core.download)
      * [core.session(\[options\])](hypercore.md#core.session)
      * [core.info(\[options\])](hypercore.md#core.info)
      * [core.close()](hypercore.md#core.close)
      * [core.ready()](hypercore.md#core.ready)
      * [core.replicate(isInitiatorOrReplicationStream, \[options\])](hypercore.md#core.replicate)
      * [core.findingPeers()](hypercore.md#core.findingpeers)
      * [core.session(\[options\])](hypercore.md#core.session)
      * [core.snapshot(\[options\])](hypercore.md#core.snapshot)
    * Events:
      * [append](hypercore.md#core.onappend)
      * [truncate](hypercore.md#core.ontruncate)
      * [ready](hypercore.md#core.onready)
      * [close](hypercore.md#core.onclose)
      * [peer-add](hypercore.md#core.onpeer-add)
      * [peer-remove](hypercore.md#core.onpeer-remove)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hypercore
```

A Hypercore can only be modified by its creator; internally it signs updates with a private key that's meant to live on a single machine, and should never be shared. However, the writer can replicate to many readers, in a manner similar to BitTorrent.

> Unlike BitTorrent, a Hypercore can be modified after its initial creation, and peers can receive live update notifications whenever the writer adds new blocks.


### API

#### **`const core = new Hypercore(storage, [key], [options])`**

Creates a new Hypercore instance.

`storage` should be set to a directory where to store the data and core metadata.

```javascript
const core = new Hypercore('./directory') // store data in ./directory
```

> Alternatively, the user can pass a function instead that is called with every filename Hypercore needs to function and return a [abstract-random-access](https://github.com/random-access-storage/abstract-random-access) instance that is used to store the data.


```javascript
const RAM = require('random-access-memory')
const core = new Hypercore((filename) => {
  // Filename will be one of: data, bitfield, tree, signatures, key, secret_key
  // The data file will contain all the data concatenated.

  // Store all files in ram by returning a random-access-memory instance
  return new RAM()
})
```

By default Hypercore uses [random-access-file](https://github.com/random-access-storage/random-access-file). This is also useful for storing specific files in other directories.

Hypercore will produce the following files:

* `oplog` - The internal truncating journal/oplog that tracks mutations, the public key, and other metadata.
* `tree` - The Merkle Tree file.
* `bitfield` - The bitfield marking which data blocks this core has.
* `data` - The raw data of each block.


> `tree`, `data`, and `bitfield` are normally very sparse files.


`key` can be set to a Hypercore public key. When unset this the public key will be loaded from storage. If no key exists a new key pair will be generated.

`options` include:

|        Property       | Description                                                                             | Type     | Default            |
| :-------------------: | --------------------------------------------------------------------------------------- | -------- | ------------------ |
| **`createIfMissing`** | create a new Hypercore key pair if none was present in the storage                      | Boolean  | `true`             |
|    **`overwrite`**    | overwrite any old Hypercore that might already exist                                    | Boolean  | `false`            |
|      **`sparse`**     | enable sparse mode, counting unavailable blocks towards core.length and core.byteLength | Boolean  | `true`             |
|  **`valueEncoding`**  | one of 'json', 'utf-8', or 'binary'                                                     | String   | `'binary'`         |
|   **`encodeBatch`**   | optionally apply an encoding to complete batches                                        | Function | `batch => { ... }` |
|     **`keyPair`**     | optionally pass the public key and secret key as a key pair                             | Object   | `null`             |
|  **`encryptionKey`**  | optionally pass an encryption key to enable block encryption                            | Buffer   | `null`             |
|      **`onwait`**     | hook that is called if gets are waiting for download                                    | Function | `() => {}`         |
|     **`timeout`**     | constructor timeout                                                                     | integer  | `0`                  |
|     **`writable`**     |  disable appends and truncates                                                                     | Boolean  | `true`                |

We can also set valueEncoding to any [abstract-encoding](https://github.com/mafintosh/abstract-encoding) or [compact-encoding](https://github.com/compact-encoding) instance.

valueEncodings will be applied to individual blocks, even if we append batches. To control encoding at the batch level, the `encodeBatch` option can be used, which is a function that takes a batch and returns a binary-encoded batch. If a custom valueEncoding is provided, it will not be applied prior to `encodeBatch`.

> **Do not** attempt to create multiple Hypercores with the same private key (i.e., on two different devices).
>
>Doing so will **most definitely** cause a Hypercore conflict. A conflict implies that the core was implicitly forked. In such a scenario, replicating peers will 'gossip' that the core should be deemed dead and unrecoverable.


#### Properties

#### **`core.readable`** {#core.readable}

Can we read from this core? After [closing](hypercore.md#await-coreclose) the core this will be `false`.

#### **`core.id`** {#core.id}

A string containing the ID (z-base-32 of the public key) that identifies this core.

#### **`core.key`** {#core.key}

Buffer containing the public key identifying this core.

<details>

<summary>Learn more about Hypercore Keys</summary>

All Hypercores are identified by two properties: A **public key** and a **discovery key**, the latter of which is derived from the public key. Importantly, the public key gives peers read \*\*\*\* capability — if we have the key, we can exchange blocks with other peers.

The process of block replication requires the peers to prove to each other that they know the public key. This is important because the public key is necessary for peers to be able to validate the blocks. Hence, only the peers who know the public key can perform the block replication.

Since the public key is also a read capability, it can't be used to discover other readers (by advertising it on a DHT, for example) as that would lead to capability leaks. The discovery key, being derived from the public key but lacking read capability, can be shared openly for peer discovery.

</details>

#### **`core.keyPair`** {#core.keyPair}

An object containing buffers of the core's public and secret key

#### **`core.discoveryKey`** {#core.discoveryKey}

Buffer containing a key derived from the core's public key. In contrast to `core.key,` this key can not be used to verify the data. It can be used to announce or look for peers that are sharing the same core, without leaking the core key.

> The above properties are populated after [`ready`](hypercore.md#await-core.ready) has been emitted. Will be `null` before the event.


#### **`core.encryptionKey`** {#core.encryptionKey}

Buffer containing the optional block encryption key of this core. Will be `null` unless block encryption is enabled.

#### **`core.writable`** {#core.writable}

Can we append to this core?

> Populated after [`ready`](hypercore.md#await-core.ready) has been emitted. Will be `false` before the event.


#### **`core.length`** {#core.length}

The number of blocks of data available on this core. If `sparse: false`, this will equal `core.contiguousLength`.

#### **`core.contiguousLength`** {#core.contiguousLength}

The number of blocks contiguously available starting from the first block of this core.

#### **`core.fork`** {#core.fork}

The current fork id of this core

> The above properties are populated after [`ready`](hypercore.md#await-core.ready) has been emitted. Will be `0` before the event.


#### **`core.padding`** {#core.padding}

The amount of padding applied to each block of this core. Will be `0` unless block encryption is enabled.

#### Methods

#### **`const { length, byteLength } = await core.append(block)`**  {#core.append}

Append a block of data (or an array of blocks) to the core. Returns the new length and byte length of the core.

> This operation is 'atomic'. This means that the block is appended altogether or not at all (in case of I/O failure).


```javascript
// simple call append with a new block of data
await core.append(Buffer.from('I am a block of data'))

// pass an array to append multiple blocks as a batch
await core.append([Buffer.from('batch block 1'), Buffer.from('batch block 2')])
```

#### **`const block = await core.get(index, [options])`** {#core.get}

Get a block of data. If the data is not available locally this method will prioritize and wait for the data to be downloaded.

```javascript
// get block #42
const block = await core.get(42)

// get block #43, but only wait 5s
const blockIfFast = await core.get(43, { timeout: 5000 })

// get block #44, but only if we have it locally
const blockLocal = await core.get(44, { wait: false })
```

`options` include:

|       Property      | Description                                            | Type    | Default              |
| :-----------------: | ------------------------------------------------------ | ------- | -------------------- |
|      **`wait`**     | Wait for the block to be downloaded                    | Boolean | `true`               |
|     **`onwait`**    | Hook that is called if the get is waiting for download | Boolean | `() => {}`           |
|    **`timeout`**    | Wait at max some milliseconds (0 means no timeout)     | Boolean | `0`                  |
| **`valueEncoding`** | One of 'json', 'utf-8', or 'binary'                    | String  | core's valueEncoding |
|    **`decrypt`**    | Automatically decrypts the block if encrypted          | Boolean | `true`               |

#### **`const has = await core.has(start, [end])`** {#core.has}

Check if the core has all blocks between `start` and `end`.

#### **`const updated = await core.update([options])`** {#core.update}

Wait for the core to try and find a signed update to its length. Does not download any data from peers except for proof of the new core length.

```javascript
const updated = await core.update()
console.log('core was updated?', updated, 'length is', core.length)
```

`options` include:

|  Property  | Description                                       | Type    | Default |
| :--------: | ------------------------------------------------- | ------- | ------- |
| **`wait`** | Wait for the meta-data of hypercore to be updated | Boolean | `replicator.findingPeers > 0`  |

#### **`const [index, relativeOffset] = await core.seek(byteOffset, [options])`** {#core.seek}

Seek a byte offset.

Returns `[index, relativeOffset]`, where `index` is the data block the byteOffset is contained in and `relativeOffset` is the relative byte offset in the data block.

```javascript
await core.append([Buffer.from('abc'), Buffer.from('d'), Buffer.from('efg')])

const first = await core.seek(1) // returns [0, 1]
const second = await core.seek(3) // returns [1, 0]
const third = await core.seek(5) // returns [2, 1]
```

`options` include:

| Property      | Description                    | Type    | Default                       |
| ------------- | ------------------------------ | ------- | ----------------------------- |
| **`wait`**    | wait for data to be downloaded | Boolean | `true` |
| **`timeout`** | wait for given milliseconds    | Integer | `core.timeout`                |

#### **`const stream = core.createReadStream([options])`** {#core.readstream}

Make a read stream to read a range of data out at once.

```javascript
// read the full core
const fullStream = core.createReadStream()

// read from block 10-15
const partialStream = core.createReadStream({ start: 10, end: 15 })

// pipe the stream somewhere using the .pipe method
// or consume it as an async iterator

for await (const data of fullStream) {
  console.log('data:', data)
}
```

`options` include:

| Property       | Description                                                    | Type    | Default       |
| -------------- | -------------------------------------------------------------- | ------- | ------------- |
| **`start`**    | Starting offset to read a range of data                        | Integer | `0`           |
| **`end`**      | Ending offset to read a range of data                          | Integer | `core.length` |
| **`live`**     | Allow realtime data replication                                | Boolean | `false`       |
| **`snapshot`** | Auto set end to core.length on open or update it on every read | Boolean | `true`        |

#### `const bs = core.createByteStream([options])` {#core.createbytestream}

Make a byte stream to read a range of bytes.

``` js
// Read the full core
const fullStream = core.createByteStream()
// Read from byte 3, and from there read 50 bytes
const partialStream = core.createByteStream({ byteOffset: 3, byteLength: 50 })
// Consume it as an async iterator
for await (const data of fullStream) {
  console.log('data:', data)
}
// Or pipe it somewhere like any stream:
partialStream.pipe(process.stdout)
```

`options` include:

| Property      | Description                    | Type    | Default                       |
| ------------- | ------------------------------ | ------- | ----------------------------- |
| **`byteOffset`**    |  Starting offset to read a range of bytes      | Integer | `0` |
| **`byteLength`** |  Number of bytes that will be read | Integer | `core.byteLength - options.byteOffset`                |
| **`prefetch`** |  Controls the number of blocks to preload    | Integer | `32`                |

#### **`const cleared = await core.clear(start, [end], [options])`** {#core.clear}

Clears stored blocks between `start` and `end`, reclaiming storage when possible.

`options` include:

| Property          | Description                                                           | Type    | Default |
| ----------------- | --------------------------------------------------------------------- | ------- | ------- |
| **`diff`** | Returned `cleared` bytes object is null unless enabled   | Boolean | `false` |

```javascript
await core.clear(4) // clear block 4 from local cache
await core.clear(0, 10) // clear block 0-10 from local cache
```

The core will also 'gossip' with peers it is connected to, that it no longer have these blocks.

#### **`await core.truncate(newLength, [forkId])`** {#core.truncate}

Truncates the core to a smaller length.

Per default, this will update the fork ID of the core to `+ 1`, but we can set the preferred fork ID with the option. Note that the fork ID should be incremented in a monotone manner.

#### `await core.purge()` {#core.purge}

Purge the Hypercore from storage, completely removing all data.

#### **`const hash = await core.treeHash([length])`** {#core.purge}

Get the Merkle Tree hash of the core at a given length, defaulting to the current length of the core.

#### **`const range = core.download([range])`** {#core.download}

Download a range of data.

We can await until the range has been fully downloaded by doing:

```javascript
await range.done()
```

A range can have the following properties:

```javascript
{
  start: startIndex,
  end: nonInclusiveEndIndex,
  blocks: [index1, index2, ...],
  linear: false // download range linearly and not randomly
}
```

To download the full core continuously (often referred to as non-sparse mode):

```javascript
// Note that this will never be considered downloaded as the range
// will keep waiting for new blocks to be appended.
core.download({ start: 0, end: -1 })
```

To download a discrete range of blocks, pass a list of indices:

```javascript
core.download({ blocks: [4, 9, 7] })
```

To cancel downloading a range, simply destroy the range instance:

```javascript
// will stop downloading now
range.destroy()
```
#### **`const session = await core.session([options])`** {#core.session}

Creates a new Hypercore instance that shares the same underlying core. Options are inherited from the parent instance, unless they are re-set.

`options` are the same as in the constructor.

> Be sure to close any sessions made. 

#### **`const info = await core.info([options])`** {#core.info}

Get information about this core, such as its total size in bytes.

The object will look like this:

```javascript
Info {
  key: Buffer(...),
  discoveryKey: Buffer(...),
  length: 18,
  contiguousLength: 16,
  byteLength: 742,
  fork: 0,
  padding: 8,
  storage: {
    oplog: 8192, 
    tree: 4096, 
    blocks: 4096, 
    bitfield: 4096 
  }
}
```

`options` include:

| Property  | Description                    | Type    | Default |
| --------- | ------------------------------ | ------- | ------- |
| `storage` | get storage estimates in bytes | Boolean | `false` |

#### **`await core.close()`** {#core.close}

Close this core and release any underlying resources.

#### **`await core.ready()`** {#core.ready}

Waits for the core to open.

After this has been called `core.length` and other properties have been set.

> ℹ️ In general, waiting for `ready` is unnecessary unless there's a need to check a synchronous property (like `key` or `discoverykey`) before any other async API method has been called. All async methods on the public API, await `ready` internally.


#### **`const stream = core.replicate(isInitiator|stream, options)`** {#core.replicate}

Creates a replication stream. We should pipe this to another Hypercore instance.

The `isInitiator` argument is a boolean indicating whether a peer is the initiator of the connection (ie the client) or the passive peer waiting for connections (i.e., the server).

> If a P2P swarm like Hyperswarm is being used, whether a peer is an initiator can be determined by checking if the swarm connection is a client socket or a server socket. In Hyperswarm, a user can check that using the [client property on the peer details object](https://github.com/holepunchto/hyperswarm#swarmonconnection-socket-details).



To multiplex the replication over an existing Hypercore replication stream, another stream instance can be passed instead of the `isInitiator` Boolean.

To replicate a Hypercore using [`Hyperswarm`](hyperswarm.md):

```javascript
// assuming swarm is a Hyperswarm instance and core is a Hypercore
swarm.on('connection', conn => {
  core.replicate(conn)
})
```

> To replicate many Hypercores over a single Hyperswarm connection, see [`Corestore`](../helpers/corestore.md).


If not using [`Hyperswarm`](hyperswarm.md) or [`Corestore`](../helpers/corestore.md), specify the `isInitiator` field, which will create a fresh protocol stream that can be piped over any transport:

```javascript
// assuming we have two cores, localCore + remoteCore, sharing the same key
// on a server
const net = require('net')
const server = net.createServer(function (socket) {
  socket.pipe(remoteCore.replicate(false)).pipe(socket)
})

// on a client
const socket = net.connect(...)
socket.pipe(localCore.replicate(true)).pipe(socket)
```

> In almost all cases, the use of both Hyperswarm and Corestore Replication is advised and will meet all needs.

#### **`const done = core.findingPeers()`** {#core.findingpeers}

Create a hook that tells Hypercore users are finding peers for this core in the background. Call `done` when user current discovery iteration is done. If using Hyperswarm, call this after a `swarm.flush()` finishes.

This allows `core.update` to wait for either the `findingPeers` hook to finish or one peer to appear before deciding whether it should wait for a Merkle tree update before returning.

In order to prevent `get` and `update` from resolving until Hyperswarm (or any other external peer discovery process) has finished, use the following pattern:

```javascript
// assuming swarm is a Hyperswarm and core is a Hypercore
const done = core.findingPeers()
swarm.join(core.discoveryKey)

// swarm.flush() can be a very expensive operation, so don't await it
// this just marks the 'worst case', i.e., when no additional peers will be found
swarm.flush().then(() => done())

// if this block is not available locally, the `get` will wait until
// *either* a peer connects *or* the swarm flush finishes
await core.get(0)
```

#### **`core.session([options])`** 

Returns a new session for the Hypercore.

Used for the resource management of the Hypercores using reference counting. The sessions are individual openings to a Hypercore instance and consequently, the changes made through one session will be reflected across all sessions of the Hypercore.

> The returned value of `core.session()` can be used as a Hypercore instance i.e., everything provided by the Hypercore API can be used with it.

`options` include:

|   Property   | Description                                                                                 | Type    | Default     |
| :----------: | ------------------------------------------------------------------------------------------- | ------- | ----------- |
|  **`wait`**  | Wait for the block to be downloaded                                                         | Boolean | `true`      |
| **`onwait`** | Hook that is called if the get is waiting for download                                      | Boolean | `() => {}`  |
| **`sparse`** | Enables sparse mode, counting unavailable blocks towards `core.length` and `core.byteLength` | Boolean | `true`      |
|  **`class`** | class name                                                                                  | Class   | `Hypercore` |

```javascript
const core = new Hypercore(ram)
const session1 = core.session()

await core.close()     // will not close the underlying Hypercore
await session1.close() // will close the Hypercore
```

#### **`core.snapshot([options])`** {#core.snapshot} 

Returns a snapshot of the core at that particular time. This is useful for ensuring that multiple `get` operations are acting on a consistent view of the Hypercore (i.e. if the core forks in between two reads, the second should throw an error).

If [`core.update()`](hypercore.md#const-updated--await-coreupdateoptions) is explicitly called on the snapshot instance, it will no longer be locked to the previous data. Rather, it will get updated with the current state of the Hypercore instance.

`options` are the same as the options to [`core.session()`](hypercore.md#coresessionoptions).

> The fixed-in-time Hypercore clone created via snapshotting does not receive updates from the main Hypercore, unlike the Hypercore instance returned by `core.session()`.

#### Events

#### **`core.on('append')`** {#core.onappend}

Emitted when the core has been appended to (i.e., has a new length/byte length), either locally or remotely.

#### **`core.on('truncate', ancestors, forkId)`** {#core.ontruncate}

Emitted when the core has been truncated, either locally or remotely.

#### **`core.on('ready')`** {#core.onready}

Emitted after the core has initially opened all its internal state.

#### **`core.on('close')`** {#core.onclose}

Emitted when the core has been fully closed.

#### **`core.on('peer-add')`** {#core.onpeer-add}

Emitted when a new connection has been established with a peer.

#### **`core.on('peer-remove')`** {#core.onpeer-remove}

Emitted when a peer's connection has been closed.
