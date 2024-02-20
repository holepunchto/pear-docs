# Pear by Holepunch

> Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear by Holepunch is a combined Peer-to-Peer (P2P) Runtime, Development & Deployment tool.

Build, share & extend unstoppable, zero-infrastructure P2P applications for Desktop, Terminal & Mobile.

Welcome to the Internet of Peers

&nbsp; _– Holepunch, the P2P Company_

## Table of Contents

### Pear runtime

References for utilizing the Pear runtime.

* [Command-Line-Interface (CLI)](./reference/cli.md)
* [Application-Programming-Interface (API)](./reference/api.md)
* [Application Configuration](./reference/configuration.md)

### Guides

Guides on using the pear runtime to build and share P2P applications.

* [Getting Started](./guide/getting-started.md)
* [Starting a Pear Desktop Project](./guide/starting-a-pear-desktop-project.md)
* [Making a Pear Desktop Application](./guide/making-a-pear-desktop-app.md)
* [Starting a Pear Terminal Project](./guide/starting-a-pear-terminal-project.md)
* [Making a Pear Terminal Application](./guide/making-a-pear-terminal-app.md)
* [Sharing a Pear Application](./guide/sharing-a-pear-app.md)
* [Releasing a Pear Application](./guide/releasing-a-pear-app.md)

### Building blocks

The essential building blocks for building powerful P2P applications using Pear.

* [`hypercore`](./building-blocks/hypercore.md): A distributed, secure append-only log for creating fast and scalable applications without a backend, as it is entirely P2P.
* [`hyperbee`](./building-blocks/hyperbee.md): An append-only B-tree based on Hypercore. It provides a key/value-store API with methods to insert and get key/value pairs, perform atomic batch insertions, and create sorted iterators.
* [`hyperdrive`](./building-blocks/hyperdrive.md): A secure, real-time distributed file system that simplifies P2P file sharing that provides an efficient way to store and access data across multiple connected devices in a decentralized manner.
* [`autobase`](./building-blocks/autobase.md): A "virtual Hypercore" layer over many Hypercores owned by many different peers.
* [`hyperdht`](./building-blocks/hyperdht.md): The Distributed Hash Table (DHT) powering Hyperswarm. Through this DHT, each server is bound to a unique key pair, with the client connecting to the server using the server's public key.
* [`hyperswarm`](./building-blocks/hyperswarm.md): A high-level API for finding and connecting to peers who are interested in a "topic".

### How-tos

Simple How-tos on using the essential builing blocks in Pear applications.

* [How to connect two peers by key with HyperDHT](./howto/connect-two-peers-by-key-with-hyperdht.md)
* [How to connect to many peers by topic with Hyperswarm](./howto/connect-to-many-peers-by-topic-with-hyperswarm.md)
* [How to replicate and persist with Hypercore](./howto/replicate-and-persist-with-hypercore.md)
* [How to work with many Hypercores using Corestore](./howto/work-with-many-hypercores-using-corestore.md)
* [How to share append-only databases with Hyperbee](./howto/share-append-only-databases-with-hyperbee.md)
* [How to create a full peer-to-peer filesystem with Hyperdrive](./howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive.md)

### Helpers

Helper modules can be used together with the building blocks to create cutting-edge P2P tools and applications.

* [`corestore`](./helpers/corestore.md): A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.
* [`localdrive`](./helpers/localdrive.md): A file system interoperable with Hyperdrive.
* [`mirrordrive`](./helpers/mirrordrive.md): Mirror a [`hyperdrive`](./building-blocks/hyperdrive.md) or a [`localdrive`](./helpers/localdrive.md) into another one.
* [`secretstream`](./helpers/secretstream.md): SecretStream is used to securely create connections between two peers in Hyperswarm.
* [`compact-encoding`](./helpers/compact-encoding.md): A series of binary encoding schemes for building fast and small parsers and serializers. We use this in Keet to store chat messages and in Hypercore's replication protocol.
* [`protomux`](./helpers/protomux.md): Multiplex multiple message oriented protocols over a stream.

### Tools

The following tools are used extensively employed in the day-to-day development and operation of applications built on Pear.

* [Hypershell](./tools/hypershell.md):  A CLI to create and connect to P2P E2E encrypted shells.
* [Hypertele](./tools/hypertele.md): A swiss-knife proxy powered by [HyperDHT](./building-blocks/hyperdht.md).
* [Hyperbeam](./tools/hyperbeam.md): A one-to-one and end-to-end encrypted internet pipe.
* [Hyperssh](./tools/hyperssh.md): A CLI to run SSH over the [HyperDHT](./building-blocks/hyperdht.md).
* [Drives](./tools/drives.md): CLI to download, seed, and mirror a [hyperdrive](./building-blocks/hyperdrive.md) or a [localdrive](./helpers/localdrive.md).

### Apps

Applications built using Pear. 

- [Keet](./apps/keet.md): A peer-to-peer chat and video-conferencing application with end-to-end encryption.

## Stability indexing

Throughout the documentation, indications of stability are provided. Some modules are well-established and used widely, making them highly unlikely to ever change. Other modules may be new, experimental, or known to have risks associated with their use.

The following stability indices have been used:

|                           Stability                          |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark style="background-color: #80ff80;">**stable**</mark>   | Unlikely to change or be removed in the foreseeable future. |
| <mark style="background-color: #8484ff;">**experimental**</mark> |             New, untested, or have known issues.            |
| <mark style="background-color: #ffffa2;">**deprecated**</mark> |           Being removed or replaced in the future.          |
|    <mark style="background-color: #ff4242;">**unstable**</mark>   |          May change or be removed without warning.          |