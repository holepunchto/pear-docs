// scripts/refgen/layouts/secretstream.ts
//
// Editorial layout for the Secretstream reference page. As with the other
// manifests, the member entries (signatures, params, returns, source links,
// examples) come from the model; this manifest supplies only grouping + order,
// the intro and quickstart, and the see-also links.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Noise-encrypted duplex stream used for Holepunch peer transports.',
  status: 'stable',

  intro:
    '`Secretstream` wraps a transport stream in a Noise handshake plus libsodium `secretstream` encryption. ' +
    'It is the encrypted stream layer used underneath [Hyperswarm](/reference/building-blocks/hyperswarm) and ' +
    'related peer transports. For the upstream package, source, and release notes, see the ' +
    '[@hyperswarm/secret-stream repository](https://github.com/holepunchto/hyperswarm-secret-stream).',

  quickstart:
    '```js\n' +
    "import SecretStream from '@hyperswarm/secret-stream'\n\n" +
    'const a = new SecretStream(true)\n' +
    'const b = new SecretStream(false)\n\n' +
    'a.rawStream.pipe(b.rawStream).pipe(a.rawStream)\n\n' +
    "a.write(Buffer.from('hello encrypted world'))\n\n" +
    "b.on('data', (data) => {\n" +
    '  console.log(data.toString())\n' +
    '})\n' +
    '```',

  groups: [
    { title: 'Constructor and lifecycle', members: ['constructor', 'start', 'flush'] },
    { title: 'Stream configuration', members: ['setTimeout', 'setKeepAlive', 'sendKeepAlive'] },
    { title: 'Ordered stream I/O', members: ['write', 'end', 'on:data'] },
    { title: 'Unordered messages', members: ['send', 'trySend', 'on:message'] },
    { title: 'Utility methods', members: ['alloc', 'toJSON'] },
    { title: 'Static helpers', members: ['keyPair', 'static:id'] },
    {
      title: 'Public properties',
      members: [
        'isInitiator', 'rawStream', 'publicKey', 'remotePublicKey', 'handshakeHash',
        'connected', 'keepAlive', 'timeout', 'enableSend', 'opened',
        'rawBytesWritten', 'rawBytesRead', 'userData',
      ],
    },
    { title: 'Events', members: ['on:connect', 'on:handshake'] },
  ],

  // Members upstream under-documents in prose (model has no description, or only
  // a source link in the generated entry) — transcribed from the curated page.
  descriptions: {
    flush:
      'Resolves to `true` when pending encrypted writes and the underlying raw stream have flushed successfully, or `false` if the stream closed before that happened.',
    write: 'Writes an ordered payload to be encrypted and sent through the duplex stream, returning the usual writable-stream backpressure boolean.',
    end: 'Ends the stream, optionally writing a final ordered payload, following standard writable-stream behavior.',
    'on:data': 'Receives ordered decrypted payloads as `Buffer` instances.',
    alloc: 'Returns a writable payload slice backed by a preallocated encrypted output buffer. Write into it, then pass it to `stream.write(...)`.',
    toJSON: 'Returns a diagnostic object containing connection state, keys, and any serializable raw-stream metadata.',
    'static:id': 'Derives a 32-byte stream identity from the completed handshake hash, choosing the initiator/responder namespace via `isInitiator`.',
    isInitiator: '`true` on the dialing side and `false` on the accepting side.',
    rawStream: 'The wrapped transport stream, or a bridge stream when no raw stream was supplied up front.',
    connected: '`true` once the handshake is complete and the stream has emitted `connect`.',
    timeout: 'The configured idle-timeout interval in milliseconds.',
    enableSend: '`true` when unordered `send(...)` and `trySend(...)` support is enabled.',
    opened: 'A promise that resolves to `true` when the handshake succeeds, or `false` if the stream closes before opening.',
    userData: 'An arbitrary user-controlled field that higher-level protocols often use to attach transport metadata.',
    'on:handshake': 'Fires when the Noise handshake keys and hash have been established.',
  },

  // Errors thrown by public methods, transcribed from the upstream source guards.
  members: {
    constructor: { throws: ['if `isInitiator` is not a boolean.'] },
    send: {
      description:
        'Sends an encrypted unordered message, see [udx-native](https://github.com/holepunchto/udx-native/tree/main?tab=readme-ov-file#await-streamsendbuffer) for details. This method silently fails if called before the handshake is complete, or if the underlying `rawStream` is not a UDX stream (not capable of UDP).',
    },
  },

  seeAlso: [
    '[Hyperswarm](/reference/building-blocks/hyperswarm)—the peer-discovery and connection layer that typically hands sockets to Secretstream.',
    '[HyperDHT](/reference/building-blocks/hyperdht)—lower-level DHT whose direct keyed connections are also wrapped in Secretstream.',
    '[Protomux](/reference/helpers/protomux)—multiplex higher-level protocols across one framed encrypted stream.',
    '[Upstream @hyperswarm/secret-stream repository](https://github.com/holepunchto/hyperswarm-secret-stream)—source, releases, and implementation details.',
  ],
};

export default layout;
