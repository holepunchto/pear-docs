// scripts/pear-cli-surface.ts
//
// Extracts the documented CLI surface from holepunchto/pear's `cmd/index.js`.
//
// Why this file exists: Pear ships roughly every two weeks, but the DOCUMENTED
// surface changes far less often. Comparing surfaces between tags is what lets
// the docs collapse 26 releases a year into a handful of "doc-states" (design
// §1.1) — a release only earns a dropdown entry when it actually changed what
// the CLI reference has to say.
//
// `cmd/index.js` declares the whole surface with `paparam` combinators, so it can
// be read structurally rather than by diffing text:
//
//   const multisig = command('multisig', summary('…'),
//     command('link', flag('--vanity <vanity>', '…'), …),
//     …)
//
// Deliberately a SEMANTIC extract rather than a file hash. A hash would call any
// reformat, comment edit or import reorder a new doc-state and spawn a dropdown
// entry documenting nothing — the opposite of the point.
//
// Verified against the delta the audit recorded by hand for v3.0.1 -> v3.1.0:
// `cores` added, `touch --vanity` added, `multisig link --vanity` added, and the
// three sidecar log flags removed. Consumed by scripts/gen-docs-states.ts.

/** One command in the CLI tree, keyed by its full path (`multisig link`). */
export interface CommandSurface {
  summary: string;
  flags: string[];
  args: string[];
}

export interface CliSurface {
  commands: Record<string, CommandSurface>;
}

interface RawCommand {
  name: string;
  /** Offsets of the argument list, i.e. just inside `command(` … `)`. */
  start: number;
  end: number;
}

/** Find every `command('name', …)` call and the extent of its argument list. */
function findCommands(src: string): RawCommand[] {
  const out: RawCommand[] = [];
  // `\s*` spans newlines, because the name often sits on the line after the call.
  const re = /\bcommand\(\s*'([^']+)'/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const open = src.indexOf('(', m.index);
    let depth = 1;
    let i = open + 1;
    // Paren matching is enough here: `cmd/index.js` has no parens inside string
    // literals in these declarations, and a miscount would show up immediately
    // as a wrong command count in the generator's output.
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      i++;
    }
    out.push({ name: m[1], start: open + 1, end: i - 1 });
  }

  return out.sort((a, b) => a.start - b.start);
}

/**
 * Read the surface out of `cmd/index.js` source.
 *
 * Two things this has to get right, both learned by getting them wrong first:
 *
 *  - Commands are keyed by their FULL PATH. `pear cores` and `pear gc cores` are
 *    different commands that share a bare name, so keying on the name alone made
 *    the top-level `cores` added in 3.1.0 look like it already existed.
 *  - A parent's flags EXCLUDE its children's. `multisig`'s argument list contains
 *    the whole `multisig link` declaration, so a naive scan credited
 *    `link --vanity` to `multisig` as well and double-counted the change.
 */
export function extractCliSurface(src: string): CliSurface {
  const raw = findCommands(src);
  const commands: Record<string, CommandSurface> = {};

  for (const cmd of raw) {
    // Ancestors are the commands whose argument list encloses this one.
    const path = raw
      .filter((other) => other.start <= cmd.start && cmd.end <= other.end)
      .map((other) => other.name)
      .join(' ');

    const children = raw.filter(
      (other) => other !== cmd && cmd.start <= other.start && other.end <= cmd.end,
    );

    // Blank out nested declarations so only this command's own combinators remain.
    let body = src.slice(cmd.start, cmd.end);
    for (const child of children) {
      const from = child.start - cmd.start;
      const to = child.end - cmd.start;
      body = body.slice(0, from) + ' '.repeat(to - from) + body.slice(to);
    }

    const flags = [...body.matchAll(/\bflag\(\s*'([^']+)'/g)].map((f) => f[1]);
    const args = [...body.matchAll(/\barg\(\s*'([^']+)'/g)].map((a) => a[1]);
    const summary = /\bsummary\(\s*'([^']*)'/.exec(body)?.[1] ?? '';

    commands[path] = {
      summary,
      flags: [...new Set(flags)].sort(),
      args: [...new Set(args)].sort(),
    };
  }

  return { commands };
}

/**
 * ASCII unit separator, written as an escape so this file stays plain TEXT.
 * A raw control character in the source makes git classify the file as binary,
 * so its diffs stop being reviewable, and an invisible delimiter is unreadable.
 * A separator that cannot occur inside a flag, summary or arg is required here —
 * a space would be ambiguous, since summaries contain spaces.
 */
const FIELD_SEP = '\u001f';

/**
 * Stable string for a surface, so two tags can be compared for equality.
 *
 * Keys are sorted explicitly rather than relying on insertion order, so moving a
 * command's declaration within the file does not read as a surface change.
 *
 * Never persisted — only ever compared with another fingerprint from the same
 * run, so the exact format is free to change.
 */
export function fingerprintSurface(surface: CliSurface): string {
  const sorted = Object.keys(surface.commands)
    .sort()
    .map((name) => {
      const c = surface.commands[name];
      return [name, c.summary, c.flags.join('|'), c.args.join('|')].join(FIELD_SEP);
    });
  return sorted.join('\n');
}

export interface SurfaceDelta {
  added: string[];
  removed: string[];
  changed: string[];
}

/** Human-readable difference between two surfaces, for review output. */
export function diffSurfaces(before: CliSurface, after: CliSurface): SurfaceDelta {
  const delta: SurfaceDelta = { added: [], removed: [], changed: [] };
  const names = [
    ...new Set([...Object.keys(before.commands), ...Object.keys(after.commands)]),
  ].sort();

  for (const name of names) {
    const a = before.commands[name];
    const b = after.commands[name];
    if (!a) {
      delta.added.push(`pear ${name}`);
      continue;
    }
    if (!b) {
      delta.removed.push(`pear ${name}`);
      continue;
    }
    for (const f of b.flags.filter((f) => !a.flags.includes(f))) {
      delta.added.push(`pear ${name} ${f}`);
    }
    for (const f of a.flags.filter((f) => !b.flags.includes(f))) {
      delta.removed.push(`pear ${name} ${f}`);
    }
    if (a.summary !== b.summary) delta.changed.push(`pear ${name} (summary)`);
  }

  return delta;
}
