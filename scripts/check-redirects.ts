/**
 * E2E redirect verifier. Runs against the built `out/` directory after
 * `npm run build` (which triggers postbuild = scripts/generate-redirect-
 * stubs.ts). For every redirect derived from scripts/redirects.ts, asserts:
 *
 *   1. out/<from>/index.html exists.
 *   2. The HTML contains `meta http-equiv="refresh"` pointing at the new URL.
 *   3. The HTML contains `link rel="canonical"` pointing at the new URL.
 *   4. out/_redirects contains a line like `<from> <to> 308`.
 *   5. out/_redirects ends with the catch-all 404 rule from public/_redirects.
 *
 * Designed to be wired into CI alongside check:internal-links so the IA
 * can't drift back. See decisions/0001-adopt-diataxis-ia.md §6.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildRedirects } from './redirects';

interface Failure {
  from: string;
  to: string;
  reason: string;
}

const OUT_DIR = 'out';

function main(): void {
  console.log('🔍 Verifying redirect stubs and _redirects…\n');

  const redirects = buildRedirects();
  if (redirects.length === 0) {
    console.error('❌ No redirects derived from content/. Did the IA shape change?');
    process.exit(1);
  }

  const redirectsPath = join(OUT_DIR, '_redirects');
  if (!existsSync(redirectsPath)) {
    console.error(`❌ ${redirectsPath} is missing. Did postbuild run?`);
    process.exit(1);
  }
  const redirectsFile = readFileSync(redirectsPath, 'utf-8');
  const catchAllRule = '/*   /404.html   404';

  const failures: Failure[] = [];

  if (!redirectsFile.includes(catchAllRule)) {
    failures.push({
      from: catchAllRule,
      to: '/404.html',
      reason: 'catch-all 404 rule from public/_redirects is missing',
    });
  }

  if (!redirectsFile.trimEnd().endsWith(catchAllRule)) {
    failures.push({
      from: catchAllRule,
      to: '/404.html',
      reason: 'catch-all 404 rule must be the last active rule in out/_redirects',
    });
  }

  for (const { from, to } of redirects) {
    const stubPath = join(OUT_DIR, from, 'index.html');

    if (!existsSync(stubPath)) {
      failures.push({ from, to, reason: `stub missing at ${stubPath}` });
      continue;
    }

    const stub = readFileSync(stubPath, 'utf-8');

    // The whitespace inside meta http-equiv="refresh" content="..." is fixed
    // by stubHtml(); a strict match catches any drift.
    const refresh = `meta http-equiv="refresh" content="0; url=${to}"`;
    if (!stub.includes(refresh)) {
      failures.push({ from, to, reason: `meta-refresh tag missing or wrong target` });
    }

    const canonical = `link rel="canonical" href="${to}"`;
    if (!stub.includes(canonical)) {
      failures.push({ from, to, reason: `canonical link missing or wrong target` });
    }

    const redirectLine = `${from} ${to} 308`;
    if (!redirectsFile.includes(redirectLine)) {
      failures.push({ from, to, reason: `not present in out/_redirects (expected line: "${redirectLine}")` });
    }
  }

  console.log(`Checked ${redirects.length} redirects (${redirects.length * 2} assertions per row + 1 _redirects file)\n`);

  if (failures.length > 0) {
    console.log(`❌ ${failures.length} failure(s):\n`);
    for (const { from, to, reason } of failures) {
      console.log(`   ${from} → ${to}`);
      console.log(`     ${reason}\n`);
    }
    process.exit(1);
  }

  console.log('✅ All redirect stubs and _redirects entries are valid!');
}

main();
