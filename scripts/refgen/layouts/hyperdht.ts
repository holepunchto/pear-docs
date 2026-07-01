// scripts/refgen/layouts/hyperdht.ts
//
// Editorial layout for the HyperDHT reference page. The factual member entries
// (signatures, params, options, returns, source links, examples, events) come
// from the model; this manifest supplies only grouping + order, the intro and
// quickstart, see-also links, and the per-member trailing notes upstream
// doesn't express as member descriptions.

import type { Layout } from '../layout';

const layout: Layout = {
  description:
    'P2P DHT for keyed peer lookup, hole punching, and encrypted direct connections.',
  status: 'stable',

  intro:
    'HyperDHT is the lower-level keyed connection layer underneath [Hyperswarm](/reference/building-blocks/hyperswarm). ' +
    'Use it when you want to dial a known public key directly or work with raw DHT discovery and record APIs.',

  quickstart:
    '```js\n' +
    "import DHT from 'hyperdht'\n" +
    "import { once } from 'node:events'\n\n" +
    'const serverNode = new DHT()\n' +
    'const clientNode = new DHT()\n' +
    'const keyPair = DHT.keyPair()\n\n' +
    'const server = serverNode.createServer(socket => {\n' +
    "  socket.end('hello from hyperdht')\n" +
    '})\n\n' +
    'await server.listen(keyPair)\n' +
    'const socket = clientNode.connect(keyPair.publicKey)\n\n' +
    "await once(socket, 'open')\n" +
    "socket.write('ping')\n\n" +
    'for await (const chunk of socket) {\n' +
    '  console.log(chunk.toString())\n' +
    '}\n\n' +
    'await server.close()\n' +
    'await Promise.all([serverNode.destroy(), clientNode.destroy()])\n' +
    '```',

  groups: [
    { title: 'Node setup', members: ['constructor', 'keyPair', 'bootstrapper'] },
    {
      title: 'Servers',
      members: ['createServer', 'listen', 'refresh', 'address', 'on:connection', 'on:listening', 'close', 'on:close'],
    },
    { title: 'Clients and sockets', members: ['connect', 'on:open', 'remotePublicKey', 'publicKey'] },
    { title: 'Peer discovery', members: ['lookup', 'announce', 'unannounce'] },
    { title: 'Mutable and immutable records', members: ['immutablePut', 'immutableGet', 'mutablePut', 'mutableGet'] },
    { title: 'Lifecycle', members: ['destroy'] },
  ],

  // Errors thrown by public methods, transcribed from the upstream source guards.
  members: {
    listen: {
      throws: [
        '`ALREADY_LISTENING` if the server is already listening.',
        '`NODE_DESTROYED` if the DHT node has been destroyed.',
      ],
    },
  },

  notes: {
    refresh:
      'Call this to reannounce the server address. HyperDHT also calls it automatically when the network changes.',
    'on:connection':
      'The socket exposes `socket.remotePublicKey`, and `socket.handshakeHash` is a shared identifier for the encrypted session.',
    announce:
      'Servers created with `node.createServer()` already announce themselves on the key pair they are listening on. ' +
      'Use `node.announce()` when you also want to publish a topic mapping.',
    destroy:
      'HyperDHT inherits additional lower-level RPC APIs from [`dht-rpc`](https://github.com/mafintosh/dht-rpc). ' +
      'Reach for those when you need custom queries beyond the keyed connection and record helpers above.',
  },

  seeAlso: [
    '[Connect two peers by key with HyperDHT](/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht)—step-by-step direct peer connection flow.',
    '[Connect to many peers by topic with Hyperswarm](/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm)—higher-level topic discovery and connection management.',
    '[Hyperswarm](/reference/building-blocks/hyperswarm)—higher-level swarm abstraction built on HyperDHT.',
    '[Secretstream](/reference/helpers/secretstream)—the Noise-encrypted stream layer that wraps all HyperDHT connections.',
    '[Hyperbeam](/reference/tools/hyperbeam)—one-to-one encrypted pipe CLI built on HyperDHT.',
    '[Hypershell](/reference/tools/hypershell)—encrypted remote shell and file-copy tools built on HyperDHT.',
    '[Hypertele](/reference/tools/hypertele)—TCP proxy CLI built on HyperDHT.',
    '[Hyperssh](/reference/tools/hyperssh)—SSH and SSHFS access routed through HyperDHT.',
  ],
};

export default layout;
