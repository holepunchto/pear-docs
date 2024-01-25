# Hypertele

A swiss-knife proxy powered by [HyperDHT](../building-blocks/hyperdht.md)!

> [GitHub (Hypertele)](https://github.com/bitfinexcom/hypertele)

* [Installation](hypertele.md#installation)
* [Basic usage](hypertele.md#basic-usage)

### Installation

Install with [npm](https://www.npmjs.com/)

```bash
npm install -g hypertele // hyperswarm server proxy
npm install -g hyper-cmd-utils // keygen utils
```

### Basic usage

#### Server

#### **Standard pipe server**

```bash
hypertele-server --help
```

**Create a JSON config file for the server**

```javascript
{
  "seed": "SEED",
  "allowed": [
    "CLIENT_PEER_KEY",
    ...
  ]
}
```

| Options           | Description                                             |
| ----------------- | ------------------------------------------------------- |
| **`-l <PORT>`**   | port of the local service exposed to the peers          |
| **`--cert-skip`** | skip certificate check when connecting to local service |
| **`--seed SEED`** | seed (command-line)                                     |

#### Examples

```bash
hypertele-server -l 22 -c config-server.json
hypertele-server -l 22 --seed XXX
``````

> The above-mentioned command will print out the pubkey.

### Pub

**Pub server**

```bash
hypertele-pub --help
```

**Create a JSON config file for the server**

```bash
{
  "seed": "SEED",
  "allowed": [
    "CLIENT_PEER_KEY",
    ...
  ]
}
```

```yaml
options:

-l PORT : port of the local service to expose to the peers
--seed SEED : seed (command-line)
```

#### Examples

```bash
hypertele-pub -l 5555 -c config-server.json
hypertele-pub -l 5555 --seed XXX
```

> The above-mentioned command will print out the pubkey.


### Client

```bash
hypertele --help
```

**Create a JSON config file for client**

```javascript
{
  "peer": "SERVER_PEER_KEY"
}
```

| Options                    | Description                    |
| -------------------------- | ------------------------------ |
| **`-s <SERVER_PEER_KEY>`** | server peer key (command-line) |
| **`-i <keypair.json>`**    | keypair file                   |

#### Examples

```bash
hypertele -p 1337 -c config-client.json
hypertele -p 1337 -s PUBKEY_FROM_SERVER -i keypair.json
telnet localhost 1337
```

### The hyper-cmd system

Hypertele also provides support for the hyper-cmd system!

Learn more about identity management and host resolution using hyper-cmd:

> [GitHub (Hyper-cmd-docs)](https://github.com/prdn/hyper-cmd-docs)
