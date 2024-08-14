# Hyperswarm

Hyperswarm helps to find and connect to peers announcing a common 'topic' that can be anything. Using Hyperswarm, discover and connect peers with a shared interest over a distributed network. For example, we often use Hypercore's discovery key as the swarm topic for discovering peers to replicate with.

Hyperswarm offers a simple interface to abstract away the complexities of underlying modules such as [HyperDHT](hyperdht.md) and [SecretStream](../helpers/secretstream.md). These modules can also be used independently for specialized tasks.

Notable features include:

* An improved UDP holepunching algorithm that uses arbitrary DHT nodes (optionally selected by the connecting peers) to proxy necessary metadata while being maximally privacy-preserving.
* A custom-built transport protocol, [UDX](https://github.com/holepunchto/libudx), that takes advantage of the holepunching algorithm to avoid unnecessary overhead (it doesn't include handshaking since holepunching takes care of that, for example). It's blazing fast.
* A simplified DHT API that closely resembles NodeJS's `net` module, but using public keys instead of IP addresses.

> [GitHub (Hyperswarm)](https://github.com/holepunchto/hyperswarm)

* [Hyperswarm](../building-blocks/hyperswarm.md)
  * [Create a new instance](hyperswarm.md#installation)
  * Basic:
    * Properties:
      * [swarm.connecting](hyperswarm.md#swarm.connecting)
      * [swarm.connections](hyperswarm.md#swarm.connections)
      * [swarm.peers](hyperswarm.md#swarm.peers)
      * [swarm.dht](hyperswarm.md#swarm.dht)
    * Methods:
      * [swarm.join(topic, [options])](hyperswarm.md#swarm.join)
    * Events:
      * [connection](hyperswarm.md#swarm.onconnection)
      * [update](hyperswarm.md#swarm.onupdate)
    * [Clients and Servers:](hyperswarm.md#clients-and-servers)
      * Methods:
        * [swarm.leave(topic)](hyperswarm.md#swarm.leave)
        * [swarm.joinPeer(noisePublicKey)](hyperswarm.md#swarm.joinpeer)
        * [swarm.leavePeer(noisePublicKey)](hyperswarm.md#swarm.leavepeer)
        * [swarm.status(topic)](hyperswarm.md#swarm.status)
        * [swarm.listen()](hyperswarm.md#swarm.listen)
        * [swarm.flush()](hyperswarm.md#swarm.flush)
    * [Peer info:](hyperswarm.md#peerinfo)
      * Properties:
        * [peerInfo.publicKey](hyperswarm.md#peerinfo.publickey)
        * [peerInfo.topics](hyperswarm.md#peerinfo.topics)
        * [peerInfo.prioritized](hyperswarm.md#peerinfo.prioritized)
      * Methods:
        * [peerInfo.ban(banStatus = false)](hyperswarm.md#peerinfo.ban)
    * [Peer Discovery:](hyperswarm.md#peer-discovery)
      * Methods:
        * [discovery.flushed()](hyperswarm.md#discovery.flushed)
        * [discovery.refresh({ client, server })](hyperswarm.md#discovery.destroy)
        * [discovery.destroy()](hyperswarm.md#discovery.destroy)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install hyperswarm
```

### API

#### **`const swarm = new Hyperswarm([options])`**

Constructs a new Hyperswarm instance.

The following table describes the properties of the optional `options` object.

|    Property    | Description                                                                                                                                     |
| :------------: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
|  **`keyPair`** | A Noise keypair will be used to listen/connect on the DHT. Defaults to a new key pair.                                                          |
|   **`seed`**   | A unique, 32-byte, random seed that can be used to deterministically generate the key pair.                                                     |
| **`maxPeers`** | The maximum number of peer connections allowed.                                                                                                 |
| **`firewall`** | A sync function of the form `remotePublicKey => (true\|false)`. If true, the connection will be rejected. Defaults to allowing all connections. |
|    **`dht`**   | A DHT instance. Defaults to a new instance.                                                                                                     |

#### **Properties:**

#### **`swarm.connecting`** {#swarm.connecting}

A number that indicates connections in progress.

#### **`swarm.connections`** {#swarm.connections}

A set of all active client/server connections.

#### **`swarm.peers`** {#swarm.peers}

A Map containing all connected peers, of the form: `(Noise public key hex string) -> PeerInfo object`

See the [`PeerInfo`](hyperswarm.md#peerinfo) API for more details.

#### **`swarm.dht`** {#swarm.dht}

A [`HyperDHT`](./hyperdht.md) instance. Useful for lower-level control over Hyperswarm's networking.

#### Methods

#### **`const discovery = swarm.join(topic, [options])`** {#swarm.join}

Returns a [`PeerDiscovery`](hyperswarm.md#peer-discovery) object.

Start discovering and connecting to peers sharing a common topic. As new peers are connected, they will be emitted from the swarm as [`connection`](hyperswarm.md#swarmonconnection-socket-peerinfo) events.

`topic` must be a 32-byte Buffer and use a publicly sharable id, typically a Hypercore `discoveryKey` which we can then link to (join will leak the `topic` to DHT nodes).

`options` can include:

|   Property   | Description                                                                | Type    | Default |
| :----------: | -------------------------------------------------------------------------- | ------- | ------- |
| **`server`** | Accept server connections for this topic by self-announcing to the DHT     | Boolean | `true`  |
| **`client`** | Actively search for and connect to discovered servers                      | Boolean | `true`  |

> Calling `swarm.join()` makes this core directly discoverable. To ensure that this core remains discoverable, Hyperswarm handles the periodic refresh of the join. For maximum efficiency, fewer joins should be called; if sharing a single Hypercore that links to other Hypercores, only join a `topic` for the first one.

#### Events

#### **`swarm.on('connection', (socket, peerInfo) => {})`** {#swarm.onconnection}

Emitted whenever the swarm connects to a new peer.

`socket` is an end-to-end (Noise) encrypted Duplex stream.

`peerInfo` is a [`PeerInfo`](hyperswarm.md#peerinfo) instance.

#### `swarm.on('update', () => {})` {#swarm.onupdate}

Emitted when internal values are changed, useful for user interfaces.

> For instance, the 'update' event is emitted when `swarm.connecting` or `swarm.connections` changes.

### **Clients and Servers** {#clients-and-servers}

In Hyperswarm, there are two ways for peers to join the swarm: client mode and server mode. Previously in Hyperswarm v2, these were called 'lookup' and 'announce', but we now think 'client' and 'server' are more descriptive.

When user joins a topic as a server, the swarm will start accepting incoming connections from clients (peers that have joined the same topic in client mode). Server mode will announce this user keypair to the DHT so that other peers can discover the user server. When server connections are emitted, they are not associated with a specific topic -- the server only knows it received an incoming connection.

When user joins a topic as a client, the swarm will do a query to discover available servers, and will eagerly connect to them. As with server mode, these connections will be emitted as `connection` events, but in client mode, they will be associated with the topic (`info.topics` will be set in the `connection` event).

#### Methods

#### **`await swarm.leave(topic)`** {#swarm.leave}

Stop discovering peers for the given topic.

`topic` must be a 32-byte Buffer

> If a topic was previously joined in server mode, `leave` will stop announcing the topic on the DHT.
>
> If a topic was previously joined in client mode, `leave` will stop searching for servers announcing the topic.

`leave` will **not** close any existing connections.

#### **`swarm.joinPeer(noisePublicKey)`** {#swarm.joinpeer}

Establish a direct connection to a known peer.

`noisePublicKey` must be a 32-byte Buffer

As with the standard `join` method, `joinPeer` will ensure that peer connections are reestablished in the event of failures.

#### **`swarm.leavePeer(noisePublicKey)`** {#swarm.leavepeer}

Stops attempting direct connections to a known peer.

`noisePublicKey` must be a 32-byte Buffer

> If a direct connection is already established, that connection will **not** be destroyed by `leavePeer`.

#### **`const discovery = swarm.status(topic)`** {#swarm.status}

Gets the `PeerDiscovery` object associated with the topic, if it exists.

#### **`await swarm.listen()`** {#swarm.listen}

Explicitly starts listening for incoming connections. This will be called internally after the first `join`, so it rarely needs to be called manually.

#### **`await swarm.flush()`** {#swarm.flush}

Waits for any pending DHT announcements, and for the swarm to connect to any pending peers (peers that have been discovered, but are still in the queue awaiting processing).

Once a `flush()` has completed, the swarm will have connected to every peer it can discover from the current set of topics it's managing.

> `flush()` is not topic-specific, so it will wait for every pending DHT operation and connection to be processed -- it's quite heavyweight, so it could take a while. In most cases, it's not necessary, as connections are emitted by `swarm.on('connection')` immediately after they're opened.

### PeerInfo {#peerinfo}

`swarm.on('connection', ...)` emits a `PeerInfo` instance whenever a new connection is established.

There is a one-to-one relationship between connections and `PeerInfo` objects -- if a single peer announces multiple topics, those topics will be multiplexed over a single connection.

#### **Properties:**

#### **`peerInfo.publicKey`** {#peerinfo.publickey}

The peer's Noise public key.

#### **`peerInfo.topics`** {#peerinfo.topics}

An Array of topics that this Peer is associated with -- `topics` will only be updated when the Peer is in client mode.

#### **`peerInfo.prioritized`** {#peerinfo.prioritized}

If true, the swarm will rapidly attempt to reconnect to this peer.

#### **Methods:**

#### **`peerInfo.ban(banStatus = false)`** {#peerinfo.ban}

Ban or unban the peer. Banning will prevent any future reconnection attempts, but it will **not** close any existing connections.

### Peer Discovery

`swarm.join` returns a `PeerDiscovery` instance which allows for both controlling discovery behavior and responding to lifecycle changes during discovery.

#### Methods

#### **`await discovery.flushed()`** {#discovery.flushed}

Waits until the topic has been fully announced to the DHT. This method is only relevant in server mode. When `flushed()` has completed, the server will be available to the network.

#### **`await discovery.refresh({ client, server })`** {#discovery.refresh}

Updates the `PeerDiscovery` configuration, optionally toggling client and server modes. This will also trigger an immediate re-announce of the topic when the `PeerDiscovery` is in server mode.

#### **`await discovery.destroy()`** {#discovery.destroy}

Stops discovering peers for the given topic.

> If a topic was previously joined in server mode, `leave` will stop announcing the topic on the DHT.
>
>If a topic was previously joined in client mode, `leave` will stop searching for servers announcing the topic.
