// scripts/gen-docs-states.ts
//
// Phase 3 of the docs versioning plan: derive the platform doc-state list by
// comparing Pear's CLI surface between tags, instead of maintaining it by hand.
//
// Pear ships roughly every two weeks. Listing every release in the version
// dropdown would mean ~26 entries a year, most of them documenting an identical
// CLI reference. A "doc-state" is a release that actually CHANGED the documented
// surface; releases in between collapse into the doc-state they belong to
// (design §1.1). Real example, both verified against upstream: v3.0.0 and v3.0.1
// have byte-identical command surfaces and are one doc-state, and v3.2.0-rc.0
// changes nothing versus v3.1.0 — so it earns no entry at all.
//
// Writes `src/lib/docs-states.json`, which `src/lib/docs-versions.ts` reads. The
// file is COMMITTED, so a clean checkout builds with no network.
//
// Usage:
//   npx tsx scripts/gen-docs-states.ts            # regenerate and write
//   npx tsx scripts/gen-docs-states.ts --check    # fail if stale; writes NOTHING
//
// `--check` genuinely does not write, unlike `gen-curated.ts --check`, which
// rewrites five files despite its name (see PHASE-2 spec §9).
//
// Auth: set GITHUB_TOKEN to lift the anonymous rate limit (required in CI).
// Stdlib-only on purpose: CI cannot `npm install` this repo's token-gated
// dependencies, so the workflow installs just `tsx` (see docs-lint.yml).

import fs from 'node:fs';
import path from 'node:path';
import {
  extractCliSurface,
  fingerprintSurface,
  diffSurfaces,
  type CliSurface,
} from './pear-cli-surface';

const root = path.resolve(import.meta.dirname, '..');
const OUT_PATH = path.join(root, 'src/lib/docs-states.json');

const REPO = 'holepunchto/pear';
const SURFACE_FILE = 'cmd/index.js';
/** Requirement 1: every 3.x from 3.0.0. Bump when a Pear 4 line begins. */
const MAJOR = 3;

interface DocState {
  /** Dropdown text. Minor granularity where that is unambiguous (design §7 #5). */
  label: string;
  /** Compared by `compareVersions`; the release that introduced this surface. */
  value: string;
  /** Exactly one: the doc-state the latest stable release belongs to. */
  stable?: boolean;
  /** Badge it; only set when a prerelease surface differs from stable. */
  prerelease?: boolean;
  /** Every release sharing this surface, oldest first. Review aid. */
  releases: string[];
  /** What changed versus the previous doc-state. Review aid. */
  delta: string[];
}

function apiHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'pear-docs-docstate-generator',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function api<T>(pathname: string): Promise<T> {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: apiHeaders('application/vnd.github+json'),
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${pathname}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Raw file contents at a tag. */
async function fetchSurfaceFile(tag: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${SURFACE_FILE}?ref=${encodeURIComponent(tag)}`,
    { headers: apiHeaders('application/vnd.github.raw') },
  );
  if (!res.ok) {
    throw new Error(`Cannot read ${SURFACE_FILE} at ${tag}: ${res.status}`);
  }
  return res.text();
}

interface ParsedTag {
  tag: string;
  version: string;
  parts: [number, number, number];
  prerelease: string | null;
}

/** `v3.1.0-rc.1` -> parts + prerelease, or null when not a MAJOR.x release. */
function parseTag(tag: string): ParsedTag | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(tag);
  if (!m) return null;
  const parts: [number, number, number] = [+m[1], +m[2], +m[3]];
  if (parts[0] !== MAJOR) return null;
  return { tag, version: `${parts[0]}.${parts[1]}.${parts[2]}`, parts, prerelease: m[4] ?? null };
}

function compareParsed(a: ParsedTag, b: ParsedTag): number {
  for (let i = 0; i < 3; i++) {
    if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  }
  // A prerelease sorts before its own final release.
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  return (a.prerelease ?? '').localeCompare(b.prerelease ?? '');
}

async function listTags(): Promise<ParsedTag[]> {
  const raw = await api<{ name: string }[]>(`/repos/${REPO}/tags?per_page=100`);
  return raw
    .map((t) => parseTag(t.name))
    .filter((t): t is ParsedTag => t !== null)
    .sort(compareParsed);
}

/**
 * Assign labels at minor granularity, falling back to the full version.
 *
 * Decision 5 wants "3.1", not "3.1.0" — but that only works while each minor
 * holds ONE doc-state. If a patch release changes the surface (3.1.0 and 3.1.4
 * both being doc-states), two entries would claim the label "3.1" and the
 * dropdown could not tell them apart, so both take their full version instead.
 */
function assignLabels(states: DocState[]): void {
  const minorOf = (v: string) => v.split('.').slice(0, 2).join('.');
  const counts = new Map<string, number>();
  for (const s of states) counts.set(minorOf(s.value), (counts.get(minorOf(s.value)) ?? 0) + 1);
  for (const s of states) {
    s.label = counts.get(minorOf(s.value)) === 1 ? minorOf(s.value) : s.value;
  }
}

async function buildDocStates(): Promise<DocState[]> {
  const tags = await listTags();
  const stable = tags.filter((t) => !t.prerelease);
  if (stable.length === 0) throw new Error(`No stable ${MAJOR}.x tags found on ${REPO}`);

  const surfaces = new Map<string, CliSurface>();
  const surfaceOf = async (t: ParsedTag) => {
    if (!surfaces.has(t.tag)) {
      surfaces.set(t.tag, extractCliSurface(await fetchSurfaceFile(t.tag)));
    }
    return surfaces.get(t.tag)!;
  };

  const states: DocState[] = [];
  let lastFingerprint: string | null = null;
  let lastSurface: CliSurface | null = null;

  for (const tag of stable) {
    const surface = await surfaceOf(tag);
    const fingerprint = fingerprintSurface(surface);

    if (fingerprint === lastFingerprint) {
      // Same documented surface: fold into the doc-state already open.
      states[states.length - 1].releases.push(tag.version);
      continue;
    }

    const delta = lastSurface ? diffSurfaces(lastSurface, surface) : null;
    states.push({
      label: '', // assigned once every state is known
      value: tag.version,
      releases: [tag.version],
      delta: delta ? [...delta.added.map((d) => `+ ${d}`), ...delta.removed.map((d) => `- ${d}`), ...delta.changed.map((d) => `~ ${d}`)] : ['initial surface'],
    });
    lastFingerprint = fingerprint;
    lastSurface = surface;
  }

  // The newest stable release's doc-state is the canonical one.
  states[states.length - 1].stable = true;

  // A prerelease earns an entry only if it documents something the newest stable
  // does not. v3.2.0-rc.0 is the live counter-example: identical surface to
  // v3.1.0, so listing it would offer readers a version that reads the same.
  const newestPre = tags.filter((t) => t.prerelease).at(-1);
  if (newestPre && compareParsed(newestPre, stable[stable.length - 1]) > 0) {
    const preSurface = await surfaceOf(newestPre);
    if (fingerprintSurface(preSurface) !== lastFingerprint) {
      const delta = diffSurfaces(lastSurface!, preSurface);
      states.push({
        label: '',
        value: newestPre.version,
        prerelease: true,
        releases: [newestPre.tag],
        delta: [
          ...delta.added.map((d) => `+ ${d}`),
          ...delta.removed.map((d) => `- ${d}`),
          ...delta.changed.map((d) => `~ ${d}`),
        ],
      });
    }
  }

  assignLabels(states);
  // Newest first, matching how the list reads in the dropdown.
  return states.reverse();
}

function serialize(states: DocState[]): string {
  return `${JSON.stringify(
    {
      $generated: `by scripts/gen-docs-states.ts from ${REPO}:${SURFACE_FILE} — run \`npm run gen:docs-states\` to refresh`,
      states,
    },
    null,
    2,
  )}\n`;
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  console.log(
    `🔍 Deriving Pear ${MAJOR}.x doc-states from ${REPO}:${SURFACE_FILE}...\n`,
  );

  const states = await buildDocStates();
  const next = serialize(states);

  for (const s of states) {
    const badges = [s.stable && 'stable', s.prerelease && 'prerelease']
      .filter(Boolean)
      .join(', ');
    console.log(`  ${s.label.padEnd(8)} ${s.value}${badges ? `  (${badges})` : ''}`);
    console.log(`    releases: ${s.releases.join(', ')}`);
    for (const d of s.delta) console.log(`    ${d}`);
  }
  console.log('');

  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : '';

  if (current === next) {
    console.log(`✅ ${path.relative(root, OUT_PATH)} is up to date.`);
    return;
  }

  if (check) {
    // Report only. Writing here would make the check pass on its own next run
    // and silently absorb an upstream change nobody reviewed.
    console.error(
      `❌ ${path.relative(root, OUT_PATH)} is stale — Pear's CLI surface has changed.\n` +
        `   Run \`npm run gen:docs-states\` and review the diff: a new doc-state means\n` +
        `   the reference pages need <VersionSection> / <Since> markers for the delta above.`,
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(OUT_PATH, next);
  console.log(`✅ Wrote ${path.relative(root, OUT_PATH)} (${states.length} doc-state(s)).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
