// scripts/bare-refgen/layouts/bare-mdns-discovery.ts
// Editorial layout for bare-mdns-discovery: param/returns prose grounded in the
// upstream README and index.js. `query`'s `type` default (`TYPE.PTR`) and
// `discover`'s `timeout` (`10000`) / `first` handling are read from the
// method signatures and bodies in index.js. The EventEmitter overloads
// (on/once/off/emit) are left to their typed signatures. No documented throws.
//
// `MDNSOptions`/`DiscoveryOptions` already carry a real `.d.ts`-sourced
// description (from the chore/ts-doc branch preference, §9 of the branch
// handover), so a `describe` override for either is silently ignored
// (fallback-only semantics). The Android `iface` failure mode/remediation
// and the `service` prefix/suffix note that TSDoc doesn't state are added
// via `seeAlso` instead.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    "Without `iface` set, Android's `addMembership` falls back to the OS default interface, which may not be the WiFi interface, so responses are silently dropped — pass the WiFi IP, for example from `bare-wifi-android`'s `getWifiIP()`.",
    "`Discovery`'s `service` option is given without the DNS prefix/suffix — `'http'` or `'googlecast'`, not `'_http._tcp.local'`.",
  ],
  params: {
    'MDNS.constructor': {
      opts: 'Options; see [`MDNSOptions`](#mdnsoptions).',
    },
    'MDNS.query': {
      name: "The DNS name to query for, for example `'_http._tcp.local'`.",
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
