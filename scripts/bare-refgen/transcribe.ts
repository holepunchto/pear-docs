// scripts/bare-refgen/transcribe.ts
//
// Bootstraps the layout-manifest `describe` maps from each module's README.
// Parses the README `## API` section (already captured verbatim in the research
// dossier), pulls the prose under each `#### ` heading, matches it to an
// extracted symbol by name, and writes a *suggested* describe map for a human to
// review and paste into layouts/<name>.ts. This is mechanical transcription of
// author-written README prose — NOT AI — and is never applied automatically.
//
// Run: npm run bare-refs:transcribe [-- --only bare-os]

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT_DIR } from './config';
import type { BareExport, BareModel } from './model';

const RESEARCH_JSON = 'docs/bare-modules-research.json';

/**
 * Map every symbol identity (name, key, and bare last-segment) to the symbol's
 * canonical name — so a README heading resolves to the exact render key
 * (`URL.parse`, not the bare `parse`). Exact name/key registered first so a
 * shared last-segment can't clobber it.
 */
function canonicalMap(model: BareModel): Map<string, string> {
  const map = new Map<string, string>();
  const reg = (id: string | undefined, canon: string) => {
    if (id && !map.has(id)) map.set(id, canon);
  };
  const walk = (e: BareExport) => {
    reg(e.name, e.name);
    reg(e.key, e.name);
    if (e.name.includes('.')) reg(e.name.split('.').pop(), e.name);
    e.members.forEach(walk);
  };
  model.exports.forEach(walk);
  model.subpaths.forEach((s) => s.exports.forEach(walk));
  return map;
}

/**
 * Symbol name implied by a README `#### ` heading. Keeps a Capitalized receiver
 * (`URL.parse` → `URL.parse`, a class static) but drops a lowercase instance
 * receiver (`url.toString` → `toString`, `const p = os.platform()` → `platform`).
 */
function symbolFromHeading(heading: string): string | null {
  let raw = heading.replace(/`/g, '').trim();
  raw = raw
    .replace(/^const\s+[\w$]+\s*=\s*/, '')
    .replace(/^let\s+[\w$]+\s*=\s*/, '')
    .replace(/^await\s+/, '')
    .replace(/^new\s+/, '');
  const beforeParen = raw.split('(')[0].trim();
  const segs = (beforeParen.split(/\s+/).pop() ?? '').split('.');
  const ident = /^[A-Za-z_$][\w$]*$/;
  if (segs.length >= 2 && /^[A-Z]/.test(segs[segs.length - 2]) && ident.test(segs[segs.length - 1])) {
    return segs.slice(-2).join('.'); // Class.method
  }
  const name = segs[segs.length - 1] ?? '';
  return ident.test(name) ? name : null;
}

interface Block {
  name: string;
  prose: string;
}

/** Extract `#### heading` → first-paragraph prose from a README `## API` body. */
function parseApi(api: string): Block[] {
  const lines = api.split('\n');
  const blocks: Block[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^####\s+(.*)$/);
    if (!m) continue;
    const name = symbolFromHeading(m[1]);
    if (!name) continue;
    // First paragraph after the heading, up to a blank line or the next heading.
    const prose: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (/^#{2,4}\s/.test(l)) break;
      if (l.trim() === '') {
        if (prose.length) break;
        continue;
      }
      prose.push(l.trim());
    }
    if (!prose.length) continue;
    const text = prose.join(' ').replace(/\s+/g, ' ').trim();
    // Skip captured code/examples (e.g. `function toString() { [native code] }`),
    // which aren't descriptions and would break MDX.
    if (/[{}]|\[native code\]|=>/.test(text)) continue;
    blocks.push({ name, prose: text });
  }
  return blocks;
}

async function main(): Promise<void> {
  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx !== -1 ? (process.argv[onlyIdx + 1] ?? '').split(',').map((s) => s.trim()) : null;

  const research = JSON.parse(await readFile(RESEARCH_JSON, 'utf8')) as Array<{ name: string; api: string | null }>;
  const apiByName = new Map(research.map((r) => [r.name, r.api]));

  const dirs = (await readdir(OUT_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !only || only.includes(n));

  for (const name of dirs) {
    const api = apiByName.get(name);
    if (!api) {
      console.log(`  – ${name}: no README ## API section — skipping`);
      continue;
    }
    const model = JSON.parse(await readFile(join(OUT_DIR, name, 'api-model.json'), 'utf8')) as BareModel;
    const canonical = canonicalMap(model);

    const describe: Record<string, string> = {};
    const unmatched: string[] = [];
    for (const b of parseApi(api)) {
      const canon = canonical.get(b.name);
      // Skip `*Sync` siblings — folded into the async entry, so never shown.
      if (canon && canon.endsWith('Sync') && canonical.has(canon.slice(0, -4))) continue;
      if (canon && !Object.hasOwn(describe, canon)) describe[canon] = b.prose;
      else if (!canon) unmatched.push(b.name);
    }
    const documented = new Set(Object.keys(describe));
    const undocumented = model.exports.map((e) => e.name).filter((n) => !documented.has(n));

    const outPath = join(OUT_DIR, name, 'describe.suggested.json');
    await writeFile(outPath, JSON.stringify({ describe, unmatchedHeadings: unmatched, undocumentedSymbols: undocumented }, null, 2) + '\n');
    console.log(
      `  ✓ ${name}: ${Object.keys(describe).length} suggested · ${unmatched.length} README-only · ${undocumented.length} still undocumented → ${outPath}`,
    );
  }
  console.log('\nReview each describe.suggested.json and paste the good entries into scripts/bare-refgen/layouts/<name>.ts.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
