
# How to connect two Peers by key with Hyperdht

[`HyperDHT`](../building-blocks/hyperdht.md) helps clients connect to a server peer with a known public key. HyperDHT uses a series of holepunching techniques to establish direct connections between the peers, even if they're located on home networks with tricky NATs.

In the HyperDHT, peers are identified by a public key, not by an IP address. The public key is looked up in a decentralized hash table, which maps the key to an IP address and port. This means users can connect to each other irrespective of their location, even if they move between different networks.

> HyperDHT's holepunching will fail if both the client peer and the server peer are on randomizing [NATs](https://en.wikipedia.org/wiki/Network_address_translation), in which case the connection must be relayed through a third peer. HyperDHT does not do any relaying by default.

> For example, Keet implements its relaying system wherein other call participants can serve as relays -- the more participants in the call, the stronger overall connectivity becomes.

Use the HyperDHT to create a basic CLI chat app where a client peer connects to a server peer by public key. 

This example consists of two applications: `client-app` and `server-app`.

The `server-app` will create a key pair and then start a server that will listen on the generated key pair. The public key is logged into the console. Copy it for instantiating the client.

Create the `server-app` project with the following commands:

```
mkdir server-app
cd server-app
pear init -y -t terminal
npm install hyperdht b4a bare-process
```

Alter `server-app/index.js` to the following:

```javascript
import DHT from 'hyperdht'
import b4a from 'b4a'
import process from 'bare-process'

const dht = new DHT()

// This keypair is the peer identifier in the DHT
const keyPair = DHT.keyPair()

const server = dht.createServer(conn => {
  console.log('got connection!')
  process.stdin.pipe(conn).pipe(process.stdout)
})

server.listen(keyPair).then(() => {
  console.log('listening on:', b4a.toString(keyPair.publicKey, 'hex'))
})

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
Pear.teardown(() => server.close())
```

Open the `server-app` with `pear run --dev .`.

In another terminal create the `client-app` project with the following commands:

```
mkdir client-app
cd client-app
pear init -y -t terminal
npm install hyperdht b4a bare-process
```
Alter `client-app/index.js` to the following:

``` javascript
import DHT from 'hyperdht'
import b4a from 'b4a'
import process from 'bare-process'

const key = Pear.config.args[0]
if (!key) throw new Error('provide a key')

console.log('Connecting to:', key)
const publicKey = b4a.from(key, 'hex')

const dht = new DHT()
const conn = dht.connect(publicKey)
conn.once('open', () => console.log('got connection!'))

process.stdin.pipe(conn).pipe(process.stdout)
```

Run the client passing it the key from the server:

```
pear run --dev . <SUPPLY KEY HERE>
```

The `client-app` will spin up a client, and the public key copied earlier must be supplied as a command line argument for connecting to the server. The client process will log `got connection` into the console when it connects to the server.

Once it's connected, try typing in both terminals.
