// scripts/bare-model-surface.ts
//
// Fingerprint/diff a BareExport[] tree (scripts/bare-refgen/model.ts) — the
// same job scripts/bare-cli-surface.ts and scripts/pear-cli-surface.ts do for
// a paparam CLI surface, but for a TYPED surface already extracted by
// scripts/bare-refgen/extract.ts's `extractModule()`.
//
// No new AST walking here. `extractModule(entryDts)` already turns a .d.ts
// into a BareExport[] — this file only turns THAT into a comparable
// fingerprint and a human-readable delta, reused for both the `bare-runtime`
// axis (holepunchto/bare:npm/index.d.ts) and the `bare-kit` axis
// (holepunchto/react-native-bare-kit:index.d.ts). Semantic, not a hash: two
// exports compare equal when their kind/signatures/params/returns/throws
// match, regardless of description prose or JSDoc wording, so a comment-only
// .d.ts edit does not spawn a doc-state.
//
// Consumed by scripts/gen-bare-docs-states.ts.

import type { BareExport } from './bare-refgen/model';

/** One flattened member, keyed by its dotted path (`Bare.exit`, `Thread.join`). */
interface FlatMember {
  path: string;
  kind: string;
  static: boolean;
  signatures: string[];
}

/**
 * Walk the (possibly nested) export tree into a flat, dotted-path map.
 *
 * `BareExport.key` is already the fully-qualified stable identity
 * (`scripts/bare-refgen/model.ts`'s own doc: "e.g. `open`, `URL.parse`") —
 * verified directly: a `Worklet` member's key is already `Worklet.constructor`,
 * not just `constructor`. So members are NOT re-prefixed with their parent's
 * path here; doing that would double-qualify to `Worklet.Worklet.constructor`.
 * Nesting is only followed to reach every member, not to build the path.
 */
function flatten(exports: BareExport[]): Map<string, FlatMember> {
  const out = new Map<string, FlatMember>();
  for (const e of exports) {
    out.set(e.key, {
      path: e.key,
      kind: e.kind,
      static: e.static,
      signatures: [...e.signatures].sort(),
    });
    for (const [k, v] of flatten(e.members)) out.set(k, v);
  }
  return out;
}

/**
 * ASCII unit separator, written as an escape so this file stays plain TEXT —
 * see scripts/pear-cli-surface.ts for why a raw control character is avoided.
 */
const FIELD_SEP = '';

/**
 * Stable string for a surface, so two tags can be compared for equality.
 * Never persisted — only ever compared with another fingerprint from the same
 * run, so the exact format is free to change.
 */
export function fingerprintExports(exports: BareExport[]): string {
  const flat = flatten(exports);
  const sorted = [...flat.keys()].sort().map((path) => {
    const m = flat.get(path)!;
    return [m.path, m.kind, String(m.static), m.signatures.join('|')].join(FIELD_SEP);
  });
  return sorted.join('\n');
}

export interface SurfaceDelta {
  added: string[];
  removed: string[];
  changed: string[];
}

/** Human-readable difference between two surfaces, for review output. */
export function diffExports(before: BareExport[], after: BareExport[]): SurfaceDelta {
  const a = flatten(before);
  const b = flatten(after);
  const delta: SurfaceDelta = { added: [], removed: [], changed: [] };
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();

  for (const path of paths) {
    const before = a.get(path);
    const after = b.get(path);
    if (!before) {
      delta.added.push(path);
      continue;
    }
    if (!after) {
      delta.removed.push(path);
      continue;
    }
    const beforeSig = [before.kind, String(before.static), before.signatures.join('|')].join(
      FIELD_SEP,
    );
    const afterSig = [after.kind, String(after.static), after.signatures.join('|')].join(
      FIELD_SEP,
    );
    if (beforeSig !== afterSig) delta.changed.push(path);
  }

  return delta;
}
