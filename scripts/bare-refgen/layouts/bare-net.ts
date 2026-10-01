// scripts/bare-refgen/layouts/bare-net.ts
// Editorial layout for bare-net: param prose grounded in index.js (option
// defaults from the constructor destructuring) and the bare-tcp README for the
// methods that forward to the underlying TCP socket (the bare-net README
// documents no API).

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    NetSocket: {
      opts: 'Options; `readBufferSize` defaults to `65536`, and `allowHalfOpen` and `eagerOpen` to `false`.',
    },
    'NetSocket.connect': {
      path: 'The path to connect to over IPC.',
      opts: 'Connection options passed to the underlying socket; `path`, `port`, and `host` may be given here instead of as positional arguments.',
      onconnect: "Called once when the socket emits `'connect'`.",
    },
    setKeepAlive: {
      enable: 'Whether to enable keep-alive.',
      delay: 'The initial delay in milliseconds before the first keep-alive probe is sent.',
    },
    setNoDelay: {
      enable: 'When `true` (the default), data is sent immediately without buffering.',
    },
    setTimeout: {
      ms: 'The inactivity timeout in milliseconds; pass `0` to disable the timeout.',
      ontimeout: "Called once when the socket emits `'timeout'`.",
    },
    NetServer: {
      opts: 'Options applied to each accepted socket; `readBufferSize` defaults to `65536`, and `allowHalfOpen` and `pauseOnConnect` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
    'NetServer.close': {
      onclose: "Called once when the server emits `'close'`.",
    },
    'NetServer.listen': {
      path: 'The path to listen on over IPC.',
      backlog: 'The maximum length of the queue of pending connections.',
      onlistening: "Called once when the server emits `'listening'`.",
    },
    createConnection: {
      path: 'The path to connect to over IPC.',
      opts: 'Options for the socket and connection; if `path` is set the socket connects over IPC, otherwise over TCP.',
      onconnect: 'Called when the connection is established.',
    },
    createServer: {
      opts: 'Options applied to each accepted socket; `readBufferSize` defaults to `65536`, and `allowHalfOpen` and `pauseOnConnect` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
  },
};

export default layout;
