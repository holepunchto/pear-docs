# Pear by Holepunch

> Pear loads applications remotely from peers and allows anyone to create and share applications with peers.

Pear is an installable Peer-to-Peer (P2P) Runtime, Development & Deployment platform.

Build, share & extend unstoppable, zero-infrastructure P2P applications for Mobile, Desktop & Terminal.

Welcome to the Internet of Peers

&nbsp; _– Holepunch, the P2P Company_

## Documentation

* [Terms](#terms)
* [Legend](#legend)
* [Reference](#reference)
* [Examples](#examples)
* [Guides](#guides)
* [How-tos](#howtos)
* [Pear Modules](#pear-modules)
* [P2P Modules](#p2p-modules)
* [Bare Modules](#bare-modules)
* [Tools](#tools)
* [Showcase](#showcase)

### Terms

* API - Application-Programming-Interface
* CLI - Command-Line-Interface
* link - a `pear://` link, a `file://` link or an absolute/relative dir path
* P2P - Peer-to-Peer

### Legend <a name="legend"></a>

Throughout the documentation, indications of stability are provided. Some modules are well-established and used widely, making them highly unlikely to ever change. Other modules may be new, experimental, or known to have risks associated with their use.

The following stability indices have been used:

|                           Stability                                |                         Description                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| <mark style="background-color: #80ff80;">**stable**</mark>       | Unlikely to change or be removed in the foreseeable future  |
| <mark style="background-color: #8484ff;">**experimental**</mark> |             New, untested, or has known issues              |
| <mark style="background-color: #ffffa2;">**deprecated**</mark>   |           Being removed or replaced in the future           |
| <mark style="background-color: #ff4242;">**unstable**</mark>     |          May change or be removed without warning           |


## Showcase <a name="showcase"></a>

Peer-to-Peer applications built on, deployed with, running on Pear.

- [Keet](./apps/keet.md): A peer-to-peer chat and video-conferencing application with end-to-end encryption.


### Reference <a name="reference"></a>

Pear is a native point-to-point peer-to-peer capable platform that consists of a runtime binary, an API, userland modules, a command-line interface, an on-demand daemon and an application shell to provide the capabilities to develop & deploy production P2P applications. With JavaScript and beyond.

Pear's runtime binary is built on [Bare](https://github.com/holepunchto/bare), a small and modular JavaScript runtime for desktop and mobile. Like Node.js, it provides an asynchronous, event-driven architecture for writing applications in the lingua franca of modern software. Unlike Node.js, embedding and cross-device are supported as core use cases, aiming to run just as well on mobile as desktop.

* [Pear CLI](./reference/cli.md)
* [Pear Configuration](./reference/configuration.md)
* [Pear API](./reference/api.md#pear)
* [Bare API](./reference/api.md#bare)
* [Templates](./reference/templates.md)
* [Node.js Compatability](./reference/node-compat.md)
* [Recommended Practices](./reference/recommended-practices.md)
* [Troubleshooting](./reference/troubleshooting.md)
* [Frequently Asked Questions](./reference/faq.md)
* [Migration](./reference/migration.md)

### Examples <a name="examples"></a>

- [Pear Terminal](https://github.com/holepunchto/pear/tree/main/examples/terminal)
- [Pear Desktop (Electron)](https://github.com/holepunchto/pear/tree/main/examples/desktop)
- [Bare Android](https://github.com/holepunchto/bare-android)
- [Bare iOS](https://github.com/holepunchto/bare-ios)

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

### How-tos <a name="howtos"></a>

Collection of How-tos using the essential peer-to-peer building-blocks in Pear applications.

* [How to connect two peers by key with HyperDHT](./howto/connect-two-peers-by-key-with-hyperdht.md)
* [How to connect to many peers by topic with Hyperswarm](./howto/connect-to-many-peers-by-topic-with-hyperswarm.md)
* [How to replicate and persist with Hypercore](./howto/replicate-and-persist-with-hypercore.md)
* [How to work with many Hypercores using Corestore](./howto/work-with-many-hypercores-using-corestore.md)
* [How to share append-only databases with Hyperbee](./howto/share-append-only-databases-with-hyperbee.md)
* [How to create a full peer-to-peer filesystem with Hyperdrive](./howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive.md)

### Pear Modules <a name="pear-modules"></a>

The `Pear` global API is minimal and not intended as a standard library. 
Application & Integration libraries are supplied via installable modules prefixed with `pear-`. 

#### Application Libraries <a name="application-libraries"></a>

Pear modules related directly to application environment.

| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [pear-crasher](https://github.com/holepunchto/pear-crasher)                   | Uncaught exceptions & uncaught rejections crash logger               | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-message](https://github.com/holepunchto/pear-message)                   | Send inter-app pattern-matched object messages                       | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-messages](https://github.com/holepunchto/pear-messages)                 | Receive object messages that match a given object pattern            | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-pipe](https://github.com/holepunchto/pear-pipe)                         | Parent-app-connected pipe, the other end of pear-run pipe            | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-run](https://github.com/holepunchto/pear-run)                           | Run Pear child app by link. Returns a pipe to the child pipe         | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-updates](https://github.com/holepunchto/pear-updates)                   | Receive platform and application update notifications                | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  | 
| [pear-user-dirs](https://github.com/holepunchto/pear-user-dirs)               | Get the path of user-specific directories                            | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-versions](https://github.com/holepunchto/pear-versions)                 | Platform, Application and Runtime versions                           | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-wakeups](https://github.com/holepunchto/pear-wakeups)                   | Receive wakeup events, including link clicks external to app         | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |

#### User Interface Libraries <a name="user-interface-libraries"></a>| 

Pear modules that supply User Interface runtime capabilities.

| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [pear-electron](https://github.com/holepunchto/pear-electron)                 | Pear User-Interface Library for Electron"                            | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-bridge](https://github.com/holepunchto/pear-bridge)                     | Local HTTP bridge for pear-electron applications                     | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |

#### Common Libraries <a name="common-libraries"></a>

Pear modules for general usage, including applications per case.

| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [pear-drop](https://github.com/holepunchto/pear-drop)                         | Drop data, including application reset                               | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-dump](https://github.com/holepunchto/pear-dump)                         | Synchronize files from link to dir peer-to-peer or from-disk         | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-gracedown](https://github.com/holepunchto/pear-gracedown)               | Pear graceful closer. For use with `pipe.autoexit = false`           | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-info](https://github.com/holepunchto/pear-info)                         | Read Pear project information by link                                | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-link](https://github.com/holepunchto/pear-link)                         | Parser-Serializer for `pear://` links. Includes alias resolution     | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-opwait](https://github.com/holepunchto/pear-opwait)                     | Pear operation stream promise wrapper                                | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-release](https://github.com/holepunchto/pear-release)                   | Set application production release version length                    | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-seed](https://github.com/holepunchto/pear-seed)                         | Seed or reseed a Pear app drive by link                              | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-stage](https://github.com/holepunchto/pear-stage)                       | Synchronize from-disk to app drive peer-to-peer                      | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-stamp](https://github.com/holepunchto/pear-stamp)                       | Interleave locals into a template, sync and stream                   | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
    
#### Developer Libraries <a name="developer-libraries"></a>

Pear modules to assist with developing & debugging

| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [pear-inspect](https://github.com/holepunchto/pear-inspect)                   | Securely enable remote debugging protocol over Hyperswarm            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-hotmods](https://github.com/holepunchto/pear-hotmods)                   | For `pear-electron` UI apps. Frontend framework-agnostic live-reload | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |

#### Integration Libraries <a name="integration-libraries"></a>

Pear modules for runtime integrations. Such as [pear-electron](https://github.com/holepunchto/pear-electron).
    
| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [pear-appdrive](https://github.com/holepunchto/pear-appdrive)                 | Read-only Hyperdrive API subset interface for application drives     | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-aliases](https://github.com/holepunchto/pear-aliases)                   | List of aliases for `pear://<alias>` links                           | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-api](https://github.com/holepunchto/pear-api)                           | global.Pear API class                                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-changelog](https://github.com/holepunchto/pear-changelog)               | Changelog parsing and diffing                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-constants](https://github.com/holepunchto/pear-constants)               | Shared Pear constants                                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-cmd](https://github.com/holepunchto/pear-cmd)                           | Command parser & definitions                                         | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-errors](https://github.com/holepunchto/pear-errors)                     | Shared Pear error types                                              | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-gunk](https://github.com/holepunchto/pear-gunk)                         | Shared builtins, overrides & linker mappings                         | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#ff4242;">**unstable**</mark> |
| [pear-ipc](https://github.com/holepunchto/pear-ipc)                           | Interprocess Communication library                                   | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-ref](https://github.com/holepunchto/pear-ref)                           | IO handle reference counter & tracker                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-rti](https://github.com/holepunchto/pear-rti)                           | Runtime Information state bootstrap for API building                 | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-state](https://github.com/holepunchto/pear-state)                       | Shared state structure & capabilities                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-terminal](https://github.com/holepunchto/pear-terminal)                 | Terminal User Interface library                                      | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |
| [pear-tryboot](https://github.com/holepunchto/pear-tryboot)                   | Used with `pear-ipc`, tries to boot sidecar on connect failure       | ![Windows][1]![MacOS][2]![Linux][3]                           | <mark style="background-color:#80ff80;">**stable**</mark>  |

### P2P Modules <a name="p2p-modules"></a>

Modules that supply point-to-point peer-to-peer connection and storage capabilities. 

#### Building-Block Libraries <a name="building-blocks"></a>

The essential building-blocks for building powerful P2P applications using Pear.

| Name                                                     | Description                                                                         | Systems                                                       | Stability                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| [hypercore](https://github.com/holepunchto/hypercore)    | A distributed, secure append-only log for creating fast, scalable P2P applications  | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [hyperbee](https://github.com/holepunchto/hyperbee)      | An append-only B-tree running on a Hypercore. Allows sorted iteration and more      | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [hyperdrive](https://github.com/holepunchto/hyperdrive)  | A secure, real-time, efficient distributed P2P file-system                          | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [autobase](https://github.com/holepunchto/autobase)      | A "virtual Hypercore" layer over many Hypercores owned by many different peers      | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [hyperdht](https://github.com/holepunchto/hyperdht)      | The Distributed Hash Table (DHT) powering Hyperswarm                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [hyperswarm](https://github.com/holepunchto/hyperswarm)  | A high-level API for finding and connecting to peers by topic                       | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |

#### Helper Libraries <a name="helpers"></a>

Helper modules can be used together with the building-blocks to create cutting-edge P2P tools and application-modules.

| Name                                                                                | Description                                                            | Systems                                                       | Stability                                                 |
|-------------------------------------------------------------------------------------|----------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| [corestore](https://github.com/holepunchto/corestore)                               | A Hypercore factory for managing Hypercore collections as a Hypercore  | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [localdrive](https://github.com/holepunchto/localdrive)                             | A file system interoperable with Hyperdrive                            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [mirror-drive](https://github.com/holepunchto/mirror-drive)                         | Mirror between a Hyperdrive and/or Localdrive                          | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [@hyperswarm/secret-stream](https://github.com/holepunchto/hyperswarm-secret-stream)| Securely create connections between peers in a Hyperswarm              | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [compact-encoding](https://github.com/holepunchto/compact-encoding)                 | Binary encoding schemes for efficient parser-serializers.              | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |
| [protomux](https://github.com/holepunchto/protomux)                                 | Multiplex multiple message oriented protocols over a stream            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     | <mark style="background-color:#80ff80;">**stable**</mark> |

### Bare Modules <a name="bare-modules"></a>

Pear's native runtime is [Bare](https://github.com/holepunchto/bare). The `Bare` global API is minimal and not intended as a standard library. 
Standard runtime functionality is provided via a installable modules. prefixed with `bare-`.

| Module                                                                        | Description                                                          | Systems                                                       | Stability                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [bare-abort](https://github.com/holepunchto/bare-abort)                       | Cause abnormal program termination and generate a crash report       | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-assert](https://github.com/holepunchto/bare-assert)                     | Assertion library for JavaScript                                     | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-atomics](https://github.com/holepunchto/bare-atomics)                   | Native synchronization primitives for JavaScript                     | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-buffer](https://github.com/holepunchto/bare-buffer)                     | Native buffers for JavaScript                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-bundle](https://github.com/holepunchto/bare-bundle)                     | Application bundle format for JavaScript                             | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-channel](https://github.com/holepunchto/bare-channel)                   | Inter-thread messaging for JavaScript                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-console](https://github.com/holepunchto/bare-console)                   | WHATWG debugging console for JavaScript                              | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-crypto](https://github.com/holepunchto/bare-crypto)                     | Cryptographic primitives for JavaScript                              | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-daemon](https://github.com/holepunchto/bare-daemon)                     | Create and manage daemon processes in JavaScript                     | ![Windows][1]![MacOS][2]![Linux][3]                           |  <mark style="background-color:#80ff80;">**stable**</mark> | 
| [bare-dgram](https://github.com/holepunchto/bare-dgram)                       | Native UDP for JavaScript                                            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-dns](https://github.com/holepunchto/bare-dns)                           | Domain name resolution for JavaScript                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-env](https://github.com/holepunchto/bare-env)                           | Environment variable support for JavaScript                          | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-events](https://github.com/holepunchto/bare-events)                     | Event emitters for JavaScript                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-fetch](https://github.com/holepunchto/bare-fetch)                       | WHATWG Fetch implementation for Bare                                 | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-format](https://github.com/holepunchto/bare-format)                     | String formatting for JavaScript                                     | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-fs](https://github.com/holepunchto/bare-fs)                             | Native file system for JavaScript                                    | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-hrtime](https://github.com/holepunchto/bare-hrtime)                     | High-resolution timers for JavaScript                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-http1](https://github.com/holepunchto/bare-http1)                       | HTTP/1 library for JavaScript                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-https](https://github.com/holepunchto/bare-https)                       | HTTPS library for JavaScript                                         | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-inspect](https://github.com/holepunchto/bare-inspect)                   | Inspect objects as strings for debugging                             | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-inspector](https://github.com/holepunchto/bare-inspector)               | V8 inspector support for Bare                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-ipc](https://github.com/holepunchto/bare-ipc)                           | Lightweight pipe-based IPC for Bare                                  | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-module](https://github.com/holepunchto/bare-module)                     | Module support for JavaScript                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-net](https://github.com/holepunchto/bare-net)                           | TCP and IPC servers and clients for JavaScript                       | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-os](https://github.com/holepunchto/bare-os)                             | Operating system utilities for JavaScript                            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-path](https://github.com/holepunchto/bare-path)                         | Path manipulation library for JavaScript                             | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-pipe](https://github.com/holepunchto/bare-pipe)                         | Native I/O pipes for JavaScript                                      | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-process](https://github.com/holepunchto/bare-process)                   | Node.js-compatible process control for Bare                          | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-querystring](https://github.com/holepunchto/bare-querystring)           | URL query string utilities                                           | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-readline](https://github.com/holepunchto/bare-readline)                 | Line editing for interactive CLIs with command history               | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-realm](https://github.com/holepunchto/bare-realm)                       | Realm support for Bare                                               | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-repl](https://github.com/holepunchto/bare-repl)                         | Read-Evaluate-Print-Loop environment for JavaScript                  | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-rpc](https://github.com/holepunchto/bare-rpc)                           | <https://github.com/holepunchto/librpc> ABI compatible RPC for Bare  | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-semver](https://github.com/holepunchto/bare-semver)                     | Minimal semantic versioning library for Bare                         | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-signals](https://github.com/holepunchto/bare-signals)                   | Native signal handling for JavaScript                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-stream](https://github.com/holepunchto/bare-stream)                     | Streaming data for JavaScript                                        | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-structured-clone](https://github.com/holepunchto/bare-structured-clone) | Structured cloning algorithm for JavaScript                          | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> | 
| [bare-subprocess](https://github.com/holepunchto/bare-subprocess)             | Native process spawning for JavaScript                               | ![Windows][1]![MacOS][2]![Linux][3]                           |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-tcp](https://github.com/holepunchto/bare-tcp)                           | Native TCP sockets for JavaScript                                    | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-timers](https://github.com/holepunchto/bare-timers)                     | Native timers for JavaScript                                         | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-tls](https://github.com/holepunchto/bare-tls)                           | Transport Layer Security (TLS) streams for JavaScript                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-tty](https://github.com/holepunchto/bare-tty)                           | Native TTY streams for JavaScript                                    | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-type](https://github.com/holepunchto/bare-type)                         | Cross-realm type predicates for Bare                                 | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-url](https://github.com/holepunchto/bare-url)                           | WHATWG URL implementation for JavaScript                             | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-vm](https://github.com/holepunchto/bare-vm)                             | Isolated JavaScript contexts for Bare                                | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-worker](https://github.com/holepunchto/bare-worker)                     | Higher-level worker threads for JavaScript                           | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-ws](https://github.com/holepunchto/bare-ws)                             | WebSocket library for JavaScript                                     | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |
| [bare-zlib](https://github.com/holepunchto/bare-zlib)                         | Stream-based zlib bindings for JavaScript                            | ![Windows][1]![MacOS][2]![Linux][3]![Android][4]![iOS][5]     |  <mark style="background-color:#80ff80;">**stable**</mark> |

### Tools <a name="tools"></a>

Beyond the [Pear CLI](./reference/cli.md) these ecosystem P2P CLI tools are additionally useful for day-to-day development and operations.

| Name                                                    | Description                                              | Systems                                                     | Stability                                                 |
|-------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| [Hypershell](https://github.com/holepunchto/hypershell) | A CLI to create and connect to P2P E2E encrypted shells  | ![Windows][1]![MacOS][2]![Linux][3]                         | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hypertele](https://github.com/holepunchto/hypertele)   | A swiss-knife proxy powered by `hyperdht`                | ![Windows][1]![MacOS][2]![Linux][3]                         | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperbeam](https://github.com/holepunchto/hyperbeam)   | A one-to-one and end-to-end encrypted internet pipe      | ![Windows][1]![MacOS][2]![Linux][3]                         | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Hyperssh](https://github.com/holepunchto/hyperssh)     | A CLI to run SSH over the DHT.                           | ![Windows][1]![MacOS][2]![Linux][3]                         | <mark style="background-color:#80ff80;">**stable**</mark> |
| [Drives](https://github.com/holepunchto/drives)         | CLI that interacts with `hyperdrive` & `localdrive`      | ![Windows][1]![MacOS][2]![Linux][3]                         | <mark style="background-color:#80ff80;">**stable**</mark> |


[1]: assets/windows.svg
[2]: assets/macos.svg
[3]: assets/linux.svg
[4]: assets/android.svg
[5]: assets/ios.svg