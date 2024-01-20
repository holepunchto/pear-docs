# Hyperbeam

An end-to-end encrypted pipeline for the Internet, utilizing the [hyperswarm.md](../building-blocks/hyperswarm.md "mention") and Noise Protocol for secure communications.

> [Github (Hyperbeam)](https://github.com/mafintosh/hyperbeam)

* [Installation](hyperbeam.md#installation)
* [Basic usage](hyperbeam.md#usage)
* [CLI](hyperbeam.md#cli)
* [API](hyperbeam.md#api)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperbeam
```

### Basic usage

```javascript
const Hyperbeam = require('hyperbeam')

// to generate a passphrase, leave the constructor empty 
// and hyperbeam will generate one for you
const beam = new Hyperbeam()

// Use the following constructor with ('neznr3z3j44l7q7sgynbzpdrdlpausurbpcmqvwupmuoidolbopa') a 32-byte unique passphrase
// to find the other side of your pipe.
// const beam = new Hyperbeam('neznr3z3j44l7q7sgynbzpdrdlpausurbpcmqvwupmuoidolbopa')

// beam.key gives the passphrase
console.log('passphrase: ',beam.key)

// make a little chat app
process.stdin.pipe(beam).pipe(process.stdout)

```

### CLI

**Step 1: Install Hyperbeam as a global npm package.**

```bash
npm install -g hyperbeam
```

**Step 2: Generate a passphrase, using the following command on a machine**

```bash
echo 'hello world' | hyperbeam
```

e.g. output: `neznr3z3j44l7q7sgynbzpdrdlpausurbpcmqvwupmuoidolbopa`

**Step 3: Then on another machine run the following command**

```bash
# will print 'hello world'
hyperbeam neznr3z3j44l7q7sgynbzpdrdlpausurbpcmqvwupmuoidolbopa
```

### API

**`const stream = new Hyperbeam([key][, options])`**

Make a new Hyperbeam duplex stream.

This stream will auto-connect to another peer using the same key with an end-to-end encrypted tunnel. When the other peer writes it's emitted as `data` on this stream. Likewise, when you write to this stream it's emitted as `data` on the other peer's stream.

> If you do not pass a `key` into the constructor (the passphrase), one will be generated and put on `stream.key`

`options` include:

| Option    | Description                                |
| --------- | ------------------------------------------ |
| **`dht`** | A DHT instance. Defaults to a new instance |

**`stream.key`**

The passphrase used by the stream for connection.
