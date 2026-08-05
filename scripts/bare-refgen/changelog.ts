// scripts/bare-refgen/changelog.ts
//
// Emits a Markdown summary of what a regeneration changed, by diffing the
// working-tree api-model.json files against the versions committed at git HEAD.
// The regenerate-bare-refs workflow captures this into the PR body so a reviewer sees
// "3 methods added, 1 signature changed" instead of a 400-line diff — and
// removed/renamed symbols (potential breaking changes) are called out.
//
// Run: npm run bare-refs:changelog   (prints Markdown to stdout)

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT_DIR } from './config';
import type { BareExport, BareModel } from './model';

const execFile = promisify(execFileCb);

/** Flatten a model to key → primary signature (recursive, incl. subpaths). */
function signatures(model: BareModel): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (e: BareExport) => {
    map.set(e.key, e.signatures[0] ?? e.name);
    e.members.forEach(walk);
  };
  model.exports.forEach(walk);
  model.subpaths.forEach((s) => s.exports.forEach(walk));
  return map;
}

async function committedModel(path: string): Promise<BareModel | null> {
  try {
    const { stdout } = await execFile('git', ['show', `HEAD:${path}`], { maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(stdout) as BareModel;
  } catch {
    return null; // not committed yet (first run) → treat as all-new
  }
}

interface ModuleDelta {
  name: string;
  version: string;
  prevVersion: string | null;
  added: string[];
  removed: string[];
  changed: string[];
}

async function diffModule(name: string): Promise<ModuleDelta | null> {
  const path = join(OUT_DIR, name, 'api-model.json');
  const next = JSON.parse(await readFile(path, 'utf8')) as BareModel;
  const prev = await committedModel(path);
  const nextSigs = signatures(next);
  const prevSigs = prev ? signatures(prev) : new Map<string, string>();

  const added: string[] = [];
  const changed: string[] = [];
  for (const [key, sig] of nextSigs) {
    if (!prevSigs.has(key)) added.push(key);
    else if (prevSigs.get(key) !== sig) changed.push(key);
  }
  const removed = [...prevSigs.keys()].filter((k) => !nextSigs.has(k));

  if (!prev) return { name, version: next.version, prevVersion: null, added: [], removed: [], changed: [] };
  if (!added.length && !removed.length && !changed.length && prev.version === next.version) return null;
  return { name, version: next.version, prevVersion: prev.version, added, removed, changed };
}

function render(deltas: ModuleDelta[]): string {
  if (deltas.length === 0) return 'No API changes since the last generation.';
  const out: string[] = ['## Bare reference changes', ''];
  for (const d of deltas) {
    const ver = d.prevVersion && d.prevVersion !== d.version ? `${d.prevVersion} → ${d.version}` : d.version;
    out.push(`### \`${d.name}\` (${ver})`, '');
    if (d.prevVersion === null) {
      out.push('- New page.', '');
      continue;
    }
    const line = (label: string, items: string[]) =>
      items.length ? out.push(`- **${label}** (${items.length}): ${items.map((i) => `\`${i}\``).join(', ')}`) : 0;
    line('Added', d.added);
    line('Changed', d.changed);
    if (d.removed.length) out.push(`- **⚠ Removed** (${d.removed.length}): ${d.removed.map((i) => `\`${i}\``).join(', ')}`);
    out.push('');
  }
  return out.join('\n');
}

async function main(): Promise<void> {
  const dirs = (await readdir(OUT_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const deltas = (await Promise.all(dirs.map(diffModule))).filter((d): d is ModuleDelta => d !== null);
  console.log(render(deltas));
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
