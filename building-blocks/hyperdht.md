# HyperDHT

The DHT powering Hyperswarm and built on top of [dht-rpc](https://github.com/holepunchto/dht-rpc). The HyperDHT uses a series of holepunching techniques to ensure connectivity works on most networks and is mainly used to facilitate finding and connecting to peers using end-to-end encrypted Noise streams.

In the HyperDHT, peers are identified by a public key, not by an IP address. A public key can be connected regardless of where the peers are located, even if they move between different networks.

Notable features include:

* lower-level module provides direct access to the DHT for connecting peers using key pairs

> [GitHub (Hyperdht)](https://github.com/holepunchto/hyperdht)

* [HyperDHT](../building-blocks/hyperdht.md)
  * [Create a new instance](hyperdht.md#installation)
  * Basic:
    * Methods:
      * [DHT.keyPair(\[seed\])](hyperdht.md#dht.keypair)
      * [DHT.bootstrapper(port, host, \[options\])](hyperdht.md#dht.bootstrapper)
      * [node.destroy(\[options\])](hyperdht.md#node.destroy)
    * [Creating P2P servers:](hyperdht.md#creating-p2p-servers)
      * [node.createServer(\[options\], \[onconnection\])](hyperdht.md#node.createserver)
      * Methods:
        * [server.listen(keyPair)](hyperdht.md#server.listen)
        * [server.refresh()](hyperdht.md#server.refresh)
        * [server.address()](hyperdht.md#server.address)
        * [server.close()](hyperdht.md#server.close)
      * Events:
        * [connection](hyperdht.md#server.onconnection)
        * [listening](hyperdht.md#server.onlistening)
        * [close](hyperdht.md#server.onclose)
    * [Connecting to P2P servers](hyperdht.md#connecting-to-p2p-servers):
      * [node.connect(remotePublicKey, \[options\])](hyperdht.md#node.connect)
      * Properties:
        * [socket.remotePublicKey](hyperdht.md#socket.remotepublickey)
        * [socket.publicKey](hyperdht.md#socket.publickey)
      * Events:
        * [open](hyperdht.md#socket.onopen)
    * [Additional Peer Discovery](hyperdht.md#additional-peer-discovery):
      * Methods:
        * [node.lookup(topic, \[options\])](hyperdht.md#node.lookup)
        * [node.announce(topic, keyPair, \[relayAddresses\], \[options\])](hyperdht.md#node.announce)
        * [node.unannounce(topic, keyPair, \[options\])](hyperdht.md#node.unannounce)
  * [Mutable/immutable records:](hyperdht.md#mutable-immutable-records)
    * Methods:
      * [node.immutablePut(value, \[options\])](hyperdht.md#node.immutableput)
      * [node.immutableGet(hash, \[options\])](hyperdht.md#node.immutableget)
      * [node.mutablePut(keyPair, value, \[options\])](hyperdht.md#node.mutableput)
      * [node.mutableGet(publicKey, \[options\])](hyperdht.md#node.mutableget)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperdht
```

### API

#### **`const node = new DHT([options])`**

Create a new DHT node.

`options` include:

| Property        | Description                                                                                      | Type   | Default                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------- |
| **`bootstrap`** | overwrite the default bootstrap servers, just need to be an array of any known DHT node(s)       | Array  | `['node1.hyperdht.org:49737', 'node2.hyperdht.org:49737', 'node3.hyperdht.org:49737']` |
| **`keyPair`**   | optionally pass the public key and secret key as a key pair to use for server.listen and connect | Object | `null`                                                                                 |

See [dht-rpc](https://github.com/holepunchto/dht-rpc) for more options as HyperDHT inherits from that.

> ℹ️ The default bootstrap servers are publicly served on behalf of the commons. To run a fully isolated DHT, start one or more DHT nodes with an empty bootstrap array (`new DHT({bootstrap:[]})`) and then use the addresses of those nodes as the `bootstrap` option in all other DHT nodes. At least one persistent node is needed for the network to be completely operational.

#### Methods

#### **`keyPair = DHT.keyPair([seed])`** {#dht.keypair}

Generates the required key pair for DHT operations.

Returns an object with `{publicKey, secretKey}`. `publicKey` holds a public key buffer, `secretKey` holds a private key buffer.

Any options passed are forwarded to dht-rpc.

#### `node = DHT.bootstrapper(port, host, [options])` {#dht.bootstrapper}

Use this method to create a bootstrap node for in order to run a Hyperswarm network.

#### **`await node.destroy([options])`** {#node.destroy}

Fully destroy this DHT node.

> This will also unannounce any running servers. To force close the node without waiting for the servers to unannounce pass `{ force: true }`.

### Creating P2P Servers

#### **`const server = node.createServer([options], [onconnection])`** {#node.createserver}

Creates a new server for accepting incoming encrypted P2P connections.

`options` include:

```javascript
{
  firewall (remotePublicKey, remoteHandshakePayload) {
    // validate if connection from remotePublicKey is accepted
    // if it is accepted return false, else return true
    // remoteHandshakePayload contains their ip and some more info
    return true
  }
}
```

> You can run servers on normal home computers, as the DHT will UDP holepunch connections for you.


#### Methods

#### **`await server.listen(keyPair)`** {#server.listen}

Makes the server listen on a keyPair. To connect to this server use `keyPair.publicKey` as the connect address.

#### **`server.refresh()`** {#server.refresh}

Refreshes the server, causing it to reannounce its address. This is automatically called on network changes.

#### **`server.address()`** {#server.address}

Returns an object containing the address of the server:

```javascript
{
  host, // external IP of the server,
  port, // external port of the server if predictable,
  publicKey // public key of the server
}
```

Information can also be retrieved from `node.remoteAddress()` minus the public key.

#### **`await server.close()`** {#server.close}

Stops listening.

#### Events

#### **`server.on('connection', socket)`** {#server.onconnection}

Emitted when a new encrypted connection has passed the firewall check.

`socket` is a [NoiseSecretStream](https://github.com/holepunchto/hyperswarm-secret-stream) instance.

User connections are identifiable by `socket.remotePublicKey` and `socket.handshakeHash` contains a unique hash representing this crypto session (same on both sides).

#### **`server.on('listening')`** {#server.onlistening}

Emitted when the server is fully listening on a keyPair.

#### **`server.on('close')`** {#server.onclose}

Emitted when the server is fully closed.

### Connecting to P2P Servers

#### **`const socket = node.connect(remotePublicKey, [options])`** {#node.connect}

Connect to a remote server. Similar to `createServer` this performs UDP hole punching for P2P connectivity.

```javascript
const node = new DHT()

const remotePublicKey = Buffer.from('public key of remote peer', 'hex')
const encryptedSocket = node.connect(remotePublicKey)
```

`options` include:

| Property      | Description                                              | Type   | Default               |
| ------------- | -------------------------------------------------------- | ------ | --------------------- |
| **`nodes`**   | optional array of close dht nodes to speed up connecting | Array  | `[]`                  |
| **`keyPair`** | optional key pair to use when connecting                | Object | `node.defaultKeyPair` |

#### Properties

#### **`socket.remotePublicKey`** {#socket.remotepublickey}

The public key of the remote peer.

#### **`socket.publicKey`** {#socket.publickey}

The public key of the connection. 

#### Events

#### **`socket.on('open')`** {#socket.onopen}

Emitted when the encrypted connection has been fully established with the server.

```javascript
encryptedSocket.on('open', function () {
  console.log('Connected to server')
})
```

### Additional Peer Discovery {#additional-peer-discovery}

#### **`const stream = node.lookup(topic, [options])`** {#node.lookup}

Look for peers in the DHT on the given topic. The topic should be a 32-byte buffer (normally a hash of something).

The returned stream looks like this

```javascript
{
  // Who sent the response?
  from: { id, host, port },
  // What address they responded to
  to: { host, port },
  // List of peers announcing under this topic
  peers: [ { publicKey, nodes: [{ host, port }, ...] } ]
}
```

To connect to the peers, also call `connect` afterward with those public keys.

Any passed options are forwarded to dht-rpc.

#### Methods

#### **`const stream = node.announce(topic, keyPair, [relayAddresses], [options])`** {#node.announce}

Announces that users are listening on a key pair to the DHT under a specific topic. An announce does a parallel lookup so the stream returned that looks like the lookup stream.

Any passed options are forwarded to `dht-rpc`.

> When announcing, a signed proof is sent to peers that the peer owns the key pair and wishes to announce under the specific topic. Optionally up to 3 nodes can be provided, indicating which DHT nodes can relay messages to the peer - this speeds up connects later on for other users.
>
> Creating a server using `dht.createServer` automatically announces itself periodically on the key pair it is listening on. When announcing the server under a specific topic, access the nodes it is close to using `server.nodes`.

#### **`await node.unannounce(topic, keyPair, [options])`** {#node.unannounce}

Unannounces a key pair.

Any passed options are forwarded to dht-rpc.

### Mutable/Immutable Records {#mutable-immutable-records}

#### Methods

#### **`const { hash, closestNodes } = await node.immutablePut(value, [options])`** {#node.immutableput}

Stores an immutable value in the DHT. When successful, the hash of the value is returned.

Any passed options are forwarded to dht-rpc.

#### **`const { value, from } = await node.immutableGet(hash, [options])`** {#node.immutableget}

Fetch an immutable value from the DHT. When successful, it returns the value corresponding to the hash.

Any passed options are forwarded to dht-rpc.

#### **`const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])`** {#node.mutableput}

Stores a mutable value in the DHT.

Any passed options are forwarded to dht-rpc.

#### **`const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])`** {#node.mutableget}

Fetches a mutable value from the DHT.

`options` include:

| Property      | Description                                              | Type   | Default               |
| ------------- | -------------------------------------------------------- | ------ | --------------------- |
| **`seq`**   | Returns values with corresponding `seq` values that are greater than or equal to the supplied `seq` option | Integer  | `0`                  |
| **`latest`** | Indicates whether the query should try to find the highest seq before returning, or just the first verified value larger than `options.seq` it sees. | Boolean | `false` |

Any passed options are forwarded to dht-rpc.
