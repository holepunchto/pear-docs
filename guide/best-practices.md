# Best Practices

This article covers useful patterns that one should follow in most cases when
developing Pear applications.

## Use one corestore instance per application

Corestores are meant to manage many cores and their sessions efficiently. Having multiple Corestore instances can cause issues such as file locking errors when using the same storage and duplicate core storage if the same core is used by two Corestores with different storages.

A single Corestore instance will:

- Reduces open file handles.
- Reduces storage space by deduping hypercore storage.
- Requires only one replication stream per peer.

If using `name`d cores that collide across different components of an app is an issue, use namespaces (`store.namepace('a')`) to create a namespaced version of a corestore. Note that retrieving cores by `key` are unaffected by namespacing.

## Use one hyperswarm instance per application

Hyperswarm supports joining multiple topics on the same instance and will dedup peer connections shared between them. Having only one swarm instance will speed up connections by reducing records in the DHT for the topic and simplify managing the max number of connections an app makes.

## Never load Javascript over http(s)

Just like in web development, running code from an external source is dangerous. Running external code opens an application up to being exploited if the external source is nefarious or compromised. This is why http and https traffic is blocked by default in Pear applications, preventing unintentional loading of code that would make your application vulnerable to supply chain attacks. This is especially dangerous for applications, like Pear applications, that have access to native functionality (eg. the file system).
