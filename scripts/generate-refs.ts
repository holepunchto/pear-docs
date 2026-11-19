// scripts/generate-refs.ts
//
// Generate reference API models from upstream source.
//
// These reference pages (content/reference/{building-blocks,helpers}/<slug>.mdx)
// are hand-authored today. This generator extracts the API surface directly from
// each upstream repo at its latest stable release and emits a structured,
// tool-agnostic model (out/refs/<slug>/api-model.json) plus a completeness/drift
// improvement plan. MDX rendering is a later phase — this stage produces specs
// only.
//
// Note: OpenAPI/Swagger are deliberately NOT used — they describe HTTP REST APIs,
// and these are JavaScript class/method libraries with no HTTP surface.
//
// Pipeline per repo, all artifacts under generated/refs/<slug>/ (committed):
//   0. resolve latest stable tag + SHA (git ls-remote) and gate on a committed cache
//   1. shallow-clone that tag (UPSTREAM_ROOT, default /tmp/pear-upstream)
//   2. extract AST (acorn) + README (mdast), merge -> api-model.json
//   3. render combined page -> reference.mdx
//   4. validate the model shape (ajv)
//   5. score completeness + drift + parity -> improvement-plan.md
//   6. sync curated page source links to the current release (--no-sync to skip)
//
// Usage:
//   npm run refs:gen -- --repo hypercore [--force] [--no-score] [--full] [--no-sync]
//   npm run refs:gen:all -- [--force]
//
// Exit 0 on success (or up-to-date skip), 1 on failure.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPOS, type RepoConfig } from './refgen/repos';
import { resolveLatestStable, isUpToDate, writeCacheEntry } from './refgen/cache';
import { ensureCheckout } from './refgen/clone';
import { extractAst } from './refgen/extract-ast';
import { extractReadme, extractSections } from './refgen/extract-readme';
import { buildModel } from './refgen/build';
import { validateModel } from './refgen/validate';
import { scoreModel, writeImprovementPlan } from './refgen/score';
import { renderReference } from './refgen/render';
import { rateAgainstMdx } from './refgen/rate';
import { syncSourceLinks } from './refgen/sync';

// Committed (not gitignored): the cache gate skips regen when upstream is
// unchanged, so the generated artifacts must live in git to exist on a clean
// checkout. They are committed alongside scripts/refgen/.cache.json.
const OUT_ROOT = 'generated/refs';

interface Args {
  repos: string[];
  force: boolean;
  score: boolean;
  full: boolean;
  sync: boolean;
}

function parseArgs(argv: string[]): Args {
  const force = argv.includes('--force');
  const score = !argv.includes('--no-score');
  const full = argv.includes('--full');
  const sync = !argv.includes('--no-sync');
  const all = argv.includes('--all');
  const repoFlagIdx = argv.indexOf('--repo');
  const repos: string[] = all
    ? Object.keys(REPOS)
    : repoFlagIdx !== -1 && argv[repoFlagIdx + 1]
      ? [argv[repoFlagIdx + 1]]
      : [];
  return { repos, force, score, full, sync };
}

/** One-line description from the upstream package.json, if present. */
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

function generate(slug: string, cfg: RepoConfig, args: Args): 'generated' | 'skipped' {
  const { tag, sha } = resolveLatestStable(cfg);
  console.log(`\n${slug}: latest stable ${tag} (${sha.slice(0, 10)})`);

  const outDir = join(OUT_ROOT, slug);
  const modelPath = join(outDir, 'api-model.json');

  // Skip only when up to date AND the committed artifact is actually present, so
  // a deleted/renamed output self-heals instead of staying gone.
  if (!args.force && isUpToDate(slug, sha) && existsSync(modelPath)) {
    console.log(`  up to date — skipping (use --force to regenerate)`);
    return 'skipped';
  }

  const repoDir = ensureCheckout(slug, cfg, tag, sha);

  const ast = extractAst(repoDir);
  const readmeText = existsSync(join(repoDir, 'README.md'))
    ? readFileSync(join(repoDir, 'README.md'), 'utf8')
    : '';
  const readme = readmeText ? extractReadme(readmeText) : [];
  const sections = readmeText ? extractSections(readmeText) : [];
  const description = readUpstreamDescription(repoDir);
  const mainAst = ast.classes.find((c) => c.main) ?? ast.classes[0];
  const subs = ast.classes.filter((c) => !c.main);
  console.log(
    `  AST: class ${mainAst?.name ?? '(none)'}, ${mainAst?.methods.length ?? 0} methods` +
      (subs.length ? ` (+${subs.length} sub-object: ${subs.map((s) => s.name).join(', ')})` : '') +
      ` · README: ${readme.length} API entries, ${sections.length} narrative sections`
  );

  const model = buildModel({ slug, cfg, tag, sha, description, ast, readme, sections });
  validateModel(model);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(modelPath, JSON.stringify(model, null, 2) + '\n');
  // Combined reference: README narrative (verbatim) + generated API.
  const refPath = join(outDir, 'reference.mdx');
  writeFileSync(refPath, renderReference(model, { full: args.full }));
  console.log(`  wrote ${modelPath} + ${refPath}`);

  const parity = rateAgainstMdx(model);
  if (parity) {
    console.log(
      `  parity vs ${parity.mdxPath}: ${parity.pct}% (${parity.covered}/${parity.totalMdx}) · ${parity.missing.length} missing, ${parity.extra.length} extra`
    );
  } else {
    console.log(`  parity: no existing MDX page for ${slug} (skipped)`);
  }

  if (args.score) {
    const score = scoreModel(model);
    const planPath = join(outDir, 'improvement-plan.md');
    writeImprovementPlan(model, score, planPath, parity);
    console.log(`  completeness ${score.pct}% · drift: ${score.driftUndocumented.length} undocumented, ${score.driftStale.length} stale · ${planPath}`);
  }

  // Sync the curated page: refresh only the pinned GitHub source links to the
  // current release. Prose, groupings, ordering and hand-authored entries are
  // preserved verbatim — the model is poorer than the curated page everywhere
  // except where each member lives in source. New/removed members are reported.
  if (args.sync && parity) {
    const page = readFileSync(parity.mdxPath, 'utf8');
    const sync = syncSourceLinks(page, model);
    if (sync.content !== page) {
      writeFileSync(parity.mdxPath, sync.content);
      console.log(`  synced ${sync.updatedLinks} source link(s) in ${parity.mdxPath}`);
    } else {
      console.log(`  sync: source links already current in ${parity.mdxPath}`);
    }
    if (sync.additions.length) {
      console.log(`  sync: ${sync.additions.length} documented upstream member(s) not on the page: ${sync.additions.join(', ')}`);
    }
  }

  writeCacheEntry(slug, { tag, sha, generatedAt: model.generatedAt });
  return 'generated';
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.repos.length === 0) {
    console.error('Usage: refs:gen -- --repo <slug> | --all  [--force] [--no-score] [--full] [--no-sync]');
    console.error(`Known slugs: ${Object.keys(REPOS).join(', ')}`);
    process.exit(1);
  }

  let failed = 0;
  for (const slug of args.repos) {
    const cfg = REPOS[slug];
    if (!cfg) {
      console.error(`Unknown repo slug: ${slug}`);
      failed++;
      continue;
    }
    try {
      generate(slug, cfg, args);
    } catch (err) {
      console.error(`  FAILED ${slug}: ${(err as Error).message}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} repo(s) failed.`);
    process.exit(1);
  }
}

main();
