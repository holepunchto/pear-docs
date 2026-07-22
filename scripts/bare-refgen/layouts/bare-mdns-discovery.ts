// scripts/bare-refgen/layouts/bare-mdns-discovery.ts
// Editorial layout for bare-mdns-discovery: param/returns prose grounded in the
// upstream README and index.js. `query`'s `type` default (`TYPE.PTR`) and
// `discover`'s `timeout` (`10000`) / `first` handling are read from the
// method signatures and bodies in index.js. The EventEmitter overloads
// (on/once/off/emit) are left to their typed signatures. No documented throws.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'MDNS.constructor': {
      opts: 'Options; see [`MDNSOptions`](#mdnsoptions).',
    },
    'MDNS.query': {
      name: "The DNS name to query for, e.g. `'_http._tcp.local'`.",
      type: 'The DNS record type to request (default `TYPE.PTR`).',
    },
    'Discovery.constructor': {
      opts: 'Options; see [`DiscoveryOptions`](#discoveryoptions).',
    },
    'Discovery.discover': {
      opts: 'Options: `timeout` is how long, in milliseconds, to keep querying before resolving (default `10000`); set `first` to resolve as soon as the first service is found instead of waiting out the timeout.',
    },
  },
  returns: {
    'Discovery.discover': 'The discovered `Service` objects — a single-element array when `opts.first` resolved early.',
  },
};

export default layout;
