// scripts/refgen/layouts/protomux.ts
//
// Editorial layout for the Protomux reference page. The factual member entries
// (signatures, params, options, returns, source links, examples) come from the
// model; this manifest supplies only what upstream can't: grouping + order, the
// intro and quickstart, see-also links, and the handful of property descriptions
// upstream doesn't provide in prose.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Multiplex multiple framed protocols over one transport stream.',
  status: 'stable',

  intro:
    '`Protomux` multiplexes multiple message-oriented subprotocols over one framed stream. ' +
    'It is typically layered on top of [Secretstream](/reference/helpers/secretstream) and uses ' +
    '[Compact encoding](/reference/helpers/compact-encoding) for message schemas. ' +
    'For source and releases, see the [Protomux repository](https://github.com/holepunchto/protomux).',

  quickstart:
    '```js\n' +
    "import Protomux from 'protomux'\n" +
    "import cenc from 'compact-encoding'\n\n" +
    'const mux = new Protomux(aFramedEncryptedStream)\n\n' +
    'const channel = mux.createChannel({\n' +
    "  protocol: 'chat',\n" +
    '  onopen() {\n' +
    "    console.log('chat channel opened')\n" +
    '  }\n' +
    '})\n\n' +
    'const message = channel.addMessage({\n' +
    '  encoding: cenc.string,\n' +
    '  onmessage(text) {\n' +
    '    console.log(text)\n' +
    '  }\n' +
    '})\n\n' +
    'channel.open()\n' +
    "message.send('hello')\n" +
    '```',

  groups: [
    { title: 'Constructor and mux helpers', members: ['constructor', 'static:from', 'static:isProtomux', 'cork', 'uncork', 'isIdle', 'for'] },
    { title: 'Pairing and channel discovery', members: ['pair', 'unpair', 'opened', 'getLastChannel'] },
    { title: 'Creating channels', members: ['createChannel'] },
    { title: 'Mux properties', members: ['stream', 'drained'] },
    { title: 'Channel lifecycle', members: ['open', 'fullyOpened', 'fullyClosed', 'close', 'Channel.cork', 'Channel.uncork'] },
    { title: 'Registering and sending messages', members: ['addMessage', 'send', 'encoding', 'onmessage'] },
    {
      title: 'Channel properties',
      members: ['userData', 'protocol', 'aliases', 'id', 'handshake', 'messages', 'opened', 'closed', 'destroyed', 'drained'],
    },
    { title: 'Lifecycle callbacks', members: ['onopen', 'onclose', 'ondestroy', 'ondrain'] },
  ],

  // Property/callback members upstream documents tersely (or not at all) in prose,
  // so the model has no usable description — supply concise ones transcribed from
  // the curated page's Returns/Parameters lines.
  descriptions: {
    'static:isProtomux': 'Returns `true` when `value` looks like a Protomux instance.',
    getLastChannel: 'Returns the most recently opened matching channel, or `null` if none is open.',
    stream: 'The framed transport stream backing this mux.',
    drained: 'The current writable backpressure state from the underlying stream.',
    fullyOpened: 'Resolves to `true` when the channel fully opens or `false` if it closes first.',
    fullyClosed: 'Resolves once the channel has been destroyed and all pending async handlers have finished.',
    userData: 'The arbitrary metadata value passed to `mux.createChannel(...)`.',
    protocol: 'The channel protocol name.',
    aliases: 'The list of alternate protocol names registered for this channel family.',
    id: 'The optional binary identifier distinguishing this channel family.',
    handshake: 'The decoded handshake payload after the channel fully opens, or `null` when no handshake encoder was configured.',
    messages: 'The array of registered message descriptors in type order.',
    closed: 'Returns `true` after either side closes the channel.',
    destroyed: 'Returns `true` after the close lifecycle and pending handlers have fully drained.',
    onopen: 'Called when the channel opens. `handshake` is the decoded open payload or `null`, and `channel` is the channel instance.',
    onclose: 'Called when the channel closes. `isRemote` is `true` when the remote side initiated the close, and `channel` is the channel instance.',
    ondestroy: 'Called when the channel is destroyed. `channel` is the destroyed channel instance.',
    ondrain: "Called when the channel's underlying mux becomes writable again. `channel` is that channel instance.",
  },

  seeAlso: [
    '[Secretstream](/reference/helpers/secretstream)—the encrypted framed stream most commonly used underneath Protomux.',
    '[Compact encoding](/reference/helpers/compact-encoding)—the schema toolkit Protomux uses for handshakes and message payloads.',
    '[Hyperswarm](/reference/building-blocks/hyperswarm)—common peer-transport entry point before you layer on Secretstream and Protomux.',
    '[Upstream Protomux repository](https://github.com/holepunchto/protomux)—source, releases, and implementation details.',
  ],
};

export default layout;
