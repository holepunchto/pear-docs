/**
 * Corpus extraction for the docs search service.
 *
 * Reuses the docs repo's own page-enumeration + slug logic (`scripts/helpers.ts`)
 * so the URLs we index/cite are byte-for-byte the ones the link checker validates
 * — no Next.js runtime required. Each page is split into heading-anchored chunks.
 *
 * Two text representations are produced per chunk:
 *   - `content` : prose only (code stripped) → what we EMBED. Keeps vectors within
 *     the embedder's 512-token budget and matches on meaning.
 *   - `raw`     : code-preserving markdown (with `file=<rootDir>/…` transclusions
 *     resolved, mirroring the docs' `remark-code-import`) → the CONTEXT the RAG
 *     answer is grounded in, so "ask" can show real code, not invented snippets.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
// THE docs tooling's own file walk and slug mapping — not a copy of it.
//
// When this service lived in its own repository these two functions had to be
// vendored, and that vendored copy carried a standing warning: `fileToSlug`
// decides the URLs we index, cite and deep-link, so if the docs site ever
// changed how a file maps to a slug and the copy did not follow, every citation
// we emit would silently point at a URL that no longer exists. Living in the
// docs repo removes the copy, and with it that entire failure mode — the link
// checker and the search index now derive their URLs from one function.
import { getFiles, fileToSlug } from '../../scripts/helpers.ts';

/**
 * Root of the docs tree to index: expects `<root>/content/**` and resolves code
 * fences written as `file=<rootDir>/path` against it.
 *
 * That is the repo root, one level up from `service/`. Resolved from this file
 * rather than from cwd so the index build works from anywhere.
 *
 * `content` must stay directly under this root — `fileToSlug` strips the literal
 * segment "content" to form the URL, so the two are not independently movable.
 */
const REPO_ROOT = process.env.DOCS_ROOT
  ? path.resolve(process.env.DOCS_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// NB: this module is BUILD-TIME ONLY, which is why it lives under scripts/ and
// not lib/. It reaches out of `service/` into the docs tooling, and `next build`
// type-checks everything tsconfig.json includes — a Sevalla build whose Build
// path is `service` cannot see the repo root, so a lib/ placement would fail
// the deploy on a module that never ships.
const CONTENT_DIR = path.join(REPO_ROOT, 'content');

const MAX_RAW_CHARS = 2600; // per-chunk LLM-context budget (code is verbose)
// Per-chunk embedding budget (~< 512 tokens). This is the budget for the WHOLE
// embedded string (label + prose), because the embedder hard-caps its input at
// 1000 chars — reserving extra room for the label here just meant the tail of
// long sections was silently dropped before it ever reached the model.
const MAX_PROSE_CHARS = 1000;
const FENCE = '```';

// Tags the strippers may delete. Everything else inside angle brackets is prose:
// the reference docs are full of type notation (`<Buffer>`, `<String|null>`,
// `<Integer>`) and URL placeholders (`pear://<stage-link>`, `<productName>`),
// which an unrestricted `<[A-Za-z/][^>]*>` rule ate — removing the very tokens a
// reader searches for, and desyncing our heading anchors from the rendered site.
const HTML_TAGS =
  'a|abbr|b|blockquote|br|button|code|col|colgroup|dd|details|div|dl|dt|em|figcaption|figure|' +
  'footer|g|h1|h2|h3|h4|h5|h6|header|hr|i|iframe|img|input|kbd|label|li|main|mark|nav|ol|p|path|' +
  'picture|pre|s|script|section|small|source|span|strong|sub|summary|sup|svg|table|tbody|td|' +
  'tfoot|th|thead|tr|u|ul|video';
// MDX components registered by the docs site (mdx-components.tsx + src/components).
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}

// Fenced block whose info string carries `file=<token>` (remark-code-import).
const FILE_FENCE = new RegExp(`${FENCE}([^\\n]*\\bfile=(\\S+)[^\\n]*)\\n[\\s\\S]*?${FENCE}`, 'g');
const ANY_FENCE = new RegExp(`${FENCE}[\\s\\S]*?${FENCE}`, 'g');

/**
 * Apply a `remark-code-import` line fragment (`#L10-L20`, `#L10`, `#L10-` ) to a
 * file's text. Without this the WHOLE file was inlined for a fence that asked for
 * a handful of lines — and since the chunk is then truncated at MAX_RAW_CHARS, the
 * excerpt the page actually shows could fall off the end entirely.
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
        const text = await readFile(path.join(REPO_ROOT, rel), 'utf-8');
        contents.set(tok, (fragment ? sliceLines(text, fragment) : text).trim());
      } catch (e) {
        // Leave the fence unresolved but warn — otherwise a moved/deleted code
        // file silently ships a literal `file=…` marker into the index.
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
 * Inline `<include>` partials. These were previously deleted outright, so shared
 * callout text (the `_snippets/` the docs deliberately factored out) was missing
 * from every page that includes it — invisible to both search and the RAG context.
 * Runs before code-import resolution so a snippet's own `file=` fences resolve too.
 */
async function resolveIncludes(body: string, fileDir: string, depth = 0): Promise<string> {
  if (depth > 3 || !INCLUDE_RE.test(body)) return body; // depth guard: snippets can nest
  INCLUDE_RE.lastIndex = 0;
  const tokens = [...new Set([...body.matchAll(INCLUDE_RE)].map((m) => m[1]))];
  const contents = new Map<string, string | null>();
  await Promise.all(
    tokens.map(async (tok) => {
      try {
        const abs = path.resolve(fileDir, tok);
        const text = await readFile(abs, 'utf-8');
        // Snippets carry their own frontmatter; keep only the body.
        contents.set(tok, await resolveIncludes(parseFrontmatter(text).body.trim(), path.dirname(abs), depth + 1));
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
  // them. Inline spans matter as much as fences here: the reference docs write
  // their type notation as `` `Pear.app.key <Buffer|null>` ``, and stripping the
  // angle brackets out of those removed the signature readers search for.
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
    // Strip *…*/**…** emphasis only. Underscores are left untouched so identifiers
    // like pear_run, snake_case, __proto__ and __init__.py survive intact — the old
    // `[*_]{1,3}` rule split them mid-word. Any genuine _underscore emphasis_ in
    // prose just keeps its literal underscores, which is harmless for embedding.
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Mirror of `stripInlineMarkdown` in scripts/helpers.ts, which is what the docs'
 * own anchor extractor feeds to github-slugger. Kept byte-identical on purpose:
 * if these two ever disagree, our deep links stop matching the rendered site.
 */
function stripInlineMarkdown(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url)
    .replace(/[*_`~]+/g, '') // emphasis / code spans
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

/** Build the full corpus: per-page records + flattened retrieval chunks. */
export async function buildCorpus(): Promise<{ pages: DocPage[]; chunks: DocChunk[] }> {
  const files = await getFiles(CONTENT_DIR);
  const pages: DocPage[] = [];
  const chunks: DocChunk[] = [];

  for (const file of files) {
    const fileRaw = await readFile(file, 'utf-8');
    const { data, body } = parseFrontmatter(fileRaw);
    // `fileToSlug` strips the FIRST occurrence of the literal string 'content',
    // so hand it a repo-relative path. Slicing at `indexOf('content')` on the
    // absolute path would latch onto any ancestor directory containing that
    // substring and mangle every URL we index and cite.
    const url = slugToUrl(fileToSlug(path.relative(REPO_ROOT, file)));
    const title = data.title || url;

    const included = await resolveIncludes(body, path.dirname(file));
    const resolved = await resolveCodeImports(included);
    const rich = toRichMarkdown(resolved);

    pages.push({ url, title, description: data.description || '', markdown: `# ${title}\n\n${rich}` });

    const slugger = new GithubSlugger();
    splitSections(rich).forEach((sec, i) => {
      // Slug the heading exactly the way the site does (rehype-slug over the
      // rendered text), i.e. from the ORIGINAL heading with only inline markdown
      // removed. Slugging a tag-stripped heading produced deep links like
      // `#pearappkey` for a section the site publishes as `#pearappkey-buffernull`,
      // so every such citation landed at the top of the page instead of the section.
      const anchor = sec.heading ? slugger.slug(stripInlineMarkdown(sec.heading)) : '';
      const prose = toProse(sec.body);
      if (!prose.trim()) return; // skip code-only/empty sections for retrieval
      const label = `${title}${sec.heading ? ` — ${sec.heading}` : ''}`;
      // Budget covers label + prose: the embedder truncates at MAX_PROSE_CHARS.
      const content = `${label}\n${prose}`.slice(0, MAX_PROSE_CHARS);
      const raw = `${label}\n${sec.body}`.slice(0, MAX_RAW_CHARS);
      chunks.push({ id: `${url}#${i}`, url, anchor, title, heading: sec.heading, content, raw });
    });
  }

  return { pages, chunks };
}
