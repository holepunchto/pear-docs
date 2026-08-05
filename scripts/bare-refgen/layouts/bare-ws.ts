// scripts/bare-refgen/layouts/bare-ws.ts
// Editorial layout for bare-ws: param/returns/throws prose grounded in the
// upstream README usage example and lib/{socket,server,errors}.js
// (holepunchto/bare-ws, main branch). Error codes and defaults quoted from
// lib/errors.js and their throw sites in lib/socket.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'Socket.constructor': {
      opts: 'Connection options: `host`/`hostname`, `port`, `path`, `secure`, or an already-connected `socket` to wrap.',
    },
    'Socket.ping': {
      data: 'The payload of the ping frame; a string is converted to a `Buffer`.',
    },
    'Socket.pong': {
      data: 'The payload of the pong frame; a string is converted to a `Buffer`.',
    },
    'Socket.handshake': {
      req: 'The outgoing HTTP request to upgrade; the WebSocket handshake headers are added to it.',
      cb: "Called once the server's response is validated, with a `WebSocketError` on failure, otherwise `null`.",
    },
    'Server.constructor': {
      onconnection: "Called on each `'connection'` event.",
    },
    'Server.close': {
      cb: 'Called once the underlying server has closed.',
    },
    'Server.handshake': {
      req: 'The incoming upgrade request.',
      cb: 'Called with a `WebSocketError` if the request is not a valid WebSocket upgrade, otherwise `null`.',
    },
    'WebSocketError.constructor': {
      msg: 'The error message.',
      code: 'The error code.',
      status: 'The WebSocket close status associated with the error.',
      fn: 'Optional function to omit from the top of the generated stack trace, passed to `Error.captureStackTrace`.',
      cause: 'The underlying cause of the error, if any.',
    },
    'WebSocketError.NETWORK_ERROR': {
      msg: 'The error message.',
      cause: 'The underlying error.',
    },
    'WebSocketError.NOT_CONNECTED': { msg: 'The error message.' },
    'WebSocketError.UNEXPECTED_RSV1': { msg: 'The error message.' },
    'WebSocketError.UNEXPECTED_RSV2': { msg: 'The error message.' },
    'WebSocketError.UNEXPECTED_RSV3': { msg: 'The error message.' },
    'WebSocketError.EXPECTED_MASK': { msg: 'The error message.' },
    'WebSocketError.EXPECTED_CONTINUATION': { msg: 'The error message.' },
    'WebSocketError.UNEXPECTED_CONTINUATION': { msg: 'The error message.' },
    'WebSocketError.UNEXPECTED_CONTROL': { msg: 'The error message.' },
    'WebSocketError.INVALID_ENCODING': { msg: 'The error message.' },
    'WebSocketError.INVALID_UPGRADE_HEADER': { msg: 'The error message.' },
    'WebSocketError.INVALID_VERSION_HEADER': { msg: 'The error message.' },
    'WebSocketError.INVALID_KEY_HEADER': { msg: 'The error message.' },
    'WebSocketError.INVALID_ACCEPT_HEADER': { msg: 'The error message.' },
    'WebSocketError.INVALID_OPCODE': { msg: 'The error message.' },
    'WebSocketError.INVALID_PAYLOAD_LENGTH': { msg: 'The error message.' },
    'WebSocketError.INCOMPLETE_FRAME': {
      msg: 'The error message.',
      length: 'The total byte length the frame needs before it can be decoded, stored as the error `status` (default `-1`).',
    },
  },
  returns: {
    'WebSocketError.NETWORK_ERROR': "A `WebSocketError` with `code` set to `'NETWORK_ERROR'`, for the caller to throw.",
    'WebSocketError.NOT_CONNECTED': "A `WebSocketError` with `code` set to `'NOT_CONNECTED'`, for the caller to throw.",
    'WebSocketError.UNEXPECTED_RSV1': "A `WebSocketError` with `code` set to `'UNEXPECTED_RSV1'`, for the caller to throw.",
    'WebSocketError.UNEXPECTED_RSV2': "A `WebSocketError` with `code` set to `'UNEXPECTED_RSV2'`, for the caller to throw.",
    'WebSocketError.UNEXPECTED_RSV3': "A `WebSocketError` with `code` set to `'UNEXPECTED_RSV3'`, for the caller to throw.",
    'WebSocketError.EXPECTED_MASK': "A `WebSocketError` with `code` set to `'EXPECTED_MASK'`, for the caller to throw.",
    'WebSocketError.EXPECTED_CONTINUATION': "A `WebSocketError` with `code` set to `'EXPECTED_CONTINUATION'`, for the caller to throw.",
    'WebSocketError.UNEXPECTED_CONTINUATION': "A `WebSocketError` with `code` set to `'UNEXPECTED_CONTINUATION'`, for the caller to throw.",
    'WebSocketError.UNEXPECTED_CONTROL': "A `WebSocketError` with `code` set to `'UNEXPECTED_CONTROL'`, for the caller to throw.",
    'WebSocketError.INVALID_ENCODING': "A `WebSocketError` with `code` set to `'INVALID_ENCODING'`, for the caller to throw.",
    'WebSocketError.INVALID_UPGRADE_HEADER': "A `WebSocketError` with `code` set to `'INVALID_UPGRADE_HEADER'`, for the caller to throw.",
    'WebSocketError.INVALID_VERSION_HEADER': "A `WebSocketError` with `code` set to `'INVALID_VERSION_HEADER'`, for the caller to throw.",
    'WebSocketError.INVALID_KEY_HEADER': "A `WebSocketError` with `code` set to `'INVALID_KEY_HEADER'`, for the caller to throw.",
    'WebSocketError.INVALID_ACCEPT_HEADER': "A `WebSocketError` with `code` set to `'INVALID_ACCEPT_HEADER'`, for the caller to throw.",
    'WebSocketError.INVALID_OPCODE': "A `WebSocketError` with `code` set to `'INVALID_OPCODE'`, for the caller to throw.",
    'WebSocketError.INVALID_PAYLOAD_LENGTH': "A `WebSocketError` with `code` set to `'INVALID_PAYLOAD_LENGTH'`, for the caller to throw.",
    'WebSocketError.INCOMPLETE_FRAME': "A `WebSocketError` with `code` set to `'INCOMPLETE_FRAME'` and `status` set to `length`, for the caller to throw.",
  },
  throws: {
    'Socket.ping': ['`NOT_CONNECTED` — the socket has not finished connecting.'],
    'Socket.pong': ['`NOT_CONNECTED` — the socket has not finished connecting.'],
  },
};

export default layout;
