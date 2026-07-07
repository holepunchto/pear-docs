// scripts/bare-refgen/select.ts
//
// Pick which modules to document. Candidates are every bare-* module that ships
// TypeScript declarations (per the research dossier); they're ranked by npm
// download count. If the registry is unreachable we fall back to the dossier's
// inbound-dependency count so the pipeline still runs offline/in CI sandboxes.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { RESEARCH_JSON, TOP_N, ALLOWLIST, MIN_DOWNLOADS, DOWNLOADS_JSON } from './config';

interface ResearchRec {
  name: string;
  hasTypes: boolean;
  inboundDeps: number;
}

export interface Selection {
  name: string;
  downloads: number;
  inboundDeps: number;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Last-month downloads, retrying through transient rate-limits (HTTP 429). */
async function lastMonthDownloads(name: string, tries = 4): Promise<number | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
      if (res.ok) {
        const json = (await res.json()) as { downloads?: number };
        return typeof json.downloads === 'number' ? json.downloads : null;
      }
      if (res.status !== 429 && res.status < 500) return null; // genuine miss
    } catch {
      /* network blip — retry */
    }
    await sleep(400 * (attempt + 1)); // back off before the next try
  }
  return null;
}

/** Run `fn` over `items` at most `limit` at a time (avoids bursting the registry). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function selectModules(n: number = TOP_N): Promise<Selection[]> {
  const records = JSON.parse(await readFile(RESEARCH_JSON, 'utf8')) as ResearchRec[];
  const candidates = records.filter((r) => r.hasTypes);

  const cache: Record<string, number> = existsSync(DOWNLOADS_JSON)
    ? JSON.parse(await readFile(DOWNLOADS_JSON, 'utf8'))
    : {};

  const withCounts = await mapLimit(candidates, 8, async (r) => {
    const live = await lastMonthDownloads(r.name);
    if (live != null) cache[r.name] = live; // refresh the cache on a good fetch
    // Fall back to the cached count so a rate-limited fetch never drops a module.
    return { name: r.name, inboundDeps: r.inboundDeps, downloads: live ?? cache[r.name] ?? null };
  });

  const sortedCache = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  await writeFile(DOWNLOADS_JSON, JSON.stringify(sortedCache, null, 2) + '\n');

  const gotCounts = withCounts.some((r) => r.downloads !== null);
  if (!gotCounts) {
    console.warn('⚠ no download counts (API down, no cache) — ranking by inbound-dependency count instead.');
  }

  const ranked = withCounts
    .map((r) => ({ name: r.name, downloads: r.downloads ?? 0, inboundDeps: r.inboundDeps }))
    .sort((a, b) => (gotCounts ? b.downloads - a.downloads : b.inboundDeps - a.inboundDeps));

  // Base set: everything above the download threshold, else the top N.
  const min = MIN_DOWNLOADS;
  const base = min != null ? ranked.filter((r) => r.downloads >= min) : ranked.slice(0, n);

  // Always include the curated allowlist (kept even if below the cut).
  const chosen = new Map(base.map((r) => [r.name, r]));
  for (const name of ALLOWLIST) {
    if (chosen.has(name)) continue;
    const rec = ranked.find((r) => r.name === name);
    if (rec) chosen.set(name, rec);
    else console.warn(`⚠ allowlist module "${name}" is not a bare-* candidate with types — skipped.`);
  }
  return [...chosen.values()].sort((a, b) => b.downloads - a.downloads);
}
