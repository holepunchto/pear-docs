// scripts/refgen/clone.ts
//
// Stage 1 — make a local checkout of the upstream repo at a specific tag.
//
// Reuses the UPSTREAM_ROOT convention from the existing scripts (defaults to
// /tmp/pear-upstream). If a checkout already sits at the wanted SHA we reuse it;
// otherwise we shallow-clone the single tag.

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RepoConfig } from './repos';
import { repoUrl } from './repos';

const UPSTREAM_ROOT = process.env.UPSTREAM_ROOT ?? '/tmp/pear-upstream';

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function headSha(dir: string): string | null {
  try {
    return git(['rev-parse', 'HEAD'], dir);
  } catch {
    return null;
  }
}

/**
 * Ensure a checkout of `cfg` at `tag` (commit `sha`) exists locally; return its
 * absolute path. Idempotent: a matching existing checkout is reused as-is.
 */
export function ensureCheckout(slug: string, cfg: RepoConfig, tag: string, sha: string): string {
  mkdirSync(UPSTREAM_ROOT, { recursive: true });
  const dir = join(UPSTREAM_ROOT, slug);

  if (existsSync(dir)) {
    if (headSha(dir) === sha) return dir; // already at the wanted commit
    rmSync(dir, { recursive: true, force: true }); // stale — reclone cleanly
  }

  git(['clone', '--depth', '1', '--branch', tag, repoUrl(cfg), dir]);
  return dir;
}
