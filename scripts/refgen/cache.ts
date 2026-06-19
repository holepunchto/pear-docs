// scripts/refgen/cache.ts
//
// Stage 0 — resolve the latest stable release and gate regeneration on it.
//
// "Latest stable" = the highest semver git tag that is NOT a pre-release. We read
// it over the network with `git ls-remote` (no clone) so the gate is cheap. The
// resolved commit SHA is compared against a committed manifest; if unchanged we
// skip the whole pipeline for that repo. `--force` bypasses the gate.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RepoConfig } from './repos';
import { repoUrl } from './repos';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(HERE, '.cache.json');

export interface CacheEntry {
  tag: string;
  sha: string;
  generatedAt: string;
}

export type Cache = Record<string, CacheEntry>;

export interface Resolved {
  tag: string;
  sha: string;
}

interface Version {
  nums: [number, number, number];
  pre: boolean;
}

/** Parse a `vX.Y.Z[-prerelease][+build]` tag. Returns null for non-semver tags. */
function parseVersion(tag: string): Version | null {
  const m = tag.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/);
  if (!m) return null;
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: !!m[4] };
}

/** Descending compare: higher version first. */
function rcompare(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) if (a.nums[i] !== b.nums[i]) return b.nums[i] - a.nums[i];
  return 0;
}

/**
 * Resolve the latest stable tag + its commit SHA via `git ls-remote --tags`.
 * Annotated-tag peeled refs (`^{}`) are preferred so the SHA is the commit, not
 * the tag object. Pre-releases (`-rc`, `-beta`, …) are skipped.
 */
export function resolveLatestStable(cfg: RepoConfig): Resolved {
  const out = execFileSync('git', ['ls-remote', '--tags', '--refs', repoUrl(cfg)], {
    encoding: 'utf8',
  });

  // Map tag -> {sha, version}; with --refs the peeled commit SHA is what we get.
  const candidates: { tag: string; sha: string; version: Version }[] = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^([0-9a-f]{40})\s+refs\/tags\/(.+)$/);
    if (!m) continue;
    const tag = m[2].replace(/\^\{\}$/, '');
    const version = parseVersion(tag);
    if (!version || version.pre) continue; // skip non-semver and pre-releases
    candidates.push({ tag, sha: m[1], version });
  }

  if (candidates.length === 0) {
    throw new Error(`No stable semver tags found for ${cfg.org}/${cfg.repo}`);
  }

  candidates.sort((a, b) => rcompare(a.version, b.version));
  return { tag: candidates[0].tag, sha: candidates[0].sha };
}

export function readCache(): Cache {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as Cache;
  } catch {
    return {};
  }
}

export function writeCacheEntry(slug: string, entry: CacheEntry): void {
  const cache = readCache();
  cache[slug] = entry;
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  const ordered: Cache = {};
  for (const key of Object.keys(cache).sort()) ordered[key] = cache[key];
  writeFileSync(CACHE_FILE, JSON.stringify(ordered, null, 2) + '\n');
}

/** True when the committed SHA matches the freshly resolved one. */
export function isUpToDate(slug: string, sha: string): boolean {
  return readCache()[slug]?.sha === sha;
}
