// scripts/bare-refgen/layouts/bare-pipe.ts
// Editorial layout for bare-pipe: param/returns/throws prose grounded in the
// upstream README (main branch, pre-marker prose) and index.js/lib/errors.js.
// Option defaults quoted from the README's `options = { ... }` blocks; error
// codes read from lib/errors.js and their throw sites in index.js.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-subprocess`](/reference/bare/modules/bare-subprocess) — uses pipes for child-process stdio.',
  ],
  params: {
    Pipe: {
      path: 'A file descriptor to open (number), or a path to connect to (string).',
      opts: 'Options; `readBufferSize` defaults to `65536`, `allowHalfOpen` and `eagerOpen` to `true`, and `ipc` to `false` (set `ipc: true` to enable handle passing over the pipe).',
    },
    open: {
      fd: 'The file descriptor to open the pipe on.',
      onconnect: "Called once when the pipe emits `'connect'`.",
    },
    connect: {
      path: 'The path to connect to.',
      opts: 'Options; `path` may be given here instead of as the first argument.',
      onconnect: 'Called when the connection is established.',
    },
    write: {
      chunk: 'The data to write.',
      encoding: 'The encoding of `chunk` when it is a string.',
      handle: 'A handle to transfer to the receiver alongside the chunk; requires the pipe to have been created with `ipc: true` and `handle` to implement the `IPCAcceptable` protocol.',
      cb: 'Called when the chunk has been processed.',
    },
    accept: {
      target: "The object to accept the pending handle into; must implement the `IPCAcceptable` protocol. Call synchronously from the `'handle'` event listener.",
    },
    'Pipe.createConnection': {
      path: 'The path to connect to.',
      opts: 'Options passed to both the `Pipe` constructor and `connect()`.',
      onconnect: 'Called when the connection is established.',
    },
    'Pipe.createServer': {
      opts: 'Options applied to each incoming pipe; `readBufferSize` defaults to `65536`, `allowHalfOpen` to `true`, `pauseOnConnect` to `false`, and `ipc` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
    PipeServer: {
      opts: 'Options applied to each incoming pipe; `readBufferSize` defaults to `65536`, `allowHalfOpen` to `true`, `pauseOnConnect` to `false`, and `ipc` to `false`.',
      onconnection: "Called on each `'connection'` event.",
    },
    listen: {
      path: 'The path to listen on.',
      backlog: 'The maximum length of the queue of pending connections (default `511`).',
      opts: '`path` and `backlog` may be given here instead of as positional arguments.',
      onlistening: "Called once when the server emits `'listening'`.",
    },
    close: {
      onclose: "Called once when the server emits `'close'`, after all existing connections have ended.",
    },
  },
  returns: {
    accept: '`target`, for chaining the accepted handle into an expression.',
    address: 'The bound path, or `null` if the server is not listening.',
    'Pipe.pipe': 'A `[read, write]` pair of file descriptors connected to each other.',
  },
  throws: {
    connect: ['`PIPE_ALREADY_CONNECTED` — the pipe is already connecting or connected.'],
    accept: ['`INVALID_IPC_TARGET` — `target` does not implement the IPC handle protocol.'],
    listen: [
      '`SERVER_ALREADY_LISTENING` — the server is already listening.',
      '`SERVER_IS_CLOSED` — the server has been closed.',
    ],
  },
};

export default layout;
