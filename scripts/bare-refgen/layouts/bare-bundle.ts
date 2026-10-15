// scripts/bare-refgen/layouts/bare-bundle.ts
// Editorial layout for bare-bundle: param/returns/throws prose grounded in the
// upstream index.js and lib/errors.js (holepunchto/bare-bundle, main branch).
// The upstream README documents only the on-disk bundle format, so option
// defaults are quoted from destructuring defaults in index.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'Bundle.constructor': {
      opts: 'Options; `File` defaults to `MemoryFile`.',
    },
    'Bundle.from': {
      value: 'The serialized bundle string or buffer to parse, or an existing `Bundle`.',
    },
    'Bundle.isBundle': {
      value: 'The value to check.',
    },
    'Bundle.exists': {
      key: 'The key of the file to look up.',
    },
    'Bundle.mode': {
      key: 'The key of the file to look up.',
    },
    'Bundle.read': {
      key: 'The key of the file to read.',
    },
    'Bundle.write': {
      key: 'The key (path) to store the file under.',
      data: 'The file contents.',
      opts: 'Options; `main`, `addon`, `asset`, and `executable` default to `false`, and `alias` and `imports` to unset.',
    },
    'Bundle.mount': {
      root: 'The base URL (or URL string) to resolve keys and specifiers against.',
      opts: 'Options; `conditions` maps import-map condition names to per-condition roots.',
    },
    'Bundle.unmount': {
      root: 'The base URL (or URL string) to make keys and specifiers relative to.',
      opts: 'Options; `conditions` maps import-map condition names to per-condition roots.',
    },
    'Bundle.toBuffer': {
      opts: 'Options; `indent` defaults to `0` and `shared` to `false`.',
    },
    'MemoryFile.constructor': {
      data: 'The file contents; a string is converted to a `Buffer`.',
      opts: 'Options; `mode` defaults to `0o755` when `executable` is `true`, otherwise `0o644`.',
    },
  },
  returns: {
    'Bundle.from': 'The parsed `Bundle`, or `value` itself if it is already a `Bundle`.',
    'Bundle.isBundle': '`true` if `value` is a `Bundle` instance or exposes the bundle kind symbol, `false` otherwise.',
    'Bundle.empty': '`true` if the bundle contains no files, `false` otherwise.',
    'Bundle.exists': '`true` if a file exists at `key`, `false` otherwise.',
    'Bundle.write': 'The bundle itself, for chaining writes.',
    'Bundle.mount': 'A new `Bundle` with rewritten keys; the original bundle is left unchanged.',
    'Bundle.unmount': 'A new `Bundle` with rewritten keys; the original bundle is left unchanged.',
  },
  throws: {
    'Bundle.from': ['`INVALID_BUNDLE_HEADER` — the serialized header is not valid JSON.'],
    'Bundle.write': ['`TypeError` — `key` is not a string.'],
  },
};

export default layout;
