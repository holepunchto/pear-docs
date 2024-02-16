# Localdrive

A file system API that is similar to [`Hyperdrive`](../building-blocks/hyperdrive.md). This tool comes in handy when mirroring files from user filesystem to a drive, and vice-versa.

> [GitHub (Localdrive)](https://github.com/holepunchto/localdrive)

* [Installation](localdrive.md#installation)
* [Usage](localdrive.md#usage)
* [API](localdrive.md#api)
* [Examples](localdrive.md#examples)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install localdrive
```

### Usage

```javascript
const Localdrive = require('localdrive')

const drive = new Localdrive('./my-project')

await drive.put('/blob.txt', Buffer.from('example'))
await drive.put('/images/logo.png', Buffer.from('..'))
await drive.put('/images/old-logo.png', Buffer.from('..'))

const buffer = await drive.get('/blob.txt')
console.log(buffer) // => <Buffer ..> 'example'

const entry = await drive.entry('/blob.txt')
console.log(entry) // => { key, value: { executable, linkname, blob, metadata } }

await drive.del('/images/old-logo.png')

await drive.symlink('/images/logo.shortcut', '/images/logo.png')

for await (const file of drive.list('/images')) {
  console.log('list', file) // => { key, value }
}

const rs = drive.createReadStream('/blob.txt')
for await (const chunk of rs) {
  console.log('rs', chunk) // => <Buffer ..>
}

const ws = drive.createWriteStream('/blob.txt')
ws.write('new example')
ws.end()
ws.once('close', () => console.log('file saved'))
```

### API

**`const drive = new Localdrive(root, [options])`**

Creates a drive based on a `root` directory. `root` can be relative or absolute.

`options` include:

| Property          | Description                                              | Type    | Default  |
|-------------------|----------------------------------------------------------|---------|----------|
| **`followLinks`** | If enabled then `entry(key)` will follow the `linkname`. | Boolean | `false`  |
| **`metadata`**    | Hook functions are called accordingly.                 | Object  | `null`   |
| **`atomic`**      | Enables atomicity for file writing (tmp file and rename). | Boolean | `false`  |
| **`roots`**       | For mapping key prefixes to different roots.            | Object  | `{}`     |


> The metadata hook `del()` could be called with non-existing metadata keys.


**`drive.root`**

String with the resolved (absolute) drive path.

**`drive.supportsMetadata`**

Boolean indicating whether the drive handles metadata. Default `false`.

If `options.metadata` hooks are passed then `supportsMetadata` becomes `true`.

**`await drive.put(key, buffer, [options])`**

Creates a file at `key` path in the drive. `options` are the same as in `createWriteStream`.

**`const buffer = await drive.get(key)`**

Returns the blob at `key` path in the drive. If no blob exists, returns null.

> It also returns null for symbolic links.

**`const entry = await drive.entry(key, [options])`**

Returns the entry at `key` path in the drive. It looks like this:

```javascript
{
  key: String,
  value: {
    executable: Boolean,
    linkname: null,
    blob: {
      byteOffset: Number,
      blockOffset: Number,
      blockLength: Number,
      byteLength: Number
    },
    metadata: null
  },
  mtime: Number
}
```

Available `options`:

```js
{
  follow: false // Follow symlinks, 16 max or throws an error
}
```

**`await drive.del(key)`**

Deletes the file at `key` path from the drive.

**`await drive.symlink(key, linkname)`**

Creates an entry in drive at `key` path that points to the entry at `linkname`.

> ℹ️ If a blob entry currently exists at `key` path then it will be overwritten and `drive.get(key)` will return null, while `drive.entry(key)` will return the entry with symlink information.

#### **`const comparison = drive.compare(entryA, entryB)`**

Returns `0` if entries are the same, `1` if `entryA` is older, and `-1` if `entryB` is older.

**`const iterator = drive.list([folder])`**

Returns a stream of all entries in the drive inside of specified `folder`.

**`const iterator = drive.readdir([folder])`**

Returns a stream of all subpaths of entries in drive stored at paths prefixed by `folder`.

**`const mirror = drive.mirror(out, [options])`**

Mirrors this drive into another. Returns a [`MirrorDrive`](../helpers/mirrordrive.md) instance constructed with `options`.

Call [`await mirror.done()`](../helpers/mirrordrive.md#await-mirrordone) to wait for the mirroring to finish.

**`const rs = drive.createReadStream(key, [options])`**

Returns a stream to read out the blob stored in the drive at `key` path.

`options` include:

| Property     | Description                                        | Type    | Default    |
| ------------ | -------------------------------------------------- | ------- | ---------- |
| **`start`**  | Starting offset of the desired readstream interval | Integer | **`null`** |
| **`end`**    | Ending offset of the desired readstream interval   | Integer | **`null`** |
| **`length`** | Length of the desired readstream interval          | Integer | **`null`** |


> `start` and `end` are inclusive.
>
> `length` overrides `end`, they're not meant to be used together.

**`const ws = drive.createWriteStream(key, [options])`**

Streams a blob into the drive at `key` path.

`options` include:

| Property         | Description                           | Type    | Default |
| ---------------- | ------------------------------------- | ------- | ------- |
| **`executable`** | whether the blob is executable or not | Boolean | `true`  |

### Examples

#### Metadata hooks

Metadata backed by `Map`:

```javascript
const meta = new Map()
const metadata = {
  get: (key) => meta.has(key) ? meta.get(key) : null,
  put: (key, value) => meta.set(key, value),
  del: (key) => meta.delete(key)
}

const drive = new Localdrive('./my-app', { metadata })

// ...
```

> `metadata.del()` will also be called when metadata is `null`

```javascript
await drive.put('/file.txt', Buffer.from('a')) // Default metadata is null
```