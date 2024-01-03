# Hyperdrive

<mark style="background-color:green;">**stable**</mark>

Hyperdrive is a secure, real-time distributed file system designed for easy P2P file sharing. We use it extensively inside Holepunch; apps like Keet are distributed to users as Hyperdrives, as is the Holepunch platform itself.

{% embed url="https://github.com/holepunchto/hyperdrive" %}

* [Hyperdrive](hyperdrive.md#installation)
  * [Create a new instance](hyperdrive.md#const-drive-new-hyperdrive-store-key)
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
      * [drive.ready()](hyperdrive.md#await-drive.ready)
      * [drive.close()](hyperdrive.md#await-drive.close)
      * [drive.put(path, buffer, \[options\])](hyperdrive.md#await-drive.put-path-buffer-options)
      * [drive.get(path, \[options\])](hyperdrive.md#const-buffer-await-drive.get-path-options)
      * [drive.entry(path, \[options\])](hyperdrive.md#const-entry-await-drive.entry-path-options)
      * [drive.exists(path)](hyperdrive.md#const-exists-await-drive.exists-path)
      * [drive.del(path)](hyperdrive.md#await-drive.del-path)
      * [drive.compare(entryA, entryB)](hyperdrive.md#const-comparison-drive.compare-entrya-entryb)
      * [drive.clear(path, \[options\])](hyperdrive.md#const-cleared-await-drive.clear-path-options)
      * [drive.clearAll(\[options\])](hyperdrive.md#const-cleared-await-drive.clearall-options)
      * [drive.purge()](hyperdrive.md#await-drive.purge)
      * [drive.symlink(path, linkname)](hyperdrive.md#await-drive.symlink-path-linkname)
      * [drive.batch()](hyperdrive.md#const-batch-drive.batch)
        * [batch.flush()](hyperdrive.md#await-batch.flush)
      * [drive.list(folder, \[options\])](hyperdrive.md#const-stream-drive.list-folder-options)
      * [drive.readdir(folder)](hyperdrive.md#const-stream-drive.readdir-folder)
      * [drive.entries(\[range\], \[options\])](hyperdrive.md#const-stream-await-drive.entries-range-options)
      * [drive.mirror(out, \[options\])](hyperdrive.md#const-mirror-drive.mirror-out-options)
      * [drive.watch(\[folder\])](hyperdrive.md#const-watcher-drive.watch-folder)
      * [drive.createReadStream(path, \[options\])](hyperdrive.md#const-rs-drive.createreadstream-path-options)
      * [drive.createWriteStream(path, \[options\])](hyperdrive.md#const-ws-drive.createwritestream-path-options)
      * [drive.download(folder, \[options\])](hyperdrive.md#await-drive.download-folder-options)
      * [drive.checkout(version)](hyperdrive.md#const-snapshot-drive.checkout-version)
      * [drive.diff(version, folder, \[options\])](hyperdrive.md#const-stream-drive.diff-version-folder-options)
      * [drive.downloadDiff(version, folder, \[options\])](hyperdrive.md#await-drive.downloaddiff-version-folder-options)
      * [drive.downloadRange(dbRanges, blobRanges)](hyperdrive.md#await-drive.downloadrange-dbranges-blobranges)
      * [drive.findingPeers()](hyperdrive.md#const-done-drive.findingpeers)
      * [drive.replicate(isInitiatorOrStream)](hyperdrive.md#const-stream-drive.replicate-isinitiatororstream)
      * [drive.update(\[options\])](hyperdrive.md#const-updated-await-drive.update-options)
      * [drive.getBlobs()](hyperdrive.md#const-blobs-await-drive.getblobs)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperdrive
```

### API

#### **`const drive = new Hyperdrive(store, [key])`**

Creates a new Hyperdrive instance. `store` must be an instance of [corestore.md](../helpers/corestore.md "mention").

By default, it uses the core at `{ name: 'db' }` from `store`, unless you set the public `key`.

#### Properties

#### **`drive.corestore`**

The Corestore instance used as storage.

#### **`drive.db`**

The underlying Hyperbee backing the drive file structure.

#### **`drive.core`**

The Hypercore used for `drive.db`.

#### **`drive.id`**

String containing the id (z-base-32 of the public key) identifying this drive.

#### **`drive.key`**

The public key of the Hypercore backing the drive.

#### **`drive.writable`**

Boolean indicating if we can write or delete data in this drive.

#### **`drive.readable`**

Boolean indicating if we can read from this drive. After closing the drive this will be `false`.

#### **`drive.discoveryKey`**

The hash of the public key of the Hypercore backing the drive. It can be used as a `topic` to seed the drive using Hyperswarm.

#### **`drive.contentKey`**

The public key of the [Hyperblobs](https://github.com/holepunchto/hyperblobs) instance holding blobs associated with entries in the drive.

#### **`drive.version`**

The number that indicates how many modifications were made, is useful as a version identifier.

#### **`drive.supportsMetadata`**

Boolean indicating if the drive handles or not metadata. Always `true`.

#### Methods

#### **`await drive.ready()`**

Waits until the internal state is loaded.

Use it once before reading synchronous properties like `drive.discoveryKey`, unless you called any of the other APIs.

#### **`await drive.close()`**

Fully close this drive, including its underlying Hypercore backed data structures.

#### **`await drive.put(path, buffer, [options])`**

Creates a file at `path` in the drive. `options` are the same as in `createWriteStream`.

#### **`const buffer = await drive.get(path, [options])`**

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

#### **`const entry = await drive.entry(path, [options])`**

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

#### `const exists = await drive.exists(path)`

Returns `true` if the entry at `path` does exists, otherwise `false`.

#### **`await drive.del(path)`**

Deletes the file at `path` from the drive.

{% hint style="info" %}
The underlying blob is not deleted, only the reference in the file structure.
{% endhint %}

#### **`const comparison = drive.compare(entryA, entryB)`**

Returns `0` if entries are the same, `1` if `entryA` is older, and `-1` if `entryB` is older.

#### **`const cleared = await drive.clear(path, [options])`**

Deletes the blob from storage to free up space, but the file structure reference is kept.

`options` include:

| Property          | Description                                                           | Type    | Default |
| ----------------- | --------------------------------------------------------------------- | ------- | ------- |
| **`diff`** | Returned `cleared` bytes object is null unless you enable this | Boolean | `false` |

#### `const cleared = await drive.clearAll([options])`

Deletes all the blobs from storage to free up space, similar to how `drive.clear()` works.

`options` include:

| Property          | Description                                                           | Type    | Default |
| ----------------- | --------------------------------------------------------------------- | ------- | ------- |
| **`diff`** | Returned `cleared` bytes object is null unless you enable this | Boolean | `false` |

#### `await drive.purge()`

Purge both cores (db and blobs) from your storage, completely removing all the drive's data.

#### **`await drive.symlink(path, linkname)`**

Creates an entry in drive at `path` that points to the entry at `linkname`.

If a blob entry currently exists at `path` then it will get overwritten and `drive.get(key)` will return `null`, while `drive.entry(key)` will return the entry with symlink information.

#### **`const batch = drive.batch()`**

Useful for atomically mutating the drive, has the same interface as Hyperdrive.

#### **`await batch.flush()`**

Commit a batch of mutations to the underlying drive.

#### **`const stream = drive.list(folder, [options])`**

Returns a stream of all entries in the drive at paths prefixed with `folder`.

`options` include:

| Property        | Description                                   | Type    | Default |
| --------------- | --------------------------------------------- | ------- | ------- |
| **`recursive`** | whether to descend into all subfolders or not | Boolean | `true`  |

#### **`const stream = drive.readdir(folder)`**

Returns a stream of all subpaths of entries in the drive stored at paths prefixed by `folder`.

#### **`const stream = await drive.entries([range], [options])`**

Returns a read stream of entries in the drive.

`options` are the same as `Hyperbee().createReadStream([range], [options])`.

#### **`const mirror = drive.mirror(out, [options])`**

Efficiently mirror this drive into another. Returns a [mirrordrive.md](../helpers/mirrordrive.md "mention") instance constructed with `options`.

Call `await mirror.done()` to wait for the mirroring to finish.

#### **`const watcher = drive.watch([folder])`**

Returns an iterator that listens on `folder` to yield changes, by default on `/`.

Usage example:

```javascript
for await (const [current, previous] of watcher) {
  console.log(current.version)
  console.log(previous.version)
}
```

{% hint style="warning" %}
`current` and `previous` are the snapshots that are auto-closed before next value.

Do not close those snapshots yourself because they're used internally, let them be auto-closed.
{% endhint %}

Methods:

`await watcher.ready()`

Waits until the watcher is loaded and detecting changes.

`await watcher.destroy()`

Stops the watcher. You could also stop it by using `break` in the loop.

#### **`const rs = drive.createReadStream(path, [options])`**

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

#### **`const ws = drive.createWriteStream(path, [options])`**

Stream a blob into the drive at `path`.

`options` include:

| Property         | Description                                          | Type    | Default |
| ---------------- | ---------------------------------------------------- | ------- | ------- |
| **`executable`** | whether the blob is executable or not                | Boolean | `true`  |
| **`metadata`**   | Extended file information i.e., arbitrary JSON value | Object  | `null`  |

#### **`await drive.download(folder, [options])`**

Downloads the blobs corresponding to all entries in the drive at paths prefixed with `folder`.

`options` are the same as those for `drive.list(folder, [options])`.

#### **`const snapshot = drive.checkout(version)`**

Get a read-only snapshot of a previous version.

#### **`const stream = drive.diff(version, folder, [options])`**

Efficiently create a stream of shallow changes to `folder` between `version` and `drive.version`.

Each entry is sorted by key and looks like this:

```javascript
{
  left: Object, // Entry in folder at drive.version for some path
  right: Object // Entry in folder at drive.checkout(version) for some path
}
```

{% hint style="info" %}
If an entry exists in `drive.version` of the `folder` but not in `version`, then `left` is set and `right` will be `null`, and vice versa.
{% endhint %}

#### **`await drive.downloadDiff(version, folder, [options])`**

Downloads all the blobs in `folder` corresponding to entries in `drive.checkout(version)` that are not in `drive.version`.

In other words, downloads all the blobs added to `folder` up to `version` of the drive.

#### **`await drive.downloadRange(dbRanges, blobRanges)`**

Downloads the entries and blobs stored in the [ranges](https://github.com/holepunchto/hypercore#const-range--coredownloadrange) `dbRanges` and `blobRanges`.

#### **`const done = drive.findingPeers()`**

Indicate to Hyperdrive that you're finding peers in the background, requests will be on hold until this is done.

Call `done()` when your current discovery iteration is done, i.e., after `swarm.flush()` finishes.

#### **`const stream = drive.replicate(isInitiatorOrStream)`**

Usage example:

```javascript
const swarm = new Hyperswarm()
const done = drive.findingPeers()
swarm.on('connection', (socket) => drive.replicate(socket))
swarm.join(drive.discoveryKey)
swarm.flush().then(done, done)
```

Learn more about how replicate works at [corestore.replicate](https://github.com/holepunchto/corestore#const-stream--storereplicateoptsorstream).

#### **`const updated = await drive.update([options])`**

Waits for initial proof of the new drive version until all `findingPeers` are done.

`options` include:

```javascript
{
  wait: false
}
```

Use `drive.findingPeers()` or `{ wait: true }` to make await `drive.update()` blocking.

#### **`const blobs = await drive.getBlobs()`**

Returns the [Hyperblobs](https://github.com/holepunchto/hyperblobs) instance storing the blobs indexed by drive entries.

```javascript
await drive.put('/file.txt', Buffer.from('hi'))

const buffer1 = await drive.get('/file.txt')

const blobs = await drive.getBlobs()
const entry = await drive.entry('/file.txt')
const buffer2 = await blobs.get(entry.value.blob)

// => buffer1 and buffer2 are equals
```
