// scripts/bare-refgen/layouts/bare-tls.ts
// Editorial layout for bare-tls: param/throws prose grounded in the upstream
// README (main branch, pre-marker prose) and index.js/net.js/lib/errors.js.
// Option defaults quoted from the README's `options = { ... }` block; throw
// conditions read from their sites in the TLSSocket constructor.

import type { Layout } from '../layout';

// NOTE re the regression audit: `TLSSocketOptions.host`/`.ca`/`.alpnProtocols`
// already carry the old page's exact SNI/CA/ALPN prose via real .d.ts TSDoc —
// no layout override needed. The TLS server's method surface
// (listen/address/close/ref/unref) is a genuine upstream `.d.ts` gap:
// `TLSNetServer extends EventEmitter<TLSNetServerEvents>` and declares only
// `readonly listening: boolean` itself — none of those methods are typed
// anywhere in the published package (confirmed via `npm pack bare-tls`), so
// there is no member here to attach a description to.

const layout: Layout = {
  groups: [],
  params: {
    TLSSocket: {
      socket: 'The duplex stream to wrap; it handles transport while the TLS socket handles encryption and decryption.',
      opts: 'Options; `rejectUnauthorized`, `eagerOpen`, and `allowHalfOpen` default to `true`, and `readBufferSize` to `65536`.',
    },
    createServer: {
      opts: 'Options applied to each incoming socket; the same as `TLSSocket`, plus any options supported by `bare-net`.',
      onconnection: "Called on each `'connection'` event.",
    },
    createConnection: {
      opts: "Options passed to both the underlying TCP socket and `TLSSocket`; `port` is required and `host` defaults to `'localhost'`.",
      onconnect: 'Called when the connection is established.',
    },
    'errors.from': {
      err: 'The error to convert.',
    },
    'TLSError.from': {
      err: 'The error to convert.',
    },
  },
  throws: {
    TLSSocket: [
      '`TypeError` — `host` is missing for a client socket while `rejectUnauthorized` is `true`.',
      '`RangeError` — an ALPN protocol name is empty or longer than 255 bytes.',
    ],
  },
};

export default layout;
