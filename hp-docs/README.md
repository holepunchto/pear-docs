---
Welcome to the Holepunch docs! 👋
---

# Overview
Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear by Holepunch is a combined Peer-to-Peer (P2P) Runtime, Development & Deployment tool and makes it possible to build, share and extend P2P applications using common Web and Mobile technology.

Holepunch equips developers with a powerful suite of independent components to effortlessly construct peer-to-peer applications.

Herein is everything needed to create unstoppable, zero-infrastructure P2P applications for Desktop, Terminal & Mobile (soon).

Welcome to the Internet of Pears–Holepunch, the P2P Company!

## Building blocks

The Holepunch Ecosystem is constructed utilizing the following structural components.

1. [hypercore.md](building-blocks/hypercore.md "mention"): A distributed, secure append-only log is a tool for creating fast and scalable applications without a backend, as it is entirely peer-to-peer.
2. [hyperbee.md](building-blocks/hyperbee.md "mention"): An append-only B-tree running on a Hypercore that provides key-value store API, with methods for inserting and getting key/value pairs, atomic batch insertions, and creation of sorted iterators.
3. [hyperdrive.md](building-blocks/hyperdrive.md "mention"): A secure, real-time distributed file system that simplifies P2P file sharing that provides an efficient way to store and access data across multiple connected devices in a decentralized manner.
4. [autobase.md](building-blocks/autobase.md "mention"): An experimental module used to automatically rebase multiple causally-linked Hypercores into a single, linearized Hypercore for multi-user collaboration.
5. [hyperdht.md](building-blocks/hyperdht.md "mention"): A DHT powering Hyperswarm. Through this DHT, each server is bound to a unique key pair, with the client connecting to the server using the server's public key.
6. [hyperswarm.md](building-blocks/hyperswarm.md "mention"): A high-level API for finding and connecting to peers who are interested in a "topic."

## Helpers

Helper modules can be used together with the building blocks to create cutting-edge P2P tools and applications.

1. [corestore.md](helpers/corestore.md "mention"): A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.
2. [localdrive.md](helpers/localdrive.md "mention"): A file system interoperable with Hyperdrive.
3. [mirrordrive.md](helpers/mirrordrive.md "mention"): Mirror a [hyperdrive.md](building-blocks/hyperdrive.md "mention") or a [localdrive.md](helpers/localdrive.md "mention") into another one.
4. [secretstream.md](helpers/secretstream.md "mention"): SecretStream is used to securely create connections between two peers in Hyperswarm.
5. [compact-encoding.md](helpers/compact-encoding.md "mention"): A series of binary encoding schemes for building fast and small parsers and serializers. Holepunch use this in Keet to store chat messages and in Hypercore's replication protocol.
6. [protomux.md](helpers/protomux.md "mention"): Multiplex multiple message oriented protocols over a stream.

## Tools built using Holepunch

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-cover data-type="files"></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><a data-mention href="tools/hypershell.md">hypershell.md</a></td><td>A CLI to create and connect to P2P E2E encrypted shells.</td><td></td><td><a href="tools/hypershell.md">hypershell.md</a></td></tr><tr><td><a data-mention href="tools/hypertele.md">hypertele.md</a></td><td>A swiss-knife proxy powered by <a data-mention href="building-blocks/hyperdht.md">hyperdht.md</a>.</td><td></td><td><a href="tools/hypertele.md">hypertele.md</a></td></tr><tr><td><a data-mention href="tools/hyperbeam.md">hyperbeam.md</a></td><td>A one-to-one and end-to-end encrypted internet pipe.</td><td></td><td><a href="tools/hyperbeam.md">hyperbeam.md</a></td></tr><tr><td><a data-mention href="tools/hyperssh.md">hyperssh.md</a></td><td>A CLI to run SSH over the <a data-mention href="building-blocks/hyperdht.md">hyperdht.md</a>.</td><td></td><td><a href="tools/hyperssh.md">hyperssh.md</a></td></tr><tr><td><a data-mention href="tools/drives.md">drives.md</a></td><td>CLI to download, seed, and mirror a <a data-mention href="building-blocks/hyperdrive.md">hyperdrive.md</a> or a <a data-mention href="helpers/localdrive.md">localdrive.md</a>.</td><td></td><td><a href="tools/drives.md">drives.md</a></td></tr></tbody></table>

    ✔️ These tools are extensively employed in the day-to-day development and operation of applications built on Holepunch, like [Keet.io](https://keet.io/).


## Applications built using Holepunch

* [keet.io.md](apps/keet.io.md "mention")**:** A peer-to-peer chat and video-conferencing application with end-to-end encryption.

## What's new?

Holepunch is continuously introucing new enhancements and following are the few highlights.

### Better Building Blocks

Holepunch focus is on making the core building blocks easy to use, fast, and reliable. The goal is to give developers all the essential pieces to make powerful P2P apps without being unnecessarily opinionated and without any operational complexity.

The core modules Hyperspace daemon and `hyp` CLI tools are now deprecated.

### Hypercore v10

* The [`session`](building-blocks/hypercore.md#core.session-options) and [`snapshot`](building-blocks/hypercore.md#core.snapshot-options) methods for providing multiple views over the same underlying Hypercore, which simplifies resource management.
* A [`truncate`](building-blocks/hypercore.md#await-core.truncate-newlength-forkid) method for intentionally creating a new fork, starting at a given length. We use this method extensively in [autobase.md](building-blocks/autobase.md "mention"), as described below.
* An improved fork detection in the replication protocol, to improve resilience.
* Optional on-disk encryption for blocks (in addition to the existing transport encryption).
* The storage layer now uses a write-ahead log to ensure that power loss or unexpected shutdown cannot lead to data corruption.

### Hyperswarm v4

* An improved UDP holepunching algorithm that uses arbitrary DHT nodes (optionally selected by the connecting peers) to proxy necessary metadata while being maximally privacy-preserving.
* A custom-built transport protocol, [UDX](https://github.com/hyperswarm/libudx), that takes advantage of the holepunching algorithm to avoid unnecessary overhead (it doesn't include handshaking since holepunching takes care of that, for example). It's blazing fast.
* A simplified DHT API that closely resembles NodeJS's `net` module, but using public keys instead of IPs.

### Hyperdrive

* Uses Hyperbee internally for storing file metadata
* Major API simplification. Instead of mirroring POSIX APIs, the new API better captures the core requirements of P2P file transfer.
* Auxiliary tools, [localdrive.md](helpers/localdrive.md "mention") and [mirrordrive.md](helpers/mirrordrive.md "mention"), that streamline import/export flows and make it easy to mirror drives to and from the local filesystem when deploying Keet.

### Autobase (experimental)

Hypercores are single-writer data structures, but collaboration is crucial. [autobase.md](building-blocks/autobase.md "mention") is an experimental module that allows to turn many Hypercores, owned by different people, into a single 'virtual' Hypercore. In Keet, every member of a room has their input Hypercore where they write chat messages, and Autobase merges these into the linear view to see on screen.

As Autobase's output shares the familiar Hypercore API, it is possible to plug it into higher-level modules like Hyperbee and Hyperdrive, getting a multi-user collaboration with little additional effort.

    ⚠️ Autobase is still experimental and is likely to change significantly in the near future. If you're feeling adventurous, give it a shot!


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
| [hypercore.md](building-blocks/hypercore.md "mention")   |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperbee.md](building-blocks/hyperbee.md "mention")     |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperdrive.md](building-blocks/hyperdrive.md "mention") |    <mark style="background-color:green;">**stable**</mark>   |
| [autobase.md](building-blocks/autobase.md "mention")     | <mark style="background-color:blue;">**experimental**</mark> |
| [hyperswarm.md](building-blocks/hyperswarm.md "mention") |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperdht.md](building-blocks/hyperdht.md "mention")     |    <mark style="background-color:green;">**stable**</mark>   |


    ⚠️ Any part of a module (method, event, or property) that is not documented as part of that module's public API is subject to change at any time.
