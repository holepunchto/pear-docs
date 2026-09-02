/**
 * Reference docs accuracy audit (Phase 2–4 helper for the review plan).
 *
 * This script supports the manual API/CLI review of the 17 reference pages under
 * `content/bare/reference/{building-blocks,helpers,tools}/` (moved from
 * `content/reference/...` in the Phase 6 physical reorg — see
 * docs/plans/PEAR-BARE-SPLIT-PITCH.md). It does not replace reading
 * upstream READMEs or running quickstarts; it automates the first pass:
 *
 *   1. Structural checks — frontmatter, stub detection (single GitHub link only).
 *   2. Symbol inventory — every `#### \`...\`` under `## API Reference` (libraries)
 *      or every `## \`command\`` section (tools).
 *   3. Upstream text search — each symbol is reduced to search terms and looked up
 *      in a local clone of the matching repo (see UPSTREAM_MAP for slug → folder).
 *
 * Prerequisites (one-time):
 *
 *   mkdir -p /tmp/pear-upstream && cd /tmp/pear-upstream
 *   # holepunchto repos from the plan, plus these renames:
 *   git clone --depth 1 https://github.com/holepunchto/mirror-drive.git
 *   git clone --depth 1 https://github.com/holepunchto/hyperswarm-secret-stream.git
 *   git clone --depth 1 https://github.com/bitfinexcom/hypertele.git
 *
 * Usage:
 *
 *   UPSTREAM_ROOT=/tmp/pear-upstream npm run audit:reference-docs
 *
 * Exit code:
 *
 *   0 — all pages pass structural checks (no stubs, valid frontmatter).
 *   1 — at least one page is still a stub or has frontmatter issues.
 *
 * Symbol misses are printed as REVIEW items but do not fail the process: the text
 * search is shallow (first ~80 source files, word-boundary match) and often misses
 * valid docs (async-iter examples, protomux channel callbacks, CLI heading text).
 * Treat "not found in upstream" as a manual follow-up, not a CI blocker.
 *
 * Full review log: docs/REFERENCE_DOCS_REVIEW_LOG.md
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

/** Override with `UPSTREAM_ROOT` when clones live somewhere other than /tmp. */
const UPSTREAM_ROOT = process.env.UPSTREAM_ROOT ?? '/tmp/pear-upstream';

/**
 * Maps each MDX filename slug to the directory name under UPSTREAM_ROOT.
 * Required when the npm package / repo name differs from the docs slug
 * (e.g. mirrordrive → mirror-drive, secretstream → hyperswarm-secret-stream).
 */
const UPSTREAM_MAP: Record<string, string> = {
  autobase: 'autobase',
  hyperbee: 'hyperbee',
  hypercore: 'hypercore',
  hyperdht: 'hyperdht',
  hyperdrive: 'hyperdrive',
  hyperswarm: 'hyperswarm',
  'compact-encoding': 'compact-encoding',
  corestore: 'corestore',
  localdrive: 'localdrive',
  mirrordrive: 'mirror-drive',
  protomux: 'protomux',
  secretstream: 'hyperswarm-secret-stream',
  drives: 'drives',
  hyperbeam: 'hyperbeam',
  hypershell: 'hypershell',
  hyperssh: 'hyperssh',
  hypertele: 'hypertele',
};

/** The three reference subtrees included in the audit. */
const CATEGORIES = [
  { dir: 'content/p2p/reference/building-blocks', type: 'library' as const },
  { dir: 'content/p2p/reference/helpers', type: 'library' as const },
  { dir: 'content/p2p/reference/tools', type: 'cli' as const },
];

/**
 * Collects API symbols from library/helper pages.
 * Only headings inside `## API Reference` count — matches the review plan checklist.
 * Example heading: `#### \`await core.append(block)\``
 */
function extractApiSymbols(mdx: string): string[] {
  const symbols: string[] = [];
  const apiSection = mdx.split('## API Reference')[1];
  if (!apiSection) return symbols;

  const re = /^#### `([^`]+)`/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(apiSection)) !== null) {
    symbols.push(m[1].trim());
  }
  return symbols;
}

/**
 * Collects documented CLI commands from tool pages.
 * Tool docs use `## \`drives mirror <src> <dst>\`` for each command section.
 */
function extractCliSections(mdx: string): string[] {
  const sections: string[] = [];
  const re = /^## `([^`]+)`/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mdx)) !== null) {
    sections.push(m[1].trim());
  }
  return sections;
}

/**
 * Turns a full heading string into one or more grep-friendly identifiers.
 * e.g. `await core.append(buf)` → `append`; `new Hypercore(...)` → `Hypercore`.
 */
function symbolToSearchTerms(symbol: string): string[] {
  const terms = new Set<string>();
  terms.add(symbol);

  const methodMatch = symbol.match(/\.([a-zA-Z_$][\w$]*)\s*\(/);
  if (methodMatch) terms.add(methodMatch[1]);

  const ctorMatch = symbol.match(/new\s+([A-Za-z_$][\w$]*)/);
  if (ctorMatch) terms.add(ctorMatch[1]);

  const propMethod = symbol.match(/\.([a-zA-Z_$][\w$]*)$/);
  if (propMethod) terms.add(propMethod[1]);

  return [...terms];
}

/**
 * Best-effort check that a symbol appears somewhere in the upstream repo.
 * Walks up to depth 4, reads up to 80 .js/.ts/.md files, word-boundary match.
 * Returns false if the repo is missing or no term matches — not proof the API is wrong.
 */
function searchUpstream(repoPath: string, terms: string[]): boolean {
  if (!existsSync(repoPath)) return false;

  const files: string[] = [];
  function walk(dir: string, depth = 0) {
    if (depth > 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(js|mjs|cjs|ts|md)$/i.test(e.name)) files.push(p);
    }
  }
  walk(repoPath);

  const haystack = files
    .slice(0, 80)
    .map((f) => {
      try {
        return readFileSync(f, 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');

  return terms.some((t) => {
    if (t.length < 2) return false;
    return new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(
      haystack
    );
  });
}

/** Phase 1 structural checklist: required frontmatter for reference API pages. */
function checkFrontmatter(mdx: string, file: string): string[] {
  const issues: string[] = [];
  const fm = mdx.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    issues.push('missing frontmatter');
    return issues;
  }
  const block = fm[1];
  if (!/docType:\s*reference/.test(block))
    issues.push('docType should be reference');
  if (!/schemaType:\s*APIReference/.test(block))
    issues.push('schemaType should be APIReference');
  if (!/title:/.test(block)) issues.push('missing title');
  if (!/description:/.test(block)) issues.push('missing description');
  return issues;
}

type PageReport = {
  file: string;
  slug: string;
  type: 'library' | 'cli';
  frontmatterIssues: string[];
  symbols: string[];
  symbolResults: { symbol: string; found: boolean }[];
  cliSections: string[];
  bodyLength: number;
  isStub: boolean;
};

const reports: PageReport[] = [];

for (const { dir, type } of CATEGORIES) {
  const fullDir = join(process.cwd(), dir);
  if (!existsSync(fullDir)) continue;

  for (const file of readdirSync(fullDir).filter((f) => f.endsWith('.mdx'))) {
    const slug = basename(file, '.mdx');
    const path = join(fullDir, file);
    const mdx = readFileSync(path, 'utf8');
    const body = mdx.replace(/^---[\s\S]*?---\r?\n?/, '').trim();

    const report: PageReport = {
      file: path,
      slug,
      type,
      frontmatterIssues: checkFrontmatter(mdx, path),
      symbols: [],
      symbolResults: [],
      cliSections: [],
      bodyLength: body.length,
      // Pre-migration pages were a single markdown link to GitHub — reject that shape.
      isStub: /^\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)$/.test(body),
    };

    const upstreamDir = join(UPSTREAM_ROOT, UPSTREAM_MAP[slug] ?? slug);

    if (type === 'library') {
      report.symbols = extractApiSymbols(mdx);
      for (const symbol of report.symbols) {
        const terms = symbolToSearchTerms(symbol);
        const found = searchUpstream(upstreamDir, terms);
        report.symbolResults.push({ symbol, found });
      }
    } else {
      report.cliSections = extractCliSections(mdx);
      for (const section of report.cliSections) {
        const found = searchUpstream(upstreamDir, [
          section,
          section.replace(/-/g, ''),
        ]);
        report.symbolResults.push({ symbol: section, found });
      }
    }

    reports.push(report);
  }
}

// Human-readable report for paste into PR #287 or the review log.
let totalSymbols = 0;
let foundSymbols = 0;
let missingSymbols = 0;

console.log('# Reference docs audit report\n');
console.log(`Upstream root: ${UPSTREAM_ROOT}\n`);

for (const r of reports) {
  const missing = r.symbolResults.filter((s) => !s.found);
  totalSymbols += r.symbolResults.length;
  foundSymbols += r.symbolResults.length - missing.length;
  missingSymbols += missing.length;

  const status =
    r.frontmatterIssues.length === 0 && !r.isStub && missing.length === 0
      ? 'PASS'
      : 'REVIEW';

  console.log(`## ${r.slug} (${status})`);
  console.log(`- file: ${r.file}`);
  console.log(`- body length: ${r.bodyLength}`);
  if (r.frontmatterIssues.length)
    console.log(`- frontmatter: ${r.frontmatterIssues.join(', ')}`);
  if (r.isStub) console.log('- WARNING: still a link stub');
  console.log(
    `- symbols: ${r.symbolResults.length - missing.length}/${r.symbolResults.length} found in upstream`
  );
  if (missing.length > 0) {
    console.log('- **not found in upstream (verify manually):**');
    for (const m of missing.slice(0, 15)) {
      console.log(`  - \`${m.symbol}\``);
    }
    if (missing.length > 15)
      console.log(`  - ... and ${missing.length - 15} more`);
  }
  console.log('');
}

console.log('---');
console.log(
  `Total: ${foundSymbols}/${totalSymbols} symbols matched upstream text search`
);
console.log(
  `Pages: ${reports.filter((r) => r.frontmatterIssues.length === 0 && !r.isStub).length}/${reports.length} pass structural checks`
);

const exitCode = reports.some((r) => r.isStub || r.frontmatterIssues.length > 0)
  ? 1
  : 0;

process.exit(exitCode);
