# Hyperdrive

Hyperdrive is a secure, real-time distributed file system designed for easy P2P file sharing. We use it extensively inside Holepunch; apps like Keet are distributed to users as Hyperdrives, as is the Holepunch platform itself.

Notable features include:

* Uses Hyperbee internally for storing file metadata
* Major API simplification. Instead of mirroring POSIX APIs, the new API better captures the core requirements of P2P file transfer.
* Auxiliary tools, [`localdrive`](../helpers/localdrive.md) and [`mirrordrive`](../helpers/mirrordrive.md), that streamline import/export flows and make it easy to mirror drives to and from the local filesystem.

> [GitHub (Hyperdrive)](https://github.com/holepunchto/hyperdrive)

* [Hyperdrive](../building-blocks/hyperdrive.md)
  * [Create a new instance](hyperdrive.md#installation)
  * Basic:
    * Properties:
      * [drive.corestore](hyperdrive.md#drive.corestore)
      * [drive.db](hyperdrive.md#drive.db)
      * [drive.core](hyperdrive.md#drive.core)
      * [drive.id](hyperdrive.md#drive.id)
      * [drive.key](hyperdrive.md#drive.key)
      * [drive.writable](hyperdrive.md#drive.writable)
      * [drive.readable](hyperdrive.md#drive.readable)
      * [drive.discoveryKey](hyperdrive.md#drive.discoverykey)
      * [drive.contentKey](hyperdrive.md#drive.contentkey)
      * [drive.version](hyperdrive.md#drive.version)
      * [drive.supportsMetadata](hyperdrive.md#drive.supportsmetadata)
    * Methods:
      * [drive.ready()](hyperdrive.md#drive.ready)
      * [drive.close()](hyperdrive.md#drive.close)
      * [drive.put(path, buffer, \[options\])](hyperdrive.md#drive.put)
      * [drive.get(path, \[options\])](hyperdrive.md#drive.get)
      * [drive.entry(path, \[options\])](hyperdrive.md#drive.entry)
      * [drive.exists(path)](hyperdrive.md#drive.exists)
      * [drive.del(path)](hyperdrive.md#drive.del)
      * [drive.compare(entryA, entryB)](hyperdrive.md#drive.compare)
      * [drive.clear(path, \[options\])](hyperdrive.md#drive.clear)
      * [drive.clearAll(\[options\])](hyperdrive.md#drive.clearall)
      * [drive.purge()](hyperdrive.md#drive.purge)
      * [drive.symlink(path, linkname)](hyperdrive.md#drive.symlink)
      * [drive.batch()](hyperdrive.md#drive.batch)
        * [batch.flush()](hyperdrive.md#drive.batch)
      * [drive.list(folder, \[options\])](hyperdrive.md#drive.list)
      * [drive.readdir(folder)](hyperdrive.md#drive.readdir)
      * [drive.entries(\[range\], \[options\])](hyperdrive.md#drive.entries)
      * [drive.mirror(out, \[options\])](hyperdrive.md#drive.mirror)
      * [drive.watch(\[folder\])](hyperdrive.md#drive.watch)
      * [drive.createReadStream(path, \[options\])](hyperdrive.md#drive.createreadstream)
      * [drive.createWriteStream(path, \[options\])](hyperdrive.md#drive.createwritestream)
      * [drive.download(folder, \[options\])](hyperdrive.md#drive.download)
      * [drive.checkout(version)](hyperdrive.md#drive.checkout)
      * [drive.diff(version, folder, \[options\])](hyperdrive.md#drive.diff)
      * [drive.downloadDiff(version, folder, \[options\])](hyperdrive.md#drive.downloaddiff)
      * [drive.downloadRange(dbRanges, blobRanges)](hyperdrive.md#drive.downloadrange)
      * [drive.findingPeers()](hyperdrive.md#drive.findingpeers)
      * [drive.replicate(isInitiatorOrStream)](hyperdrive.md#drive.replicate)
      * [drive.update(\[options\])](hyperdrive.md#drive.update)
      * [drive.getBlobs()](hyperdrive.md#drive.getblobs)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperdrive
```

### API

#### **`const drive = new Hyperdrive(store, [key])`**

Creates a new Hyperdrive instance. `store` must be an instance of [`Corestore`](../helpers/corestore.md).

By default, it uses the core at `{ name: 'db' }` from `store`, unless the public `key` is set.

#### Properties

#### **`drive.corestore`** {#drive.corestore}

The Corestore instance used as storage.

#### **`drive.db`** {#drive.db}

The underlying Hyperbee backing the drive file structure.

#### **`drive.core`** {#drive.core}

The Hypercore used for `drive.db`.

#### **`drive.id`** {#drive.id}

String containing the id (z-base-32 of the public key) identifying this drive.

#### **`drive.key`** {#drive.key}

The public key of the Hypercore backing the drive.

#### **`drive.writable`** {#drive.writable}

Boolean indicating if we can write or delete data in this drive.

#### **`drive.readable`** {#drive.readable}

Boolean indicating if we can read from this drive. After closing the drive this will be `false`.

#### **`drive.discoveryKey`** {#drive.discoverykey}

The hash of the public key of the Hypercore backing the drive. It can be used as a `topic` to seed the drive using Hyperswarm.

#### **`drive.contentKey`** {#drive.contentkey}

The public key of the [Hyperblobs](https://github.com/holepunchto/hyperblobs) instance holding blobs associated with entries in the drive.

#### **`drive.version`** {#drive.version}

The number that indicates how many modifications were made, it is useful as a version identifier.

#### **`drive.supportsMetadata`** {#drive.supportsmetadata}

Boolean indicating if the drive handles or not metadata. Always `true`.

#### Methods

#### **`await drive.ready()`** {#drive.ready}

Waits until the internal state is loaded.

Use it once before reading synchronous properties like `drive.discoveryKey`. 
If any of the other APIs are called first they will wait for readiness so this is only needed to lookup
synchronous properties before any API call.

#### **`await drive.close()`** {#drive.close}

Fully close this drive, including its underlying Hypercore backed data structures.

#### **`await drive.put(path, buffer, [options])`** {#drive.put}

Creates a file at `path` in the drive. `options` are the same as in `createWriteStream`.

#### **`const buffer = await drive.get(path, [options])`** {#drive.get}

Returns the blob at `path` in the drive. If no blob exists, returns `null`.

It also returns `null` for symbolic links.

`options` include:

```js
{
  follow: false, // Follow symlinks, 16 max or throws an error
  wait: true, // Wait for block to be downloaded
  timeout: 0 // Wait at max some milliseconds (0 means no timeout)
}
```

#### **`const entry = await drive.entry(path, [options])`** {#drive.entry}

Returns the entry at `path` in the drive. It looks like this:

```javascript
{
  seq: Number,
  key: String,
  value: {
    executable: Boolean, // Whether the blob at path is an executable
    linkname: null, // If entry not symlink, otherwise a string to the entry this links to
    blob: { // Hyperblobs id that can be used to fetch the blob associated with this entry
      blockOffset: Number,
      blockLength: Number,
      byteOffset: Number,
      byteLength: Number
    },
    metadata: null
  }
}
```

`options` include:

```js
{
  follow: false, // Follow symlinks, 16 max or throws an error
  wait: true, // Wait for block to be downloaded
  timeout: 0 // Wait at max some milliseconds (0 means no timeout)
}
```

#### `const exists = await drive.exists(path)` {#drive.exists}

Returns `true` if the entry at `path` does exists, otherwise `false`.

#### **`await drive.del(path)`** {#drive.del}

Deletes the file at `path` from the drive.

> ℹ️ The underlying blob is not deleted, only the reference in the file structure.

#### **`const comparison = drive.compare(entryA, entryB)`** {#drive.compare}

Returns `0` if entries are the same, `1` if `entryA` is older, and `-1` if `entryB` is older.

#### **`const cleared = await drive.clear(path, [options])`** {#drive.clear}

Deletes the blob from storage to free up space, but the file structure reference is kept.

`options` include:

| Property          | Description                                                           | Type    | Default |
| ----------------- | --------------------------------------------------------------------- | ------- | ------- |
| **`diff`** | Returned `cleared` bytes object is null unless enabled | Boolean | `false` |

#### `const cleared = await drive.clearAll([options])` {#drive.clearall}

Deletes all the blobs from storage to free up space, similar to how `drive.clear()` works.

`options` include:

| Property          | Description                                                           | Type    | Default |
| ----------------- | --------------------------------------------------------------------- | ------- | ------- |
| **`diff`** | Returned `cleared` bytes object is null unless enabled | Boolean | `false` |

#### `await drive.purge()` {#drive.purge}

Purges both cores (db and blobs) from storage, completely removing all the drive's data.

#### **`await drive.symlink(path, linkname)`** {#drive.symlink}

Creates an entry in drive at `path` that points to the entry at `linkname`.

If a blob entry currently exists at `path` then it will get overwritten and `drive.get(key)` will return `null`, while `drive.entry(key)` will return the entry with symlink information.

#### **`const batch = drive.batch()`** {#drive.batch}

Useful for atomically mutating the drive, has the same interface as Hyperdrive.

#### **`await batch.flush()`** {#drive.flush}

Commit a batch of mutations to the underlying drive.

#### **`const stream = drive.list(folder, [options])`** {#drive.list}

Returns a stream of all entries in the drive at paths prefixed with `folder`.

`options` include:

| Property        | Description                                   | Type    | Default |
| --------------- | --------------------------------------------- | ------- | ------- |
| **`recursive`** | whether to descend into all subfolders or not | Boolean | `true`  |

#### **`const stream = drive.readdir(folder)`** {#drive.readdir}

Returns a stream of all subpaths of entries in the drive stored at paths prefixed by `folder`.

#### **`const stream = await drive.entries([range], [options])`** {#drive.entries}

Returns a read stream of entries in the drive.

`options` are the same as `Hyperbee().createReadStream([range], [options])`.

#### **`const mirror = drive.mirror(out, [options])`** {#drive.mirror}

Mirrors this drive into another. Returns a [`MirrorDrive`](../helpers/mirrordrive.md) instance constructed with `options`.

Call `await mirror.done()` to wait for the mirroring to finish.

#### **`const watcher = drive.watch([folder])`** {#drive.watch}

Returns an iterator that listens on `folder` to yield changes, by default on `/`.

Usage example:

```javascript
for await (const [current, previous] of watcher) {
  console.log(current.version)
  console.log(previous.version)
}
```

> `current` and `previous` are the snapshots that are auto-closed before next value.
>
> Do not close those snapshots as they're used internally, let them be auto-closed.


Methods:

`await watcher.ready()`

Waits until the watcher is loaded and detecting changes.

`await watcher.destroy()`

Stops the watcher. I can also be stopped by using `break` in the `for await` loop.

#### **`const rs = drive.createReadStream(path, [options])`** {#drive.createreadstream}

Returns a stream to read out the blob stored in the drive at `path`.

`options` include:

```javascript
{
  start: Number, // `start` and `end` are inclusive
  end: Number,
  length: Number, // `length` overrides `end`, they're not meant to be used together
  wait: true, // Wait for blocks to be downloaded
  timeout: 0 // Wait at max some milliseconds (0 means no timeout)
}
```

#### **`const ws = drive.createWriteStream(path, [options])`** {#drive.createwritestream}

Stream a blob into the drive at `path`.

`options` include:

| Property         | Description                                          | Type    | Default |
| ---------------- | ---------------------------------------------------- | ------- | ------- |
| **`executable`** | whether the blob is executable or not                | Boolean | `true`  |
| **`metadata`**   | Extended file information i.e., arbitrary JSON value | Object  | `null`  |

#### **`await drive.download(folder, [options])`** {#drive.download}

Downloads the blobs corresponding to all entries in the drive at paths prefixed with `folder`.

`options` are the same as those for `drive.list(folder, [options])`.

#### **`const snapshot = drive.checkout(version)`** {#drive.checkout}

Gets a read-only snapshot of a previous version.

#### **`const stream = drive.diff(version, folder, [options])`** {#drive.diff}

Creates a stream of shallow changes to `folder` between `version` and `drive.version`.

Each entry is sorted by key and looks like this:

```javascript
{
  left: Object, // Entry in folder at drive.version for some path
  right: Object // Entry in folder at drive.checkout(version) for some path
}
```

> ℹ️ If an entry exists in `drive.version` of the `folder` but not in `version`, then `left` is set and `right` will be `null`, and vice versa.

#### **`await drive.downloadDiff(version, folder, [options])`** {#drive.downloaddiff}

Downloads all the blobs in `folder` corresponding to entries in `drive.checkout(version)` that are not in `drive.version`.

In other words, downloads all the blobs added to `folder` up to `version` of the drive.

#### **`await drive.downloadRange(dbRanges, blobRanges)`** {#drive.downloadrange}

Downloads the entries and blobs stored in the [ranges](https://github.com/holepunchto/hypercore#const-range--coredownloadrange) `dbRanges` and `blobRanges`.

#### **`const done = drive.findingPeers()`** {#drive.findingpeers}

Indicates to Hyperdrive that users are finding peers in the background, requests will be on hold until this is done.

Call `done()` when the current discovery iteration is done, i.e., after `swarm.flush()` finishes.

#### **`const stream = drive.replicate(isInitiatorOrStream)`** {#drive.replicate}

Usage example:

```javascript
const swarm = new Hyperswarm()
const done = drive.findingPeers()
swarm.on('connection', (socket) => drive.replicate(socket))
swarm.join(drive.discoveryKey)
swarm.flush().then(done, done)
```

Learn more about how replicate works at [corestore.replicate](https://github.com/holepunchto/corestore#const-stream--storereplicateoptsorstream).

#### **`const updated = await drive.update([options])`** {#drive.update}

Waits for initial proof of the new drive version until all `findingPeers` are done.

`options` include:

```javascript
{
  wait: false
}
```

Use `drive.findingPeers()` or `{ wait: true }` to make await `drive.update()` blocking.

#### **`const blobs = await drive.getBlobs()`** {#drive.getblobs}

Returns the [Hyperblobs](https://github.com/holepunchto/hyperblobs) instance storing the blobs indexed by drive entries.

```javascript
await drive.put('/file.txt', Buffer.from('hi'))

const buffer1 = await drive.get('/file.txt')

const blobs = await drive.getBlobs()
const entry = await drive.entry('/file.txt')
const buffer2 = await blobs.get(entry.value.blob)

// => buffer1 and buffer2 are equals
```
