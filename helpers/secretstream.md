# SecretStream

SecretStream is used to securely create connections between two peers in Hyperswarm. It is powered by Noise and libsodium's SecretStream. SecretStream can be used as a standalone module to provide encrypted communication between two parties.

The SecretStream instance is a Duplex stream that supports usability as a normal stream for standard read/write operations. Furthermore, its payloads are encrypted with libsodium's SecretStream for secure transmission.

>[Github (SecretStream)](https://github.com/holepunchto/hyperswarm-secret-stream)

* [SecretStream](secretstream.md#installation)
  * [Create a new instance](secretstream.md#const-s--new-secretstreamisinitiator-rawstream-options)
  * Basic:
    * Properties:
      * [s.publicKey](secretstream.md#spublickey)
      * [s.remotePublicKey](secretstream.md#sremotepublickey)
      * [s.handshakeHash](secretstream.md#shandshakehash)
    * Methods:
      * [s.start(rawStream, \[options\])](secretstream.md#sstartrawstream-options)
      * [s.setTimeout(ms)](secretstream.md#ssettimeoutms)
      * [s.setKeepAlive(ms)](secretstream.md#ssetkeepalivems)
      * [SecretStream.keyPair(\[seed\])](secretstream.md#const-keypair--secretstreamkeypairseed)
    * Events:
      * [connect](secretstream.md#sonconnect-onconnecthandler)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install @hyperswarm/secret-stream
```

### API

#### **`const s = new SecretStream(isInitiator, [rawStream], [options])`**

Makes a new stream.

`isInitiator` is a boolean indicating whether you are the client or the server.

`rawStream` can be set to an underlying transport stream to run the noise stream over.

`options` include:

|        Property       | Description                                                                | Type                                                  |
| :-------------------: | -------------------------------------------------------------------------- | ----------------------------------------------------- |
|     **`pattern`**     | Accept server connections for this topic by announcing yourself to the DHT | String                                                |
| **`remotePublicKey`** | PublicKey of the other party                                               | String                                                |
|     **`keyPair`**     | Combination of PublicKey and SecretKey                                     | { publicKey, secretKey }                              |
|    **`handshake`**    | To use a handshake performed elsewhere, pass it here                       | { tx, rx, handshakeHash, publicKey, remotePublicKey } |

The SecretStream returned is a Duplex stream that you use as a normal stream, to write/read data from, except its payloads are encrypted using the libsodium secretstream.

> By default, the above process uses ed25519 for the handshakes.

To load the key pair asynchronously, the secret stream also supports passing in a promise instead of the keypair that later resolves to `{ publicKey, secretKey }`. The stream lifecycle will wait for the resolution and auto-destroy the stream if the promise gives an error.

#### Properties

#### **`s.publicKey`**

Gets the local public key.

#### **`s.remotePublicKey`**

Gets the remote's public key. Populated after `open` is emitted.

#### **`s.handshakeHash`**

Gets the unique hash of this handshake. Populated after `open` is emitted.

#### Methods

#### **`s.start(rawStream, [options])`**

Starts a SecretStream from a rawStream asynchronously.

```javascript
const s = new SecretStream({
  autoStart: false // call start manually
})

// ... do async stuff or destroy the stream

s.start(rawStream, {
  ... options from above
})
```

#### **`s.setTimeout(ms)`**

Sets the stream timeout. If no data is received within a `ms` window, the stream is auto-destroyed.

#### **`s.setKeepAlive(ms)`**

Sends a heartbeat (empty message) every time the socket is idle for `ms` milliseconds.

#### **`const keyPair = SecretStream.keyPair([seed])`**

Generates an ed25519 key pair.

#### Events

#### **`s.on('connect', onConnectHandler)`**

Emitted when the handshake is fully done. It is safe to write to the stream immediately though, as data is buffered internally before the handshake has been completed.
