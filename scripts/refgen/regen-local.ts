// scripts/refgen/regen-local.ts
//
// Regenerate a model from a LOCAL upstream checkout, bypassing clone + cache.
//
// This exists for the "edit upstream source locally, see the refs update" loop —
// e.g. adding JSDoc comments to a checkout and watching the generated refs gain
// descriptions/examples. The normal generator (generate-refs.ts) reclones at the
// release SHA and would discard local edits, so it can't be used for this.
//
// Tag/SHA default to the values in the committed model so the pinned source links
// and the cache key stay identical — the only thing that changes is what the
// extractor reads from the (edited) working tree. Override with --tag / --sha when
// regenerating from a different release.
//
// Usage:
//   tsx scripts/refgen/regen-local.ts <slug> [repoDir] [--tag vX.Y.Z] [--sha <sha>]
//
//   repoDir defaults to $UPSTREAM_ROOT/<slug> (UPSTREAM_ROOT default /tmp/pear-upstream).
//
// After regenerating, run `npm run refs:curated -- <slug> [--write]` to render.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPOS } from './repos';
import { extractAst } from './extract-ast';
import { extractReadme, extractSections } from './extract-readme';
import { buildModel } from './build';
import { validateModel } from './validate';
import { jsdocGapReport, writeJsDocGapReport } from './jsdoc-gap';
import { loadLayout } from './layout';
import type { ApiModel } from './model';

const OUT_ROOT = 'generated/refs';
const UPSTREAM_ROOT = process.env.UPSTREAM_ROOT ?? '/tmp/pear-upstream';

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : undefined;
}

function readUpstreamDescription(repoDir: string): string | undefined {
  const pkgPath = join(repoDir, 'package.json');
  if (!existsSync(pkgPath)) return undefined;
  try {
    const desc = JSON.parse(readFileSync(pkgPath, 'utf8')).description;
    return typeof desc === 'string' && desc.trim() ? desc.trim() : undefined;
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--tag' && argv[i - 1] !== '--sha');
  const slug = positional[0];
  if (!slug || !REPOS[slug]) {
    console.error(`Usage: tsx scripts/refgen/regen-local.ts <slug> [repoDir] [--tag vX.Y.Z] [--sha <sha>]`);
    console.error(`Known slugs: ${Object.keys(REPOS).join(', ')}`);
    process.exit(1);
  }
  const cfg = REPOS[slug];
  const repoDir = positional[1] ?? join(UPSTREAM_ROOT, slug);
  if (!existsSync(repoDir)) {
    console.error(`No local checkout at ${repoDir}. Clone the repo there first (see clone.ts / UPSTREAM_ROOT).`);
    process.exit(1);
  }

  // Default tag/sha to the committed model so source links + cache key don't move.
  const modelPath = join(OUT_ROOT, slug, 'api-model.json');
  const prior = existsSync(modelPath) ? (JSON.parse(readFileSync(modelPath, 'utf8')) as ApiModel) : undefined;
  const tag = flag(argv, '--tag') ?? prior?.tag;
  const sha = flag(argv, '--sha') ?? prior?.sha;
  if (!tag || !sha) {
    console.error(`No committed model to inherit tag/sha from; pass --tag and --sha explicitly.`);
    process.exit(1);
  }

  console.log(`Regenerating ${slug} from ${repoDir} @ ${tag} (${sha.slice(0, 10)}) — local working tree, no clone.`);

  const ast = extractAst(repoDir);
  const readmeText = existsSync(join(repoDir, 'README.md')) ? readFileSync(join(repoDir, 'README.md'), 'utf8') : '';
  const readme = readmeText ? extractReadme(readmeText) : [];
  const sections = readmeText ? extractSections(readmeText) : [];
  const description = readUpstreamDescription(repoDir);

  const model = buildModel({ slug, cfg, tag, sha, description, ast, readme, sections });
  validateModel(model);

  // Preserve the committed generatedAt so the diff is purely the source change.
  if (prior?.generatedAt) model.generatedAt = prior.generatedAt;

  writeFileSync(modelPath, JSON.stringify(model, null, 2) + '\n');
  const jsdocCount = model.classes.reduce((n, c) => n + c.methods.filter((m) => m.source.includes('jsdoc')).length, 0);
  console.log(`Wrote ${modelPath} — ${jsdocCount} member(s) now sourced (partly) from JSDoc.`);

  // JSDoc gap report: the upstream to-do list for top-quality docs. When a layout
  // manifest exists, grade only the published surface (its grouped members) so
  // internal instance fields don't pollute the to-do.
  const layout = await loadLayout(slug);
  const publishedKeys = layout
    ? new Set(layout.groups.flatMap((g) => g.members))
    : undefined;
  const report = jsdocGapReport(model, publishedKeys);
  const gapPath = join(OUT_ROOT, slug, 'jsdoc-gaps.md');
  writeJsDocGapReport(report, model, gapPath);
  console.log(`Wrote ${gapPath} — ${report.pct}% documented (${report.complete}/${report.graded}); ${report.gaps.length} member(s) need JSDoc.`);
}

main();

