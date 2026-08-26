// scripts/check-cross-links.ts
//
// Two reports in one pass over content/:
//
//   1. Cross-link coverage — for every "canonical" page (the building-blocks,
//      helpers, tools, and a curated list of high-traffic reference / how-to
//      pages), find prose mentions of that page's term in other pages and
//      record how many of those mentions are wrapped in *any* markdown link
//      versus left as bare prose. Reports per-term coverage so PRs that
//      introduce orphan mentions get flagged.
//
//   2. Orphan inventory — count inbound MDX-to-MDX links for every content
//      page. Pages with 0 inbound links from other content pages are hard
//      orphans (only reachable via the sidebar) and fail the build. Pages
//      with 1 inbound link are low-inbound and reported as warnings.
//
// Config:
//   - `--strict` : also fail on low-inbound pages and on coverage below
//     COVERAGE_FLOOR (default 50%) for any canonical term that has ≥3
//     mentions across the site.
//   - Exempt slugs: quadrant landings and `/` are excluded from the orphan
//     check because they're reachable from the root navigation by design.
//
// See `decisions/0001-adopt-diataxis-ia.md` §8 for context on why
// cross-link coverage matters separately from broken-link checks.

import { readFile } from 'fs/promises';
import {
  CONTENT_DIR,
  fileToSlug,
  getFiles,
  extractLinks,
  type InternalLink,
} from './helpers';

interface Canonical {
  /** Page slug, e.g. `/reference/building-blocks/hypercore`. */
  slug: string;
  /** Display term to look for in prose, case-insensitively. */
  term: string;
  /** Optional alternate spellings (rare — most modules have one canonical name). */
  aliases?: string[];
}

interface CoverageRow {
  slug: string;
  term: string;
  totalMentions: number;
  linkedMentions: number;
  unlinkedHits: { file: string; line: number; preview: string }[];
}

interface OrphanRow {
  slug: string;
  inboundCount: number;
  inboundFiles: string[];
}

const COVERAGE_FLOOR = 0.5;
const COVERAGE_REPORT_MIN_MENTIONS = 3;

const EXEMPT_FROM_ORPHAN = new Set<string>([
  '/',
  '/pear/how-to',
  '/pear/reference',
  '/pear/explanation',
  // Bare's own root and quadrant landings, reachable from the
  // ProductSwitcher / sidebar rather than through content-to-content links —
  // see docs/plans/PEAR-BARE-SPLIT-PITCH.md. Bare's explanation landing is
  // the repurposed content/bare/explanation/use-bare-standalone.mdx, which
  // picks up inbound links like any other content page, so it isn't listed
  // here.
  '/bare',
  '/bare/how-to',
  '/bare/reference',
]);

const STRICT = process.argv.includes('--strict');

/** Curated canonical terms for pages whose title isn't a single distinctive word. */
const CURATED_CANONICALS: Canonical[] = [
  { slug: '/pear/reference/pear/cli', term: 'Pear CLI', aliases: ['`pear` CLI'] },
  { slug: '/pear/reference/pear/runtime', term: '`pear-runtime`', aliases: ['pear-runtime module'] },
  { slug: '/pear/reference/pear/configuration', term: 'Pear configuration' },
  { slug: '/pear/reference/pear/api', term: 'Pear API' },
  { slug: '/pear/reference/modules/pear-modules', term: 'Pear modules' },
  { slug: '/bare/reference/modules/bare-modules', term: 'Bare modules' },
  { slug: '/pear/explanation/runtime-and-languages', term: 'Runtime and languages' },
  { slug: '/pear/explanation/storage-and-distribution', term: 'Storage and distribution' },
  { slug: '/pear/explanation/dependencies-and-network', term: 'Dependencies and network' },
];

/**
 * Build the canonical-term list:
 *   - everything under /bare/reference/{building-blocks,helpers,tools}, with
 *     the term derived from the file basename (titlecased)
 *   - merged with the curated list above
 */
function buildCanonicals(files: string[]): Canonical[] {
  const fromTree: Canonical[] = [];
  const moduleDirs = [
    '/bare/reference/building-blocks/',
    '/bare/reference/helpers/',
    '/bare/reference/tools/',
  ];
  for (const file of files) {
    const slug = fileToSlug(file);
    if (!moduleDirs.some((d) => slug.startsWith(d))) continue;
    const basename = slug.split('/').pop()!;
    const term = prettifyModuleName(basename);
    fromTree.push({ slug, term });
  }
  return [...fromTree, ...CURATED_CANONICALS];
}

function prettifyModuleName(basename: string): string {
  // hypercore → Hypercore, hyperdht → HyperDHT, compact-encoding → Compact-encoding.
  const specialCase: Record<string, string> = {
    hyperdht: 'HyperDHT',
    hyperssh: 'HyperSSH',
  };
  if (specialCase[basename]) return specialCase[basename];
  return basename
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

interface CleanedContent {
  /** Body with frontmatter and fenced code blocks stripped. */
  body: string;
  /** Ranges within `body` that are inside any markdown link text `[…](…)`. */
  linkedRanges: [number, number][];
}

function clean(raw: string): CleanedContent {
  const withoutFrontmatter = raw.replace(/^---\n[\s\S]*?\n---\n/, '\n');
  const body = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
    .replace(/~~~[\s\S]*?~~~/g, (m) => ' '.repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length))
    // Heading lines aren't prose; per the project's no-links-in-headers rule
    // we don't expect canonical terms inside them to be linked.
    .replace(/^[ \t]*#{1,6}[ \t][^\n]*$/gm, (m) => ' '.repeat(m.length));

  const linkedRanges: [number, number][] = [];
  const linkRe = /\[([^\]]+)\]\(((?:[^)(]|\([^)]*\))*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(body)) !== null) {
    const textStart = m.index + 1;
    const textEnd = textStart + m[1].length;
    linkedRanges.push([textStart, textEnd]);
  }
  return { body, linkedRanges };
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termRegex(canonical: Canonical): RegExp {
  const variants = [canonical.term, ...(canonical.aliases ?? [])]
    .map(escapeForRegex)
    .join('|');
  // Match case-sensitively so a canonical term like "Drives" doesn't collide
  // with the common verb "drives". Module names are proper nouns; that's
  // exactly what we want to flag.
  return new RegExp(`(^|[^\\w-])(${variants})(?=$|[^\\w-])`, 'g');
}

function lineForOffset(text: string, offset: number): { line: number; preview: string } {
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineEnd = text.indexOf('\n', offset);
  const preview = text
    .slice(lineStart, lineEnd === -1 ? text.length : lineEnd)
    .trim()
    .slice(0, 160);
  return { line, preview };
}

function isInside(offset: number, ranges: [number, number][]): boolean {
  for (const [start, end] of ranges) {
    if (offset >= start && offset < end) return true;
  }
  return false;
}

async function main(): Promise<void> {
  console.log('🔍 Auditing cross-link coverage and orphan pages…\n');

  const files = await getFiles(CONTENT_DIR);
  const canonicals = buildCanonicals(files);

  // --- Pass 1: parse every file once, capture cleaned body + outbound links.
  type Parsed = {
    file: string;
    slug: string;
    cleaned: CleanedContent;
    raw: string;
    outbound: InternalLink[];
  };
  const parsed: Parsed[] = [];
  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    parsed.push({
      file,
      slug: fileToSlug(file),
      cleaned: clean(raw),
      raw,
      outbound: extractLinks(raw).internal,
    });
  }

  // --- Cross-link coverage --------------------------------------------------
  const coverage: CoverageRow[] = [];
  for (const canonical of canonicals) {
    const re = termRegex(canonical);
    let totalMentions = 0;
    let linkedMentions = 0;
    const unlinkedHits: CoverageRow['unlinkedHits'] = [];

    for (const p of parsed) {
      // Don't count mentions inside the canonical page itself — a page
      // talking about its own subject shouldn't be flagged as needing a
      // self-link.
      if (p.slug === canonical.slug) continue;

      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(p.cleaned.body)) !== null) {
        // m.index points at the leading boundary char (or start-of-string);
        // the actual term starts after that boundary, captured in m[2].
        const termOffset = m.index + (m[1] ? m[1].length : 0);
        totalMentions++;
        if (isInside(termOffset, p.cleaned.linkedRanges)) {
          linkedMentions++;
        } else {
          const { line, preview } = lineForOffset(p.cleaned.body, termOffset);
          unlinkedHits.push({ file: p.file, line, preview });
        }
      }
    }

    coverage.push({
      slug: canonical.slug,
      term: canonical.term,
      totalMentions,
      linkedMentions,
      unlinkedHits,
    });
  }

  // --- Orphan inventory -----------------------------------------------------
  const inbound = new Map<string, Set<string>>();
  for (const p of parsed) inbound.set(p.slug, new Set());
  for (const p of parsed) {
    for (const link of p.outbound) {
      if (!link.path) continue; // anchor-only links don't count as inbound traffic.
      const target = inbound.get(link.path);
      if (!target) continue; // asset link or unknown — handled by check-internal-links.
      if (link.path === p.slug) continue; // ignore self-links.
      target.add(p.slug);
    }
  }
  const orphans: OrphanRow[] = [];
  for (const [slug, sources] of inbound) {
    if (EXEMPT_FROM_ORPHAN.has(slug)) continue;
    orphans.push({
      slug,
      inboundCount: sources.size,
      inboundFiles: [...sources].sort(),
    });
  }
  orphans.sort((a, b) => a.inboundCount - b.inboundCount || a.slug.localeCompare(b.slug));

  // --- Render ----------------------------------------------------------------
  console.log(`Checked ${parsed.length} files; ${canonicals.length} canonical terms.\n`);

  let hardFail = false;
  let strictFail = false;

  console.log('— Cross-link coverage —');
  console.log('(linked / total mentions across other content pages)\n');
  for (const row of coverage.sort((a, b) => coverageRatio(a) - coverageRatio(b))) {
    if (row.totalMentions === 0) {
      console.log(`   · ${row.term.padEnd(28)}  no prose mentions outside ${row.slug}`);
      continue;
    }
    const ratio = coverageRatio(row);
    const pct = `${(ratio * 100).toFixed(0)}%`.padStart(4);
    const status = ratio === 1 ? '✅' : ratio >= COVERAGE_FLOOR ? '·' : '⚠️';
    console.log(
      `   ${status} ${row.term.padEnd(28)}  ${row.linkedMentions}/${row.totalMentions}  (${pct})  → ${row.slug}`
    );
    if (ratio < COVERAGE_FLOOR && row.totalMentions >= COVERAGE_REPORT_MIN_MENTIONS) {
      strictFail = true;
      for (const hit of row.unlinkedHits.slice(0, 5)) {
        console.log(`        ${hit.file}:${hit.line}  ${hit.preview}`);
      }
      if (row.unlinkedHits.length > 5) {
        console.log(`        … ${row.unlinkedHits.length - 5} more`);
      }
    }
  }

  console.log('\n— Orphan inventory —');
  console.log('(inbound MDX-to-MDX links, excluding sidebar; quadrant landings exempt)\n');
  const hardOrphans = orphans.filter((o) => o.inboundCount === 0);
  const lowInbound = orphans.filter((o) => o.inboundCount === 1);

  if (hardOrphans.length === 0 && lowInbound.length === 0) {
    console.log('   ✅ Every page has ≥2 inbound links from other content pages.\n');
  } else {
    if (hardOrphans.length > 0) {
      hardFail = true;
      console.log(`   ❌ ${hardOrphans.length} hard orphan(s) — no other page links here:\n`);
      for (const row of hardOrphans) {
        console.log(`      ${row.slug}`);
      }
      console.log('');
    }
    if (lowInbound.length > 0) {
      console.log(`   ⚠️  ${lowInbound.length} low-inbound page(s) — only 1 other page links here:\n`);
      for (const row of lowInbound) {
        console.log(`      ${row.slug}  ← ${row.inboundFiles.join(', ')}`);
      }
      console.log('');
    }
  }

  if (hardFail) {
    console.log('❌ Hard orphans found. Add at least one inbound link to each.');
    process.exit(1);
  }
  if (STRICT && strictFail) {
    console.log(
      `❌ --strict: coverage below ${(COVERAGE_FLOOR * 100).toFixed(0)}% for one or more canonical terms with ≥${COVERAGE_REPORT_MIN_MENTIONS} mentions.`
    );
    process.exit(1);
  }
  if (STRICT && lowInbound.length > 0) {
    console.log('❌ --strict: low-inbound pages found.');
    process.exit(1);
  }

  console.log('✅ Cross-link audit complete.');
}

function coverageRatio(row: CoverageRow): number {
  if (row.totalMentions === 0) return 1;
  return row.linkedMentions / row.totalMentions;
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
