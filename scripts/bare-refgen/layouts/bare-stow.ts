// scripts/bare-refgen/layouts/bare-stow.ts
// Editorial layout for bare-stow: param/returns/throws prose grounded in the
// upstream README and index.js / lib/{protocol,host}.js. The `stow()` argument
// validation (`'target' is required`, `'out' is required`, unsupported host)
// is read from index.js; those are plain `Error`s (no error code), so the
// throws bullets are prose-only. Covers the main entry point plus the
// `bare-stow/protocol` and `bare-stow/host` subpaths.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    stow: {
      entry: 'The entry module to bundle, as a `file:` URL or path string.',
      target: 'The bundling target: a `Target` object, or a target name resolved to one (the built-in `bare-sidecar` and `bare-worker`, or a `bare-stow-target-<name>` package).',
      out: 'The path to write the harness to, as a `file:` URL or path string; the bundle is written alongside it.',
      opts: 'Options; see [`StowOptions`](#stowoptions).',
    },
    'StowOptions.resolveTarget': {
      name: 'The target name to resolve to a `Target`.',
    },
    'StowOptions.resolveRPC': {
      name: 'The RPC name to resolve to an `RPC`.',
    },
    'Target.generate': {
      context: 'The target context describing the bundle to embed and the RPC wiring to splice in.',
    },
    'RPC.generate': {
      context: 'The RPC context describing the identifiers, module system, and role to generate wiring for.',
    },
    'Protocol.constructor': {
      stream: 'The underlying duplex byte stream to multiplex the control and user-data channels over.',
    },
    'Protocol.send': {
      type: "The control frame type, for example `'ready'`, `'exit'`, `'error'`, or `'terminate'`.",
      payload: 'An optional JSON-serializable payload carried with the frame.',
    },
    attach: {
      stream: 'Any duplex byte stream to attach the protocol to.',
    },
    'IPC.constructor': {
      stream: "The host side of a stowed bundle's transport (any duplex byte stream).",
    },
    wrap: {
      stream: "The host side of a stowed bundle's transport (any duplex byte stream).",
    },
  },
  returns: {
    stow: "An async generator that yields each written artifact's `url` as it is produced — the harness first, then the bundle, then any offloaded addon or asset files.",
    attach: 'A `Protocol` multiplexing control and user-data frames over `stream`.',
    wrap: 'An `IPC` handle wrapping `stream`, with the `ready` promise and `terminate()` layered on top of `Protocol`.',
    'IPC.terminate': "The worker's exit `code` once it exits.",
  },
  throws: {
    stow: [
      'The `target` argument is missing.',
      'The `out` argument is missing.',
      'A host in `opts.hosts` is not supported by the resolved target.',
    ],
  },
};

export default layout;
