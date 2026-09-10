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

/**
 * key/name → every BareExport registered under that identity (recursive,
 * incl. subpaths). A bare `name` is not unique — a namespace-level helper
 * and a same-named instance method legitimately share one (e.g. bare-events'
 * static `EventEmitter.on(emitter, name, opts)` and instance `on(name, fn)`
 * both register under `on`) — so this is a multi-map, not last-write-wins.
 */
function exportsByIdentity(model: BareModel): Map<string, BareExport[]> {
  const map = new Map<string, BareExport[]>();
  const add = (id: string, e: BareExport) => {
    const list = map.get(id);
    if (list) list.push(e);
    else map.set(id, [e]);
  };
  const walk = (e: BareExport) => {
    add(e.key, e);
    if (e.name !== e.key) add(e.name, e);
    e.members.forEach(walk);
  };
  model.exports.forEach(walk);
  model.subpaths.forEach((s) => s.exports.forEach(walk));
  return map;
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

/** Manifest refs (group members, describe/params/returns/throws keys) that match no symbol. */
function layoutGaps(layout: Layout, ids: Set<string>): string[] {
  const refs = new Set<string>();
  for (const g of layout.groups ?? []) g.members.forEach((m) => refs.add(m));
  Object.keys(layout.describe ?? {}).forEach((k) => refs.add(k));
  Object.keys(layout.throws ?? {}).forEach((k) => refs.add(k));
  Object.keys(layout.params ?? {}).forEach((k) => refs.add(k));
  Object.keys(layout.returns ?? {}).forEach((k) => refs.add(k));
  return [...refs].filter((r) => !ids.has(r));
}

/**
 * `layout.params[member][paramName]` entries whose `paramName` matches no
 * real parameter of ANY export registered under that identity. `layoutGaps`
 * above only checks the outer member key — a renamed parameter (e.g. a
 * `.d.ts` source swap that renames `opts` to `options`) leaves the outer key
 * valid but silently orphans the manifest's per-parameter prose, with no
 * symptom other than a blank Description cell. Checked against every
 * colliding export (see `exportsByIdentity`) so a namespace-level helper
 * sharing a bare name with an instance method — different param lists, same
 * identity string — isn't flagged just because one of the two doesn't match.
 * Reported as `member.paramName` so it's easy to find.
 */
function paramKeyGaps(layout: Layout, byIdentity: Map<string, BareExport[]>): string[] {
  const gaps: string[] = [];
  for (const [memberRef, params] of Object.entries(layout.params ?? {})) {
    const candidates = byIdentity.get(memberRef);
    if (!candidates) continue; // already reported by layoutGaps
    const realNames = new Set(candidates.flatMap((ex) => ex.params.map((p) => p.name)));
    for (const paramName of Object.keys(params)) {
      if (!realNames.has(paramName)) gaps.push(`${memberRef}.${paramName}`);
    }
  }
  return gaps;
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

    // A committed model with no exports means the extractor failed silently
    // (e.g. an ambient-declaration shape it doesn't handle) — the driver should
    // have skipped it instead.
    if (model.exports.length === 0 && model.subpaths.every((s) => s.exports.length === 0)) {
      problems.push({ module: name, kind: 'coverage', detail: 'model has 0 extractable exports (extractor gap or should be skipped)' });
    }

    for (const key of coverageGaps(model, mdx)) {
      problems.push({ module: name, kind: 'coverage', detail: `export not rendered: ${key}` });
    }
    if (layout) {
      const byIdentity = exportsByIdentity(model);
      for (const ref of layoutGaps(layout, new Set(byIdentity.keys()))) {
        problems.push({ module: name, kind: 'layout', detail: `manifest ref matches no symbol: ${ref}` });
      }
      for (const ref of paramKeyGaps(layout, byIdentity)) {
        problems.push({ module: name, kind: 'layout', detail: `manifest params key matches no real parameter: ${ref}` });
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
