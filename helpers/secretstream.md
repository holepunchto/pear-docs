# SecretStream

SecretStream is used to securely create connections between two peers in Hyperswarm. It is powered by Noise and libsodium's SecretStream. SecretStream can be used as a standalone module to provide encrypted communication between two parties.

The SecretStream instance is a Duplex stream that supports usability as a normal stream for standard read/write operations. Furthermore, its payloads are encrypted with libsodium's SecretStream for secure transmission.

>[GitHub (SecretStream)](https://github.com/holepunchto/hyperswarm-secret-stream)

* [SecretStream](secretstream.md#installation)
  * [Create a new instance](secretstream.md#secretstream.new)
  * Basic:
    * Properties:
      * [s.publicKey](secretstream.md#secretstream.publickey)
      * [s.remotePublicKey](secretstream.md#secretstream.remotepublickey)
      * [s.handshakeHash](secretstream.md#secretstream.handshakehash)
    * Methods:
      * [s.start(rawStream, \[options\])](secretstream.md#secretstream.startrawstream)
      * [s.setTimeout(ms)](secretstream.md#secretstream.settimeout)
      * [s.setKeepAlive(ms)](secretstream.md#secretstream.setkeepalive)
      * [SecretStream.keyPair(\[seed\])](secretstream.md#secretstream.keypair)
    * Events:
      * [connect](secretstream.md#secretstream.onconnect)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install @hyperswarm/secret-stream
```

### API

#### **`const s = new SecretStream(isInitiator, [rawStream], [options])`**  {#secretstream.new}

Makes a new stream.

`isInitiator` is a boolean indicating whether the process is a client or the server.

`rawStream` can be set to an underlying transport stream to run the noise stream over.

`options` include:

|        Property       | Description                                                                | Type                                                  |
| :-------------------: | -------------------------------------------------------------------------- | ----------------------------------------------------- |
|     **`pattern`**     | Accept server connections for this topic by announcing it to the DHT       | String                                                |
| **`remotePublicKey`** | PublicKey of the other party                                               | String                                                |
|     **`keyPair`**     | Combination of PublicKey and SecretKey                                     | { publicKey, secretKey }                              |
|    **`handshake`**    | To use a handshake performed elsewhere, pass it here                       | { tx, rx, handshakeHash, publicKey, remotePublicKey } |

The SecretStream returned is a Duplex stream to write data to and read data from, it's a normal stream with payloads that are encrypted using the libsodium secretstream.

> By default, the above process uses ed25519 for the handshakes.

To load the key pair asynchronously, the secret stream also supports passing in a promise instead of the keypair that later resolves to `{ publicKey, secretKey }`. The stream lifecycle will wait for the resolution and auto-destroy the stream if the promise gives an error.

#### Properties

#### **`s.publicKey`** {#secretstream.publicKey}

Gets the local public key.

#### **`s.remotePublicKey`** {#secretstream.remotepublickey}

Gets the remote's public key. Populated after `open` is emitted.

#### **`s.handshakeHash`** {#secretstream.handshakehash}

Gets the unique hash of this handshake. Populated after `open` is emitted.

#### Methods

#### **`s.start(rawStream, [options])`** {#secretstream.start}

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

#### **`s.setTimeout(ms)`** {#secretstream.settimeout}

Sets the stream timeout. If no data is received within a `ms` window, the stream is auto-destroyed.

#### **`s.setKeepAlive(ms)`** {#secretstream.keepalive}

Sends a heartbeat (empty message) every time the socket is idle for `ms` milliseconds.

#### **`const keyPair = SecretStream.keyPair([seed])`** {#secretstream.keypair}

Generates an ed25519 key pair.

#### Events

#### **`s.on('connect', onConnectHandler)`**  {#secretstream.onconnect}

Emitted when the handshake is fully done. It is safe to write to the stream immediately though, as data is buffered internally before the handshake has been completed.
