// scripts/bare-refgen/layouts/bare-http1.ts
// Editorial layout for bare-http1: param/throws prose grounded in the module
// sources (lib/*.js; the upstream README documents no API). Defaults quoted
// from the constructor destructuring in lib/client-request.js, lib/agent.js,
// and lib/server.js; error codes read from lib/errors.js and their throw sites
// in lib/validate.js and lib/agent.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    HTTPIncomingMessage: {
      socket: 'The socket the message is read from.',
      opts: 'Initial values for `headers`, plus `method` and `url` (server side) or `statusCode` and `statusMessage` (client side).',
    },
    'HTTPIncomingMessage.getHeader': {
      name: 'The header name (case-insensitive).',
    },
    'HTTPIncomingMessage.hasHeader': {
      name: 'The header name (case-insensitive).',
    },
    'HTTPIncomingMessage.setTimeout': {
      ms: 'The socket timeout in milliseconds.',
      ontimeout: "Added as a one-time `'timeout'` listener.",
    },
    HTTPOutgoingMessage: {
      socket: 'The socket the message is written to.',
    },
    'HTTPOutgoingMessage.getHeader': {
      name: 'The header name (case-insensitive).',
    },
    'HTTPOutgoingMessage.hasHeader': {
      name: 'The header name (case-insensitive).',
    },
    'HTTPOutgoingMessage.setHeader': {
      name: 'The header name (case-insensitive); must be a valid RFC 7230 token.',
      value: 'The header value; must not contain line-terminating characters.',
    },
    'HTTPOutgoingMessage.setTimeout': {
      ms: 'The socket timeout in milliseconds.',
      ontimeout: "Added as a one-time `'timeout'` listener.",
    },
    HTTPAgent: {
      opts: "Agent options (`keepAlive`, `keepAliveMsecs`, `defaultPort`) plus TCP socket and connect options applied to each connection the agent creates.",
    },
    'HTTPAgent.addRequest': {
      req: 'The request to assign a socket to.',
      opts: 'The socket and connection options, including the destination `host` and `port`.',
    },
    'HTTPAgent.createConnection': {
      opts: 'The socket and connection options, including the destination `host` and `port`.',
    },
    'HTTPAgent.getName': {
      opts: 'The destination `host` and `port` to derive the pool key from.',
    },
    'HTTPAgent.keepSocketAlive': {
      socket: 'The socket to keep alive for reuse.',
    },
    'HTTPAgent.reuseSocket': {
      socket: 'The socket to mark as back in active use.',
      req: 'The request the socket is being reused for.',
    },
    HTTPServer: {
      opts: 'Options passed to each `HTTPServerConnection`, such as custom `IncomingMessage` and `ServerResponse` classes.',
      onrequest: "Added as a listener for the `'request'` event.",
    },
    'HTTPServer.setTimeout': {
      ms: 'The idle-socket timeout in milliseconds; `0` (the default) disables it.',
      ontimeout: "Added as a `'timeout'` listener.",
    },
    HTTPServerResponse: {
      socket: 'The socket the response is written to.',
      req: 'The request this response answers.',
    },
    'HTTPServerResponse.writeHead': {
      statusCode: 'The status code to send.',
      statusMessage: 'The reason phrase to send; defaults to the standard phrase for `statusCode`.',
      headers: 'Additional headers to merge into the response headers.',
    },
    HTTPServerConnection: {
      server: 'The server the connection belongs to.',
      socket: 'The connection socket.',
      opts: 'Custom `IncomingMessage` and `ServerResponse` classes to use for requests on the connection.',
    },
    'HTTPServerConnection.for': {
      socket: 'The socket to look up.',
    },
    HTTPClientRequest: {
      opts: "Request options; `method` defaults to `'GET'`, `path` to `'/'`, `host` to `'localhost'`, and `port` to the agent's default port (`80`). Set `agent` to choose the pooling agent, or `false` for a fresh, unpooled one.",
      onresponse: "Added as a one-time `'response'` listener.",
    },
    HTTPClientConnection: {
      socket: 'The connection socket.',
      opts: 'A custom `IncomingMessage` class to use for the response.',
    },
    'HTTPClientConnection.for': {
      socket: 'The socket to look up.',
    },
    'HTTPClientConnection.from': {
      socket: 'The socket to look up or create a connection for.',
      opts: 'Options used if a new connection is created.',
    },
    createServer: {
      opts: 'Options passed to each `HTTPServerConnection`, such as custom `IncomingMessage` and `ServerResponse` classes.',
      onrequest: "Added as a listener for the `'request'` event.",
    },
    request: {
      url: 'The URL to request, as a `URL` object or string; its host, port, and path populate the request options.',
      opts: 'Request options, merged over the values derived from `url`.',
      onresponse: "Added as a one-time `'response'` listener.",
    },
    get: {
      url: 'The URL to request, as a `URL` object or string; its host, port, and path populate the request options.',
      opts: 'Request options, merged over the values derived from `url`.',
      onresponse: "Added as a one-time `'response'` listener.",
    },
  },
  throws: {
    'HTTPOutgoingMessage.setHeader': [
      '`INVALID_HEADER_NAME` — `name` is not a valid RFC 7230 token.',
      '`INVALID_HEADER_VALUE` — `value` contains a line-terminating character.',
    ],
    'HTTPAgent.createConnection': ['`AGENT_SUSPENDED` — the agent is suspended.'],
    HTTPClientRequest: [
      '`INVALID_HEADER_NAME` — `method` or a header name is not a valid token.',
      '`INVALID_HEADER_VALUE` — `path` or a header value contains an invalid character.',
    ],
    'HTTPServerResponse.writeHead': [
      '`INVALID_HEADER_NAME` — a header name is not a valid token.',
      '`INVALID_HEADER_VALUE` — `statusMessage` or a header value contains an invalid character.',
    ],
  },
};

export default layout;
