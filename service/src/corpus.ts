/**
 * Corpus extraction for the QVAC docs search service.
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
// Reuse the docs tooling's file walk + slug mapping (single source of truth).
import { getFiles, fileToSlug } from '../../scripts/helpers.ts';

const SERVICE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(SERVICE_DIR, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content');

const MAX_RAW_CHARS = 2600; // per-chunk LLM-context budget (code is verbose)
const MAX_PROSE_CHARS = 1000; // per-chunk embedding budget (~< 512 tokens)
const FENCE = '```';

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

/** Inline `file=<rootDir>/path` code fences from the referenced source files. */
async function resolveCodeImports(body: string): Promise<string> {
  const tokens = [...new Set([...body.matchAll(FILE_FENCE)].map((m) => m[2]))];
  const contents = new Map<string, string | null>();
  await Promise.all(
    tokens.map(async (tok) => {
      try {
        const rel = tok.replace(/^["']|["']$/g, '').split('#')[0].replace('<rootDir>/', '');
        contents.set(tok, (await readFile(path.join(REPO_ROOT, rel), 'utf-8')).trim());
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

/** Code-preserving cleanup: drop imports/JSX noise but keep fences + prose. */
function toRichMarkdown(body: string): string {
  // Protect code blocks so the JSX/tag strippers don't touch code.
  const blocks: string[] = [];
  let s = body.replace(ANY_FENCE, (m) => `@@CODEBLOCK${blocks.push(m) - 1}@@`);
  s = s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^import\s.+$/gm, '')
    .replace(/^export\s.+$/gm, '')
    .replace(/<include>[\s\S]*?<\/include>/g, '')
    .replace(/<[A-Za-z/][^>]*>/g, '') // JSX/HTML tags (code is protected above)
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
    const relForSlug = file.slice(file.indexOf('content'));
    const url = slugToUrl(fileToSlug(relForSlug));
    const title = data.title || url;

    const resolved = await resolveCodeImports(body);
    const rich = toRichMarkdown(resolved);

    pages.push({ url, title, description: data.description || '', markdown: `# ${title}\n\n${rich}` });

    const slugger = new GithubSlugger();
    splitSections(rich).forEach((sec, i) => {
      const anchor = sec.heading ? slugger.slug(sec.heading) : '';
      const prose = toProse(sec.body);
      if (!prose.trim()) return; // skip code-only/empty sections for retrieval
      const label = `${title}${sec.heading ? ` — ${sec.heading}` : ''}`;
      const content = `${label}\n${prose}`.slice(0, MAX_PROSE_CHARS + label.length);
      const raw = `${label}\n${sec.body}`.slice(0, MAX_RAW_CHARS);
      chunks.push({ id: `${url}#${i}`, url, anchor, title, heading: sec.heading, content, raw });
    });
  }

  return { pages, chunks };
}
