/**
 * Postbuild: emit static-export redirect artifacts into out/.
 *
 *   1. HTML meta-refresh stubs at every legacy path:
 *        out/<from>/index.html  ->  redirects to <to>
 *      Survives any static host with zero deploy-side config.
 *
 *   2. A Sevalla / Netlify / Cloudflare-Pages compatible _redirects
 *      file at out/_redirects. Follows the qvac docs strategy:
 *        - public/_redirects is the authored source (markdown negotiation,
 *          catch-all 404, etc.) and is copied into out/ by `next build`.
 *        - This script prepends generated IA 301 rules ahead of that file
 *          so legacy redirects stay first-match and public/_redirects
 *          rules (especially the catch-all 404) remain last.
 *        - The `Accept: text/markdown` rules are generated here, one per
 *          path depth, where public/_redirects has the marker line.
 *
 * IA redirects are derived from scripts/redirects.ts. See
 * decisions/0001-adopt-diataxis-ia.md §6.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { buildRedirects, stubHtml } from './redirects';
import { NEGOTIATION_MARKER, maxTwinDepth, negotiationRules } from './markdown-negotiation';

const OUT_DIR = 'out';
const PUBLIC_REDIRECTS_PATH = 'public/_redirects';

function readPublicRedirects(): string {
  if (!existsSync(PUBLIC_REDIRECTS_PATH)) {
    return '';
  }

  const source = readFileSync(PUBLIC_REDIRECTS_PATH, 'utf-8').trimEnd();
  if (!source.includes(NEGOTIATION_MARKER)) {
    throw new Error(`${PUBLIC_REDIRECTS_PATH} is missing the "${NEGOTIATION_MARKER}" line.`);
  }
  const depth = maxTwinDepth(OUT_DIR);
  if (depth === 0) {
    throw new Error(`No .md twins in ${OUT_DIR}/; run generate-llm-md-files.ts first.`);
  }
  return source.replace(NEGOTIATION_MARKER, negotiationRules(depth).join('\n'));
}

function main(): void {
  const redirects = buildRedirects();
  const publicRedirects = readPublicRedirects();

  if (redirects.length === 0 && publicRedirects.length === 0) {
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

  // `301!` — the force flag is required: a static meta-refresh stub exists at
  // each `from` path (written above), and on Sevalla/Kinsta/Cloudflare a
  // non-forced rule is shadowed by that static file (serves 200, rule never
  // fires). Force makes the host emit a real 301; the stub stays as the
  // zero-config fallback for hosts that don't read `_redirects`.
  const generatedRedirects = redirects.map(({ from, to }) => `${from} ${to} 301!`).join('\n');
  const redirectsFile =
    generatedRedirects && publicRedirects
      ? `${generatedRedirects}\n\n${publicRedirects}\n`
      : generatedRedirects
        ? `${generatedRedirects}\n`
        : `${publicRedirects}\n`;
  writeFileSync(join(OUT_DIR, '_redirects'), redirectsFile);

  console.log(
    `✅ Wrote ${stubsWritten} redirect stubs and out/_redirects (${redirects.length} generated IA rules + public/_redirects).`,
  );
}

main();
