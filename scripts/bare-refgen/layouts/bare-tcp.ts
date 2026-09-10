// scripts/bare-refgen/layouts/bare-tcp.ts
// Editorial layout for bare-tcp: param/returns/throws prose grounded in the
// upstream README (main branch, pre-marker prose) and index.js/lib/errors.js.
// Option defaults quoted from the README's `options = { ... }` blocks and the
// constructor/method destructuring; error codes read from lib/errors.js and
// their throw sites in index.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  seeAlso: ['Sockets are [`bare-stream`](/reference/bare/modules/bare-stream) duplex streams.'],
  params: {
    TCPSocket: {
      opts: 'Options; `readBufferSize` defaults to `65536`, and `allowHalfOpen` and `eagerOpen` to `true`.',
    },
    'TCPSocket.connect': {
      port: 'The port to connect to.',
      host: "The host to connect to; defaults to `'localhost'`.",
      opts: 'Connection options; if `host` is a hostname it is resolved with `opts.lookup`, which defaults to `dns.lookup` from `bare-dns`.',
      onconnect: 'Called when the connection is established.',
    },
    'TCPSocket.open': {
      fd: 'The file descriptor of an existing TCP connection to open the socket on.',
      opts: '`fd` may be given here instead of as the first argument.',
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
    TCPServer: {
      opts: 'Options applied to each incoming socket; `readBufferSize` defaults to `65536`, `allowHalfOpen` to `true`, and `keepAlive`, `noDelay`, and `pauseOnConnect` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
    'TCPServer.listen': {
      port: 'The port to listen on; if `0` (the default), an available port is assigned.',
      host: "The host to listen on; defaults to `'localhost'`.",
      backlog: 'The maximum length of the queue of pending connections (default `511`).',
      opts: 'Listen options; the positional arguments may be given here instead, and `lookup` (default `dns.lookup`) resolves `host` when it is a hostname.',
      onlistening: "Called once when the server emits `'listening'`.",
    },
    'TCPServer.close': {
      onclose: "Called once when the server emits `'close'`, after all existing connections have ended.",
    },
    createConnection: {
      port: 'The port to connect to.',
      host: "The host to connect to; defaults to `'localhost'`.",
      opts: 'Options passed to both the `TCPSocket` constructor and `connect()`.',
      onconnect: 'Called when the connection is established.',
    },
    createServer: {
      opts: 'Options applied to each incoming socket; `readBufferSize` defaults to `65536`, `allowHalfOpen` to `true`, and `keepAlive`, `noDelay`, and `pauseOnConnect` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
    isIP: {
      host: 'The string to check.',
    },
    isIPv4: {
      host: 'The string to check.',
    },
    isIPv6: {
      host: 'The string to check.',
    },
  },
  returns: {
    'TCPServer.address': 'The bound address as `{ address, family, port }`, or `null` if the server is not listening.',
    socketpair: 'The file descriptors of the two connected sockets.',
  },
  throws: {
    'TCPSocket.connect': [
      '`SOCKET_ALREADY_CONNECTED` — the socket is already connecting or connected.',
      '`INVALID_PORT` — `port` is not an integer between 0 and 65535.',
    ],
    'TCPServer.listen': [
      '`SERVER_ALREADY_LISTENING` — the server is already listening.',
      '`SERVER_IS_CLOSED` — the server has been closed.',
      '`INVALID_PORT` — `port` is not an integer between 0 and 65535.',
    ],
  },
};

export default layout;
