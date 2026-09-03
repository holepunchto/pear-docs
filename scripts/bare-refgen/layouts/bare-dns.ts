// scripts/bare-refgen/layouts/bare-dns.ts
//
// Editorial layout for bare-dns. The upstream README has no API section, so
// prose is derived from index.js / binding.c (holepunchto/bare-dns): `lookup`
// wraps uv_getaddrinfo, and the `resolve*` family queries the DNS protocol via
// c-ares. Defaults (`family: 0`, `all: false`) are read off the destructuring
// in index.js. Not invented.
//
// 2.2.0 filled in the rest of the resolution API and ships TSDoc on `cancel`,
// `destroy`, and `reverse` in index.d.ts, which the generator picks up on its
// own — those do not need entries here.
//
// Grouping: left as `groups: []` — the default per-container grouping
// (dns namespace / DNSResolver / Types) already matches the API shape.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'dns.lookup': {
      hostname: 'The host name to resolve.',
      cb: 'Called with `(err, address, family)`, or `(err, addresses)` when `all: true`.',
    },
    'DNSResolver.resolveTxt': {
      hostname: 'The host name to query TXT records for.',
      cb: 'Called with `(err, records)`; each record is an array of the strings it is made of.',
    },
  },
};

export default layout;
