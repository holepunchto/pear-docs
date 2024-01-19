# Pear by Holepunch

> Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear by Holepunch is a combined Peer-to-Peer (P2P) Runtime, Development & Deployment tool.

Pear makes it possible to build, share and extend P2P applications using common Web and Mobile technology.

Herein is everything needed to create unstoppable, zero-infrastructure P2P applications for Desktop, Terminal & Mobile (soon).

Welcome to the Internet of Peers

&nbsp; _– Holepunch, the P2P Company_

## Table of Contents

### References

* [Command-Line-Interface (CLI)](./reference/cli.md)
* [Application-Programming-Interface (API)](./reference/api.md)
* [Application Configuration](./reference/configuration.md)

### Guides

* [Getting Started](./guide/getting-started.md)
* [Starting a Pear Desktop Project](./guide/starting-a-pear-desktop-project.md)
* [Making a Pear Desktop Application](./guide/making-a-pear-desktop-app.md)
* [Starting a Pear Terminal Project](./guide/starting-a-pear-terminal-project.md)
* [Making a Pear Terminal Application](./guide/making-a-pear-terminal-app.md)
* [Sharing a Pear Application](./guide/sharing-a-pear-app.md)
* [Marking a Release](./guide/releasing-a-pear-app.md)

## Building blocks

The following structural components form the backbone of the Pear Ecosystem.

1. [`hypercore`](./building-blocks/hypercore.md): A distributed, secure append-only log for creating fast and scalable applications without a backend, as it is entirely peer-to-peer.
2. [`hyperbee`](./building-blocks/hyperbee.md): An append-only B-tree running on a Hypercore that provides key-value store API, with methods for inserting and getting key/value pairs, atomic batch insertions, and creation of sorted iterators.
3. [`hyperdrive`](./building-blocks/hyperdrive.md): A secure, real-time distributed file system that simplifies P2P file sharing that provides an efficient way to store and access data across multiple connected devices in a decentralized manner.
4. [`autobase`](./building-blocks/autobase.md): An experimental module used to automatically rebase multiple causally-linked Hypercores into a single, linearized Hypercore for multi-user collaboration.
5. [`hyperdht`](./building-blocks/hyperdht.md): A DHT powering Hyperswarm. Through this DHT, each server is bound to a unique key pair, with the client connecting to the server using the server's public key.
6. [`hyperswarm`](./building-blocks/hyperswarm.md): A high-level API for finding and connecting to peers who are interested in a "topic."

## Helpers

Helper modules can be used together with the building blocks to create cutting-edge P2P tools and applications.

1. [`corestore`](./helpers/corestore.md): A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.
2. [`localdrive`](./helpers/localdrive.md): A file system interoperable with Hyperdrive.
3. [`mirrordrive`](./helpers/mirrordrive.md): Mirror a [`hyperdrive`](./building-blocks/hyperdrive.md) or a [`localdrive`](./helpers/localdrive.md) into another one.
4. [`secretstream`](./helpers/secretstream.md): SecretStream is used to securely create connections between two peers in Hyperswarm.
5. [compact-`encoding`](./helpers/compact-encoding.md): A series of binary encoding schemes for building fast and small parsers and serializers. We use this in Keet to store chat messages and in Hypercore's replication protocol.
6. [`protomux`](./helpers/protomux.md): Multiplex multiple message oriented protocols over a stream.

## Tools

|                           Tools                           |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark>**[Hypershell](./tools/hypershell)**</mark>   | A CLI to create and connect to P2P E2E encrypted shells.. |
| <mark>**[Hypertele](./tools/hypertele)**</mark> | A swiss-knife proxy powered by [HyperDHT](./building-blocks/hyperdht).            |
| <mark>**[Hyperbeam](./tools/hyperbeam)**</mark> | A one-to-one and end-to-end encrypted internet pipe.          |
|    <mark>**[Hyperssh](./tools/hyperssh)**</mark>   | A CLI to run SSH over the [HyperDHT](./building-blocks/hyperdht).          |
|    <mark>**[Drives](./tools/drives)**</mark>   | CLI to download, seed, and mirror a [hyperdrive](./building-blocks/hyperdrive) or a [localdrive](./helpers/localdrive).          |

> ✔️ These tools are extensively employed in the day-to-day development and operation of applications built on Pear, like [Keet.io](https://keet.io/).


### Hypercore

* The [`session`](./building-blocks/hypercore.md#core.session-options) and [`snapshot`](./building-blocks/hypercore.md#core.snapshot-options) methods for providing multiple views over the same underlying Hypercore, which simplifies resource management.
* A [`truncate`](./building-blocks/hypercore.md#await-core.truncate-newlength-forkid) method for intentionally creating a new fork, starting at a given length. We use this method extensively in [`autobase`](./building-blocks/autobase.md), as described below.
* An improved fork detection in the replication protocol, to improve resilience.
* Optional on-disk encryption for blocks (in addition to the existing transport encryption).
* The storage layer now uses a write-ahead log to ensure that power loss or unexpected shutdown cannot lead to data corruption.

### Hyperswarm

* An improved UDP holepunching algorithm that uses arbitrary DHT nodes (optionally selected by the connecting peers) to proxy necessary metadata while being maximally privacy-preserving.
* A custom-built transport protocol, [UDX](https://github.com/hyperswarm/libudx), that takes advantage of the holepunching algorithm to avoid unnecessary overhead (it doesn't include handshaking since holepunching takes care of that, for example). It's blazing fast.
* A simplified DHT API that closely resembles NodeJS's `net` module, but using public keys instead of IP addresses.

### Hyperdrive

* Uses Hyperbee internally for storing file metadata
* Major API simplification. Instead of mirroring POSIX APIs, the new API better captures the core requirements of P2P file transfer.
* Auxiliary tools, [`localdrive`](./helpers/localdrive.md) and [`mirrordrive`](./helpers/mirrordrive.md), that streamline import/export flows and make it easy to mirror drives to and from the local filesystem. We use these every day when deploying Keet.

### Autobase (experimental)

Hypercores are single-writer data structures, but collaboration is crucial. [`autobase`](./building-blocks/autobase.md "mention") is an experimental module that allows to turn many Hypercores, owned by different people, into a single 'virtual' Hypercore. In Keet, every member of a room has their input Hypercore where they write chat messages, and Autobase merges these into the linear view members see on the screen.

As Autobase's output shares the familiar Hypercore API, it is possible to plug it into higher-level modules like Hyperbee and Hyperdrive, getting a multi-user collaboration with little additional effort.

> Autobase is still experimental and is likely to change significantly in the near future.

## Stability indexing

Throughout the documentation, indications of a module's stability are provided. Some modules are well-established and used widely, making them highly unlikely to ever change. Other modules may be new, experimental, or known to have risks associated with their use.

The following stability indices have been used:

|                           Stability                          |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark style="background-color:green;">**stable**</mark>   | Unlikely to change or be removed in the foreseeable future. |
| <mark style="background-color:blue;">**experimental**</mark> |             New, untested, or have known issues.            |
| <mark style="background-color:yellow;">**deprecated**</mark> |           Being removed or replaced in the future.          |
|    <mark style="background-color:red;">**unstable**</mark>   |          May change or be removed without warning.          |

#### Stability overview

| Module                                                   |                           Stability                          |
| -------------------------------------------------------- | :----------------------------------------------------------: |
| [`hypercore`](./building-blocks/hypercore.md)   |    <mark style="background-color:green;">**stable**</mark>   |
| [`hyperbee`](./building-blocks/hyperbee.md)     |    <mark style="background-color:green;">**stable**</mark>   |
| [`hyperdrive`](./building-blocks/hyperdrive.md) |    <mark style="background-color:green;">**stable**</mark>   |
| [`autobase`](./building-blocks/autobase.md)     | <mark style="background-color:blue;">**experimental**</mark> |
| [`hyperswarm`](./building-blocks/hyperswarm.md) |    <mark style="background-color:green;">**stable**</mark>   |
| [`hyperdht`](./building-blocks/hyperdht.md)     |    <mark style="background-color:green;">**stable**</mark>   |


 > Any part of a module (method, event, or property) that is not documented as part of that module's public API is subject to change at any time.
