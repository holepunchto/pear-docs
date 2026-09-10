// scripts/resolve-upstream-commits-config.ts
//
// One-time (re-run only when the watched module list changes, not daily)
// resolver for scripts/upstream-commits.json — the config
// scripts/check-upstream-commits.ts polls every day.
//
// For each watched repo, determines:
//   - its real default branch (fetched from the GitHub API, never assumed —
//     some holepunchto repos use `main`, and assuming wrong silently tracks
//     nothing)
//   - the single most-authoritative "source of truth" file to watch,
//     PRIORITIZING a shipped `.d.ts` when one exists (mirrors
//     scripts/bare-refgen/fetch.ts's `resolveEntryDts` candidate order:
//     exports["."].types/.typings, pkg.types, pkg.typings, main's .d.ts
//     sibling, index.d.ts), falling back to the actual entry JS file for
//     repos that ship no declarations at all (bare-cli's bin/bare.js, the
//     12 building-blocks/helpers repos, Pear's cmd/index.js).
//
// Every candidate is VERIFIED to exist via the GitHub Contents API before
// being written — no path is guessed and left unverified, unlike hand-typing
// 80+ file paths would risk.
//
// Sources for the watched-repo list itself:
//   - The 3 Bare platform axes: hand-specified (already fully known, see
//     scripts/gen-bare-docs-states.ts).
//   - 70 bare-refgen modules: generated/bare-refs/<name>/api-model.json's
//     cached `repoUrl` (already resolved once at generation time).
//   - 12 building-blocks/helpers modules: scripts/refgen/repos.ts (already
//     the single source of truth for that pipeline's org/repo mapping).
//   - Pear itself: holepunchto/pear, cmd/index.js (no .d.ts).
//
// Usage: npx tsx scripts/resolve-upstream-commits-config.ts

import fs from 'node:fs';
import path from 'node:path';
import { REPOS as REFGEN_REPOS } from './refgen/repos';

const root = path.resolve(import.meta.dirname, '..');
const OUT_PATH = path.join(root, 'scripts/upstream-commits.json');
const BARE_REFS_DIR = path.join(root, 'generated/bare-refs');

function apiHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'pear-docs-upstream-commits-resolver',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function api<T>(pathname: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: apiHeaders('application/vnd.github+json'),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${pathname}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function defaultBranch(repo: string): Promise<string> {
  const info = await api<{ default_branch: string }>(`/repos/${repo}`);
  if (!info) throw new Error(`Repo not found: ${repo}`);
  return info.default_branch;
}

async function fileExists(repo: string, branch: string, file: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${file}?ref=${encodeURIComponent(branch)}`,
    { headers: apiHeaders('application/vnd.github+json') },
  );
  return res.ok;
}

interface PkgJson {
  types?: string;
  typings?: string;
  main?: string;
  exports?: unknown;
}

/** Mirrors scripts/bare-refgen/fetch.ts's findTypesInExports, on a fetched (not local) package.json. */
function findTypesInExports(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  for (const key of ['types', 'typings']) {
    if (typeof obj[key] === 'string') return obj[key] as string;
  }
  const dot = obj['.'];
  if (dot !== undefined) {
    const inDot = findTypesInExports(dot);
    if (inDot) return inDot;
  }
  for (const value of Object.values(obj)) {
    const found = findTypesInExports(value);
    if (found) return found;
  }
  return null;
}

/** Resolve + VERIFY a repo's shipped .d.ts entry, or null if it ships none. */
async function resolveDtsEntry(repo: string, branch: string): Promise<string | null> {
  const pkg = await api<PkgJson>(`/repos/${repo}/contents/package.json?ref=${branch}`);
  // Contents API base64-encodes file content under `content` when fetched with
  // the default Accept — re-fetch raw since `api()` above expects JSON shape.
  const raw = await fetch(
    `https://api.github.com/repos/${repo}/contents/package.json?ref=${branch}`,
    { headers: apiHeaders('application/vnd.github.raw') },
  );
  if (!raw.ok) return null;
  const parsed = JSON.parse(await raw.text()) as PkgJson;

  const candidates = [
    findTypesInExports(parsed.exports),
    parsed.types ?? null,
    parsed.typings ?? null,
    parsed.main ? parsed.main.replace(/\.[cm]?js$/, '.d.ts') : null,
    'index.d.ts',
  ].filter((c): c is string => !!c);

  for (const candidate of candidates) {
    const rel = candidate.replace(/^\.\//, '');
    if (await fileExists(repo, branch, rel)) return rel;
  }
  return null;
}

interface CommitWatchEntry {
  key: string;
  name: string;
  repo: string;
  branch: string;
  /** The single file whose commit history is authoritative for "did this surface change." */
  file: string;
  /** True when `file` is a shipped .d.ts (prioritized signal) vs. a fallback source file. */
  dts: boolean;
}

async function resolvePlatformAxes(): Promise<CommitWatchEntry[]> {
  const bareBranch = await defaultBranch('holepunchto/bare');
  const kitBranch = await defaultBranch('holepunchto/react-native-bare-kit');
  return [
    { key: 'bare-cli', name: 'Bare CLI', repo: 'holepunchto/bare', branch: bareBranch, file: 'bin/bare.js', dts: false },
    { key: 'bare-runtime', name: 'Bare runtime API', repo: 'holepunchto/bare', branch: bareBranch, file: 'npm/index.d.ts', dts: true },
    { key: 'bare-kit', name: 'Bare Kit', repo: 'holepunchto/react-native-bare-kit', branch: kitBranch, file: 'index.d.ts', dts: true },
  ];
}

async function resolveBareRefgenModules(): Promise<CommitWatchEntry[]> {
  const dirs = fs
    .readdirSync(BARE_REFS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const out: CommitWatchEntry[] = [];
  for (const name of dirs) {
    const modelPath = path.join(BARE_REFS_DIR, name, 'api-model.json');
    if (!fs.existsSync(modelPath)) continue;
    const model = JSON.parse(fs.readFileSync(modelPath, 'utf8')) as { repoUrl?: string };
    if (!model.repoUrl) {
      console.warn(`  ⚠ ${name}: no cached repoUrl, skipping`);
      continue;
    }
    const repo = model.repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    try {
      const branch = await defaultBranch(repo);
      const dts = await resolveDtsEntry(repo, branch);
      if (!dts) {
        console.warn(`  ⚠ ${name} (${repo}): no .d.ts resolved, skipping`);
        continue;
      }
      out.push({ key: `bare-module:${name}`, name, repo, branch, file: dts, dts: true });
      console.log(`  ✓ ${name} -> ${repo}@${branch}:${dts}`);
    } catch (err) {
      console.warn(`  ⚠ ${name} (${repo}): ${err instanceof Error ? err.message : err}`);
    }
  }
  return out;
}

async function resolveRefgenModules(): Promise<CommitWatchEntry[]> {
  const out: CommitWatchEntry[] = [];
  for (const [slug, cfg] of Object.entries(REFGEN_REPOS)) {
    const repo = `${cfg.org}/${cfg.repo}`;
    try {
      const branch = cfg.branch ?? (await defaultBranch(repo));
      // These repos ship no .d.ts (pure-JS, AST-extracted) — package.json's
      // `main` is the closest thing to an authoritative entry file.
      const raw = await fetch(
        `https://api.github.com/repos/${repo}/contents/package.json?ref=${branch}`,
        { headers: apiHeaders('application/vnd.github.raw') },
      );
      const pkg = raw.ok ? (JSON.parse(await raw.text()) as PkgJson) : {};
      const candidate = (pkg.main ?? 'index.js').replace(/^\.\//, '');
      const exists = await fileExists(repo, branch, candidate);
      const file = exists ? candidate : 'index.js';
      out.push({ key: `building-block:${slug}`, name: slug, repo, branch, file, dts: false });
      console.log(`  ✓ ${slug} -> ${repo}@${branch}:${file}`);
    } catch (err) {
      console.warn(`  ⚠ ${slug} (${repo}): ${err instanceof Error ? err.message : err}`);
    }
  }
  return out;
}

async function resolvePear(): Promise<CommitWatchEntry[]> {
  const branch = await defaultBranch('holepunchto/pear');
  return [{ key: 'pear-cli', name: 'Pear CLI', repo: 'holepunchto/pear', branch, file: 'cmd/index.js', dts: false }];
}

async function main(): Promise<void> {
  console.log('🔍 Resolving platform axes...');
  const platform = await resolvePlatformAxes();

  console.log('🔍 Resolving 70 bare-refgen module repos (this makes ~2-3 API calls per module)...');
  const bareModules = await resolveBareRefgenModules();

  console.log('🔍 Resolving 12 building-blocks/helpers repos...');
  const refgenModules = await resolveRefgenModules();

  console.log('🔍 Resolving Pear...');
  const pear = await resolvePear();

  const entries = [...platform, ...bareModules, ...refgenModules, ...pear];

  const out = {
    $generated:
      'by scripts/resolve-upstream-commits-config.ts — re-run only when the watched module list changes, not daily. Consumed by scripts/check-upstream-commits.ts.',
    entries,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`\n✅ Wrote ${path.relative(root, OUT_PATH)} (${entries.length} watched entries).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
