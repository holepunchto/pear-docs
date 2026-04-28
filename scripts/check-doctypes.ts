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
// Run as `npm run check:doctypes`. Exit 0 on pass, 1 on any mismatch.
import { readFile } from 'fs/promises';
import { CONTENT_DIR, getFiles } from './helpers';

interface Mismatch {
  file: string;
  expected: string | string[];
  actual: string | null;
}

/**
 * Top-level directory under content/ -> required docType for every .mdx
 * inside (recursive). Singular, matching the @tetherto/docs-seo-schema
 * docType enum.
 */
const QUADRANT_DOCTYPE: Record<string, string> = {
  tutorials: 'tutorial',
  'how-to': 'how-to',
  reference: 'reference',
  explanation: 'explanation',
};

/**
 * The site-root index is conceptually an explanation (it tells you what
 * Pear *is*) so it gets the explanation docType. ADR §8 calls this out
 * as a special case.
 */
const ROOT_INDEX = 'content/index.mdx';
const ROOT_INDEX_DOCTYPE = 'explanation';

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

function expectedDocType(file: string): string | null {
  const norm = file.replace(/\\/g, '/');

  if (norm === ROOT_INDEX) return ROOT_INDEX_DOCTYPE;

  // Strip the content/ prefix and pick the first path segment as the
  // quadrant. content/how-to/connect-to-peers/foo.mdx -> "how-to".
  const rel = norm.replace(/^content\//, '');
  const quadrant = rel.split('/')[0];

  return QUADRANT_DOCTYPE[quadrant] ?? null;
}

async function readDocType(file: string): Promise<string | null> {
  const body = await readFile(file, 'utf-8');
  const match = body.match(DOCTYPE_RE);
  return match ? match[1] : null;
}

async function main(): Promise<void> {
  console.log('🔍 Checking docType <-> directory invariants...\n');

  const files = await getFiles(CONTENT_DIR);
  const mismatches: Mismatch[] = [];
  let exempted = 0;
  let unscoped = 0;

  for (const file of files) {
    const norm = file.replace(/\\/g, '/');
    if (TEMPORARY_EXEMPTIONS.has(norm)) {
      exempted++;
      continue;
    }

    const expected = expectedDocType(norm);
    if (expected === null) {
      // File outside the four quadrants and not the root index. Could be
      // a scratch page during a refactor; report but don't fail.
      unscoped++;
      console.log(`  ⚠ ${norm}: no rule for this path (skipped)`);
      continue;
    }

    const actual = await readDocType(file);
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
    process.exit(1);
  }

  console.log('✅ All pages declare the right docType for their directory.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
