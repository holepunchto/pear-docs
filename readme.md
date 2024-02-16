# Pear by Holepunch

> Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear by Holepunch is a combined Peer-to-Peer (P2P) Runtime, Development & Deployment tool.

Build, share & extend unstoppable, zero-infrastructure P2P applications for Desktop, Terminal & Mobile.

Welcome to the Internet of Peers

&nbsp; _– Holepunch, the P2P Company_

## Table of Contents

### Reference

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
* [Releasing a Pear Application](./guide/releasing-a-pear-app.md)

### How-tos

* [How to connect two peers by key with HyperDHT](./howto/connect-two-peers-by-key-with-hyperdht.md)
* [How to connect to many peers by topic with Hyperswarm](./howto/connect-to-many-peers-by-topic-with-hyperswarm.md)
* [How to replicate and persist with Hypercore](./howto/replicate-and-persist-with-hypercore.md)
* [How to work with many Hypercores using Corestore](./howto/work-with-many-hypercores-using-corestore.md)
* [How to share append-only databases with Hyperbee](./howto/share-append-only-databases-with-hyperbee.md)
* [How to create a full peer-to-peer filesystem with Hyperdrive](./howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive.md)

## Building blocks

|  Module                                         |                           Stability                          |
| ------------------------------------------------| :----------------------------------------------------------: |
| [`hypercore`](./building-blocks/hypercore.md)   |    <mark style="background-color: #80ff80;">**stable**</mark>   |
| [`hyperbee`](./building-blocks/hyperbee.md)     |    <mark style="background-color: #80ff80;">**stable**</mark>   |
| [`hyperdrive`](./building-blocks/hyperdrive.md) |    <mark style="background-color: #80ff80;">**stable**</mark>   |
| [`autobase`](./building-blocks/autobase.md)     | <mark style="background-color: #8484ff;">**experimental**</mark> |
| [`hyperswarm`](./building-blocks/hyperswarm.md) |    <mark style="background-color: #80ff80;">**stable**</mark>   |
| [`hyperdht`](./building-blocks/hyperdht.md)     |    <mark style="background-color: #80ff80;">**stable**</mark>   |

### Hypercore

The [`hypercore`](./building-blocks/hypercore.md) module is a distributed, secure append-only log for creating fast and scalable applications without a backend, as it is entirely peer-to-peer.

Notable features include:

* Improved fork detection in the replication protocol, to improve resilience.
* Optional on-disk encryption for blocks (in addition to the existing transport encryption).
* A write-ahead log in the storage layer to ensure that power loss or unexpected shutdown cannot lead to data corruption.
* The [`session`](./building-blocks/hypercore.md#core.session-options) and [`snapshot`](./building-blocks/hypercore.md#core.snapshot-options) methods for providing multiple views over the same underlying Hypercore, which simplifies resource management.
* A [`truncate`](./building-blocks/hypercore.md#await-core.truncate-newlength-forkid) method for intentionally creating a new fork, starting at a given length. We use this method extensively in [`autobase`](./building-blocks/autobase.md).

### Hyperswarm

The [`hyperswarm`](./building-blocks/hyperswarm.md) module is a high-level API for finding and connecting to peers who are interested in a "topic".

Notable features include:

* An improved UDP holepunching algorithm that uses arbitrary DHT nodes (optionally selected by the connecting peers) to proxy necessary metadata while being maximally privacy-preserving.
* A custom-built transport protocol, [UDX](https://github.com/hyperswarm/libudx), that takes advantage of the holepunching algorithm to avoid unnecessary overhead (it doesn't include handshaking since holepunching takes care of that, for example). It's blazing fast.
* A simplified DHT API that closely resembles NodeJS's `net` module, but using public keys instead of IP addresses.

### Hyperdrive

The [`hyperdrive`](./building-blocks/hyperdrive.md) module is a secure, real-time distributed file system that simplifies P2P file sharing. It provides an efficient way to store and access data across multiple connected devices in a decentralized manner.

* Uses Hyperbee internally for storing file metadata
* Major API simplification. Instead of mirroring POSIX APIs, the new API better captures the core requirements of P2P file transfer.
* Auxiliary tools, [`localdrive`](./helpers/localdrive.md) and [`mirrordrive`](./helpers/mirrordrive.md), that streamline import/export flows and make it easy to mirror drives to and from the local filesystem.

### Autobase (experimental)

The [`autobase`](./building-blocks/autobase.md) experimental module provides a "virtual Hypercore" layer over many Hypercores owned by many different peers. 

Notable features include:

* Automatic rebasing of multiple causally-linked Hypercores into a single, linearized Hypercore for multi-user collaboration.
* Low-friction integration into higher-level modules like Hyperbee and Hyperdrive: Autobase's output shares the familiar Hypercore API so peer-to-peer multi-user collaboration is achievable with little additional implementation effort.

> Autobase is still experimental and is likely to change significantly in the near future.

### Hyperdht

The `hyperdht` module is the Distributed Hash Table (DHT) powering Hyperswarm. Through this DHT, each server is bound to a unique key pair, with the client connecting to the server using the server's public key.

Notable features include:

* Lower-level module provides direct access to the DHT for connecting peers using key pairs.

## Helpers

Helper modules can be used together with the building blocks to create cutting-edge P2P tools and applications.

* [`corestore`](./helpers/corestore.md): A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.
* [`localdrive`](./helpers/localdrive.md): A file system interoperable with Hyperdrive.
* [`mirrordrive`](./helpers/mirrordrive.md): Mirror a [`hyperdrive`](./building-blocks/hyperdrive.md) or a [`localdrive`](./helpers/localdrive.md) into another one.
* [`secretstream`](./helpers/secretstream.md): SecretStream is used to securely create connections between two peers in Hyperswarm.
* [`compact-encoding`](./helpers/compact-encoding.md): A series of binary encoding schemes for building fast and small parsers and serializers. We use this in Keet to store chat messages and in Hypercore's replication protocol.
* [`protomux`](./helpers/protomux.md): Multiplex multiple message oriented protocols over a stream.

## Tools

The following tools are used extensively, employed in the day-to-day development and operation of applications built on Pear.

|                           Tools                           |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark>**[Hypershell](./tools/hypershell.md)**</mark>   | A CLI to create and connect to P2P E2E encrypted shells.. |
| <mark>**[Hypertele](./tools/hypertele.md)**</mark> | A swiss-knife proxy powered by [HyperDHT](./building-blocks/hyperdht.md).            |
| <mark>**[Hyperbeam](./tools/hyperbeam.md)**</mark> | A one-to-one and end-to-end encrypted internet pipe.          |
|    <mark>**[Hyperssh](./tools/hyperssh.md)**</mark>   | A CLI to run SSH over the [HyperDHT](./building-blocks/hyperdht.md).          |
|    <mark>**[Drives](./tools/drives.md)**</mark>   | CLI to download, seed, and mirror a [hyperdrive](./building-blocks/hyperdrive.md) or a [localdrive](./helpers/localdrive.md).          |


## Stability indexing

Throughout the documentation, indications of stability are provided. Some modules are well-established and used widely, making them highly unlikely to ever change. Other modules may be new, experimental, or known to have risks associated with their use.

The following stability indices have been used:

|                           Stability                          |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark style="background-color: #80ff80;">**stable**</mark>   | Unlikely to change or be removed in the foreseeable future. |
| <mark style="background-color: #8484ff;">**experimental**</mark> |             New, untested, or have known issues.            |
| <mark style="background-color: #ffffa2;">**deprecated**</mark> |           Being removed or replaced in the future.          |
|    <mark style="background-color: #ff4242;">**unstable**</mark>   |          May change or be removed without warning.          |

