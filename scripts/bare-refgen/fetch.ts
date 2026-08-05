// scripts/bare-refgen/fetch.ts
//
// Fetch a published module's TypeScript declarations without installing it:
// `npm pack` the tarball, extract it, and resolve the package's declaration
// entry point. Reads only what the package actually ships to consumers — the
// real public contract.

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, rename, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const execFile = promisify(execFileCb);

export interface FetchedPackage {
  name: string;
  version: string;
  description: string | null;
  repoUrl: string | null;
  minBare: string | null;
  native: boolean;
  /** Absolute path to the extracted `package/` directory. */
  pkgDir: string;
  /** Absolute path to the resolved entry `.d.ts`, or null if none is shipped. */
  entryDts: string | null;
  /** Additional published entry points that ship declarations. */
  subpaths: { name: string; dts: string }[];
  /** Call to delete the temp checkout when done. */
  cleanup: () => Promise<void>;
}

interface Pkg {
  name?: string;
  version?: string;
  description?: string;
  types?: string;
  typings?: string;
  main?: string;
  exports?: unknown;
  engines?: Record<string, string> | null;
  addon?: boolean | null;
  repository?: string | { url?: string } | null;
  dependencies?: Record<string, string> | null;
}

/** Depth-first search for a `types`/`typings` condition inside an exports map. */
function findTypesInExports(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  for (const key of ['types', 'typings']) {
    if (typeof obj[key] === 'string') return obj[key] as string;
  }
  // Prefer the "." subpath, then any nested condition object.
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

/** Resolve the declaration entry from package.json fields, with fallbacks. */
function resolveEntryDts(pkgDir: string, pkg: Pkg): string | null {
  const candidates: (string | null)[] = [
    findTypesInExports(pkg.exports),
    pkg.types ?? null,
    pkg.typings ?? null,
    // `.d.ts` sibling of main (foo.js -> foo.d.ts), then index.d.ts.
    pkg.main ? pkg.main.replace(/\.[cm]?js$/, '.d.ts') : null,
    'index.d.ts',
  ];
  for (const rel of candidates) {
    if (!rel) continue;
    const abs = resolve(pkgDir, rel);
    if (existsSync(abs)) return abs;
  }
  return null;
}

/**
 * Additional entry points from the `exports` map (e.g. `./promises`, `./web`)
 * that ship their own declarations. The main "." entry and the `./package`
 * helper are excluded.
 */
function resolveSubpaths(pkgDir: string, pkg: Pkg, name: string): { name: string; dts: string }[] {
  const exp = pkg.exports;
  if (!exp || typeof exp !== 'object') return [];
  const out: { name: string; dts: string }[] = [];
  for (const [subpath, node] of Object.entries(exp as Record<string, unknown>)) {
    if (subpath === '.' || subpath === './package' || !subpath.startsWith('./')) continue;
    const rel = findTypesInExports(node);
    if (!rel) continue;
    const abs = resolve(pkgDir, rel);
    if (!existsSync(abs)) continue;
    out.push({ name: `${name}/${subpath.slice(2)}`, dts: abs });
  }
  return out;
}

function repoUrlOf(pkg: Pkg): string | null {
  const r = pkg.repository;
  const raw = typeof r === 'string' ? r : r?.url ?? null;
  if (!raw) return null;
  return raw
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');
}

// ---- dependency vendoring -------------------------------------------------
//
// Bare `.d.ts` files routinely import types from sibling `bare-*` packages
// (`bare-events`, `bare-stream`, …), but `fetchPackage` only ever extracts the
// ONE requested tarball — no `node_modules`, so those imports can't resolve
// and the checker silently drops anything that depends on them (inherited
// interface members via `extends`, symbols reached through a resolved alias,
// …). Below, each fetched package's `bare-*` dependencies (recursively) are
// npm-packed into a shared, run-scoped cache and symlinked into place. This
// is a declarations-only concern — nothing here is ever executed — so a
// deduped `npm pack` extraction stands in for a real `npm install`.

let sharedDepCacheDir: string | null = null;
const depCache = new Map<string, string | null>();
const depClosureLinked = new Set<string>();

async function depCacheRoot(): Promise<string> {
  if (!sharedDepCacheDir) sharedDepCacheDir = await mkdtemp(join(tmpdir(), 'bare-refgen-deps-'));
  return sharedDepCacheDir;
}

/** Delete the shared dependency cache. Call once, after the whole run finishes. */
export async function cleanupDepCache(): Promise<void> {
  if (sharedDepCacheDir) await rm(sharedDepCacheDir, { recursive: true, force: true });
  sharedDepCacheDir = null;
  depCache.clear();
  depClosureLinked.clear();
}

/** `npm pack` + extract a single dependency into the shared cache, deduped by name. */
async function vendorDep(name: string): Promise<string | null> {
  if (depCache.has(name)) return depCache.get(name)!;
  const root = await depCacheRoot();
  const dest = join(root, name);
  let result: string | null = dest;
  if (!existsSync(dest)) {
    const tmp = join(root, `.extract-${name}`);
    try {
      await mkdir(tmp, { recursive: true });
      const { stdout } = await execFile(
        'npm',
        ['pack', name, '--json', '--pack-destination', tmp],
        { maxBuffer: 64 * 1024 * 1024 },
      );
      const meta = JSON.parse(stdout) as Array<{ filename: string }>;
      await execFile('tar', ['xzf', join(tmp, meta[0].filename), '-C', tmp]);
      await rename(join(tmp, 'package'), dest);
    } catch {
      result = null; // no .d.ts shipped, fetch failed, etc — leave unresolved, same as today
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }
  depCache.set(name, result);
  return result;
}

/**
 * Symlink a package's `bare-*` dependencies into its `node_modules`, and
 * recurse into each dependency's own `bare-*` dependencies (deduped via
 * `depClosureLinked`, so a widely-used base package's own closure is only
 * walked once per run, however many dependents it has).
 */
async function linkBareDeps(pkgDir: string, pkg: Pkg): Promise<void> {
  const deps = Object.keys(pkg.dependencies ?? {}).filter((d) => d.startsWith('bare-'));
  if (deps.length === 0) return;
  const nodeModules = join(pkgDir, 'node_modules');
  await mkdir(nodeModules, { recursive: true });
  for (const dep of deps) {
    const link = join(nodeModules, dep);
    if (!existsSync(link)) {
      const depDir = await vendorDep(dep);
      if (!depDir) continue;
      try {
        await symlink(depDir, link, 'dir');
      } catch {
        continue;
      }
    }
    if (depClosureLinked.has(dep)) continue;
    depClosureLinked.add(dep);
    try {
      const depDir = await vendorDep(dep);
      if (!depDir) continue;
      const depPkg = JSON.parse(await readFile(join(depDir, 'package.json'), 'utf8')) as Pkg;
      await linkBareDeps(depDir, depPkg);
    } catch {
      // malformed package.json in a vendored dep — leave its own deps unresolved
    }
  }
}

export async function fetchPackage(name: string): Promise<FetchedPackage> {
  const dir = await mkdtemp(join(tmpdir(), `bare-refgen-${name}-`));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    const { stdout } = await execFile(
      'npm',
      ['pack', name, '--json', '--pack-destination', dir],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const meta = JSON.parse(stdout) as Array<{ filename: string }>;
    const tgz = join(dir, meta[0].filename);
    await execFile('tar', ['xzf', tgz, '-C', dir]);

    const pkgDir = join(dir, 'package');
    const pkg = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8')) as Pkg;
    await linkBareDeps(pkgDir, pkg);

    return {
      name: pkg.name ?? name,
      version: pkg.version ?? '0.0.0',
      description: pkg.description ?? null,
      repoUrl: repoUrlOf(pkg),
      minBare: pkg.engines?.bare ?? null,
      native: pkg.addon === true,
      pkgDir,
      entryDts: resolveEntryDts(pkgDir, pkg),
      subpaths: resolveSubpaths(pkgDir, pkg, pkg.name ?? name),
      cleanup,
    };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
