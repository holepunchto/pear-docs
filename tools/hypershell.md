# Hypershell

A command-line interface for generating and connecting to peer-to-peer, end-to-end encrypted shells.

>[GitHub (Hypershell)](https://github.com/holepunchto/hypershell)

* [Installation](hypershell.md#installation)
* [Basic usage](hypershell.md#basic-usage)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install -g hypershell
```

### Basic usage

**Create a P2P shell server.**

```bash
hypershell-server [options]
```

`options` include:

| Options                     | Description                       | Default                          |
| --------------------------- | --------------------------------- | -------------------------------- |
| **`-f <filename>`**         | Filename of the server seed key.  | `~/.hypershell/peer`             |
| **`--firewall <filename>`** | List of allowed public keys.      | `~/.hypershell/authorized_peers` |

**Connect to a P2P shell.**

```bash
hypershell [options] <server public key>
```

`options` include:

| Options             | Description                       | Default              |
| ------------------- | --------------------------------- | -------------------- |
| **`-f <filename>`** |  Filename of the client seed key. | `~/.hypershell/peer` |

**Create keys of type ed25519 for use by the holepunch-protocol.**

```bash
hypershell-keygen [options]
```

`options` include:

| Options             | Description                    |
| ------------------- | ------------------------------ |
| **`-f <filename>`** | Filename of the seed key file. |
| **`-c <comment>`**  | Provides a new comment.        |

### Setup

First, create a key with the default filename:

```bash
hypershell-keygen
```

**Client**

Now the server can be connected to (providing the public key has been allowed):

```bash
hypershell <server public key>
```

**Server**

To create a server:

```bash
hypershell-server
```

`~/.hypershell/firewall` will be automatically created as an empty file. That means all connections are denied by default.

>  Public keys can be added in real time by adding them to the firewall list while `hypershell-server` is running.

### Known peers

There will be a file named `~/.hypershell/known_peers`.

Add named peers to the file, for example:

```bash
# <name> <public key>
home cdb7b7774c3d90547ce2038b51367dc4c96c42abf7c2e794bb5eb036ec7793cd 
```

Utilize `hypershell home` to eliminate the need for constantly providing the full public key.

### Multiple keys

Multiple keys are required to have multiple servers.

Generate another key:

```bash
hypershell-keygen -f ~/.hypershell/my-server
```

Create a new shell server:


```bash
hypershell-server -f ~/.hypershell/my-server --firewall ~/.hypershell/my-server-firewall
```

The client also accepts `-f` if required.
