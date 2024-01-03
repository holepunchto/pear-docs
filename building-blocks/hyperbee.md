# Hyperbee

<mark style="background-color:green;">**stable**</mark>

Hyperbee is an append only B-tree based on [hypercore.md](hypercore.md "mention"). It provides a key/value-store API, with methods for inserting and getting key-value pairs, atomic batch insertions, and creating sorted iterators. It uses a single Hypercore for storage, using a technique called embedded indexing. It provides features like cache warmup extension, efficient diffing, version control, sorted iteration, and sparse downloading.

{% hint style="info" %}
As with the Hypercore, a Hyperbee can only have a **single writer on a single machine**; the creator of the Hyperdrive is the only person who can modify it because they're the only one with the private key. That said, the writer can replicate to **many readers**, in a manner similar to BitTorrent.
{% endhint %}

{% embed url="https://github.com/holepunchto/hyperbee" %}

* [Hyperbee](hyperbee.md#installation):
  * [Create a new instance](hyperbee.md#const-db-new-hyperbee-core-options):
  * Basic:
    * Properties:
      * [db.core](hyperbee.md#db.core)
      * [db.version](hyperbee.md#db.version)
      * [db.id](hyperbee.md#db.id)
      * [db.key](hyperbee.md#db.key)
      * [db.discoveryKey](hyperbee.md#db.discoverykey)
      * [db.writable](hyperbee.md#db.writable)
      * [db.readable](hyperbee.md#db.readable)
    * Methods:
      * [db.ready()](hyperbee.md#await-db.ready)
      * [db.close()](hyperbee.md#await-db.close)
      * [db.put(key, \[value\], \[options\])](hyperbee.md#await-db.put-key-value-options)
      * [db.get(key, \[options\])](hyperbee.md#const-seq-key-value-await-db.get-key-options)
      * [db.del(key, \[options\])](hyperbee.md#await-db.del-key-options)
      * [db.getBySeq(seq, \[options\])](hyperbee.md#const-key-value-await-db.getbyseq-seq-options)
      * [db.replicate(isInitiatorOrStream)](hyperbee.md#const-stream-db.replicate-isinitiatororstream)
      * [db.batch()](hyperbee.md#const-batch-db.batch)
        * [batch.put(key, \[value\], \[options\])](hyperbee.md#await-batch.put-key-value-options)
        * [batch.get(key, \[options\])](hyperbee.md#const-seq-key-value-await-batch.get-key-options)
        * [batch.del(key, \[options\])](hyperbee.md#await-batch.del-key-options)
        * [batch.flush()](hyperbee.md#await-batch.flush)
        * [batch.close()](hyperbee.md#await-batch.close)
      * [db.createReadStream(\[range\], \[options\])](hyperbee.md#const-stream-db.createreadstream-range-options)
      * [db.peek(\[range\], \[options\])](hyperbee.md#const-seq-key-value-await-db.peek-range-options)
      * [db.createHistoryStream(\[options\])](hyperbee.md#const-stream-db.createhistorystream-options)
      * [db.createDiffStream(otherVersion, \[options\])](hyperbee.md#const-stream-db.creatediffstream-otherversion-options)
      * [db.getAndWatch(key, \[options\])](hyperbee.md#const-entrywatcher-await-db.getandwatch-key-options)
      * [db.watch(\[range\])](hyperbee.md#const-watcher-db.watch-range)
      * [db.checkout(version)](hyperbee.md#const-snapshot-db.checkout-version)
      * [db.snapshot()](hyperbee.md#const-snapshot-db.snapshot)
      * [db.sub('sub-prefix', \[options\])](hyperbee.md#const-sub-db.sub-sub-prefix-options)
      * [db.getHeader(\[options\])](hyperbee.md#const-header-await-db.getheader-options)
      * [Hyperbee.isHyperbee(core, \[options\])](hyperbee.md#const-ishyperbee-await-hyperbee.ishyperbee-core-options)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperbee
```

### API

#### **`const db = new Hyperbee(core, [options])`**

Make a new Hyperbee instance. `core` should be a [hypercore.md](hypercore.md "mention").

`options` include:

|       Property      | Description                                                                 | Type   | Default    |
| :-----------------: | --------------------------------------------------------------------------- | ------ | ---------- |
| **`valueEncoding`** | Encoding type for the values. Takes values of 'json', 'utf-8', or 'binary'. | String | `'binary'` |
|  **`keyEncoding`**  | Encoding type for the keys. Takes values of 'ascii', 'utf-8', or 'binary'.  | String | `'binary'` |

{% hint style="info" %}
Currently read/diff streams sort based on the _encoded_ value of the keys.
{% endhint %}

#### Properties

#### **`db.core`**

The underlying [Hypercore](hypercore.md) backing this bee.

#### **`db.version`**

A number that indicates how many modifications were made, is useful as a version identifier.

#### **`db.id`**

String containing the id (z-base-32 of the public key) identifying this bee.

#### **`db.key`**

Buffer containing the public key identifying this bee.

#### **`db.discoveryKey`**

Buffer containing a key derived from `db.key`.

{% hint style="info" %}
This discovery key does not allow you to verify the data, it's only to announce or look for peers that are sharing the same bee, without leaking the bee key.
{% endhint %}

#### **`db.writable`**

Boolean indicating if we can put or delete data in this bee.

#### **`db.readable`**

Boolean indicating if we can read from this bee. After closing the bee this will be `false`.

#### **Methods**

#### **`await db.ready()`**

Waits until the internal state is loaded.

Use it once before reading synchronous properties like `db.version`, unless you called any of the other APIs.

#### **`await db.close()`**

Fully close this bee, including its core.

#### **`await db.put(key, [value], [options])`**

Insert a new key. Value can be optional.

{% hint style="info" %}
If you're inserting a series of data atomically or want more performance then check the `db.batch` API.
{% endhint %}

**`options`** includes:

```javascript
{
  cas (prev, next) { return true }
}
```

**Compare And Swap (cas)**

`cas` option is a function comparator to control whether the `put` succeeds.

By returning `true` it will insert the value, otherwise, it won't.

It receives two args: `prev` is the current node entry, and `next` is the potential new node.

```javascript
await db.put('number', '123', { cas })
console.log(await db.get('number')) // => { seq: 1, key: 'number', value: '123' }

await db.put('number', '123', { cas })
console.log(await db.get('number')) // => { seq: 1, key: 'number', value: '123' }
// Without cas this would have been { seq: 2, ... }, and the next { seq: 3 }

await db.put('number', '456', { cas })
console.log(await db.get('number')) // => { seq: 2, key: 'number', value: '456' }

function cas (prev, next) {
  // You can use same-data or same-object lib, depending on the value complexity
  return prev.value !== next.value
}
```

#### **`const { seq, key, value } = await db.get(key, [options])`**

Get a key's value. Returns `null` if the key doesn't exist.

`seq` is the Hypercore index at which this key was inserted.

`options` include:

| Property            | Description                                                                 | Type    | Default  |
| ------------------- | --------------------------------------------------------------------------- | ------- | -------- |
| **`wait`**          | Wait for the meta-data of hypercore to be updated                           | Boolean | `true`   |
| **`update`**        | Determine if the core has to be updated before any operation                | Boolean | `true`  |
| **`keyEncoding`**   | Encoding type for the keys. Takes values of 'json', 'utf-8', or 'binary'.   | String  | `binary` |
| **`valueEncoding`** | Encoding type for the values. Takes values of 'json', 'utf-8', or 'binary'. | String  | `binary` |

{% hint style="info" %}
`db.get(key, [options])` uses the state at the time of initiating the read, so the write operations that complete after `get` is initiated and before it is resolved are ignored.
{% endhint %}

#### **`await db.del(key, [options])`**

Delete a key.

`options` include:

```javascript
{
  cas (prev) { return true }
}
```

**Compare And Swap (cas)**

`cas` option is a function comparator to control whether the `del` succeeds.

By returning `true` it will delete the value, otherwise, it won't.

It only receives one arg: `prev` which is the current node entry.

```javascript
// This won't get deleted
await db.del('number', { cas })
console.log(await db.get('number')) // => { seq: 1, key: 'number', value: 'value' }

// Change the value so the next time we try to delete it then "cas" will return true
await db.put('number', 'can-be-deleted')

await db.del('number', { cas })
console.log(await db.get('number')) // => null

function cas (prev) {
  return prev.value === 'can-be-deleted'
}
```
#### **`const { key, value } = await db.getBySeq(seq, [options])`**

Get the key and value from a block number.

`seq` is the Hypercore index. Returns `null` if block doesn't exists.

#### **`const stream = db.replicate(isInitiatorOrStream)`**

See more about how replicate works at [core.replicate](hypercore.md#const-stream-core.replicate-isinitiatororreplicationstream).

#### **`const batch = db.batch()`**

Make a new atomic batch that is either fully processed or not processed at all.

{% hint style="info" %}
If you have several inserts and deletions then a batch can be much faster.
{% endhint %}

#### **`await batch.put(key, [value], [options])`**

Insert a key into a batch.

`options` are the same as **`db.put`** method.

#### **`const { seq, key, value } = await batch.get(key, [options])`**

Get a key, and value out of a batch.

`options` are the same as **`db.get`** method.

#### **`await batch.del(key, [options])`**

Delete a key into the batch.

`options` are the same as **`db.del`** method.

#### **`await batch.flush()`**

Commit the batch to the database, and releases any locks it has acquired.

#### **`await batch.close()`**

Destroy a batch, and releases any locks it has acquired on the `db`.

Call this if you want to abort a batch without flushing it.

<details>

<summary>Learn more about <code>db.batch()</code></summary>

A batch is atomic: it is either processed fully or not at all.

A Hyperbee has a single write lock. A batch acquires this write lock with its first modifying operation (**`put`**, **`del`**), and releases it when it flushes. You can also explicitly acquire the lock with **`await batch.lock()`**. If you use the batch only for read operations, the write lock is never acquired. Once the write lock is acquired, the batch must flush before any other writes to the Hyperbee can be processed.

A batch's state snaps at creation time, so write operations applied outside of the batch are not taken into account when reading. Write operations within the batch do get taken into account, as is to be expected — if you first run **`await batch.put('myKey', 'newValue')`** and later run **`await batch.get('myKey')`**, you will observe **`'newValue'`**.

</details>

#### **`const stream = db.createReadStream([range], [options])`**

Make a read stream. Sort order is based on the binary value of the keys. All entries in the stream are similar to the ones returned from **`db.get`**.

`range` should specify the range you want to read and looks like this:

```javascript
{
  gt: 'only return keys > than this',
  gte: 'only return keys >= than this',
  lt: 'only return keys < than this',
  lte: 'only return keys <= than this'
}
```

`options` include:

| Property      | Description                        | Type    | Default |
| ------------- | ---------------------------------- | ------- | ------- |
| **`reverse`** | determine order of the keys        | Boolean | `false` |
| **`limit`**   | max number of entries you want     | Integer | `-1`    |

#### **`const { seq, key, value } = await db.peek([range], [options])`**

Similar to doing a read stream and returning the first value, but a bit faster than that.

#### **`const stream = db.createHistoryStream([options])`**

Create a stream of all entries ever inserted or deleted from the `db`. Each entry has an additional `type` property indicating if it was a `put` or `del` operation.

`options` include:

| Property      | Description                                                              | Type    | Default |
| ------------- | ------------------------------------------------------------------------ | ------- | ------- |
| **`live`**    | determine whether the stream will wait for new data and never end or not | Boolean | `false` |
| **`reverse`** | determine the order in which data is received                            | Boolean | `false` |
| **`gt`**      | start after this index                                                   | Integer | `null`  |
| **`gte`**     | start with this seq (inclusive)                                          | Integer | `null`  |
| **`lt`**      | stop before this index                                                   | Integer | `null`  |
| **`lte`**     | stop after this index                                                    | Integer | `null`  |
| **`limit`**   | max number of entries you want                                           | Integer | `-1`    |

{% hint style="info" %}
If any of the gte, gt, lte, lt arguments are `< 0` then they'll implicitly be added with the version before starting so doing `{ gte: -1 }` makes a stream starting at the last index.
{% endhint %}

#### **`const stream = db.createDiffStream(otherVersion, [options])`**

Efficiently create a stream of shallow changes between two versions of the `db`.

`options` are the same as `db.createReadStream`, except for reverse.

Each entry is sorted by key and looks like this:

```javascript
{
  left: <the entry in the db>,
  right: <the entry in the other version>
}
```

{% hint style="info" %}
If an entry exists in `db` but not in the other version, then `left` is set and `right` will be null, and vice versa.

If the entries are causally equal (i.e., they have the identical seq), they are not returned, only the diff.
{% endhint %}

#### `const entryWatcher = await db.getAndWatch(key, [options])`

Returns a watcher which listens to changes on the given key.

`entryWatcher.node` contains the current entry in the same format as the result of `bee.get(key)`, and will be updated as it changes.

{% hint style="info" %}
By default, the node will have the bee's key encoding and value encoding, but you can overwrite it by setting the `keyEncoding` and `valueEncoding` options.

Listen to `entryWatcher.on('update')` to be notified when the value of node has changed.
{% endhint %}

Call `await watcher.close()` to stop the watcher.

#### **`const watcher = db.watch([range])`**

Listens to changes that are on the optional `range`.

`range` options are the same as `createReadStream` except they are reversed.

{% hint style="info" %}
By default, the yielded snapshots will have the bee's key encoding and value encoding, but you can overwrite them by setting the `keyEncoding` and `valueEncoding` options.
{% endhint %}

Usage example:

```javascript
for await (const [current, previous] of watcher) {
  console.log(current.version)
  console.log(previous.version)
}
```

Returns a new value after a change, `current` and `previous` are snapshots that are auto-closed before the next value.

Methods:

`await watcher.ready()`

Waits until the watcher is loaded and detects changes.

`await watcher.destroy()`

Stops the watcher. You could also stop it by using `break` inside the loop.

{% hint style="warning" %}

* Do not attempt to close the snapshots yourself. Since they're used internally, let them be auto-closed.&#x20;
* Watchers are not supported on subs and checkouts. Instead, use the `range` option to limit the scope.
{% endhint %}

#### **`const snapshot = db.checkout(version)`**

Get a read-only snapshot of a previous version.

#### **`const snapshot = db.snapshot()`**

Shorthand for getting a checkout for the current version.

#### **`const sub = db.sub('sub-prefix', options = {})`**

Create a sub-database where a given value will prefix all entries.

This makes it easy to create namespaces within a single Hyperbee.

`options` include:

|       Property      | Description                                                                 | Type   | Default                   |
| :-----------------: | --------------------------------------------------------------------------- | ------ | ------------------------- |
|      **`sep`**      | A namespace separator                                                       | Buffer | `Buffer.alloc(1)`         |
| **`valueEncoding`** | Encoding type for the values. Takes values of 'json', 'utf-8', or 'binary'. | String | `defaults to the parents` |
|  **`keyEncoding`**  | Encoding type for the keys. Takes values of 'ascii', 'utf-8', or 'binary'.  | String | `defaults to the parents` |

For example:

```javascript
const root = new Hyperbee(core)
const sub = root.sub('a')

// In root, this will have the key ('a' + separator + 'b')
await sub.put('b', 'hello')

// Returns => { key: 'b', value: 'hello')
await sub.get('b')
```

#### **`const header = await db.getHeader([options])`**

Returns the header contained in the first block. Throws an error if undecodable.

`options` are the same as the `core.get` method.

#### **`const isHyperbee = await Hyperbee.isHyperbee(core, [options])`**

Returns `true` if the core contains a Hyperbee, `false` otherwise.

This requests the first block on the core, so it can throw depending on the options.

`options` are the same as the `core.get` method.
