// scripts/bare-refgen/index.ts
//
// Driver: pick the top-N most-downloaded bare-* modules that ship .d.ts, fetch
// each published tarball, extract its API from the type declarations, render an
// MDX page (using the per-module layout manifest when present), and write both
// the page and the intermediate api-model.json to generated/bare-refs/.
//
// Writes to the preview dir by default. `--write` ALSO overwrites the published
// page in content/ (see `generateOne`), so any hand-edit made directly to
// content/reference/bare/modules/*.mdx is lost on the next `--write` run —
// change the generator or the module's layout manifest instead.
//
//   npm run gen:bare-refs                          # regenerate all, preview only
//   npm run gen:bare-refs -- --only bare-fs,bare-os
//   npm run gen:bare-refs -- --only bare-dns --write   # promote into content/
//
// Run: npx tsx scripts/bare-refgen/index.ts

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ORG,
  OUT_DIR,
  CONTENT_DIR,
  TOP_N,
  VERSIONS_JSON,
  CATALOG_MDX,
  RESEARCH_JSON,
  FAMILY,
  STABILITY_COLORS,
  stabilityOf,
} from './config';
import { selectModules } from './select';
import { fetchPackage, cleanupDepCache } from './fetch';
import { extractModule } from './extract';
import { loadLayout } from './layout';
import { renderPage } from './render';
import type { BareModel } from './model';

/** README `## Usage` body, captured verbatim by the family's research dossier. */
async function usageFromResearch(name: string): Promise<string | null> {
  if (!RESEARCH_JSON) return null; // family has no dossier (pear) — omit Usage
  try {
    const recs = JSON.parse(await readFile(RESEARCH_JSON, 'utf8')) as Array<{ name: string; usage: string | null }>;
    return recs.find((r) => r.name === name)?.usage ?? null;
  } catch {
    return null;
  }
}

/** Other top-level README sections (CLI flags, protocol specs, …), captured verbatim by the same dossier. */
async function extraSectionsFromResearch(name: string): Promise<Array<{ heading: string; body: string }>> {
  if (!RESEARCH_JSON) return [];
  try {
    const recs = JSON.parse(await readFile(RESEARCH_JSON, 'utf8')) as Array<{
      name: string;
      extraSections?: Array<{ heading: string; body: string }>;
    }>;
    return recs.find((r) => r.name === name)?.extraSections ?? [];
  } catch {
    return [];
  }
}

function parseOnly(): string[] | null {
  const i = process.argv.indexOf('--only');
  if (i === -1) return null;
  return (process.argv[i + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function parseTop(): number {
  const i = process.argv.indexOf('--top');
  const n = i === -1 ? NaN : Number(process.argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : TOP_N;
}

/** Merge the just-generated versions into the version cache (release poll input). */
async function updateVersions(versions: Record<string, string>): Promise<void> {
  const existing: Record<string, string> = existsSync(VERSIONS_JSON)
    ? JSON.parse(await readFile(VERSIONS_JSON, 'utf8'))
    : {};
  const merged = { ...existing, ...versions };
  const sorted = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
  await writeFile(VERSIONS_JSON, JSON.stringify(sorted, null, 2) + '\n');
}

/**
 * Merge this run's skip outcomes into the `_skipped.json` cache. `names` is
 * only the modules touched by this run (the full selection, or `--only`'s
 * narrower list) — entries for every other module are left untouched so an
 * `--only` run can't clobber skip status recorded by earlier runs. Modules
 * IN `names` get their status fully replaced (added if newly skipped,
 * dropped if they now ship usable .d.ts), mirroring updateVersions' per-key
 * overwrite above but for an array instead of a dict.
 */
export async function updateSkipped(skippedPath: string, names: string[], skipped: string[]): Promise<void> {
  const existing: string[] = existsSync(skippedPath) ? JSON.parse(await readFile(skippedPath, 'utf8')) : [];
  const touched = new Set(names);
  const retained = existing.filter((name) => !touched.has(name));
  const merged = Array.from(new Set([...retained, ...skipped])).sort();
  await writeFile(skippedPath, JSON.stringify(merged, null, 2) + '\n');
}

/**
 * Section new catalog rows land under when a module has no existing row at
 * all. It's a parking spot, not a judgment call about where the module
 * belongs — `todo.ts` flags every name added this way so a person moves it to
 * the right section.
 */
const FALLBACK_SECTION = '## Other utilities';

/**
 * Non-destructively keep each module's catalog row current: ensure it links to
 * the reference page and carries the right stability. Curated prose is left
 * intact — only the reference link is appended (if missing) and the stability
 * cell is set. Modules with no row at all get a new 2-column row appended
 * under `FALLBACK_SECTION` (description from `package.json`, never
 * fabricated); the caller records those for the TODO report.
 */
async function syncCatalog(names: string[], descriptions: Record<string, string | null>): Promise<string[]> {
  if (!existsSync(CATALOG_MDX)) return [];
  const lines = (await readFile(CATALOG_MDX, 'utf8')).split('\n');
  let changed = false;
  const matched = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split('|');
    if (cells.length < 3) continue; // not a table row
    const name = names.find((n) => cells[1].includes(`[${n}]`));
    if (!name) continue;
    matched.add(name);
    const refLink = `/reference/bare/modules/${name}`;
    if (!cells[2].includes(refLink)) {
      cells[2] = `${cells[2].trimEnd()} — [reference](${refLink}) `;
      changed = true;
    }
    // Stability is a styled <mark> badge, in whichever cell holds it (table
    // layouts vary — 2-column "Other utilities" has none). Only rewrite when
    // the LEVEL changed, preserving the existing cell (and formatting) otherwise.
    const stabilityCellIndex = cells.findIndex((c) => /stable|experimental|deprecated|unstable/.test(c));
    if (stabilityCellIndex !== -1) {
      const wantedLevel = stabilityOf(name);
      const currentLevel = cells[stabilityCellIndex].match(/stable|experimental|deprecated|unstable/)?.[0];
      if (currentLevel !== wantedLevel) {
        const color = STABILITY_COLORS[wantedLevel];
        cells[stabilityCellIndex] = ` <mark style={{ backgroundColor: '${color}', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 500 }}>${wantedLevel}</mark> `;
        changed = true;
      }
    }
    lines[i] = cells.join('|');
  }

  const added: string[] = [];
  const missing = names.filter((n) => !matched.has(n));
  if (missing.length) {
    const headingIndex = lines.findIndex((l) => l.trim() === FALLBACK_SECTION);
    if (headingIndex === -1) {
      console.warn(`  ⚠ syncCatalog: fallback section "${FALLBACK_SECTION}" not found in ${CATALOG_MDX} — cannot add rows for: ${missing.join(', ')}`);
    } else {
      // The section's table is the first "| --- |" separator row after the
      // heading; new rows go immediately after it (top of that table), or
      // right after the heading's intro paragraph if the table is empty.
      let insertAt = headingIndex + 1;
      for (let i = headingIndex + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
        if (/^\|[\s-]*\|/.test(lines[i]) || lines[i].startsWith('| ---')) {
          insertAt = i + 1;
          break;
        }
      }
      for (const name of missing) {
        const desc = descriptions[name]?.trim() || '(no package.json description)';
        const row = `| [${name}](https://github.com/${ORG}/${name}) | ${desc} — [reference](/reference/bare/modules/${name}) |`;
        lines.splice(insertAt, 0, row);
        insertAt++;
        added.push(name);
        changed = true;
      }
    }
  }

  if (changed) await writeFile(CATALOG_MDX, lines.join('\n'));
  return added;
}

async function generateOne(
  name: string,
  generatedAt: string,
  write: boolean,
  skipped: string[],
): Promise<{ orphans: string[]; version: string; description: string | null } | null> {
  const pkg = await fetchPackage(name);
  try {
    if (!pkg.entryDts) {
      console.warn(`  ⚠ ${name}: no .d.ts shipped in the published package — skipping.`);
      skipped.push(name);
      return null;
    }
    const model: BareModel = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      repoUrl: pkg.repoUrl,
      npmUrl: `https://www.npmjs.com/package/${pkg.name}`,
      minBare: pkg.minBare,
      native: pkg.native,
      dependencies: pkg.bareDependencies,
      usage: await usageFromResearch(name),
      extraSections: await extraSectionsFromResearch(name),
      exports: extractModule(pkg.entryDts, pkg.name),
      subpaths: pkg.subpaths.map((s) => ({
        name: s.name,
        exports: extractModule(s.dts, s.name),
      })),
      generatedAt,
    };

    // A declaration that yields nothing (e.g. a body-less shorthand ambient
    // module) is as undocumentable as no .d.ts at all — skip rather than render
    // an empty page, and clear any stale output from earlier runs.
    if (model.exports.length === 0 && model.subpaths.every((s) => s.exports.length === 0)) {
      console.warn(`  ⚠ ${name}: declarations yield no extractable exports — skipping.`);
      skipped.push(name);
      await rm(join(OUT_DIR, `${name}.mdx`), { force: true });
      await rm(join(OUT_DIR, name), { recursive: true, force: true });
      return null;
    }
    const layout = await loadLayout(name);
    const { mdx, orphans } = renderPage(model, layout);

    const dir = join(OUT_DIR, name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'api-model.json'), JSON.stringify(model, null, 2) + '\n');
    await writeFile(join(OUT_DIR, `${name}.mdx`), mdx);
    if (write) {
      await mkdir(CONTENT_DIR, { recursive: true });
      await writeFile(join(CONTENT_DIR, `${name}.mdx`), mdx);
    }

    const exportCount = model.exports.length;
    const layoutNote = layout ? (orphans.length ? `layout · ${orphans.length} auto-grouped` : 'layout') : 'by-kind';
    const dest = write ? ` → ${CONTENT_DIR}/` : '';
    console.log(`  ✓ ${name}@${pkg.version} — ${exportCount} top-level exports · ${layoutNote}${dest}`);
    return { orphans, version: pkg.version, description: model.description };
  } finally {
    await pkg.cleanup();
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const only = parseOnly();
  let names: string[];
  if (only) {
    names = only;
    console.log(`📘 Generating bare refs for: ${names.join(', ')}\n`);
  } else {
    const top = parseTop();
    console.log(`📘 Selecting bare-* modules with type declarations (top ${top} by downloads + allowlist)...\n`);
    const selection = await selectModules(top);
    selection.forEach((s, i) =>
      console.log(`  ${String(i + 1).padStart(2)}. ${s.name} — ${s.downloads.toLocaleString()} downloads/mo`),
    );
    console.log('');
    names = selection.map((s) => s.name);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();

  let ok = 0;
  const versions: Record<string, string> = {};
  const descriptions: Record<string, string | null> = {};
  const skipped: string[] = [];
  try {
    for (const name of names) {
      try {
        const res = await generateOne(name, generatedAt, write, skipped);
        if (res) {
          ok++;
          versions[name] = res.version;
          descriptions[name] = res.description;
        }
      } catch (err) {
        console.error(`  ✗ ${name}: ${(err as Error).message}`);
      }
    }
  } finally {
    // The shared dependency-vendor cache (see fetch.ts) is run-scoped, not
    // per-package — clean it up once, after every module has been generated.
    await cleanupDepCache();
  }

  await updateVersions(versions);
  // Record modules that were selected but ship no usable .d.ts, so the TODO can
  // flag them (they need upstream types before they can be documented).
  await updateSkipped(join(OUT_DIR, '_skipped.json'), names, skipped);
  if (write) {
    const added = await syncCatalog(Object.keys(versions), descriptions);
    // Record modules that got a brand-new catalog row under the fallback
    // section, so the TODO can flag them for a human to move to the right
    // section (syncCatalog guesses a parking spot, not a category).
    await writeFile(join(OUT_DIR, '_catalog-added.json'), JSON.stringify(added.sort(), null, 2) + '\n');
  }

  console.log(`\n✅ Wrote ${ok}/${names.length} pages to ${write ? CONTENT_DIR : OUT_DIR}/`);
  if (skipped.length) console.log(`   ⚠ skipped (no .d.ts shipped): ${skipped.join(', ')}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
