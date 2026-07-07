// scripts/bare-refgen/index.ts
//
// Driver: pick the top-N most-downloaded bare-* modules that ship .d.ts, fetch
// each published tarball, extract its API from the type declarations, render an
// MDX page (using the per-module layout manifest when present), and write both
// the page and the intermediate api-model.json to generated/bare-refs/.
//
// Writes ONLY to the preview dir — never to content/. Manual command:
//   npm run gen:bare-refs            # regenerate all
//   npm run gen:bare-refs -- --only bare-fs,bare-os
//
// Run: npx tsx scripts/bare-refgen/index.ts

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR, CONTENT_DIR, TOP_N, VERSIONS_JSON, CATALOG_MDX, STABILITY_COLORS, stabilityOf } from './config';
import { selectModules } from './select';
import { fetchPackage } from './fetch';
import { extractModule } from './extract';
import { loadLayout } from './layout';
import { renderPage } from './render';
import type { BareModel } from './model';

const RESEARCH_JSON = 'docs/bare-modules-research.json';

/** README `## Usage` body, captured verbatim by the research script. */
async function usageFromResearch(name: string): Promise<string | null> {
  try {
    const recs = JSON.parse(await readFile(RESEARCH_JSON, 'utf8')) as Array<{ name: string; usage: string | null }>;
    return recs.find((r) => r.name === name)?.usage ?? null;
  } catch {
    return null;
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
 * Non-destructively keep each module's catalog row current: ensure it links to
 * the reference page and carries the right stability. Curated prose is left
 * intact — only the reference link is appended (if missing) and the stability
 * cell is set.
 */
async function syncCatalog(names: string[]): Promise<void> {
  if (!existsSync(CATALOG_MDX)) return;
  const lines = (await readFile(CATALOG_MDX, 'utf8')).split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split('|');
    if (cells.length < 6) continue; // not a 4-column table row
    const name = names.find((n) => cells[1].includes(`[${n}]`));
    if (!name) continue;
    const refLink = `/reference/bare/modules/${name}`;
    if (!cells[2].includes(refLink)) {
      cells[2] = `${cells[2].trimEnd()} — [reference](${refLink}) `;
      changed = true;
    }
    // Stability is a styled <mark> badge. Only rewrite when the LEVEL changed,
    // preserving the existing cell (and its formatting) otherwise.
    const wantedLevel = stabilityOf(name);
    const currentLevel = cells[4].match(/stable|experimental|deprecated|unstable/)?.[0];
    if (currentLevel !== wantedLevel) {
      const color = STABILITY_COLORS[wantedLevel];
      cells[4] = ` <mark style={{ backgroundColor: '${color}', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 500 }}>${wantedLevel}</mark> `;
      changed = true;
    }
    lines[i] = cells.join('|');
  }
  if (changed) await writeFile(CATALOG_MDX, lines.join('\n'));
}

async function generateOne(
  name: string,
  generatedAt: string,
  write: boolean,
  skipped: string[],
): Promise<{ orphans: string[]; version: string } | null> {
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
      usage: await usageFromResearch(name),
      exports: extractModule(pkg.entryDts, pkg.pkgDir),
      subpaths: pkg.subpaths.map((s) => ({
        name: s.name,
        exports: extractModule(s.dts, pkg.pkgDir),
      })),
      generatedAt,
    };
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
    return { orphans, version: pkg.version };
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
  const skipped: string[] = [];
  for (const name of names) {
    try {
      const res = await generateOne(name, generatedAt, write, skipped);
      if (res) {
        ok++;
        versions[name] = res.version;
      }
    } catch (err) {
      console.error(`  ✗ ${name}: ${(err as Error).message}`);
    }
  }

  await updateVersions(versions);
  // Record modules that were selected but ship no usable .d.ts, so the TODO can
  // flag them (they need upstream types before they can be documented).
  await writeFile(join(OUT_DIR, '_skipped.json'), JSON.stringify(skipped.sort(), null, 2) + '\n');
  if (write) await syncCatalog(Object.keys(versions));

  console.log(`\n✅ Wrote ${ok}/${names.length} pages to ${write ? CONTENT_DIR : OUT_DIR}/`);
  if (skipped.length) console.log(`   ⚠ skipped (no .d.ts shipped): ${skipped.join(', ')}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
