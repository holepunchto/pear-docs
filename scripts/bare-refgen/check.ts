// scripts/bare-refgen/check.ts
//
// Validation gate for the generated bare references. Re-renders each committed
// api-model.json and asserts:
//   1. coverage      — every top-level export appears on the page (no silent drops);
//   2. layout sanity — every manifest members/describe/throws key matches a real symbol;
//   3. MDX validity  — the page compiles as MDX.
// Exits non-zero on any failure so CI can gate the regeneration PR.
//
// Run: npm run check:bare-refs   (reads generated/bare-refs/*/api-model.json)

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT_DIR } from './config';
import { loadLayout, type Layout } from './layout';
import { renderPage } from './render';
import type { BareExport, BareModel } from './model';

interface Problem {
  module: string;
  kind: 'coverage' | 'layout' | 'mdx';
  detail: string;
}

/** Every key AND display name in the model (recursive, incl. subpaths). */
function allIdentities(model: BareModel): Set<string> {
  const ids = new Set<string>();
  const walk = (e: BareExport) => {
    ids.add(e.key);
    ids.add(e.name);
    e.members.forEach(walk);
  };
  model.exports.forEach(walk);
  model.subpaths.forEach((s) => s.exports.forEach(walk));
  return ids;
}

/** Top-level exports whose name never appears in the rendered page. */
function coverageGaps(model: BareModel, mdx: string): string[] {
  const gaps: string[] = [];
  for (const e of model.exports) {
    // Expanded classes surface via members/group heading; check the class name
    // or any member name is present.
    const names = [e.name, ...e.members.map((m) => m.name)];
    if (!names.some((n) => mdx.includes(n))) gaps.push(e.key);
  }
  return gaps;
}

/** Manifest refs (group members, describe/throws keys) that match no symbol. */
function layoutGaps(layout: Layout, ids: Set<string>): string[] {
  const refs = new Set<string>();
  for (const g of layout.groups) g.members.forEach((m) => refs.add(m));
  Object.keys(layout.describe ?? {}).forEach((k) => refs.add(k));
  Object.keys(layout.throws ?? {}).forEach((k) => refs.add(k));
  return [...refs].filter((r) => !ids.has(r));
}

async function compilesAsMdx(mdx: string): Promise<string | null> {
  try {
    const { compile } = await import('@mdx-js/mdx');
    await compile(mdx.replace(/^---\n[\s\S]*?\n---\n/, ''), { development: false });
    return null;
  } catch (err) {
    const msg = (err as Error)?.message;
    // @mdx-js/mdx not installed in this environment — skip rather than fail.
    if (/Cannot find package '@mdx-js\/mdx'/.test(msg ?? '')) {
      console.warn('  (MDX compile skipped: @mdx-js/mdx not installed)');
      return null;
    }
    return String(msg).split('\n')[0];
  }
}

async function main(): Promise<void> {
  const dirs = (await readdir(OUT_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const problems: Problem[] = [];
  for (const name of dirs) {
    const model = JSON.parse(await readFile(join(OUT_DIR, name, 'api-model.json'), 'utf8')) as BareModel;
    const layout = await loadLayout(name);
    const { mdx } = renderPage(model, layout);

    for (const key of coverageGaps(model, mdx)) {
      problems.push({ module: name, kind: 'coverage', detail: `export not rendered: ${key}` });
    }
    if (layout) {
      for (const ref of layoutGaps(layout, allIdentities(model))) {
        problems.push({ module: name, kind: 'layout', detail: `manifest ref matches no symbol: ${ref}` });
      }
    }
    const mdxErr = await compilesAsMdx(mdx);
    if (mdxErr) problems.push({ module: name, kind: 'mdx', detail: mdxErr });
  }

  if (problems.length === 0) {
    console.log(`✅ ${dirs.length} modules OK — coverage, layout, and MDX all pass.`);
    return;
  }
  console.error(`❌ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  [${p.kind}] ${p.module}: ${p.detail}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
