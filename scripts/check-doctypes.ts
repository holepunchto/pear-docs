// scripts/check-doctypes.ts
//
// Enforces the directory <-> docType invariant defined in
// decisions/0001-adopt-diataxis-ia.md §8. Every page under content/ must
// declare a `docType` in its frontmatter that matches the Diátaxis quadrant
// it lives in. The site-root index gets a special-case rule.
//
// What this prevents: a how-to landing in /reference/, an explanation
// landing in /how-to/, a faq sneaking back in. Once a directory is created
// the validator picks it up automatically — no schema list to maintain.
//
// Also enforces a second, unrelated invariant: every page must declare a
// valid `product` (pear/bare/shared) — see docs/plans/PEAR-BARE-SPLIT-PITCH.md.
// Unlike docType, product isn't directory-derived (a page's nav-tree home
// isn't its content/ path), so this just validates the value against the
// schema's enum rather than mapping it from the path.
//
// Run as `npm run check:doctypes`. Exit 0 on pass, 1 on any mismatch.
import { readFile } from 'fs/promises';
import { CONTENT_DIR, getFiles } from './helpers';

interface Mismatch {
  file: string;
  expected: string | string[];
  actual: string | null;
}

/** Keep in sync with `productSchema` in source.config.ts. */
const VALID_PRODUCTS = new Set(['pear', 'bare', 'shared']);

/**
 * Top-level directory under content/ -> required docType for every .mdx
 * inside (recursive). Singular, matching the @tetherto/docs-seo-schema
 * docType enum.
 *
 * `getting-started/` is a template-specific helper, not one of the four
 * Diátaxis quadrants. The Diátaxis skill classifies it as "tutorial in
 * spirit"; we keep it as its own top-level directory so the page sits
 * outside `tutorials/` (which is reserved for full multi-step lessons).
 */
const QUADRANT_DOCTYPE: Record<string, string> = {
  tutorials: 'tutorial',
  'how-to': 'how-to',
  reference: 'reference',
  explanation: 'explanation',
  'getting-started': 'getting-started',
  // Not a Diátaxis quadrant: the rolling changelog is a generic page, like
  // the site-root index.
  changelog: 'page',
};

/**
 * The site-root index is a quadrant launcher, so it uses the generic page
 * docType instead of pretending to be one of the four Diátaxis modes.
 */
const ROOT_INDEX = 'content/index.mdx';
const ROOT_INDEX_DOCTYPE = 'page';

/**
 * Files temporarily exempted from the dir<->docType rule. Empty today; the
 * FAQ exemption that lived here was retired when subtask 9 deconstructed
 * /reference/faq.mdx into the right quadrants.
 *
 * Anything new added here MUST come with a tracked-issue link in the
 * comment so it can't quietly accrue.
 */
const TEMPORARY_EXEMPTIONS: ReadonlySet<string> = new Set();

/**
 * Match a `docType:` line in the YAML frontmatter. Tolerates the three
 * forms Fumadocs/MDX writers actually use: bare word, single-quoted,
 * double-quoted. Multiline flag because frontmatter is at top of file.
 */
const DOCTYPE_RE = /^docType:\s*["']?([\w-]+)["']?\s*$/m;

/** Same tolerant matching as DOCTYPE_RE, for the `product:` frontmatter field. */
const PRODUCT_RE = /^product:\s*["']?([\w-]+)["']?\s*$/m;

function expectedDocType(file: string): string | null {
  const norm = file.replace(/\\/g, '/');

  if (norm === ROOT_INDEX) return ROOT_INDEX_DOCTYPE;

  // Strip the content/ prefix and pick the first path segment as the
  // quadrant. content/how-to/connect-to-peers/foo.mdx -> "how-to".
  const rel = norm.replace(/^content\//, '');
  const quadrant = rel.split('/')[0];

  return QUADRANT_DOCTYPE[quadrant] ?? null;
}

async function readFrontmatterField(file: string, re: RegExp): Promise<string | null> {
  const body = await readFile(file, 'utf-8');
  const match = body.match(re);
  return match ? match[1] : null;
}

async function main(): Promise<void> {
  console.log('🔍 Checking docType <-> directory invariants...\n');

  const files = await getFiles(CONTENT_DIR);
  const mismatches: Mismatch[] = [];
  const productIssues: Mismatch[] = [];
  let exempted = 0;
  let unscoped = 0;

  for (const file of files) {
    const norm = file.replace(/\\/g, '/');
    if (TEMPORARY_EXEMPTIONS.has(norm)) {
      exempted++;
      continue;
    }

    const product = await readFrontmatterField(file, PRODUCT_RE);
    if (product === null || !VALID_PRODUCTS.has(product)) {
      productIssues.push({ file: norm, expected: [...VALID_PRODUCTS], actual: product });
    }

    const expected = expectedDocType(norm);
    if (expected === null) {
      // File outside the four quadrants and not the root index. Could be
      // a scratch page during a refactor; report but don't fail.
      unscoped++;
      console.log(`  ⚠ ${norm}: no rule for this path (skipped)`);
      continue;
    }

    const actual = await readFrontmatterField(file, DOCTYPE_RE);
    if (actual !== expected) {
      mismatches.push({ file: norm, expected, actual });
    }
  }

  console.log(
    `\nChecked ${files.length} files (${exempted} exempted, ${unscoped} unscoped)\n`,
  );

  if (mismatches.length > 0) {
    console.log('❌ docType mismatches:\n');
    for (const { file, expected, actual } of mismatches) {
      console.log(`   ${file}`);
      console.log(`     expected: docType: ${expected}`);
      console.log(`     actual:   docType: ${actual ?? '(missing)'}\n`);
    }
    console.log(
      'Fix by either editing the page\'s frontmatter or moving the file ' +
        'to the matching quadrant. See decisions/0001-adopt-diataxis-ia.md §8.',
    );
  }

  if (productIssues.length > 0) {
    console.log('❌ Missing or invalid `product` frontmatter:\n');
    for (const { file, expected, actual } of productIssues) {
      console.log(`   ${file}`);
      console.log(`     expected one of: ${(expected as string[]).join(' | ')}`);
      console.log(`     actual:          ${actual ?? '(missing)'}\n`);
    }
    console.log(
      'Fix by adding `product: pear | bare | shared` to the page\'s frontmatter. ' +
        'See docs/plans/PEAR-BARE-SPLIT-PITCH.md.',
    );
  }

  if (mismatches.length > 0 || productIssues.length > 0) {
    process.exit(1);
  }

  console.log('✅ All pages declare the right docType for their directory, and a valid product.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
