// scripts/refgen/report-all.ts
//
// Aggregate JSDoc-quality report across every committed model
// (generated/refs/*/api-model.json) — no upstream clone, so it runs in CI. For
// each module it (re)writes generated/refs/<slug>/jsdoc-gaps.md and prints a
// one-line completeness summary. This is the lever for keeping source JSDoc good
// as the module set grows.
//
// Usage:
//   tsx scripts/refgen/report-all.ts             # write gap reports + print summary
//   tsx scripts/refgen/report-all.ts --summary   # print only (no writes) — for checks
//   tsx scripts/refgen/report-all.ts --gate 80   # exit non-zero if any module < 80%
//
// The gate is opt-in: until source repos are enriched, completeness is low, so CI
// runs this report-only. Flip on `--gate <n>` once modules clear the floor.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel } from './model';
import { loadLayout } from './layout';
import { jsdocGapReport, writeJsDocGapReport, type JsDocGapReport } from './jsdoc-gap';

const REFS = 'generated/refs';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const summaryOnly = argv.includes('--summary');
  const gateIdx = argv.indexOf('--gate');
  const gate = gateIdx >= 0 ? Number(argv[gateIdx + 1]) : null;

  const slugs = readdirSync(REFS)
    .filter((s) => existsSync(join(REFS, s, 'api-model.json')))
    .sort();

  type Row = {
    slug: string;
    pct: number;
    graded: number;
    gaps: number;
    typedefs: number;
    coverage: JsDocGapReport['coverage'];
  };
  const rows: Row[] = [];
  let belowGate = 0;

  for (const slug of slugs) {
    const model = JSON.parse(readFileSync(join(REFS, slug, 'api-model.json'), 'utf8')) as ApiModel;
    const layout = await loadLayout(slug);
    const published = layout ? new Set(layout.groups.flatMap((g) => g.members)) : undefined;
    const report = jsdocGapReport(model, published);
    if (!summaryOnly) writeJsDocGapReport(report, model, join(REFS, slug, 'jsdoc-gaps.md'));
    rows.push({
      slug,
      pct: report.pct,
      graded: report.graded,
      gaps: report.gaps.length,
      typedefs: model.typedefs?.length ?? 0,
      coverage: report.coverage,
    });
    if (gate != null && report.graded > 0 && report.pct < gate) belowGate++;
  }

  // have/want → "63%" (or "  —" when nothing of that kind exists on the module).
  const pct = (c: { have: number; want: number }) => (c.want ? `${Math.round((c.have / c.want) * 100)}%`.padStart(4) : '   —');

  console.log(`\nJSDoc coverage (published surface)${summaryOnly ? '' : ' — gap reports refreshed'}:\n`);
  console.log(`  ${''.padEnd(18)}  complete   desc  types  returns  examples`);
  for (const r of rows) {
    const bar = r.pct >= 80 ? '🟢' : r.pct >= 40 ? '🟡' : '🔴';
    const c = r.coverage;
    console.log(
      `  ${bar} ${r.slug.padEnd(18)} ${`${r.pct}%`.padStart(7)}   ${pct(c.description)} ${pct(c.paramTypes)}  ${pct(c.returns)}    ${pct(c.examples)}   · ${String(r.gaps).padStart(3)} to do`
    );
  }
  const graded = rows.filter((r) => r.graded > 0);
  const sum = (sel: (c: JsDocGapReport['coverage']) => { have: number; want: number }) => {
    const have = graded.reduce((s, r) => s + sel(r.coverage).have, 0);
    const want = graded.reduce((s, r) => s + sel(r.coverage).want, 0);
    return pct({ have, want });
  };
  const avg = graded.length ? Math.round(graded.reduce((s, r) => s + r.pct, 0) / graded.length) : 0;
  console.log(
    `\n  totals across ${graded.length} module(s): complete ${avg}%  ·  desc ${sum((c) => c.description)}  types ${sum((c) => c.paramTypes)}  returns ${sum((c) => c.returns)}  examples ${sum((c) => c.examples)}`
  );
  console.log(`\n  "complete" needs all of: description + every param typed + typed @returns + example.`);

  if (gate != null && belowGate > 0) {
    console.error(`\nGate failed: ${belowGate} module(s) below ${gate}%. Enrich their source JSDoc (see each jsdoc-gaps.md).`);
    process.exit(1);
  }
}

main();
