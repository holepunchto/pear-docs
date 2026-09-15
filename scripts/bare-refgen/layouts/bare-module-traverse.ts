// scripts/bare-refgen/layouts/bare-module-traverse.ts
// Editorial layout for bare-module-traverse: param/returns prose grounded in
// the upstream README and index.js. The `traverse` callbacks map directly to
// the generator's yield kinds (module to read, module to probe, resolution to
// transform, prefix to list); probeModule/resolveModule default to
// `defaultProbeModule` (undefined) and `defaultResolveModule` (identity) in
// index.js. The resolve subpath functions (default/bare/node, exported as
// `resolve` under their own subpaths) share one signature.
//
// The `traverse.*` step generators (addons, assets, constants, imports,
// link, module, package, preresolved, Traversal) now extract as members of
// `traverse` as of the extract.ts/render.ts fix that recovers a function's
// namespace-merge statics — see
// docs/plans/bare-refs/handover-2026-08-05.md §14. None carry upstream
// JSDoc, and the old page never documented them individually either (just
// listed the names and their versioning caveat) — same treatment kept here
// in `seeAlso` rather than fabricated per-function prose.

import type { Layout } from '../layout';

const resolverParams = {
  entry: 'The import to resolve, as produced by `bare-module-lexer`.',
  parentURL: 'The WHATWG `URL` to resolve `entry` relative to.',
  opts: 'Resolve options forwarded to the underlying resolution algorithm.',
};

const layout: Layout = {
  seeAlso: [
    "It's the engine behind [`bare-pack`](/reference/modules/bare-modules) — a low-level building block; use `bare-pack` to produce a bundle, and reach for this directly only when building tooling on top of the graph.",
    'The step generators exposed on `traverse` (`traverse.module`, `traverse.package`, `traverse.preresolved`, `traverse.imports`, `traverse.addons`, and `traverse.assets`) are subject to change between minor releases; if using them directly, specify a tilde range (for example `~1.2.3`) when declaring the dependency. See the [repository README](https://github.com/holepunchto/bare-module-traverse) for each step generator.',
  ],
  params: {
    traverse: {
      entry: 'The WHATWG `URL` of the entry module to root the graph at.',
      readModule:
        'Called with the `URL` of each module to read; returns its source as a `Buffer` or `string`, or `null` if it does not exist. Returning a promise disables synchronous iteration.',
      listPrefix:
        'Called with the `URL` of each prefix to list; must yield the `URL`s that have it as a prefix. If omitted, prefixes are not traversed.',
      probeModule:
        'Called with the `URL` of each module to probe for existence; returns a boolean, or `undefined` to fall back to `readModule`.',
      resolveModule:
        'Called with each resolution `URL` to transform; returns the `URL` to use in its place. Defaults to the identity function.',
    },
    default: resolverParams,
    bare: resolverParams,
    node: resolverParams,
    resolve: resolverParams,
  },
  returns: {
    traverse:
      'An iterable of resolved `Dependency` records for the module graph; asynchronous when any callback returns a promise.',
    default: 'A `Resolver` that yields the candidate resolutions for `entry`.',
    bare: 'A `Resolver` that yields the candidate resolutions for `entry`.',
    node: 'A `Resolver` that yields the candidate resolutions for `entry`.',
    resolve: 'A `Resolver` that yields the candidate resolutions for `entry`.',
  },
};

export default layout;
