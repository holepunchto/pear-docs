// scripts/bare-refgen/layouts/bare-semver.ts
//
// Editorial layout for bare-semver. Facts (signatures, types) come from the
// .d.ts; prose here is transcribed/derived from the upstream README and
// lib/*.js implementation (holepunchto/bare-semver), not invented.
//
// Grouping: left as `groups: []` deliberately. The module's real surface is
// three classes (Version, Comparator, Range) plus one function (satisfies),
// one errors namespace, and one constants object — the default per-container
// grouping (errors / Version / Comparator / Range / Functions / Constants and
// variables) already keeps each class's constructor, properties, and methods
// together. Forcing a thematic split (for example "Parsing", "Comparison", "Range
// matching") would separate `Version.parse` from `Version.major`/`compare`
// under the same class, which reads worse than the current class-based
// layout for this particular API shape.
//
// NOTE on a model-level key collision (see also: session report): the
// instance method `Version#compare(version): boolean` and the static
// namespace function `Version.compare(a, b): number` are both assigned the
// model key `"Version.compare"` by extract.ts's `buildExport()` (the `key`
// formula at extract.ts ~L332-336 doesn't fork on `isStatic` the way
// `displayName` does). Because `own()` resolves a member's override by
// checking `e.key` before `e.name`, any layout entry keyed `"Version.compare"`
// would be picked up by BOTH members, clobbering the instance method's entry
// with content meant for the static one (or vice versa). To avoid that, the
// instance method is targeted below by its bare name `"compare"` (safe, since
// the static function's own name is `"Version.compare"`, not `"compare"`),
// and the static `Version.compare(a, b): number` function is left
// undocumented here — it cannot be safely targeted through this layout
// system until the key collision is fixed at the source.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  // `Range.parse` already has a real .d.ts-sourced description (comparison
  // operators, partial versions, logical OR) — describe() only falls back to
  // layout prose when the .d.ts has none, so the additional range syntaxes
  // below can't be appended there. seeAlso is the only free-text slot left.
  seeAlso: [
    'Beyond comparison operators, `Range.parse()` also supports caret ranges (`^1.2.3`), tilde ranges (`~1.2.3` or `~>1.2.3`), X-ranges and wildcards (`1.2.x`, `1.*`, `*`), and hyphen ranges (`1.2.3 - 2.3.4`).',
    "It's pure JavaScript and underpins Bare's module/addon resolution.",
    '[`bare-module-resolve`](/reference/bare/modules/bare-module-resolve) — uses semver ranges during resolution.',
  ],
  params: {
    'errors.INVALID_RANGE': {
      msg: 'The error message.',
      fn: 'Optional function to omit from the top of the generated stack trace, passed to `Error.captureStackTrace`.',
    },
    'errors.INVALID_VERSION': {
      msg: 'The error message.',
      fn: 'Optional function to omit from the top of the generated stack trace, passed to `Error.captureStackTrace`.',
    },
    'Version.constructor': {
      major: 'The major version number.',
      minor: 'The minor version number.',
      patch: 'The patch version number.',
      opts: 'Optional `prerelease` and `build` tag arrays; each defaults to an empty array.',
    },
    // Targets the instance method only — see the key-collision note above.
    compare: {
      version: 'The version to compare against.',
    },
    'Version.parse': {
      input: 'The version string to parse.',
    },
    'Comparator.constructor': {
      operator: 'One of the `constants` operator values (`EQ`, `LT`, `LTE`, `GT`, `GTE`).',
      version: 'The version the comparator matches against.',
    },
    'Comparator.test': {
      version: 'The version to test against the comparator.',
    },
    'Range.constructor': {
      comparators:
        'Two-dimensional array of comparator sets: the outer array is a union (OR) of inner arrays, each an intersection (AND); defaults to an empty range that matches nothing.',
    },
    'Range.parse': {
      input: 'The range string to parse.',
    },
    'Range.test': {
      version: 'The version to test against the range.',
    },
    satisfies: {
      version: 'The version to test, or a version string to parse.',
      range: 'The range to test against, or a range string to parse.',
    },
  },
  returns: {
    satisfies: '`true` if `version` matches `range`, `false` otherwise.',
    'errors.INVALID_RANGE': "A `SemVerError` with `code` set to `'INVALID_RANGE'`, for the caller to throw.",
    'errors.INVALID_VERSION': "A `SemVerError` with `code` set to `'INVALID_VERSION'`, for the caller to throw.",
    'Comparator.test': "`true` if `version` satisfies the comparator's operator and version, `false` otherwise.",
    'Range.test': '`true` if `version` satisfies any comparator set in the range, `false` otherwise.',
  },
  throws: {
    'Version.parse': ['`INVALID_VERSION` — `input` is not a valid version string.'],
    'Range.parse': [
      '`INVALID_VERSION` — `input` is not valid range syntax (reported via the `INVALID_VERSION` code — `INVALID_RANGE` is not currently thrown by the parser).',
    ],
    satisfies: ['`INVALID_VERSION` — `version` or `range` is a string that fails to parse.'],
  },
};

export default layout;
