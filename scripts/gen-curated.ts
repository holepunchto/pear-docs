// scripts/gen-curated.ts
//
// Hybrid curated-page generator (pipeline stage). For every repo that has a
// layout manifest (scripts/refgen/layouts/<slug>.ts), it merges the committed
// model with the manifest and writes the full curated page to
// generated/refs/<slug>/curated-preview.mdx for review.
//
// This stage is NOT cache-gated on upstream: it re-renders from the committed
// model + manifest every run, so editing a manifest (or a model refresh) shows
// up immediately.
//
// Flags:
//   [slug]   restrict to one repo (default: every repo with a manifest)
//   --check  exit non-zero if any manifest references an unknown member (stale
//            key) or leaves a documented model member ungrouped (newly
//            documented upstream). This is the CI gate.
//   --write  also write the rendered page over the live content/reference page
//            (opt-in; default is preview-only).
//
// Usage:
//   npm run refs:curated                # render previews for all manifests
//   npm run refs:curated -- --check     # CI gate
//   npm run refs:curated -- autobase --write
//
// Prereq: models exist under generated/refs/<slug>/api-model.json (run refs:gen).

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel } from './refgen/model';
import type { Augmentation } from './refgen/augment';
import { loadLayout } from './refgen/layout';
import { renderCuratedPage } from './refgen/render-curated';

const LAYOUTS_DIR = 'scripts/refgen/layouts';
const REFS_DIR = 'generated/refs';
const CONTENT_ROOT = 'content/reference';

/** Slugs that have a layout manifest. */
function manifestSlugs(): string[] {
  return readdirSync(LAYOUTS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
}

/** Locate <slug>.mdx under content/reference (for --write). */
function findContentPage(slug: string, dir = CONTENT_ROOT): string | null {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      const hit = findContentPage(slug, p);
      if (hit) return hit;
    } else if (e === `${slug}.mdx`) {
      return p;
    }
  }
  return null;
}

interface RepoResult {
  slug: string;
  unknown: string[];
  ungrouped: string[];
  wrote: string[];
  error?: string;
}

async function renderSlug(slug: string, write: boolean): Promise<RepoResult> {
  const base: RepoResult = { slug, unknown: [], ungrouped: [], wrote: [] };

  const modelPath = join(REFS_DIR, slug, 'api-model.json');
  if (!existsSync(modelPath)) return { ...base, error: `no model at ${modelPath} (run refs:gen)` };

  const layout = await loadLayout(slug);
  if (!layout) return { ...base, error: 'no layout manifest' };

  const model = JSON.parse(readFileSync(modelPath, 'utf8')) as ApiModel;

  // Optional reviewed LLM augmentation (examples/returns for model-thin members).
  const augPath = join(REFS_DIR, slug, 'augment.json');
  const augment = existsSync(augPath)
    ? (JSON.parse(readFileSync(augPath, 'utf8')) as Augmentation)
    : undefined;

  const { mdx, unknown, ungrouped } = renderCuratedPage(model, layout, model.repo.repo, augment);

  const wrote: string[] = [];
  const previewPath = join(REFS_DIR, slug, 'curated-preview.mdx');
  writeFileSync(previewPath, mdx);
  wrote.push(previewPath);

  if (write) {
    const contentPath = findContentPage(slug);
    if (!contentPath) return { ...base, unknown, ungrouped, wrote, error: `--write: no content page for ${slug}` };
    writeFileSync(contentPath, mdx);
    wrote.push(contentPath);
  }

  return { slug, unknown, ungrouped, wrote };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const check = argv.includes('--check');
  const write = argv.includes('--write');
  const slugArg = argv.find((a) => !a.startsWith('--'));
  const slugs = slugArg ? [slugArg] : manifestSlugs();

  if (slugs.length === 0) {
    console.error(`No layout manifests found in ${LAYOUTS_DIR}.`);
    process.exit(1);
  }

  let gateFailures = 0;
  let hardErrors = 0;

  for (const slug of slugs) {
    const r = await renderSlug(slug, write);
    if (r.error) {
      console.error(`✗ ${slug}: ${r.error}`);
      hardErrors++;
      continue;
    }
    const issues: string[] = [];
    if (r.unknown.length) issues.push(`${r.unknown.length} unknown (${r.unknown.join(', ')})`);
    if (r.ungrouped.length) issues.push(`${r.ungrouped.length} ungrouped (${r.ungrouped.join(', ')})`);
    if (issues.length) gateFailures++;
    console.log(`${issues.length ? '⚠' : '✓'} ${slug}: wrote ${r.wrote.join(', ')}${issues.length ? ` — ${issues.join('; ')}` : ''}`);
  }

  if (hardErrors > 0) process.exit(1);
  if (check && gateFailures > 0) {
    console.error(
      `\nGate failed: ${gateFailures} manifest(s) have unknown or ungrouped members. ` +
        `File newly documented members into a group, or fix stale manifest keys.`
    );
    process.exit(1);
  }
}

main();
