// scripts/bare-cli-surface.ts
//
// Extracts the documented CLI surface from holepunchto/bare's `bin/bare.js`.
//
// Same rationale as scripts/pear-cli-surface.ts, and the same DSL: `bin/bare.js`
// declares its surface with the same `paparam` combinators Pear's `cmd/index.js`
// uses (`command()`, `flag()`, `arg()`, `rest()`), so it can be read
// structurally rather than by diffing text. Deliberately a SEMANTIC extract
// rather than a file hash — a hash would call any reformat, comment edit or
// import reorder a new doc-state and spawn an entry documenting nothing.
//
// Simpler than pear-cli-surface.ts in one respect: `bare` declares exactly ONE
// flat command (no subcommands), so there is no parent/child nesting to
// resolve and no path-keying needed. It also uses `description()` where Pear's
// commands use `summary()`, and has a `rest('[...args]', …)` combinator Pear's
// CLI surface doesn't use.
//
// Consumed by scripts/gen-bare-docs-states.ts.

/** The whole (single, flat) `bare` command surface. */
export interface CliSurface {
  description: string;
  flags: string[];
  args: string[];
  rest: string[];
}

/**
 * Read the surface out of `bin/bare.js` source.
 *
 * `flag()`/`arg()`/`rest()` calls anywhere in the file are collected — safe
 * here because the file declares a single command with no nested `command()`
 * calls to accidentally sweep in (unlike Pear's `cmd/index.js`, where a naive
 * scan would credit a parent with its children's flags).
 */
export function extractCliSurface(src: string): CliSurface {
  const flags = [...src.matchAll(/\bflag\(\s*'([^']+)'/g)].map((f) => f[1]);
  const args = [...src.matchAll(/\barg\(\s*'([^']+)'/g)].map((a) => a[1]);
  const rest = [...src.matchAll(/\brest\(\s*'([^']+)'/g)].map((r) => r[1]);
  const description = /\bdescription\(\s*'([^']*)'/.exec(src)?.[1] ?? '';

  return {
    description,
    flags: [...new Set(flags)].sort(),
    args: [...new Set(args)].sort(),
    rest: [...new Set(rest)].sort(),
  };
}

/**
 * ASCII unit separator, written as an escape so this file stays plain TEXT.
 * See scripts/pear-cli-surface.ts for why a raw control character is avoided.
 */
const FIELD_SEP = '';

/**
 * Stable string for a surface, so two tags can be compared for equality.
 * Never persisted — only ever compared with another fingerprint from the same
 * run, so the exact format is free to change.
 */
export function fingerprintSurface(surface: CliSurface): string {
  return [
    surface.description,
    surface.flags.join('|'),
    surface.args.join('|'),
    surface.rest.join('|'),
  ].join(FIELD_SEP);
}

export interface SurfaceDelta {
  added: string[];
  removed: string[];
  changed: string[];
}

/** Human-readable difference between two surfaces, for review output. */
export function diffSurfaces(before: CliSurface, after: CliSurface): SurfaceDelta {
  const delta: SurfaceDelta = { added: [], removed: [], changed: [] };

  for (const f of after.flags.filter((f) => !before.flags.includes(f))) {
    delta.added.push(`bare ${f}`);
  }
  for (const f of before.flags.filter((f) => !after.flags.includes(f))) {
    delta.removed.push(`bare ${f}`);
  }
  for (const a of after.args.filter((a) => !before.args.includes(a))) {
    delta.added.push(`bare ${a}`);
  }
  for (const a of before.args.filter((a) => !after.args.includes(a))) {
    delta.removed.push(`bare ${a}`);
  }
  for (const r of after.rest.filter((r) => !before.rest.includes(r))) {
    delta.added.push(`bare ${r}`);
  }
  for (const r of before.rest.filter((r) => !after.rest.includes(r))) {
    delta.removed.push(`bare ${r}`);
  }
  if (before.description !== after.description) delta.changed.push('bare (description)');

  return delta;
}
