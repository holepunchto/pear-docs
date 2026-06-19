// scripts/refgen/layouts/hyperswarm.ts
//
// Editorial layout for the Hyperswarm reference page. As with autobase and
// hypercore, the member entries (signatures, params, returns, source links,
// examples) come from the model; this manifest supplies only grouping + order,
// the intro and quickstart, per-member notes, see-also links, and the handful of
// descriptions upstream doesn't provide in prose.

import type { Layout } from '../layout';

const layout: Layout = {
  description:
    'Topic-based peer discovery and encrypted connections on top of HyperDHT.',
  status: 'stable',

  intro:
    'Hyperswarm is the high-level networking layer for discovering peers by a shared 32-byte topic and opening ' +
    'encrypted connections between them. Prefer one swarm instance per app and join multiple topics on that same ' +
    'instance when possible.',

  quickstart:
    '```js\n' +
    "import Hyperswarm from 'hyperswarm'\n\n" +
    'const server = new Hyperswarm()\n' +
    'const client = new Hyperswarm()\n\n' +
    "server.on('connection', socket => {\n" +
    "  socket.end('hello from the server')\n" +
    '})\n\n' +
    "client.on('connection', socket => {\n" +
    "  socket.once('data', async buf => {\n" +
    '    console.log(buf.toString())\n' +
    '    await Promise.all([client.destroy(), server.destroy()])\n' +
    '  })\n' +
    '})\n\n' +
    "const topic = Buffer.alloc(32).fill('pear-docs-topic')\n" +
    'const discovery = server.join(topic, { server: true, client: false })\n' +
    'await discovery.flushed()\n\n' +
    'client.join(topic, { server: false, client: true })\n' +
    'await client.flush()\n' +
    '```',

  groups: [
    { title: 'Constructor and state', members: ['constructor', 'connecting', 'connections', 'peers', 'dht'] },
    { title: 'Topic membership', members: ['join', 'leave', 'status', 'flush'] },
    { title: 'Direct peers and events', members: ['joinPeer', 'leavePeer', 'on:connection', 'on:update', 'on:ban'] },
    { title: 'Listening and lifecycle', members: ['listen', 'suspend', 'resume', 'destroy'] },
    { title: '`PeerDiscovery`', members: ['flushed', 'refresh', 'destroy'] },
    { title: '`PeerInfo`', members: ['publicKey', 'topics', 'prioritized', 'ban'] },
  ],

  notes: {
    join:
      'Client mode discovers and dials servers for a topic. Server mode announces that topic and accepts inbound ' +
      'connections. Connections opened in client mode update `peerInfo.topics`; inbound server connections are not ' +
      'tied to a single topic.',
    leave: 'Leaving a topic stops new discovery work but does not close already-open connections.',
    status:
      '`status(topic)` returns the underlying `PeerDiscovery`, whose `refresh()` takes no arguments and reannounces ' +
      "or re-looks up with the topic's existing client/server configuration. The object returned by `swarm.join(...)` " +
      'is a session over that discovery and accepts `{ client, server }` on `refresh(...)`.',
    flush: '`flush()` is global to the swarm rather than scoped to one topic, so it can be comparatively expensive.',
    leavePeer: 'If the peer is already connected, `leavePeer(...)` does not close that existing socket.',
    listen:
      '`listen()` is usually called for you after the first `join(...)`, but it is available when you want listening ' +
      'to start earlier.',
    refresh: 'Refreshing a server-mode discovery also triggers a new DHT announcement for that topic.',
    ban: 'Banning prevents future reconnection attempts, but it does not close an already-open connection.',
  },

  seeAlso: [
    '[Connect to many peers by topic with Hyperswarm](/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm)—broader topic-based discovery walkthrough.',
    '[Connect two peers by key with HyperDHT](/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht)—direct one-to-one connections without topic discovery.',
    '[HyperDHT](/reference/building-blocks/hyperdht)—lower-level DHT and hole-punching layer beneath Hyperswarm.',
    '[Secretstream](/reference/helpers/secretstream)—the encrypted stream type that Hyperswarm connections expose.',
    '[Protomux](/reference/helpers/protomux)—multiplex multiple protocols across one Hyperswarm connection.',
    '[Corestore](/reference/helpers/corestore)—pass swarm connections directly to `store.replicate()` to co-replicate all managed cores.',
  ],
};

export default layout;
