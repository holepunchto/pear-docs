// scripts/refgen/seed-jsdoc.ts
//
// Seed JSDoc into a source repo from what the README already documents — the
// migration accelerator for the JSDoc-first model. For every member that the
// README describes but the source doesn't yet JSDoc, it inserts a JSDoc block
// (description, @param, @returns, @example) directly above the member, with empty
// `{}` type slots for a maintainer to fill. Run it, review the diff, add types.
//
// Reads the committed model (generated/refs/<slug>/api-model.json) for the prose
// and the source line of each member, and edits the local checkout in place.
// Insertions are applied bottom-up so earlier edits don't shift later line
// numbers. Members that already carry JSDoc (source includes 'jsdoc') are skipped.
//
// Usage: tsx scripts/refgen/seed-jsdoc.ts <slug> [repoDir]
//   repoDir defaults to $UPSTREAM_ROOT/<slug> (default /tmp/pear-upstream/<slug>).
//
// IMPORTANT: regenerate the model from the SAME checkout first
// (`tsx scripts/refgen/regen-local.ts <slug>`) so the line numbers line up.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel, RefMethod } from './model';

const REFS = 'generated/refs';
const UPSTREAM_ROOT = process.env.UPSTREAM_ROOT ?? '/tmp/pear-upstream';

/** Parse `…/blob/<ref>/<path>#L<line>` → the member's source location. */
function loc(m: RefMethod): { file: string; line: number } | null {
  if (!m.sourceLink) return null;
  const mt = m.sourceLink.match(/\/blob\/[^/]+\/(.+?)#L(\d+)/);
  return mt ? { file: mt[1], line: Number(mt[2]) } : null;
}

function wrap(text: string, width = 76): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > width) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** An options-object fence (rendered as a table elsewhere) — not a usage example. */
function isOptionsFence(ex: string): boolean {
  const t = ex.trim();
  // A `{ … }` whose first field is `name:`, `name,` or a method shorthand `name (`.
  return t.startsWith('{') && t.endsWith('}') && /^\s*[A-Za-z_$][\w$]*\s*[,:(]/m.test(t);
}

/** Build the JSDoc block for a member, indented to match the source line. */
function buildBlock(m: RefMethod, indent: string): string[] {
  const out = [`${indent}/**`];
  const star = (s: string) => out.push(s ? `${indent} * ${s}` : `${indent} *`);

  if (m.description) for (const line of m.description.split('\n')) for (const w of wrap(line.trim())) star(w);

  for (const p of m.params) {
    const name = p.optional ? `[${p.name}]` : p.name;
    const desc = p.description ? ` - ${p.description.replace(/\s+/g, ' ').trim()}` : '';
    star(`@param {${p.type ?? ''}} ${name}${desc}`); // empty {} = fill in the type
  }

  // Always leave a type slot for the value a member yields, so "fill the {}" is
  // the whole job. Fields use @type; getters/methods use @returns; constructors,
  // setters and events don't return.
  if (m.kind === 'property') {
    star(`@type {${m.returnType ?? ''}}`);
  } else if (m.kind === 'getter' || m.kind === 'method') {
    const desc = m.returns ? ` ${m.returns.replace(/^returns?\b:?\s*/i, '').replace(/\s+/g, ' ').trim()}` : '';
    star(`@returns {${m.returnType ?? ''}}${desc}`);
  }

  const example = m.examples.find((ex) => !isOptionsFence(ex)); // skip option fences
  if (example) {
    star('@example');
    for (const line of example.split('\n')) star(line);
  }

  out.push(`${indent} */`);
  return out;
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx scripts/refgen/seed-jsdoc.ts <slug> [repoDir]');
    process.exit(1);
  }
  const repoDir = process.argv[3] ?? join(UPSTREAM_ROOT, slug);
  const modelPath = join(REFS, slug, 'api-model.json');
  if (!existsSync(modelPath)) {
    console.error(`No model at ${modelPath} (run refs:gen / regen-local first).`);
    process.exit(1);
  }
  const model = JSON.parse(readFileSync(modelPath, 'utf8')) as ApiModel;

  // Seedable = documented in the README (has prose to seed) AND found in source
  // (has a line) AND not already JSDoc'd. Grouped by file.
  const byFile = new Map<string, { line: number; m: RefMethod }[]>();
  let skipped = 0;
  for (const cls of model.classes) {
    for (const m of cls.methods) {
      if (m.kind === 'event') continue;
      if (!m.source.includes('ast') || !m.source.includes('readme')) continue;
      if (m.source.includes('jsdoc')) {
        skipped++;
        continue;
      }
      const l = loc(m);
      if (!l) continue;
      (byFile.get(l.file) ?? byFile.set(l.file, []).get(l.file)!).push({ line: l.line, m });
    }
  }

  let seeded = 0;
  for (const [file, items] of byFile) {
    const abs = join(repoDir, file);
    if (!existsSync(abs)) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    items.sort((a, b) => b.line - a.line); // bottom-up
    for (const { line, m } of items) {
      const idx = line - 1;
      if (idx < 0 || idx >= lines.length) continue;
      if ((lines[idx - 1]?.trim() ?? '').endsWith('*/')) continue; // already has a block above
      const indent = lines[idx].match(/^\s*/)?.[0] ?? '';
      lines.splice(idx, 0, ...buildBlock(m, indent));
      seeded++;
    }
    writeFileSync(abs, lines.join('\n'));
  }

  console.log(
    `Seeded ${seeded} JSDoc block(s) into ${repoDir} (${skipped} already had JSDoc).\n` +
      `Next: fill the empty \`{}\` type slots, review the diff, and open a PR. Then re-run regen-local + refs:jsdoc.`
  );
}

main();
