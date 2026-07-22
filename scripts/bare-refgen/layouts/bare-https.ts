// scripts/bare-refgen/layouts/bare-https.ts
//
// Editorial layout for bare-https. The upstream README has no API section, so
// prose is derived from index.js and lib/*.js (holepunchto/bare-https): the
// `agent` default is read off lib/client-request.js (`opts.agent === false ?
// new HTTPSAgent() : opts.agent || HTTPSAgent.global`), and the listener
// wiring off lib/server.js. Not invented.
//
// Grouping: left as `groups: []` — the default per-container grouping already
// matches the API shape.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    createServer: {
      opts: 'Server options: TLS socket options (e.g. `cert`, `key`) plus `bare-http1` server connection options.',
      onrequest: "Added as a `'request'` listener.",
    },
    'HTTPSServer.constructor': {
      opts: 'Server options: TLS socket options (e.g. `cert`, `key`) plus `bare-http1` server connection options.',
      onrequest: "Added as a `'request'` listener.",
    },
    request: {
      url: 'The URL to request, as a `URL` object or a URL string.',
      opts: '`bare-http1` client request options; `agent` defaults to `globalAgent`, or pass `agent: false` to use a fresh `HTTPSAgent`.',
      onresponse: "Added as a one-time `'response'` listener.",
    },
    'HTTPSClientRequest.constructor': {
      opts: '`bare-http1` client request options; `agent` defaults to `HTTPSAgent.global`, or pass `agent: false` to use a fresh `HTTPSAgent`.',
      onresponse: "Added as a one-time `'response'` listener.",
    },
    'HTTPSAgent.createConnection': {
      opts: 'Options for the underlying TCP connection and its TLS wrapper.',
    },
  },
};

export default layout;
