# Hyperssh

A utility to facilitate SSH operations via the [HyperDHT](../building-blocks/hyperdht.md).

> [GitHub (Hyperssh)](https://github.com/mafintosh/hyperssh)

* [Installation](hyperssh.md#installation)
* [Basic usage](hyperssh.md#basic-usage)
* [Windows RDP](hyperssh.md#windows-rdp)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install -g hyperssh // ssh / fuse client stubs
npm install -g hypertele // hyperswarm server proxy
npm install -g hyper-cmd-utils // keygen utils
```

### Basic usage

On a server or a machine running an ssh-server, run:

```bash
hyper-cmd-util-keygen --gen_seed
-> SEED

hypertele-server --seed SEED -l 22
-> PEER_KEY
```

This will start announcing the server on the DHT and will display the Noise Public Key of the server.

To connect to the server from another machine, pass the keypair to the `hyperssh` command, along with an optional username:

```bash
hyperssh -s ab01f... -u maf
hyperssh -s ab01f... -u maf -i keypair.json
```

There is no need to remember hostnames any more.


> Under the hood, Hyperswarm performs UDP holepunching. So the server should be accessible even if it is located on a home network. Refer to identity management for more information.


### Windows RDP

Hyperssh can also be used with Windows RDP to remotely log in to Windows machines over Hyperswarm.

**Ensure RDP is enabled on the computer that is going to be logged into (the server), and on that computer run:**

```bash
hypertele-server --seed SEED -l 3389
```

**Then on another computer (client), anywhere on the internet, ssh into the server:**

```bash
hyperssh --rdp -s ...
```

## The hyper-cmd system

The Hyperssh also supports the hyper-cmd system. Refer to [Identity management](https://github.com/prdn/hyper-cmd-docs/blob/main/identity.md) and [Host resolution](https://github.com/prdn/hyper-cmd-docs/blob/main/resolve.md) for additional information.
