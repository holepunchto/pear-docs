/**
 * Postbuild: emit static-export redirect artifacts into out/.
 *
 *   1. HTML meta-refresh stubs at every legacy path:
 *        out/<from>/index.html  ->  redirects to <to>
 *      Survives any static host with zero deploy-side config.
 *
 *   2. A Sevalla / Netlify / Cloudflare-Pages compatible _redirects
 *      file at out/_redirects, with one `<from> <to> 308` line per
 *      entry plus static rules from public/_redirects (e.g. catch-all 404).
 *
 * Both are derived from scripts/redirects.ts to keep a single source
 * of truth. See decisions/0001-adopt-diataxis-ia.md §6.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { buildRedirects, stubHtml } from './redirects';

const OUT_DIR = 'out';
const STATIC_REDIRECTS_PATH = 'public/_redirects';

/** Active rules from public/_redirects (comments and blank lines skipped). */
function readStaticRedirects(): string[] {
  if (!existsSync(STATIC_REDIRECTS_PATH)) {
    return [];
  }

  return readFileSync(STATIC_REDIRECTS_PATH, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function main(): void {
  const redirects = buildRedirects();

  const staticRedirects = readStaticRedirects();

  if (redirects.length === 0 && staticRedirects.length === 0) {
    console.warn('⚠️  No redirects to emit (content/ tree empty?).');
    return;
  }

  let stubsWritten = 0;
  for (const { from, to } of redirects) {
    const indexPath = join(OUT_DIR, from, 'index.html');
    mkdirSync(dirname(indexPath), { recursive: true });
    writeFileSync(indexPath, stubHtml(to));
    stubsWritten++;
  }

  // _redirects: simple 3-column format (`<from> <to> <status>`) understood
  // by Netlify, Cloudflare Pages, Sevalla, and most static hosts. Each line
  // is a permanent redirect (308 — same semantics as the meta-refresh stub
  // but without the round-trip). Static rules from public/_redirects (e.g.
  // the catch-all 404) are appended last so they stay after IA redirects.
  const generatedRedirects = redirects.map(({ from, to }) => `${from} ${to} 308`);
  const redirectsFile = [...generatedRedirects, ...staticRedirects].join('\n') + '\n';
  writeFileSync(join(OUT_DIR, '_redirects'), redirectsFile);

  console.log(
    `✅ Wrote ${stubsWritten} redirect stubs and out/_redirects (${redirects.length} generated + ${staticRedirects.length} static rules).`,
  );
}

main();
