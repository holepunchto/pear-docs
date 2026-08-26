// scripts/bare-refgen/layouts/bare-module-resolve.ts
//
// Editorial layout for bare-module-resolve. The .d.ts's `declare namespace
// resolve { ... }` block (module, url, preresolved, package, packageSelf,
// packageExports, packageImports, packageImportsExports, packageTarget,
// builtinTarget, file, directory, constants, Resolver, and several
// supporting type aliases) now extracts as members of `resolve` as of the
// extract.ts/render.ts fix that recovers a function's namespace-merge
// statics — see docs/plans/bare-refs/handover-2026-08-05.md §14. None carry
// upstream JSDoc, and the old page never documented them individually either
// (just listed the names and pointed at the README for signatures) — same
// treatment kept here in `seeAlso` rather than fabricated per-function prose.
// groups is intentionally left empty: the default kind-based headings
// (Functions / Types) already read cleanly and a custom grouping would add
// ceremony without benefit.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  seeAlso: [
    "The algorithm's steps are exposed on `resolve` for fine-grained use (`resolve.module`, `resolve.url`, `resolve.preresolved`, `resolve.deferred`, `resolve.package`, `resolve.packageSelf`, `resolve.packageExports`, `resolve.packageImports`, `resolve.packageImportsExports`, `resolve.packageTarget`, `resolve.builtinTarget`, `resolve.file`, and `resolve.directory`); they're subject to change between minor releases; if using them directly, specify a tilde range (for example `~1.2.3`) when declaring the module dependency. See the [repository README](https://github.com/holepunchto/bare-module-resolve) for each step's signature and options.",
    'A low-level building block. Most applications resolve modules implicitly through the [runtime](/reference/bare/runtime) or bundle with [`bare-pack`](/reference/modules/bare-modules); reach for this directly only when implementing tooling.',
    'Paired with [`bare-addon-resolve`](/reference/bare/modules/bare-addon-resolve) — the matching algorithm for native addons — and used by [`bare-module-traverse`](/reference/bare/modules/bare-module-traverse) to walk a whole module graph.',
  ],
  // Grounded in the existing `resolve` TSDoc (bare-module-resolve.describe.json)
  // and, for the ModuleResolveError factories, in the message text each call
  // site in index.js actually constructs (lib/errors.js just forwards `msg`
  // into `Error`, so the generic phrasing mirrors the sibling bare-addon-resolve
  // layout rather than restating the source's literal template strings, which
  // are already summarized under `throws` below).
  params: {
    resolve: {
      specifier: 'The module specifier to resolve, relative to `parentURL`.',
      parentURL: 'The WHATWG `URL` that `specifier` is resolved against.',
      readPackage:
        'Called with the `URL` of each package manifest to read; must return the parsed JSON manifest if it exists, or `null`. Returning a promise disables synchronous iteration.',
    },
    'ModuleResolveError.INVALID_MODULE_SPECIFIER': { msg: 'The error message.' },
    'ModuleResolveError.INVALID_PACKAGE_TARGET': { msg: 'The error message.' },
    'ModuleResolveError.PACKAGE_IMPORT_NOT_DEFINED': { msg: 'The error message.' },
    'ModuleResolveError.PACKAGE_PATH_NOT_EXPORTED': { msg: 'The error message.' },
    'ModuleResolveError.UNSUPPORTED_ENGINE': { msg: 'The error message.' },
  },
  // `resolve`'s failure-mode verified directly in index.js: the generator only
  // ever yields confirmed/candidate resolutions or returns a numeric status
  // (UNRESOLVED/YIELDED/RESOLVED/CYCLIC) — an unresolvable specifier is never
  // signalled by `null` or a thrown error, only by the iterable simply ending.
  returns: {
    resolve:
      'Yields each candidate resolution `URL` in the order the algorithm tries them, for the caller to test (for example check it exists); if none resolve, iteration simply ends without yielding further values — it does not throw or return `null` for an unresolved specifier.',
    'ModuleResolveError.INVALID_MODULE_SPECIFIER':
      'A new `ModuleResolveError` with code `INVALID_MODULE_SPECIFIER`.',
    'ModuleResolveError.INVALID_PACKAGE_TARGET':
      'A new `ModuleResolveError` with code `INVALID_PACKAGE_TARGET`.',
    'ModuleResolveError.PACKAGE_IMPORT_NOT_DEFINED':
      'A new `ModuleResolveError` with code `PACKAGE_IMPORT_NOT_DEFINED`.',
    'ModuleResolveError.PACKAGE_PATH_NOT_EXPORTED':
      'A new `ModuleResolveError` with code `PACKAGE_PATH_NOT_EXPORTED`.',
    'ModuleResolveError.UNSUPPORTED_ENGINE':
      'A new `ModuleResolveError` with code `UNSUPPORTED_ENGINE`.',
  },
  // None of these are yet `@throws`-tagged upstream. Grounded in the call sites
  // in index.js (not in the README, which doesn't document error conditions).
  // All 5 codes can propagate out of the top-level `resolve()` since it drives
  // `module()`, which transitively reaches `url`, `package`, `packageImports`,
  // `packageExports`, `packageTarget`, and `validateEngines`.
  throws: {
    resolve: [
      "`INVALID_MODULE_SPECIFIER` — the specifier (or a `node:`-protocol target) is not a valid module or package specifier: empty, a scoped package name missing the `/`, invalid characters, a relative-style `node:` specifier, an unmatched internal `#import` specifier, or a `file:` path containing an encoded `/` or `\\`.",
      "`INVALID_PACKAGE_TARGET` — a string target in a package's `\"exports\"` (or non-internal `\"imports\"`) map does not start with `./`.",
      "`PACKAGE_PATH_NOT_EXPORTED` — the requested subpath is not defined by the package's `\"exports\"` map.",
      "`PACKAGE_IMPORT_NOT_DEFINED` — an internal `#specifier` is not defined by the package's `\"imports\"` map.",
      "`UNSUPPORTED_ENGINE` — the package's `\"engines\"` requirement is not satisfied by the corresponding `opts.engines` entry.",
    ],
  },
};

export default layout;
