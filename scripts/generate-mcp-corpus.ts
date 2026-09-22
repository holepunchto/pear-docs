/**
 * Post-build: generates the retrieval corpus the docs MCP server consumes.
 *
 * Writes two files into `out/mcp/`, which ship with the ordinary static deploy
 * of `published`:
 *
 *   - `corpus.json`   : every page's markdown plus heading-anchored chunks.
 *   - `manifest.json` : counts, timestamps and `corpusHash` — a few hundred
 *                       bytes, so the search service can poll it cheaply and
 *                       only pull the multi-megabyte corpus when it changed.
 *
 * This replaces the old arrangement where the search service kept its own
 * vendored copy of the extraction logic, cloned this repo to run it, and
 * committed the ~12MB result into its own git history. The docs repo is the
 * only place that knows how a content file becomes a URL, so it is the right
 * place to emit the corpus; the service now only embeds it.
 *
 * Deliberately produces NO vectors. Embedding needs the QVAC native addon and
 * runs 10-40 minutes on CPU — far too heavy for a site build. `corpusHash` is
 * what lets the service skip that work: it re-embeds only when the hash moves,
 * and the hash is computed exactly the way the service's own index builder
 * computes it (sha256 over `[id, content]` pairs, in chunk order).
 *
 * Run after `next build`: tsx scripts/generate-mcp-corpus.ts
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';
import { getFiles, fileToSlug, stripInlineMarkdown, CONTENT_DIR } from './helpers';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_PATH = path.join(ROOT, CONTENT_DIR);
const OUT_DIR = path.join(ROOT, 'out', 'mcp');

/**
 * Bumped when the shape of `corpus.json` changes incompatibly. The service
 * refuses a corpus it does not understand rather than silently indexing
 * fields that moved.
 */
const CORPUS_VERSION = 1;

const MAX_RAW_CHARS = 2600; // per-chunk LLM-context budget (code is verbose)
// Budget for the WHOLE embedded string (label + prose). The embedder hard-caps
// its input at 1000 chars, so reserving extra room for the label here would
// only drop the tail of long sections before the model ever saw it.
const MAX_PROSE_CHARS = 1000;
const FENCE = '```';

// Tags the strippers may delete. Everything else inside angle brackets is prose:
// the reference docs are full of type notation (`<Buffer>`, `<String|null>`)
// and URL placeholders (`pear://<stage-link>`), which an unrestricted
// `<[A-Za-z/][^>]*>` rule ate — removing the very tokens a reader searches for,
// and desyncing the heading anchors from the rendered site.
const HTML_TAGS =
  'a|abbr|b|blockquote|br|button|code|col|colgroup|dd|details|div|dl|dt|em|figcaption|figure|' +
  'footer|g|h1|h2|h3|h4|h5|h6|header|hr|i|iframe|img|input|kbd|label|li|main|mark|nav|ol|p|path|' +
  'picture|pre|s|script|section|small|source|span|strong|sub|summary|sup|svg|table|tbody|td|' +
  'tfoot|th|thead|tr|u|ul|video';
// MDX components registered by the site (mdx-components.tsx + src/components).
const MDX_COMPONENTS =
  'Accordion|Accordions|Banner|Callout|Card|Cards|File|Files|Folder|Image|ImageGrid|ImageZoom|' +
  'KeetIcon|KeetModal|Mermaid|MermaidZoom|PearIcon|Status|Step|Steps|Tab|Tabs|TypeTable|include';
const TAG_RE = new RegExp(`</?(?:${HTML_TAGS}|${MDX_COMPONENTS})(?:\\s[^>]*)?/?>`, 'gi');

export interface DocChunk {
  id: string;
  url: string; // canonical page URL with trailing slash
  anchor: string; // heading slug for deep-linking ('' for the lead section)
  title: string; // page title (frontmatter)
  heading: string; // section heading ('' for the lead section)
  content: string; // prose-only text (embedded + used for snippets)
  raw: string; // code-preserving markdown (RAG context)
}

export interface DocPage {
  url: string;
  title: string;
  description: string;
  markdown: string; // code-preserving full-page markdown (MCP fetch_doc)
}

function slugToUrl(slug: string): string {
  if (slug === '/' || slug === '') return '/';
  return `${slug.replace(/\/+$/, '')}/`;
}

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}

// Fenced block whose info string carries `file=<token>` (remark-code-import).
const FILE_FENCE = new RegExp(`${FENCE}([^\\n]*\\bfile=(\\S+)[^\\n]*)\\n[\\s\\S]*?${FENCE}`, 'g');
const ANY_FENCE = new RegExp(`${FENCE}[\\s\\S]*?${FENCE}`, 'g');

/**
 * Apply a `remark-code-import` line fragment (`#L10-L20`, `#L10`, `#L10-`) to a
 * file's text. Without this the WHOLE file is inlined for a fence that asked for
 * a handful of lines — and since the chunk is then truncated at MAX_RAW_CHARS,
 * the excerpt the page actually shows can fall off the end entirely.
 */
function sliceLines(text: string, fragment: string): string {
  const m = fragment.match(/^L(\d+)(?:-(?:L(\d+))?)?$/i);
  if (!m) return text;
  const start = Math.max(1, Number(m[1]));
  const lines = text.split('\n');
  const end = m[2] ? Number(m[2]) : /-$/.test(fragment) ? lines.length : start;
  return lines.slice(start - 1, Math.max(start, end)).join('\n');
}

/** Inline `file=<rootDir>/path` code fences from the referenced source files. */
async function resolveCodeImports(body: string): Promise<string> {
  // Keyed by the full token (path + optional `#Lx-Ly`), so two fences quoting
  // different ranges of the same file each resolve to their own excerpt.
  const tokens = [...new Set([...body.matchAll(FILE_FENCE)].map((m) => m[2]))];
  const contents = new Map<string, string | null>();
  await Promise.all(
    tokens.map(async (tok) => {
      try {
        const cleaned = tok.replace(/^["']|["']$/g, '');
        const hash = cleaned.indexOf('#');
        const rel = (hash === -1 ? cleaned : cleaned.slice(0, hash)).replace('<rootDir>/', '');
        const fragment = hash === -1 ? '' : cleaned.slice(hash + 1);
        const text = await readFile(path.join(ROOT, rel), 'utf-8');
        contents.set(tok, (fragment ? sliceLines(text, fragment) : text).trim());
      } catch (e) {
        // Leave the fence unresolved but warn — otherwise a moved/deleted code
        // file silently ships a literal `file=…` marker into the corpus.
        console.warn(`⚠ code import unresolved: ${tok} (${(e as Error).message})`);
        contents.set(tok, null);
      }
    }),
  );
  return body.replace(FILE_FENCE, (full, info: string, tok: string) => {
    const c = contents.get(tok);
    if (c == null) return full;
    const lang = info.trim().split(/\s+/)[0] || '';
    return `${FENCE}${lang}\n${c}\n${FENCE}`;
  });
}

/** Fumadocs `<include>path</include>` partial (path is relative to the includer). */
const INCLUDE_RE = /<include>\s*([^<\s]+)\s*<\/include>/g;

/**
 * Inline `<include>` partials, before code-import resolution so a snippet's own
 * `file=` fences resolve too. Deleting them instead would drop the shared
 * callout text the docs deliberately factored into `_snippets/` from every page
 * that includes it — invisible to both search and the RAG context.
 */
async function resolveIncludes(body: string, fileDir: string, depth = 0): Promise<string> {
  if (depth > 3 || !INCLUDE_RE.test(body)) return body; // depth guard: snippets nest
  INCLUDE_RE.lastIndex = 0;
  const tokens = [...new Set([...body.matchAll(INCLUDE_RE)].map((m) => m[1]))];
  const contents = new Map<string, string | null>();
  await Promise.all(
    tokens.map(async (tok) => {
      try {
        const abs = path.resolve(fileDir, tok);
        const text = await readFile(abs, 'utf-8');
        // Snippets carry their own frontmatter; keep only the body.
        contents.set(
          tok,
          await resolveIncludes(parseFrontmatter(text).body.trim(), path.dirname(abs), depth + 1),
        );
      } catch (e) {
        console.warn(`⚠ include unresolved: ${tok} (${(e as Error).message})`);
        contents.set(tok, null);
      }
    }),
  );
  return body.replace(INCLUDE_RE, (full, tok: string) => contents.get(tok) ?? full);
}

/** Code-preserving cleanup: drop imports/JSX noise but keep fences + prose. */
function toRichMarkdown(body: string): string {
  // Protect fenced blocks AND inline code spans so the tag stripper can't touch
  // them. Inline spans matter as much as fences: the reference pages write type
  // notation as `` `Pear.app.key <Buffer|null>` ``, and stripping the angle
  // brackets out of those removes the signature readers search for.
  const blocks: string[] = [];
  const protect = (m: string) => `@@CODEBLOCK${blocks.push(m) - 1}@@`;
  let s = body.replace(ANY_FENCE, protect).replace(/`[^`\n]+`/g, protect);
  s = s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^import\s.+$/gm, '')
    .replace(/^export\s.+$/gm, '')
    .replace(TAG_RE, '') // known HTML/MDX tags only (code is protected above)
    .replace(/\n{3,}/g, '\n\n');
  return s.replace(/@@CODEBLOCK(\d+)@@/g, (_, i) => blocks[Number(i)]).trim();
}

/** Reduce rich markdown to plain prose (for embedding + snippets). */
function toProse(rich: string): string {
  return rich
    .replace(ANY_FENCE, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Strip *…*/**…** emphasis only. Underscores are left untouched so
    // identifiers like pear_run, snake_case and __proto__ survive intact — a
    // `[*_]{1,3}` rule splits them mid-word. Genuine _underscore emphasis_ in
    // prose just keeps its literal underscores, which is harmless to embed.
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Fence-aware split into heading sections (never splits inside a code block). */
function splitSections(md: string): { heading: string; body: string }[] {
  const lines = md.split('\n');
  const secs: { heading: string; lines: string[] }[] = [{ heading: '', lines: [] }];
  let inCode = false;
  for (const line of lines) {
    if (line.trimStart().startsWith(FENCE)) inCode = !inCode;
    const h = !inCode ? line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/) : null;
    if (h) secs.push({ heading: h[1].trim(), lines: [] });
    else secs.at(-1)!.lines.push(line);
  }
  return secs.map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }));
}

/**
 * Hash of the retrieval-relevant corpus: chunk ids paired with the exact text
 * that gets embedded, in order.
 *
 * `JSON.stringify` per pair rather than a hand-picked delimiter, so an id or
 * body that happens to contain the delimiter cannot produce the same hash for
 * a genuinely different corpus. The search service computes this identically —
 * if the two ever drift, it will re-embed on every poll (wasteful) or, worse,
 * keep stale vectors against new text. Change one side only with the other.
 */
function hashCorpus(chunks: DocChunk[]): string {
  const h = createHash('sha256');
  for (const c of chunks) h.update(JSON.stringify([c.id, c.content]));
  return h.digest('hex');
}

/** Build the full corpus: per-page records + flattened retrieval chunks. */
export async function buildCorpus(): Promise<{ pages: DocPage[]; chunks: DocChunk[] }> {
  const files = await getFiles(CONTENT_PATH);
  const pages: DocPage[] = [];
  const chunks: DocChunk[] = [];

  for (const file of files) {
    const fileRaw = await readFile(file, 'utf-8');
    const { data, body } = parseFrontmatter(fileRaw);
    // `fileToSlug` strips the FIRST occurrence of the literal string 'content',
    // so hand it a repo-relative path. An absolute path whose ancestors happen
    // to contain "content" would have the wrong segment stripped, mangling
    // every URL indexed and cited.
    const url = slugToUrl(fileToSlug(path.relative(ROOT, file)));
    const title = data.title || url;

    const included = await resolveIncludes(body, path.dirname(file));
    const resolved = await resolveCodeImports(included);
    const rich = toRichMarkdown(resolved);

    pages.push({
      url,
      title,
      description: data.description || '',
      markdown: `# ${title}\n\n${rich}`,
    });

    const slugger = new GithubSlugger();
    splitSections(rich).forEach((sec, i) => {
      // Slug the heading the way the site does (rehype-slug over the rendered
      // text), i.e. from the ORIGINAL heading with only inline markdown
      // removed. Slugging a tag-stripped heading yields `#pearappkey` for a
      // section the site publishes as `#pearappkey-buffernull`, so every such
      // citation lands at the top of the page instead of at the section.
      const anchor = sec.heading ? slugger.slug(stripInlineMarkdown(sec.heading)) : '';
      const prose = toProse(sec.body);
      if (!prose.trim()) return; // skip code-only/empty sections for retrieval
      const label = `${title}${sec.heading ? ` — ${sec.heading}` : ''}`;
      const content = `${label}\n${prose}`.slice(0, MAX_PROSE_CHARS);
      const raw = `${label}\n${sec.body}`.slice(0, MAX_RAW_CHARS);
      chunks.push({ id: `${url}#${i}`, url, anchor, title, heading: sec.heading, content, raw });
    });
  }

  return { pages, chunks };
}

async function main(): Promise<void> {
  const t0 = Date.now();
  const { pages, chunks } = await buildCorpus();

  // `Object.fromEntries` silently keeps the LAST record for a repeated key, and
  // sibling `x.mdx` + `x/index.mdx` both slug to `/x/`. That would drop one page
  // from the MCP `fetch_doc` tool while still indexing both files' chunks under
  // the same URL — so the per-page diversity cap would treat them as one page
  // and a citation could deep-link to an anchor that only exists on the page we
  // discarded. Fail the build instead of publishing a quietly wrong corpus.
  const seen = new Map<string, string>();
  for (const p of pages) {
    const prev = seen.get(p.url);
    if (prev) {
      throw new Error(
        `Duplicate page URL ${p.url}: "${prev}" and "${p.title}" both map to it. Rename one file.`,
      );
    }
    seen.set(p.url, p.title);
  }

  const corpusHash = hashCorpus(chunks);
  const builtAt = new Date().toISOString();
  const corpus = {
    version: CORPUS_VERSION,
    builtAt,
    corpusHash,
    pages: Object.fromEntries(pages.map((p) => [p.url, p])),
    chunks,
  };
  const body = JSON.stringify(corpus);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'corpus.json'), body);
  // The manifest is what the service polls. It carries a digest over the exact
  // bytes written above, so a truncated or half-deployed corpus is detectable
  // rather than silently indexed.
  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(
      {
        version: CORPUS_VERSION,
        builtAt,
        corpusHash,
        pageCount: pages.length,
        chunkCount: chunks.length,
        corpus: {
          path: 'corpus.json',
          bytes: Buffer.byteLength(body),
          sha256: createHash('sha256').update(body).digest('hex'),
        },
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `✓ Wrote out/mcp/corpus.json (${pages.length} pages, ${chunks.length} chunks, ` +
      `${(Buffer.byteLength(body) / 1e6).toFixed(1)}MB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
  console.log(`  corpusHash ${corpusHash.slice(0, 12)}…`);
}

main().catch((e) => {
  console.error('✖ MCP corpus generation failed:', e);
  process.exit(1);
});
