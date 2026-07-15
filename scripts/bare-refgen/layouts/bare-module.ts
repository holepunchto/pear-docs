// scripts/bare-refgen/layouts/bare-module.ts
// Editorial layout for bare-module: param/returns/throws prose grounded in the
// upstream README, index.d.ts/lib/protocol.d.ts, lib/module.js, and
// lib/errors.js. Static Module methods and ModuleProtocol methods are keyed
// qualified (Module.resolve, ModuleProtocol.resolve) so the same member name
// on the two classes stays distinct. Throw codes are the ModuleError factories
// reached from lib/module.js (MODULE_NOT_FOUND / ASSET_NOT_FOUND from the tail
// of resolve()/asset(), TYPE_INCOMPATIBLE from a cached type mismatch in
// load()); the resolve()/asset() guard clauses also throw a plain TypeError
// for a non-string specifier.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Module.constructor': {
      url: 'The WHATWG `URL` identifying the module.',
    },
    'Module.resolve': {
      specifier: 'The module specifier to resolve.',
      parentURL: 'The WHATWG `URL` to resolve `specifier` relative to.',
      opts: 'Resolution options.',
    },
    'Module.asset': {
      specifier: 'The asset specifier to resolve.',
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
        'Protocol method overrides; any of `preresolve`, `postresolve`, `resolve`, `exists`, `read`, `addon`, or `asset`.',
      context: 'An existing protocol to fall back to for any method not provided in `methods`.',
    },
    'ModuleProtocol.preresolve': {
      specifier: 'The module specifier being resolved.',
      parentURL: 'The `URL` the specifier is resolved relative to.',
    },
    'ModuleProtocol.postresolve': {
      url: 'The resolved `URL` to post-process.',
    },
    'ModuleProtocol.resolve': {
      specifier: 'The module specifier to resolve.',
      parentURL: 'The `URL` to resolve `specifier` relative to.',
      imports: 'The `"imports"` map to apply during resolution.',
    },
    'ModuleProtocol.exists': {
      url: 'The `URL` to check for existence.',
      type: 'The module type being probed (see `Module.constants.types`).',
    },
    'ModuleProtocol.read': {
      url: 'The `URL` to read.',
    },
    'ModuleProtocol.addon': {
      url: 'The resolved addon `URL` to post-process.',
    },
    'ModuleProtocol.asset': {
      url: 'The resolved asset `URL` to post-process.',
    },
    'ModuleProtocol.extend': {
      methods: 'Protocol method overrides for the new protocol.',
    },
  },
  returns: {
    'Module.resolve': 'The WHATWG `URL` that `specifier` resolves to.',
    'Module.asset': 'The WHATWG `URL` of the resolved asset.',
    'Module.load': 'The loaded `Module`, reusing the cached instance if `url` was already loaded.',
    'Module.createRequire':
      'A `require()` bound to `parentURL`, with `main`, `cache`, `resolve`, `addon`, and `asset` attached.',
    'ModuleProtocol.preresolve': 'The (possibly rewritten) specifier to pass into the resolve algorithm.',
    'ModuleProtocol.postresolve': 'The (possibly transformed) resolved `URL`.',
    'ModuleProtocol.read': 'The source of `url` as a `Buffer` or `string`, or `null` if it does not exist.',
    'ModuleProtocol.extend':
      'A new `ModuleProtocol` that uses this protocol as its context, with `methods` overriding.',
  },
  throws: {
    'Module.resolve': [
      '`MODULE_NOT_FOUND` — no module matching `specifier` could be found relative to `parentURL`.',
      '`TypeError` — `specifier` is not a string.',
    ],
    'Module.asset': [
      '`ASSET_NOT_FOUND` — no asset matching `specifier` could be found relative to `parentURL`.',
      '`TypeError` — `specifier` is not a string.',
    ],
    'Module.load': [
      '`TYPE_INCOMPATIBLE` — a module is already cached for `url` with a type incompatible with the requested `type`.',
    ],
  },
};

export default layout;
