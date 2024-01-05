---
description: Welcome to the World of Pears-Holepunch, the P2P Company!! 👋
---

Pear enables you to create, and share applications with peers.

# Pear from Holepunch

Pear from Holepunch is a Combined Runtime, Software Development Kit (SDK), and Peer-to-Peer (P2P) Deployment tool that makes it possible to build, share, and extend P2P applications using common web and mobile technology stacks.
Pear has everything you need to create unstoppable, zero-infrastructure P2P applications for desktop, terminal, and mobile.


## Platform
The [Pear Command line](./01-command-line.md) provides access to develop, deploy, and production capabilities for the apps.

## Building blocks

The Holepunch Ecosystem is constructed utilizing the following structural components.

1. [hypercore.md](./building-blocks/hypercore.md "mention"): A distributed, secure, append-only log is a useful tool for creating fast, and scalable applications without a backend, as it is entirely peer-to-peer.
2. [hyperbee.md](./building-blocks/hyperbee.md "mention"): An append-only B-tree running on a Hypercore. It provides key-value store API, with methods for inserting and getting key/value pairs, atomic batch insertions, and creation of sorted iterators.
3. [hyperdrive.md](./building-blocks/hyperdrive.md "mention"): A secure, real-time distributed file system that simplifies peer-to-peer (P2P) file sharing. It provides an efficient way to store and access data across multiple connected devices in a decentralized manner.
4. [autobase.md](./building-blocks/autobase.md "mention"): An experimental module that's used to automatically rebase multiple causally-linked Hypercores into a single, linearized Hypercore for multi-user collaboration.
5. [hyperdht.md](./building-blocks/hyperdht.md "mention"): A DHT powering Hyperswarm. Through this DHT, each server is bound to a unique key pair, with the client connecting to the server using the server's public key.
6. [hyperswarm.md](./building-blocks/hyperswarm.md "mention"): A high-level API for finding and connecting to peers who are interested in a "topic."

## Helpers

Helper modules can be used together with the building blocks to create cutting-edge peer-to-peer tools and applications.

1. [corestore.md](./helpers/corestore.md "mention"): A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.
2. [localdrive.md](./helpers/localdrive.md "mention"): A file system interoperable with Hyperdrive.
3. [mirrordrive.md](./helpers/mirrordrive.md "mention"): Mirror a [hyperdrive.md](./building-blocks/hyperdrive.md "mention") or a [localdrive.md](./helpers/localdrive.md "mention") into another one.
4. [secretstream.md](./helpers/secretstream.md "mention"): Used to securely create connections between two peers in Hyperswarm.
5. [compact-encoding.md](./helpers/compact-encoding.md "mention"): A series of binary encoding schemes for building fast and small parsers and serializers. We use this in Keet to store chat messages and in Hypercore's replication protocol.
6. [protomux.md](./helpers/protomux.md "mention"): Multiplex multiple message oriented protocols over a stream.

## Tools built using Holepunch

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-cover data-type="files"></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><a data-mention href="./tools/hypershell.md">hypershell.md</a></td><td>A CLI to create and connect to P2P E2E encrypted shells.</td><td></td><td><a href="./tools/hypershell.md">hypershell.md</a></td></tr><tr><td><a data-mention href="./tools/hypertele.md">hypertele.md</a></td><td>A swiss-knife proxy powered by <a data-mention href="./building-blocks/hyperdht.md">hyperdht.md</a>.</td><td></td><td><a href="./tools/hypertele.md">hypertele.md</a></td></tr><tr><td><a data-mention href="./tools/hyperbeam.md">hyperbeam.md</a></td><td>A one-to-one and end-to-end encrypted internet pipe.</td><td></td><td><a href="./tools/hyperbeam.md">hyperbeam.md</a></td></tr><tr><td><a data-mention href="./tools/hyperssh.md">hyperssh.md</a></td><td>A CLI to run SSH over the <a data-mention href="./building-blocks/hyperdht.md">hyperdht.md</a>.</td><td></td><td><a href="tools/hyperssh.md">hyperssh.md</a></td></tr><tr><td><a data-mention href="./tools/drives.md">drives.md</a></td><td>CLI to download, seed, and mirror a <a data-mention href="./building-blocks/hyperdrive.md">hyperdrive.md</a> or a <a data-mention href="./helpers/localdrive.md">localdrive.md</a>.</td><td></td><td><a href="./tools/drives.md">drives.md</a></td></tr></tbody></table>

{% hint style="success" %}
These tools are extensively employed in the day-to-day development and operation of applications built on Holepunch, like [Keet.io](https://keet.io/).
{% endhint %}

## Applications built using Holepunch

* [keet.io.md](apps/keet.io.md "mention")**:** A peer-to-peer chat and video-conferencing application with end-to-end encryption.

## What's new?

If you're already familiar with [hypercore.md](./building-blocks/hypercore.md "mention"), [hyperswarm.md](./building-blocks/hyperswarm.md "mention"), and the rest of the modules here, you might be wondering what's changed recently. In short, a lot! here's a brief breakdown of some of the highlights.

### Enhanced Building Blocks

Pear main focus is on making our core building blocks as easy to use, as fast, and as reliable as possible. The goal is to give developers all the essential pieces needed to develop powerful P2P apps, without being unnecessarily opinionated and without introducing operational complexity.

We'd previously introduced the Hyperspace daemon and `hyp` CLI tool as core modules, but in practice found that they don't fit cleanly into this vision. We feel it's better to keep a tight focus on the fundamental building blocks so that others can build similar higher-level tools with zero friction. Given that, they are both now considered deprecated.

### Hypercore v10

* The [`session`](./building-blocks/hypercore.md#coresessionoptions) and [`snapshot`](./building-blocks/hypercore.md#coresnapshotoptions) methods for providing multiple views over the same underlying Hypercore, which simplifies resource management.
* A [`truncate`](./building-blocks/hypercore.md#await-coretruncatenewlength-forkid) method for intentionally creating a new fork, starting at a given length. We use this method extensively in [autobase.md](./building-blocks/autobase.md "mention"), as described below.
* An improved fork detection in the replication protocol, to improve resilience.
* Optional on-disk encryption for blocks (in addition to the existing transport encryption).
* The storage layer now uses a write-ahead log to better ensure that power loss or unexpected shutdown cannot lead to data corruption.

### Hyperswarm v4

* An improved UDP holepunching algorithm that uses arbitrary DHT nodes (optionally selected by the connecting peers) to proxy necessary metadata while being maximally privacy-preserving.
* A custom-built transport protocol, [UDX](https://github.com/hyperswarm/libudx), that takes advantage of the holepunching algorithm to avoid unnecessary overhead (it doesn't include handshaking since holepunching takes care of that, for example). It's blazing fast.
* A simplified DHT API that closely resembles NodeJS's `net` module, but using public keys instead of IPs.

### Hyperdrive

* Uses Hyperbee internally for storing file metadata
* Major API simplification: Instead of mirroring POSIX APIs, the new API captures the core requirements of P2P file transfer efficiently.
* Auxiliary tools, [localdrive.md](./helpers/localdrive.md "mention") and [mirrordrive.md](./helpers/mirrordrive.md "mention"), that streamline import/export flows and make it easy to mirror drives to and from the local filesystem. We use these every day when deploying Keet.

### Autobase (experimental)

Hypercores are single-writer data structures, but collaboration is crucial. [autobase.md](./building-blocks/autobase.md "mention") is an experimental module that allows you to turn many Hypercores, owned by many different people, into a single 'virtual' Hypercore. In Keet, every member of a room has their input Hypercore where they write chat messages, and Autobase merges these into the linear view you see on screen.

Since Autobase's output shares the familiar Hypercore API, you can plug it into higher-level modules like Hyperbee and Hyperdrive, getting a multi-user collaboration with little additional effort.

{% hint style="warning" %}
Autobase is still experimental and is likely to change significantly in the near future. If you're feeling adventurous, give it a shot!
{% endhint %}

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
| [hypercore.md](./building-blocks/hypercore.md "mention")   |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperbee.md](./building-blocks/hyperbee.md "mention")     |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperdrive.md](./building-blocks/hyperdrive.md "mention") |    <mark style="background-color:green;">**stable**</mark>   |
| [autobase.md](building-blocks/autobase.md "mention")     | <mark style="background-color:blue;">**experimental**</mark> |
| [hyperswarm.md](./building-blocks/hyperswarm.md "mention") |    <mark style="background-color:green;">**stable**</mark>   |
| [hyperdht.md](./building-blocks/hyperdht.md "mention")     |    <mark style="background-color:green;">**stable**</mark>   |

{% hint style="warning" %}
Any part of a module (method, event, or property) that is not documented as part of that module's public API is subject to change at any time.

{% endhint %}
