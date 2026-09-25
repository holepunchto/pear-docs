// scripts/bare-refgen/layouts/bare-broadcast-channel.ts
// Editorial layout for bare-broadcast-channel: param/returns prose grounded in
// the upstream index.d.ts option comments and the index.js constructor
// destructuring (portCapacity = 1024, interfaces = []).

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  describe: {
    'Port.write': 'Broadcast a structured-cloneable `value` to peers.',
    'Port.writeSync': 'Broadcast a structured-cloneable `value` to peers.',
  },
  params: {
    BroadcastChannel: {
      opts: 'Channel options; `handle` backs the channel with an existing `SharedArrayBuffer`, `interfaces` registers serializable and transferable interfaces (default `[]`), and `portCapacity` defaults to `1024`.',
    },
    'BroadcastChannel.from': {
      handle: 'The `SharedArrayBuffer` backing the channel, as exposed by `channel.handle`.',
      opts: 'The same options as the constructor, except `handle`.',
    },
    'Port.write': {
      value: 'A structured-cloneable value to broadcast to peers.',
    },
    'Port.writeSync': {
      value: 'A structured-cloneable value to broadcast to peers.',
    },
  },
  returns: {
    'BroadcastChannel.from': 'A channel backed by the given `handle`.',
    connect: 'A new port connected to the channel.',
    'Port.write': 'Whether the write flushed.',
    'Port.writeSync': 'Whether the write flushed.',
  },
};

export default layout;
