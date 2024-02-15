# MirrorDrive

Mirrors a [`Hyperdrive`](../building-blocks/hyperdrive.md) or a [`LocalDrive`](../helpers/localdrive.md) into another one.

> [GitHub (Mirrordrive)](https://github.com/holepunchto/mirror-drive)

* [Installation](./mirrordrive.md#installation)
* [Basic usage](mirrordrive.md#basic-usage)
* [API](mirrordrive.md#api)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install mirror-drive
```

### Basic usage

```javascript
import MirrorDrive from 'mirror-drive'

const src = new Localdrive('./src')
const dst = new Hyperdrive(store)

const mirror = new MirrorDrive(src, dst)
console.log(mirror.count) // => { files: 0, add: 0, remove: 0, change: 0 }

for await (const diff of mirror) {
  console.log(diff) /* {
    op: 'add',
    key: '/new-file.txt',
    bytesRemoved: 0,
    bytesAdded: 4
  }*/
}

console.log(mirror.count) // => { files: 1, add: 1, remove: 0, change: 0 }
```

### API

#### **`const mirror = new MirrorDrive(src, dst, [options])`**

Creates a mirror instance to move `src` drive into `dst` drive.

`options` include:

| Property             | Type     | Default                                 |
| -------------------- | -------- | --------------------------------------- |
| **`prefix`**         | String   | `'/'`                                   |
| **`dryRun`**         | Boolean  | `false`                                 |
| **`prune`**          | Boolean  | `true`                                  |
| **`includeEquals`**  | Boolean  | `false`                                 |
| **`filter`**         | Function | `(key) => true`                         |
| **`metadataEquals`** | Function | `(srcMetadata, dstMetadata) => { ... }` |
| **`batch`**          | Boolean  | `false`                                 |
| **`entries`**        | Array    | `null`                                  |

#### **`mirror.count`**

It counts the total files processed, added, removed, and changed.

Default: `{ files: 0, add: 0, remove: 0, change: 0 }`

```javascript
const mirror = new MirrorDrive(src, dst)
console.log(mirror.count) // => { files: 0, add: 0, remove: 0, change: 0 }
```

#### **`await mirror.done()`**

It starts processing all the diffing until it is done.

```javascript
const mirror = new MirrorDrive(src, dst)
await mirror.done()
console.log(mirror.count) // => { files: 1, add: 1, remove: 0, change: 0 }
```
