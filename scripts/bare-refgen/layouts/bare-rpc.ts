// scripts/bare-refgen/layouts/bare-rpc.ts
// Editorial layout for bare-rpc: param/returns/throws prose grounded in the
// README, index.d.ts and the lib/*.js implementation.
//
// NOTE: incoming and outgoing requests share method NAMES (`reply`,
// `createRequestStream`, `createResponseStream`, `send`) with INVERTED
// semantics — e.g. `RPCIncomingRequest.reply` sends the reply while
// `RPCOutgoingRequest.reply` awaits it, and the request/response stream
// direction flips (Readable vs Writable) between the two. Keys are therefore
// kept fully qualified so each twin gets its own prose. Member descriptions
// live in bare-rpc.describe.json.
//
// Error codes (`ALREADY_SENT`, `ALREADY_RECEIVED`) are read from the synchronous
// throw sites in lib/outgoing-request.js, lib/incoming-request.js and
// lib/outgoing-event.js; `CHANNEL_CLOSED` surfaces as a promise rejection from
// `RPCOutgoingRequest.reply` on teardown (captured in its returns prose), not a
// synchronous throw, so it is not listed under Throws.

import type { Layout } from '../layout';

const sendParams = {
  data: 'The payload to send: a `Buffer`, or a string encoded using `encoding`. Omit to send no data.',
  encoding: 'The encoding used when `data` is a string (defaults to `utf8`).',
};

const readableOpts = {
  opts: 'Options for the returned [`Readable`](https://github.com/mafintosh/streamx#readable-stream) stream.',
};
const writableOpts = {
  opts: 'Options for the returned [`Writable`](https://github.com/mafintosh/streamx#writable-stream) stream.',
};

const layout: Layout = {
  params: {
    'RPC.constructor': {
      stream: 'The duplex stream to frame RPC messages over, such as a pipe or socket.',
      onrequest:
        'Callback run for each incoming request or event, receiving an `RPCIncomingRequest` (or `RPCIncomingEvent`) to inspect and `reply()` to. Defaults to a no-op.',
    },
    'RPC.request': {
      command:
        'A unique number identifying the request; the remote end differentiates requests by it.',
    },
    'RPC.event': {
      command:
        'A unique number identifying the event; the remote end differentiates events by it.',
    },
    'RPCOutgoingRequest.send': sendParams,
    'RPCOutgoingRequest.reply': {
      encoding:
        'If given, decodes the reply payload to a string using this encoding; omit to receive the raw `Buffer`.',
    },
    'RPCOutgoingRequest.createRequestStream': writableOpts,
    'RPCOutgoingRequest.createResponseStream': readableOpts,
    'RPCIncomingRequest.reply': sendParams,
    'RPCIncomingRequest.createRequestStream': readableOpts,
    'RPCIncomingRequest.createResponseStream': writableOpts,
    'RPCOutgoingEvent.send': sendParams,
    'RPCIncomingEvent.constructor': {
      rpc: 'The `RPC` instance the event arrived on.',
      command: 'The command number the event was sent with.',
      data: 'The payload buffer sent with the event.',
    },
    'RPCOutgoingEvent.constructor': {
      rpc: 'The `RPC` instance to send the event on.',
      command: 'The command number to send.',
    },
    'RPCIncomingRequest.constructor': {
      rpc: 'The `RPC` instance the request arrived on.',
      id: 'The request id, used to correlate the reply with the request.',
      command: 'The command number the request was sent with.',
      data: 'The payload buffer sent with the request.',
    },
    'RPCOutgoingRequest.constructor': {
      rpc: 'The `RPC` instance to send the request on.',
      id: 'The request id, used to correlate the reply with the request.',
      command: 'The command number to send.',
    },
    'RPCIncomingStream.constructor': {
      rpc: 'The `RPC` instance the stream belongs to.',
      request: 'The request the stream carries data for.',
      type: 'Whether the stream carries the request body (`constants.type.REQUEST`) or the response body (`constants.type.RESPONSE`).',
      opts: 'Options for the underlying [`Readable`](https://github.com/mafintosh/streamx#readable-stream) stream.',
    },
    'RPCOutgoingStream.constructor': {
      rpc: 'The `RPC` instance the stream belongs to.',
      request: 'The request the stream carries data for.',
      type: 'Whether the stream carries the request body (`constants.type.REQUEST`) or the response body (`constants.type.RESPONSE`).',
      opts: 'Options for the underlying [`Writable`](https://github.com/mafintosh/streamx#writable-stream) stream.',
    },
  },
  returns: {
    'RPC.request':
      'an `RPCOutgoingRequest`; call `send()` on it to dispatch the request and `await reply()` for the response.',
    'RPC.event': 'an `RPCOutgoingEvent`; call `send()` on it to dispatch the one-way event.',
    'RPCOutgoingRequest.reply':
      "a promise that resolves with the remote end's reply payload, or rejects with the channel's teardown error if it closes before a reply arrives.",
  },
  throws: {
    'RPCOutgoingRequest.send': ['`ALREADY_SENT` — the request has already been sent.'],
    'RPCOutgoingRequest.reply': [
      '`ALREADY_RECEIVED` — a reply is already being received for this request.',
    ],
    'RPCOutgoingRequest.createRequestStream': ['`ALREADY_SENT` — the request has already been sent.'],
    'RPCOutgoingRequest.createResponseStream': [
      '`ALREADY_RECEIVED` — the response has already been received.',
    ],
    'RPCIncomingRequest.reply': ['`ALREADY_SENT` — a response has already been sent for this request.'],
    'RPCIncomingRequest.createResponseStream': [
      '`ALREADY_SENT` — a response has already been sent for this request.',
    ],
    'RPCIncomingRequest.createRequestStream': [
      '`ALREADY_RECEIVED` — the request has already been received.',
    ],
    'RPCOutgoingEvent.send': ['`ALREADY_SENT` — the event has already been sent.'],
  },
};

export default layout;
