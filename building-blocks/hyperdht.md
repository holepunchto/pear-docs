# HyperDHT

<mark style="background-color:green;">**stable**</mark>

The DHT powering Hyperswarm and built on top of [dht-rpc](https://github.com/mafintosh/dht-rpc). The HyperDHT uses a series of holepunching techniques to make sure connectivity works on most networks and is mainly used to facilitate finding and connecting to peers using end-to-end encrypted Noise streams.

In the HyperDHT, peers are identified by a public key, not by an IP address. If you know someone's public key, you can connect to them regardless of where they're located, even if they move between different networks.

{% embed url="https://github.com/holepunchto/hyperdht" %}

* [HyperDHT](hyperdht.md#installation)
  * [Create a new instance](hyperdht.md#const-node-new-dht-options)
  * Basic:
    * Methods:
      * [DHT.keyPair(\[seed\])](hyperdht.md#keypair-dht.keypair-seed)
      * [DHT.bootstrapper(port, host, \[options\])](hyperdht.md#node-dht.bootstrapper-port-host-options)
      * [node.destroy(\[options\])](hyperdht.md#await-node.destroy-options)
    * [Creating P2P servers:](hyperdht.md#creating-p2p-servers)
      * [node.createServer(\[options\], \[onconnection\])](hyperdht.md#const-server-node.createserver-options-onconnection)
      * Methods:
        * [server.listen(keyPair)](hyperdht.md#await-server.listen-keypair)
        * [server.refresh()](hyperdht.md#server.refresh)
        * [server.address()](hyperdht.md#server.address)
        * [server.close()](hyperdht.md#await-server.close)
      * Events:
        * [connection](hyperdht.md#server.on-connection-socket)
        * [listening](hyperdht.md#server.on-listening)
        * [close](hyperdht.md#server.on-close)
    * [Connecting to P2P servers](hyperdht.md#connecting-to-p2p-servers):
      * [node.connect(remotePublicKey, \[options\])](hyperdht.md#const-socket-node.connect-remotepublickey-options)
      * Properties:
        * [socket.remotePublicKey](hyperdht.md#socket.remotepublickey)
        * [socket.publicKey](hyperdht.md#socket.publickey)
      * Events:
        * [open](hyperdht.md#socket.on-open)
    * [Additional Peer Discovery](hyperdht.md#additional-peer-discovery):
      * Methods:
        * [node.lookup(topic, \[options\])](hyperdht.md#const-stream-node.lookup-topic-options)
        * [node.announce(topic, keyPair, \[relayAddresses\], \[options\])](hyperdht.md#const-stream-node.announce-topic-keypair-relayaddresses-options)
        * [node.unannounce(topic, keyPair, \[options\])](hyperdht.md#await-node.unannounce-topic-keypair-options)
  * [Mutable/immutable records:](hyperdht.md#mutable-immutable-records)
    * Methods:
      * [node.immutablePut(value, \[options\])](hyperdht.md#const-hash-closestnodes-await-node.immutableput-value-options)
      * [node.immutableGet(hash, \[options\])](hyperdht.md#const-value-from-await-node.immutableget-hash-options)
      * [node.mutablePut(keyPair, value, \[options\])](hyperdht.md#const-publickey-closestnodes-seq-signature-await-node.mutableput-keypair-value-options)
      * [node.mutableGet(publicKey, \[options\])](hyperdht.md#const-value-from-seq-signature-await-node.mutableget-publickey-options)

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

See [dht-rpc](https://github.com/mafintosh/dht-rpc) for more options as HyperDHT inherits from that.

{% hint style="info" %}
The default bootstrap servers are publicly served on behalf of the commons. To run a fully isolated DHT, start one or more DHT nodes with an empty bootstrap array (`new DHT({bootstrap:[]})`) and then use the addresses of those nodes as the `bootstrap` option in all other DHT nodes. You'll need at least one persistent node for the network to be completely operational.
{% endhint %}

#### Methods

#### **`keyPair = DHT.keyPair([seed])`**

Generates the required key pair for DHT operations.

Returns an object with `{publicKey, secretKey}`. `publicKey` holds a public key buffer, `secretKey` holds a private key buffer.

Any options passed are forwarded to dht-rpc.

#### `node = DHT.bootstrapper(port, host, [options])`

To run your own Hyperswarm network use this method to easily create a bootstrap node.

#### **`await node.destroy([options])`**

Fully destroy this DHT node.

{% hint style="info" %}
This will also unannounce any running servers. If you want to force close the node without waiting for the servers to unannounce pass `{ force: true }`.
{% endhint %}

### Creating P2P Servers

#### **`const server = node.createServer([options], [onconnection])`**

Create a new server for accepting incoming encrypted P2P connections.

`options` include:

```javascript
{
  firewall (remotePublicKey, remoteHandshakePayload) {
    // validate if you want a connection from remotePublicKey
    // if you do return false, else return true
    // remoteHandshakePayload contains their ip and some more info
    return true
  }
}
```

{% hint style="success" %}
You can run servers on normal home computers, as the DHT will UDP holepunch connections for you.
{% endhint %}

#### Methods

#### **`await server.listen(keyPair)`**

Make the server listen on a keyPair. To connect to this server use `keyPair.publicKey` as the connect address.

#### **`server.refresh()`**

Refresh the server, causing it to reannounce its address. This is automatically called on network changes.

#### **`server.address()`**

Returns an object containing the address of the server:

```javascript
{
  host, // external IP of the server,
  port, // external port of the server if predictable,
  publicKey // public key of the server
}
```

You can also get this info from `node.remoteAddress()` minus the public key.

#### **`await server.close()`**

Stop listening.

#### Events

#### **`server.on('connection', socket)`**

Emitted when a new encrypted connection has passed the firewall check.

`socket` is a [NoiseSecretStream](https://github.com/holepunchto/hyperswarm-secret-stream) instance.

You can check who you are connected to using `socket.remotePublicKey` and `socket.handshakeHash` contains a unique hash representing this crypto session (same on both sides).

#### **`server.on('listening')`**

Emitted when the server is fully listening on a keyPair.

#### **`server.on('close')`**

Emitted when the server is fully closed.

### Connecting to P2P Servers

#### **`const socket = node.connect(remotePublicKey, [options])`**

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
| **`keyPair`** | optional key pair to use when connection                 | Object | `node.defaultKeyPair` |

#### Properties

#### **`socket.remotePublicKey`**

The public key of the remote peer.

#### **`socket.publicKey`**

The public key of the connection.

#### Events

#### **`socket.on('open')`**

Emitted when the encrypted connection has been fully established with the server.

```javascript
encryptedSocket.on('open', function () {
  console.log('Connected to server')
})
```

### Additional Peer Discovery

#### **`const stream = node.lookup(topic, [options])`**

Look for peers in the DHT on the given topic. The topic should be a 32-byte buffer (normally a hash of something).

The returned stream looks like this

```javascript
{
  // Who sent the response?
  from: { id, host, port },
  // What address they responded to (i.e., your address)
  to: { host, port },
  // List of peers announcing under this topic
  peers: [ { publicKey, nodes: [{ host, port }, ...] } ]
}
```

To connect to the peers, you should also call `connect` afterward with those public keys.

If you pass any options they are forwarded to dht-rpc.

#### Methods

#### **`const stream = node.announce(topic, keyPair, [relayAddresses], [options])`**

Announce that you are listening on a key pair to the DHT under a specific topic. An announce does a parallel lookup so the stream returned looks like the lookup stream.

Any passed options are forwarded to dht-rpc.

{% hint style="info" %}
When announcing you'll send a signed proof to peers that you own the key pair and wish to announce under the specific topic. Optionally you can provide up to 3 nodes, indicating which DHT nodes can relay messages to you - this speeds up connects later on for other users.

Creating a server using `dht.createServer` automatically announces itself periodically on the key pair it is listening on. When announcing the server under a specific topic, you can access the nodes it is close to using `server.nodes`.
{% endhint %}

#### **`await node.unannounce(topic, keyPair, [options])`**

Unannounce a key pair.

Any passed options are forwarded to dht-rpc.

### Mutable/Immutable Records

#### Methods

#### **`const { hash, closestNodes } = await node.immutablePut(value, [options])`**

Store an immutable value in the DHT. When successful, the hash of the value is returned.

Any passed options are forwarded to dht-rpc.

#### **`const { value, from } = await node.immutableGet(hash, [options])`**

Fetch an immutable value from the DHT. When successful, it returns the value corresponding to the hash.

Any passed options are forwarded to dht-rpc.

#### **`const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])`**

Store a mutable value in the DHT.

Any passed options are forwarded to dht-rpc.

#### **`const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])`**

Fetch a mutable value from the DHT.

`options` include:

| Property      | Description                                              | Type   | Default               |
| ------------- | -------------------------------------------------------- | ------ | --------------------- |
| **`seq`**   | Returns values with corresponding `seq` values that are greater than or equal to the supplied `seq` option | Integer  | `0`                  |
| **`latest`** | Indicates whether the query should try to find the highest seq before returning, or just the first verified value larger than `options.seq` it sees. | Boolean | `false` |

Any passed options are forwarded to dht-rpc.
