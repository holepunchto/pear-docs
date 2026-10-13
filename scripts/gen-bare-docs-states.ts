// scripts/gen-bare-docs-states.ts
//
// Derive the doc-state list for each Bare platform page's version dropdown —
// bare-cli, bare-runtime, bare-kit — by comparing that axis's documented
// surface between real upstream tags. Same idea as the unmerged
// scripts/gen-docs-states.ts built for Pear (design doc §1.1): Bare ships far
// more often than its documented surface changes (v1.24.0 -> v1.31.0 in about
// 4 months), so a release only earns a dropdown entry when it actually changed
// what a reference page has to say.
//
// Unlike Pear's generator, this one does NOT restrict to one major line —
// there is no "every 1.x since 1.0.0" requirement here, just "the N most
// recent doc-states" (decided: N = 5). So it walks stable tags newest-first
// and stops once it has collected 5 COMPLETE surfaces, rather than scanning
// a whole major's history. "Complete" matters: see buildDocStates().
//
// Three axes, three extraction strategies:
//   bare-cli      holepunchto/bare:bin/bare.js         scripts/bare-cli-surface.ts (paparam, text)
//   bare-runtime  holepunchto/bare:npm/index.d.ts       scripts/bare-refgen/extract.ts + bare-model-surface.ts
//   bare-kit      holepunchto/react-native-bare-kit:index.d.ts   (same as bare-runtime)
//
// Writes src/lib/bare-{cli,runtime,kit}-docs-states.json — committed, so a
// clean checkout builds with no network.
//
// Usage:
//   npx tsx scripts/gen-bare-docs-states.ts            # regenerate and write
//   npx tsx scripts/gen-bare-docs-states.ts --check    # fail if stale; writes NOTHING
//
// `--check` genuinely does not write, unlike `gen-curated.ts --check` (see
// docs/plans/DOCS-VERSIONING-DESIGN.md, PHASE-2 spec §9).
//
// Auth: set GITHUB_TOKEN to lift the anonymous rate limit (required in CI).
// Stdlib + typescript only — CI cannot `npm install` this repo's token-gated
// dependencies (see docs-lint.yml), so the workflow installs `tsx` + `typescript`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareVersions } from '../src/lib/docs-versions';
import { extractModule } from './bare-refgen/extract';
import { fingerprintExports, diffExports, type SurfaceDelta } from './bare-model-surface';
import {
  extractCliSurface,
  fingerprintSurface as fingerprintCli,
  diffSurfaces as diffCli,
} from './bare-cli-surface';
import type { BareExport } from './bare-refgen/model';

const root = path.resolve(import.meta.dirname, '..');

/** How many recent doc-states each dropdown retains (decided: upper end of 2-5). */
const DOC_STATE_COUNT = 5;

/**
 * Safety cap on how many stable tags one axis may fetch before the run FAILS.
 *
 * This used to be 60 and silently truncated the walk: bare-cli's oldest
 * collected state spans ~30 releases, so 60 tags ran out before 5 states were
 * found, and every new Bare patch release pushed the oldest tag in the scan
 * out of the window. The oldest state's `value` then drifted (1.17.5 -> 1.19.0
 * -> 1.20.3) through releases that changed nothing, and the file kept calling
 * it a "5-state window" boundary although only 3 states had been found.
 *
 * The walk now runs until the window is complete or history ends, so this
 * cap is only a guard against a runaway scan (each tag is one API request),
 * and hitting it throws instead of writing a truncated window. It sits well
 * above the whole stable history of both repos (~130 tags each in 2026-09).
 */
const MAX_TAGS_SCANNED = 400;

interface AxisConfig {
  key: string;
  /** Dropdown label, matches src/lib/version-axes.ts. */
  label: string;
  repo: string;
  file: string;
  outPath: string;
}

const AXES: AxisConfig[] = [
  {
    key: 'bare-cli',
    label: 'Bare CLI version',
    repo: 'holepunchto/bare',
    file: 'bin/bare.js',
    outPath: path.join(root, 'src/lib/bare-cli-docs-states.json'),
  },
  {
    key: 'bare-runtime',
    label: 'Bare runtime version',
    repo: 'holepunchto/bare',
    file: 'npm/index.d.ts',
    outPath: path.join(root, 'src/lib/bare-runtime-docs-states.json'),
  },
  {
    key: 'bare-kit',
    label: 'Bare Kit version',
    repo: 'holepunchto/react-native-bare-kit',
    file: 'index.d.ts',
    outPath: path.join(root, 'src/lib/bare-kit-docs-states.json'),
  },
];

interface DocState {
  /** Dropdown text, minor granularity where unambiguous. */
  label: string;
  /** Compared by compareVersions; the release that introduced this surface. */
  value: string;
  /** Exactly one: the doc-state the latest stable release belongs to. */
  stable?: boolean;
  /** Every release sharing this surface, oldest first. Review aid. */
  releases: string[];
  /** What changed vs. the previous (older) surface. For the oldest state in
   *  the file, that surface is the one just outside the window. Review aid. */
  delta: string[];
}

function apiHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'pear-docs-bare-docstate-generator',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function api<T>(pathname: string): Promise<T> {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: apiHeaders('application/vnd.github+json'),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${pathname}: ${await res.text()}`);
  return (await res.json()) as T;
}

/**
 * `null` means the file did not exist at this tag — not an error. The
 * `npm/index.d.ts` packaging layout `bare-runtime` depends on is newer than
 * some of the older stable tags in the scan window (confirmed: 404 at
 * v1.23.4), so a caller walking backward through history has to be able to
 * stop there rather than crash the whole run.
 */
async function fetchFile(repo: string, file: string, tag: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${file}?ref=${encodeURIComponent(tag)}`,
    { headers: apiHeaders('application/vnd.github.raw') },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cannot read ${file} at ${tag} in ${repo}: ${res.status}`);
  return res.text();
}

interface ParsedTag {
  tag: string;
  version: string;
  parts: [number, number, number];
  prerelease: string | null;
}

/** `v1.31.0` -> parts, or null when the tag isn't a plain SemVer release tag. */
function parseTag(tag: string): ParsedTag | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(tag);
  if (!m) return null;
  const parts: [number, number, number] = [+m[1], +m[2], +m[3]];
  return { tag, version: `${parts[0]}.${parts[1]}.${parts[2]}`, parts, prerelease: m[4] ?? null };
}

function compareParsed(a: ParsedTag, b: ParsedTag): number {
  for (let i = 0; i < 3; i++) {
    if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  }
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  return (a.prerelease ?? '').localeCompare(b.prerelease ?? '');
}

/**
 * Every stable (non-prerelease) tag, newest first. Pages through the whole tag
 * list (one request per 100 tags) instead of reading only the first page:
 * both repos have more than 100 tags, and GitHub does not promise SemVer
 * order across pages, so the full list is fetched and sorted here.
 */
async function listStableTagsNewestFirst(repo: string): Promise<ParsedTag[]> {
  const raw: { name: string }[] = [];
  for (let page = 1; ; page++) {
    const batch = await api<{ name: string }[]>(`/repos/${repo}/tags?per_page=100&page=${page}`);
    raw.push(...batch);
    if (batch.length < 100) break;
  }
  return raw
    .map((t) => parseTag(t.name))
    .filter((t): t is ParsedTag => t !== null && t.prerelease === null)
    .sort((a, b) => compareParsed(b, a));
}

/**
 * Assign labels at minor granularity, falling back to the full version when
 * that would be unsafe.
 *
 * Two distinct reasons to fall back, both required:
 *
 *  1. Collision — two states share a minor (a patch-level surface change
 *     within one minor), so the minor label alone can't tell them apart.
 *  2. Round-trip safety — `check:docs-versions` caught this one for real:
 *     unlike Pear (where "requirement 1" guarantees every doc-state starts
 *     at an X.Y.0 release), a Bare doc-state can start at ANY patch — e.g.
 *     `bare`'s `--inspect-port` flag landed in 1.28.1, not 1.28.0. The
 *     dropdown selects by `label` (`dropdown.tsx`'s `<option value={v.label}>`),
 *     and `resolveVersion` maps that string back via `compareVersions(label,
 *     value) >= 0`. A minor label "1.28" against value "1.28.1" fails that
 *     comparison (`compareVersions("1.28","1.28.1") < 0`), so picking "1.28"
 *     from the dropdown would silently resolve to the WRONG (older) entry
 *     instead of erroring. Label must therefore compare EQUAL to value, not
 *     merely share a minor.
 */
function assignLabels(states: DocState[]): void {
  const minorOf = (v: string) => v.split('.').slice(0, 2).join('.');
  const counts = new Map<string, number>();
  for (const s of states) counts.set(minorOf(s.value), (counts.get(minorOf(s.value)) ?? 0) + 1);
  for (const s of states) {
    const minor = minorOf(s.value);
    const safe = counts.get(minor) === 1 && compareVersions(minor, s.value) === 0;
    s.label = safe ? minor : s.value;
  }
}

function formatDelta(d: SurfaceDelta): string[] {
  return [
    ...d.added.map((x) => `+ ${x}`),
    ...d.removed.map((x) => `- ${x}`),
    ...d.changed.map((x) => `~ ${x}`),
  ];
}

/**
 * Extract + fingerprint one axis's surface at one tag. `bare-cli` reads the
 * paparam source as text; `bare-runtime`/`bare-kit` need a real file on disk
 * for `extractModule()` (the TS Compiler API takes a path, not raw source),
 * so those are written to a throwaway temp file with a `.d.ts` extension.
 */
async function surfaceAt(
  axis: AxisConfig,
  tag: string,
  tmpDir: string,
): Promise<{ fingerprint: string; model: unknown } | null> {
  const src = await fetchFile(axis.repo, axis.file, tag);
  if (src === null) return null; // file didn't exist yet at this tag

  if (axis.key === 'bare-cli') {
    const surface = extractCliSurface(src);
    return { fingerprint: fingerprintCli(surface), model: surface };
  }

  const tmpFile = path.join(tmpDir, `${axis.key}-${tag.replace(/[^\w.-]/g, '_')}.d.ts`);
  fs.writeFileSync(tmpFile, src);
  const exports = extractModule(tmpFile);
  return { fingerprint: fingerprintExports(exports), model: exports };
}

function diffAt(axis: AxisConfig, before: unknown, after: unknown): string[] {
  if (axis.key === 'bare-cli') {
    return formatDelta(diffCli(before as Parameters<typeof diffCli>[0], after as Parameters<typeof diffCli>[1]));
  }
  return formatDelta(diffExports(before as BareExport[], after as BareExport[]));
}

async function buildDocStates(axis: AxisConfig, tmpDir: string): Promise<DocState[]> {
  const tags = await listStableTagsNewestFirst(axis.repo);
  if (tags.length === 0) throw new Error(`No stable tags found on ${axis.repo}`);

  // Walk NEWEST-FIRST, collapsing consecutive releases with an identical
  // fingerprint into the doc-state already open, and only opening a new one
  // when the surface actually changed. Unlike Pear's generator, there is no
  // "every release since some epoch" requirement here.
  //
  // The walk does NOT stop as soon as DOC_STATE_COUNT states are open: the
  // oldest one is still incomplete at that point, because older releases may
  // share its surface. Its `value` (the release that introduced the surface)
  // is only known once the walk reaches a tag whose surface differs, so the
  // walk keeps going until that tag turns up, or history ends. That tag is
  // outside the window and is not written, but its model gives the oldest
  // state a real delta. Stopping early made `value` drift: it then depended
  // on how far back the scan happened to reach, not on the surface itself.
  const statesNewestFirst: DocState[] = [];
  const modelsNewestFirst: unknown[] = []; // model for each state, aligned by index
  let currentFingerprint: string | null = null;
  /** Model of the first surface older than the window, once reached. */
  let boundaryModel: unknown = null;
  let foundBoundary = false;
  /** True when the walk stopped because the surface file predates the tag. */
  let ranOutOfHistory = false;
  let scanned = 0;

  for (const tag of tags) {
    if (++scanned > MAX_TAGS_SCANNED) {
      throw new Error(
        `${axis.label}: scanned ${MAX_TAGS_SCANNED} stable tags of ${axis.repo} without completing ` +
          `${DOC_STATE_COUNT} doc-states. Raise MAX_TAGS_SCANNED rather than writing a truncated window.`,
      );
    }

    const surface = await surfaceAt(axis, tag.tag, tmpDir);
    if (surface === null) {
      // The surface file didn't exist yet at this (older) tag — e.g.
      // holepunchto/bare's npm/index.d.ts is newer than some stable tags.
      // Stop walking further back rather than erroring the whole run; the
      // oldest state collected so far is then genuinely the first surface.
      ranOutOfHistory = true;
      break;
    }
    const { fingerprint, model } = surface;

    if (fingerprint === currentFingerprint) {
      statesNewestFirst[statesNewestFirst.length - 1].releases.push(tag.version);
      // Releases are pushed newest-first-discovered, but within a doc-state
      // they read best oldest-first — fix the order once the state closes.
      continue;
    }

    if (statesNewestFirst.length >= DOC_STATE_COUNT) {
      // A different surface below a full window: the oldest state is now
      // complete, and this tag is where the window ends.
      boundaryModel = model;
      foundBoundary = true;
      break;
    }

    statesNewestFirst.push({ label: '', value: tag.version, releases: [tag.version], delta: [] });
    modelsNewestFirst.push(model);
    currentFingerprint = fingerprint;
  }

  // Delta vs. the NEXT-OLDER surface (index+1, since this array is
  // newest-first). For the oldest state that is the boundary surface found
  // above; with no boundary, the oldest state is the first surface there is.
  for (let i = 0; i < statesNewestFirst.length; i++) {
    statesNewestFirst[i].releases.reverse();
    // `value` must be the OLDEST release in the group (the one that
    // INTRODUCED this surface), not the newest tag encountered while
    // walking backward — `resolveDocsVersion` picks "the first entry whose
    // value is <= the selected version," so a reader on, say, 1.28.5 has to
    // compare against 1.28.1 (where `--inspect-port` first appeared), not
    // 1.31.0 (merely the newest release sharing that same surface). The
    // walk assigns `value` at group-open time (the newest tag), which is
    // wrong; fix it up now that `releases` is sorted oldest-first.
    statesNewestFirst[i].value = statesNewestFirst[i].releases[0];
    if (i + 1 < statesNewestFirst.length) {
      statesNewestFirst[i].delta = diffAt(axis, modelsNewestFirst[i + 1], modelsNewestFirst[i]);
    } else if (foundBoundary) {
      statesNewestFirst[i].delta = diffAt(axis, boundaryModel, modelsNewestFirst[i]);
    } else {
      statesNewestFirst[i].delta = [
        ranOutOfHistory
          ? `oldest doc-state — ${axis.file} does not exist further back in ${axis.repo}'s history`
          : `oldest doc-state — first stable release of ${axis.repo}`,
      ];
    }
  }

  statesNewestFirst[0].stable = true;
  assignLabels(statesNewestFirst);
  return statesNewestFirst;
}

function serialize(axis: AxisConfig, states: DocState[]): string {
  return `${JSON.stringify(
    {
      $generated: `by scripts/gen-bare-docs-states.ts from ${axis.repo}:${axis.file} — run \`npm run gen:bare-docs-states\` to refresh`,
      states,
    },
    null,
    2,
  )}\n`;
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bare-docs-states-'));
  let stale = false;

  try {
    for (const axis of AXES) {
      console.log(`\n🔍 Deriving ${axis.label} doc-states from ${axis.repo}:${axis.file}...`);

      const states = await buildDocStates(axis, tmpDir);
      const next = serialize(axis, states);

      for (const s of states) {
        console.log(`  ${s.label.padEnd(10)} ${s.value}${s.stable ? '  (stable)' : ''}`);
        console.log(`    releases: ${s.releases.join(', ')}`);
        for (const d of s.delta) console.log(`    ${d}`);
      }

      const current = fs.existsSync(axis.outPath) ? fs.readFileSync(axis.outPath, 'utf8') : '';

      if (current === next) {
        console.log(`  ✅ ${path.relative(root, axis.outPath)} is up to date.`);
        continue;
      }

      if (check) {
        stale = true;
        console.error(
          `  ❌ ${path.relative(root, axis.outPath)} is stale — ${axis.label} surface has changed.\n` +
            `     Run \`npm run gen:bare-docs-states\` and review the diff: a new doc-state means\n` +
            `     content/bare/reference/bare/*.mdx needs <VersionSection>/<Since>/<Until> markers for the delta above.`,
        );
        continue;
      }

      fs.writeFileSync(axis.outPath, next);
      console.log(`  ✅ Wrote ${path.relative(root, axis.outPath)} (${states.length} doc-state(s)).`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (check && stale) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
