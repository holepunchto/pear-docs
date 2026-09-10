// scripts/bare-refgen/layouts/bare-addon-resolve.ts
// Editorial layout for bare-addon-resolve. `resolve.*` step-function
// descriptions are grounded directly in their bodies in index.js (holepunchto/
// bare-addon-resolve, main branch) — these carry no upstream JSDoc, only the
// top-level `resolve` does. `resolve.linked`'s ahead-of-time-linking framing
// and the `darwin`/`ios` platform check are read from `platformArtefact()`
// (index.js) and its use of `opts.linkedProtocol`/`linked:`.
//
// `resolve`'s own `@returns` TSDoc is real (from the chore/ts-doc branch
// preference, §9 of the branch handover), so a `returns.resolve` layout
// override is silently ignored (fallback-only semantics — same limitation
// as `describe`). The "first candidate that exists as a file" rule that
// TSDoc doesn't state is added via `seeAlso` instead.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  seeAlso: [
    'The resolved addon is the first candidate `resolve` yields that exists as a file on the file system.',
    'The `resolve.*` step functions are subject to change between minor releases; if using them directly, specify a tilde range (for example `~1.10.0`) when declaring the module dependency.',
    "Addons normally resolve through the [runtime](/reference/bare/runtime) or are bundled by [`bare-pack`](/reference/modules/bare-modules); reach for this module directly only when building tooling on the resolution algorithm itself, such as [`bare-module-traverse`](/reference/bare/modules/bare-module-traverse).",
  ],
  params: {
    resolve: {
      specifier: 'The module specifier to resolve.',
      parentURL: 'The URL to resolve `specifier` relative to.',
      readPackage:
        'Called with the URL of each package manifest encountered; must return the parsed manifest or `null`. Returning a promise disables synchronous iteration.',
    },
    'resolve.addon': {
      specifier: 'The addon specifier to resolve.',
      parentURL: 'The URL to resolve `specifier` relative to.',
      opts: 'Options; see [`ResolveOptions`](#resolveoptions).',
    },
    'resolve.url': {
      specifier: 'An absolute URL specifier.',
      parentURL: 'Unused; accepted for a consistent step-function signature.',
      opts: 'Options; see [`ResolveOptions`](#resolveoptions).',
    },
    'resolve.package': {
      packageSpecifier: 'The package name to resolve the addon within.',
      packageVersion: 'The package version, if the specifier carried one, else `null`.',
      parentURL: 'The URL to resolve the package from.',
      opts: 'Options; see [`ResolveOptions`](#resolveoptions).',
    },
    'resolve.packageSelf': {
      packageName: "The package's own name, matched against each candidate scope's manifest.",
      packageSubpath: 'The addon subpath to resolve within the matching package.',
      packageVersion: 'The package version, if the specifier carried one, else `null`.',
      parentURL: "A URL within the package's own scope to search upward from.",
      opts: 'Options; see [`ResolveOptions`](#resolveoptions).',
    },
    'resolve.file': {
      filename: 'The file addon candidate, without an extension.',
      parentURL: 'The URL to resolve `filename` relative to.',
      opts: 'Options; `extensions` lists the candidate extensions to try, in order.',
    },
    'resolve.directory': {
      dirname: 'The prebuilds directory addon candidate.',
      version: 'The package version, if the specifier carried one, else `null`.',
      parentURL: 'The URL to resolve `dirname` relative to.',
      opts: 'Options; see [`ResolveOptions`](#resolveoptions).',
    },
    'resolve.linked': {
      name: 'The addon name to resolve to a `linked:` specifier.',
      version: 'The addon version, if any.',
      opts: "Options; `linked` must not be `false` and `hosts` (or `host`) must be set, or resolution is skipped. `linkedProtocol` overrides the `'linked:'` prefix.",
    },
    'AddonResolveError.INVALID_ADDON_SPECIFIER': {
      msg: 'The error message.',
    },
    'AddonResolveError.INVALID_PACKAGE_NAME': {
      msg: 'The error message.',
    },
  },
  describe: {
    'resolve.addon':
      'One step of the resolution algorithm, exposed for fine-grained use: resolve `specifier` as an addon — a relative or absolute specifier resolves via `resolve.file`/`resolve.directory`, otherwise via `resolve.package`.',
    'resolve.url': 'Resolve `specifier` as an absolute URL, yielding it as a single candidate.',
    'resolve.package':
      'Resolve `packageSpecifier` (optionally `@packageVersion`) as a package name, locating the addon within it.',
    'resolve.packageSelf':
      "Resolve `packageSubpath` against the package named `packageName`, for when `parentURL` lies within that package's own scope — a package requiring its own addon by name.",
    'resolve.file': 'Resolve `filename` as a file addon candidate relative to `parentURL`, trying each of `opts.extensions` in turn.',
    'resolve.directory': 'Resolve `dirname` as a prebuilds directory addon candidate relative to `parentURL`.',
    'resolve.linked':
      "Resolve `name` to a `linked:` specifier, for runtimes that link addons ahead of time by platform (for example iOS or Android) rather than resolving a prebuild at runtime.",
    'resolve.constants': 'The generator status codes yielded by each resolution step: `UNRESOLVED`, `YIELDED`, and `RESOLVED`.',
    'resolve.Resolver': 'The shared generator type every `resolve.*` step function returns.',
  },
  returns: {
    'resolve.addon': 'A `Resolver` yielding the candidate resolutions.',
    'resolve.url': 'A `Resolver` yielding the candidate resolution.',
    'resolve.package': 'A `Resolver` yielding the candidate resolutions.',
    'resolve.packageSelf': 'A `Resolver` yielding the candidate resolutions.',
    'resolve.file': 'A `Resolver` yielding the candidate resolutions.',
    'resolve.directory': 'A `Resolver` yielding the candidate resolutions.',
    'resolve.linked': 'A `Resolver` yielding the candidate `linked:` resolutions.',
    'AddonResolveError.INVALID_ADDON_SPECIFIER':
      'A new `AddonResolveError` with code `INVALID_ADDON_SPECIFIER`.',
    'AddonResolveError.INVALID_PACKAGE_NAME':
      'A new `AddonResolveError` with code `INVALID_PACKAGE_NAME`.',
  },
  throws: {
    resolve: [
      "`INVALID_ADDON_SPECIFIER` — the addon specifier is not a valid package name or contains an invalid escape sequence.",
      "`INVALID_PACKAGE_NAME` — a package manifest's `name` field is invalid (for example contains `__`).",
    ],
  },
};

export default layout;
