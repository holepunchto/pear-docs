// scripts/bare-refgen/layouts/bare-module.ts
// Editorial layout for bare-module (v7): param/returns/throws prose grounded in
// the upstream README and index.d.ts/lib/protocol.d.ts/lib/loader.d.ts. Static
// Module methods and ModuleProtocol methods are keyed qualified (Module.resolve,
// ModuleProtocol.resolve) so the same member name on the two classes stays
// distinct. Throw codes are the ModuleError factories reached from
// lib/module.js (MODULE_NOT_FOUND from the tail of resolve(),
// TYPE_INCOMPATIBLE from a cached type mismatch in load()); the resolve()
// guard clause also throws a plain TypeError for a non-string specifier.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-module-resolve`](/bare/reference/bare/modules/bare-module-resolve) and [`bare-module-traverse`](/bare/reference/bare/modules/bare-module-traverse) — the resolution and traversal algorithms underneath.',
    '[Bare runtime API](/bare/reference/bare/runtime#bareaddon) — `Bare.Addon`, the native-addon loader `require.addon` builds on.',
  ],
  params: {
    'Module.constructor': {
      url: 'The WHATWG `URL` identifying the module.',
    },
    'Module.resolve': {
      specifier: 'The module specifier to resolve.',
      parentURL: 'The WHATWG `URL` to resolve `specifier` relative to.',
      opts: 'Resolution options.',
    },
    'Module.load': {
      url: 'The WHATWG `URL` of the module to load.',
      opts: 'Load options; may carry a `source` to load directly instead of reading it through the protocol.',
    },
    'Module.createRequire': {
      parentURL: 'The parent URL that the returned `require()` resolves and loads specifiers relative to.',
      opts: 'Options for the created `require()`, such as its `protocol` and `cache`.',
    },
    'ModuleProtocol.constructor': {
      methods:
        'Protocol method overrides; any of `resolve`, `resolveSync`, `exists`, `existsSync`, `read`, `readSync`, `list`, or `listSync`.',
      context: 'An existing protocol to fall back to for any method not provided in `methods`.',
    },
    'ModuleProtocol.resolve': {
      url: 'The `URL` to resolve.',
    },
    'ModuleProtocol.exists': {
      url: 'The `URL` to check for existence.',
    },
    'ModuleProtocol.read': {
      url: 'The `URL` to read.',
    },
    'ModuleProtocol.extend': {
      methods: 'Protocol method overrides for the new protocol.',
    },
  },
  returns: {
    'Module.resolve': 'The WHATWG `URL` that `specifier` resolves to.',
    'Module.load': 'The loaded `Module`, reusing the cached instance if `url` was already loaded.',
    'Module.createRequire':
      'A `require()` bound to `parentURL`, with `main`, `cache`, `resolve`, `addon`, and `asset` attached.',
    'ModuleProtocol.resolve':
      'The resolved `URL`. A promise must not be returned during synchronous linking.',
    'ModuleProtocol.exists': 'Whether `url` exists. The default implementation returns `false`.',
    'ModuleProtocol.read': 'The source of `url` as a `Buffer` or `string`, or `null` if it does not exist.',
    'ModuleProtocol.extend':
      'A new `ModuleProtocol` that uses this protocol as its context, with `methods` overriding.',
  },
  throws: {
    'Module.resolve': [
      '`MODULE_NOT_FOUND` — no module matching `specifier` could be found relative to `parentURL`.',
      '`TypeError` — `specifier` is not a string.',
    ],
    'Module.load': [
      '`TYPE_INCOMPATIBLE` — a module is already cached for `url` with a type incompatible with the requested `type`.',
    ],
  },
};

export default layout;
