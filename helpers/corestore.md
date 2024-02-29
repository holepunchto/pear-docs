# Corestore

<mark style="background-color:green;">**stable**</mark>

Corestore is a Hypercore factory that makes it easier to manage large collections of named Hypercores. It is designed to efficiently store and replicate multiple sets of interlinked [`Hypercore`](../building-blocks/hypercore.md)(s), such as those used by [`Hyperdrive`](../building-blocks/hyperdrive.md), removing the responsibility of managing custom storage/replication code from these higher-level modules.

> [GitHub (Corestore)](https://github.com/holepunchto/corestore)

* [Corestore](corestore.md#installation)
  * [Create a new instance](corestore.md#store-new)
  * Basic:
    * Methods:
      * [store.get(key | { key, name, exclusive, \[options\] })](corestore.md#store.get)
      * [store.replicate(options|stream)](corestore.md#store.replicate)
      * [store.namespace(name)](corestore.md#store.namespace)
      * [store.session(\[options\])](corestore.md#store.sesssion)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install corestore
```

### API

#### **`const store = new Corestore(storage, [options])`** {#store-new}

Creates a new Corestore instance.

`storage` can be either a random-access-storage module, a string, or a function that takes a path and returns a random-access-storage instance.

```javascript
const Corestore = require('corestore')
const store = new Corestore('./my-storage')
```

`options` can include:

| Property         | Description                                              | Type   | Default                                                   |
| ---------------- | -------------------------------------------------------- | ------ | --------------------------------------------------------- |
| **`primaryKey`** | The primary key used to generate new Hypercore key pairs | Buffer | Randomly generated and persisted in the storage directory |

#### **`const core = store.get(key | { key, name, exclusive, [options] })`** {#store.get}

Loads a Hypercore, either by name (if the `name` option is provided), or from the provided key (if the first argument is a Buffer or String with hex/z32 key, or if the `key` option is set).

If that Hypercore has previously been loaded, subsequent calls to `get` will return a new Hypercore session on the existing core.

If the `exclusive` option is set and a writable session is opened, it will wait for all other exclusive writable to close before
opening the Hypercore. In other words, any operation on the core will wait until it is exclusive.

All other options besides `name` and `key` and `exclusive` will be forwarded to the Hypercore constructor.

```javascript
// assuming store is a Corestore instance
const core1 = store.get({ name: 'my-core-1' })
const core2 = store.get({ name: 'my-core-2' })

// awaiting ready so that we can access core1.key
await core1.ready()
const core3 = store.get({ key: core1.key }) // will open another session on core1

// assuming otherKey is the key to a non-writable core
// these are equivalent and will both return sessions on that same non-writable core
const core4 = store.get({ key: otherKey })
const core5 = store.get(otherKey)
```

> The names provided are only relevant **locally**, in that they are used to deterministically generate key pairs. Whenever a core is loaded by name, that core will be writable. Names are not shared with remote peers.

#### **`const stream = store.replicate(options|stream)`** {#store.replicate}

Creates a replication stream that's capable of replicating all Hypercores that are managed by the Corestore, assuming the remote peer has the correct capabilities.

`options` will be forwarded to Hypercore's `replicate` function.

Corestore replicates in an 'all-to-all' fashion, meaning that when replication begins, it will attempt to replicate every Hypercore that's currently loaded and in memory. These attempts will fail if the remote side doesn't have a Hypercore's capability -- Corestore replication does not exchange Hypercore keys.

If the remote side dynamically adds a new Hypercore to the replication stream (by opening that core with a `get` on their Corestore, for example), Corestore will load and replicate that core if possible.

Using [`Hyperswarm`](../building-blocks/hyperswarm.md) one can replicate Corestores as follows:

```javascript
const swarm = new Hyperswarm()
// join the relevant topic
swarm.join(...)
// simply pass the connection stream to corestore
swarm.on('connection', conn => store.replicate(conn))
```

As with Hypercore, users can also create new protocol streams by treating `options` as the `isInitiator` boolean and then replicate these streams over a transport layer of their choosing:

```javascript
// assuming store1 and store2 are corestore instances
const s1 = store1.replicate(true)
const s2 = store2.replicate(false)
s1.pipe(s2).pipe(s1)
```

#### **`const store = store.namespace(name)`** {#store.namespace}

Creates a new namespaced Corestore. Namespacing is useful for sharing a single Corestore instance between many applications or components, as it prevents name collisions.

Namespaces can be chained:

```javascript
const ns1 = store.namespace('a')
const ns2 = ns1.namespace('b')
const core1 = ns1.get({ name: 'main' }) // These will load different Hypercores
const core2 = ns2.get({ name: 'main' })
```

Namespacing is particularly useful if an application needs to create many different data structures, such as [`Hyperdrive`](../building-blocks/hyperdrive.md)s, that all share a common storage location:

```javascript
const store = new Corestore('./my-storage-dir')

// Neither drive1 nor drive2 care that they're being passed a namespaced store.
// But the top-level application can safely reuse my-storage-dir between both.
const drive1 = new Hyperdrive(store.namespace('drive-a'))
const drive2 = new Hyperdrive(store.namespace('drive-b'))
```

#### `const session = store.session([options])` {#store.session}

Creates a new Corestore that shares resources with the original, like cache, cores, replication streams, and storage, while optionally resetting the namespace, overriding `primaryKey`. Useful when an application needs to accept an optional Corestore, but needs to maintain a predictable key derivation.

`options` are the same as the constructor options:

| Property         | Description                                                                             | Type   | Default                          |
| ---------------- | --------------------------------------------------------------------------------------- | ------ | -------------------------------- |
| **`primaryKey`** | Overrides the default `primaryKey` for this session                                     | Buffer | The store's current `primaryKey` |
| **`namespace`**  | Overrides the namespace for this session. If `null`, the default namespace will be used. | Buffer | The store's current namespace.   |
| **`detach`**    | By disabling this, closing the session will also close the store that created the session. | Boolean | `true`   |
