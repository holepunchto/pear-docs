# Pear Runtime by Holepunch

> Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear is an installable Peer-to-Peer (P2P) Runtime, Development & Deployment platform.

Build, share & extend unstoppable, zero-infrastructure P2P applications for Mobile, Desktop & Terminal.

Welcome to the Internet of Peers

&nbsp; _– Holepunch, the P2P Company_

## Documentation

* [Pear](#pear)
* [Bare](#bare)
* [Guides](#guides)
* [How-tos](#howtos)
* [Building Blocks](#building-blocks)
* [Helpers](#helpers)
* [Tools](#tools)
* [Examples](#examples)
* [Stability Legend](#stability-legend)
* [Pear-Powered Applications](#applications)

### Pear <a name="pear"></a>

Pear is a native peer-to-peer capable platform that consists of a runtime binary, an API, userland modules, a command-line interface, an on-demand daemon and an application shell to provide the capabilities to develop & deploy production peer-to-peer applications. With JavaScript and beyond.

* [Pear CLI (Command-Line-Interface)](./reference/pear/cli.md)
* [Pear Application Configuration](./reference/pear/configuration.md)
* [Pear Modules](./reference/pear/modules.md)
* [Pear API (Application-Programming-Interface)](./reference/pear/api.md)
* [Pear Project Templates](./reference/pear/templates.md)
* [Troubleshooting Pear](./reference/pear/troubleshooting.md)
* [Frequently Asked Questions](./reference/pear/faq.md)
* [Migration](./reference/pear/migration.md)

### Bare <a name="bare"></a>

Pear is built on [Bare](https://github.com/holepunchto/bare), a small and modular JavaScript runtime for desktop and mobile. Like Node.js, it provides an asynchronous, event-driven architecture for writing applications in the lingua franca of modern software. Unlike Node.js, it makes embedding and cross-device support core use cases, aiming to run just as well on your phone as on your laptop.

* [Bare Modules](./reference/bare/modules.md)
* [Bare API (Application-Programming-Interface)](./reference/bare/api.md)
* [Bare Node.js Compatability](./reference/bare/node-compat.md)
* [Troubleshooting Bare](./reference/bare/troubleshooting.md)

### Guides <a name="guides"></a>

Guides on using Pear Runtime to build and share peer-to-peer applications.

* [Getting Started](./guide/getting-started.md)
* [Starting a Pear Desktop Project](./guide/starting-a-pear-desktop-project.md)
* [Making a Pear Desktop Application](./guide/making-a-pear-desktop-app.md)
* [Starting a Pear Terminal Project](./guide/starting-a-pear-terminal-project.md)
* [Making a Pear Terminal Application](./guide/making-a-pear-terminal-app.md)
* [Sharing a Pear Application](./guide/sharing-a-pear-app.md)
* [Releasing a Pear Application](./guide/releasing-a-pear-app.md)
* [Making a Bare Mobile Application](./guide/making-a-bare-mobile-app.md)
* [Creating a `pear init` Template](./guide/creating-a-pear-init-template.md)
* [Best Practices](./guide/best-practices.md)

### How-tos <a name="howtos"></a>

Collection of How-tos using the essential peer-to-peer building blocks in Pear applications.

* [How to connect two peers by key with HyperDHT](./howto/connect-two-peers-by-key-with-hyperdht.md)
* [How to connect to many peers by topic with Hyperswarm](./howto/connect-to-many-peers-by-topic-with-hyperswarm.md)
* [How to replicate and persist with Hypercore](./howto/replicate-and-persist-with-hypercore.md)
* [How to work with many Hypercores using Corestore](./howto/work-with-many-hypercores-using-corestore.md)
* [How to share append-only databases with Hyperbee](./howto/share-append-only-databases-with-hyperbee.md)
* [How to create a full peer-to-peer filesystem with Hyperdrive](./howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive.md)

### Building Block  <a name="building-blocks"></a>

The essential building blocks for building powerful P2P applications using Pear.

| Name                                           | Description                                                                                                                          | Stability                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [Hypercore](./building-blocks/hypercore.md)    | A distributed, secure append-only log for creating fast and scalable applications without a backend, as it is entirely P2P.          | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperbee](./building-blocks/hyperbee.md)      | An append-only B-tree running on a Hypercore. Allows sorted iteration and more.                                                      | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperdrive](./building-blocks/hyperdrive.md)  | A secure, real-time distributed file system that simplifies P2P file sharing and provides an efficient way to store and access data. | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Autobase](./building-blocks/autobase.md)      | A "virtual Hypercore" layer over many Hypercores owned by many different peers.                                                      | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperdht](./building-blocks/hyperdht.md)      | The Distributed Hash Table (DHT) powering Hyperswarm.                                                                                | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperswarm](./building-blocks/hyperswarm.md)  | A high-level API for finding and connecting to peers who are interested in a "topic".                                                | <mark style="background-color:#80ff80;">**stable**</mark> |

### Helpers  <a name="helpers"></a>

Helper modules can be used together with the building blocks to create cutting-edge P2P tools and applications.

| Name                                             | Description                                                                                                                                                                 | Stability                                                 |
|--------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| [Corestore](./helpers/corestore.md)              | A Hypercore factory designed to facilitate the management of sizable named Hypercore collections.                                                                           | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Localdrive](./helpers/localdrive.md)            | A file system interoperable with Hyperdrive.                                                                                                                                | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Mirrordrive](./helpers/mirrordrive.md)          | Mirror a [Hyperdrive](./building-blocks/hyperdrive.md) or a [Localdrive](./helpers/localdrive.md) into another one.                                                         | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Secretstream](./helpers/secretstream.md)        | SecretStream is used to securely create connections between two peers in Hyperswarm.                                                                                        | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Compact-encoding](./helpers/compact-encoding.md)| A series of binary encoding schemes for building fast and small parsers and serializers. We use this in Keet to store chat messages and in Hypercore's replication protocol.| <mark style="background-color:#80ff80;">**stable**</mark> |
| [Protomux](./helpers/protomux.md)                | Multiplex multiple message oriented protocols over a stream.                                                                                                                | <mark style="background-color:#80ff80;">**stable**</mark> |

### Tools  <a name="tools"></a>

The following tools are used extensively employed in the day-to-day development and operation of applications built on Pear.

| Name                               | Description                                                                                                                   | Stability                                                 |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| [Hypershell](./tools/hypershell.md)| A CLI to create and connect to P2P E2E encrypted shells.                                                                      | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hypertele](./tools/hypertele.md)  | A swiss-knife proxy powered by [HyperDHT](./building-blocks/hyperdht.md).                                                     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperbeam](./tools/hyperbeam.md)  | A one-to-one and end-to-end encrypted internet pipe.                                                                          | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperssh](./tools/hyperssh.md)    | A CLI to run SSH over the [HyperDHT](./building-blocks/hyperdht.md).                                                          | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Drives](./tools/drives.md)        | CLI to download, seed, and mirror a [Hyperdrive](./building-blocks/hyperdrive.md) or a [Localdrive](./helpers/localdrive.md). | <mark style="background-color:#80ff80;">**stable**</mark> |

### Examples <a name="examples"></a>

Collection of example applications that can be used as reference during development.
- [Bare on Mobile](./examples/bare-on-mobile.md): Reference applications for using Bare runtime on Android and iOS.
- [React App using Pear](./examples/react-app-using-pear.md): Example application for building Pear applications using React framework.

### Stability Legend <a name="stability-legend"></a>

Throughout the documentation, indications of stability are provided. Some modules are well-established and used widely, making them highly unlikely to ever change. Other modules may be new, experimental, or known to have risks associated with their use.

The following stability indices have been used:

|                           Stability                          |                         Description                         |
| :----------------------------------------------------------: | :---------------------------------------------------------: |
|    <mark style="background-color: #80ff80;">**stable**</mark>   | Unlikely to change or be removed in the foreseeable future. |
| <mark style="background-color: #8484ff;">**experimental**</mark> |             New, untested, or have known issues.            |
| <mark style="background-color: #ffffa2;">**deprecated**</mark> |           Being removed or replaced in the future.          |
|    <mark style="background-color: #ff4242;">**unstable**</mark>   |          May change or be removed without warning.          |

### Pear-Powered Applications <a name="applications"></a>

Peer-to-Peer applications built on, deployed with, running on Pear.

- [Keet](./apps/keet.md): A peer-to-peer chat and video-conferencing application with end-to-end encryption.