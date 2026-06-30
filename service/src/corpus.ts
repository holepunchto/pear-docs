/**
 * Corpus extraction for the QVAC docs search service.
 *
 * Reuses the docs repo's own page-enumeration + slug logic (`scripts/helpers.ts`)
 * so the URLs we index/cite are byte-for-byte the ones the link checker validates
 * — no Next.js runtime required. Each page is split into heading-anchored chunks
 * that become the retrieval units.
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

export interface DocChunk {
  id: string;
  url: string; // canonical page URL with trailing slash, e.g. /how-to/connect-to-peers/
  anchor: string; // heading slug for deep-linking ('' for the lead section)
  title: string; // page title (frontmatter)
  heading: string; // section heading this chunk lives under ('' for the lead section)
  content: string; // plain-text chunk body (heading + prose)
}

export interface DocPage {
  url: string;
  title: string;
  description: string;
  markdown: string; // cleaned full-page markdown (for the MCP fetch_doc tool)
}

/** Slug from helpers (`/how-to/x`) → canonical site URL (`/how-to/x/`). */
function slugToUrl(slug: string): string {
  if (slug === '/' || slug === '') return '/';
  return `${slug.replace(/\/+$/, '')}/`;
}

/** Pull `title` / `description` out of YAML frontmatter without a YAML dep. */
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

/**
 * Reduce MDX/markdown to readable plain text: drop imports/exports, JSX comments,
 * fenced code, HTML/JSX tags, and link/image syntax — keeping heading markers so
 * the chunker can split on them.
 */
function mdxToText(body: string): string {
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // JSX comments
    .replace(/^import\s.+$/gm, '') // import lines
    .replace(/^export\s.+$/gm, '') // export lines
    .replace(/<include>[\s\S]*?<\/include>/g, '') // partial includes
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/<[^>]+>/g, ' ') // HTML/JSX tags
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // emphasis
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split cleaned page text into chunks anchored at `##`/`###` headings. */
function chunkPage(text: string, maxChars = 900): { heading: string; anchor: string; content: string }[] {
  const lines = text.split('\n');
  const sections: { heading: string; lines: string[] }[] = [{ heading: '', lines: [] }];
  for (const line of lines) {
    const h = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (h) sections.push({ heading: h[1].trim(), lines: [] });
    else sections.at(-1)!.lines.push(line);
  }
  // One slugger per page so repeated headings get -1/-2 suffixes, matching
  // Fumadocs/rehype-slug (so anchors resolve to real on-page ids).
  const slugger = new GithubSlugger();
  const chunks: { heading: string; anchor: string; content: string }[] = [];
  for (const s of sections) {
    const anchor = s.heading ? slugger.slug(s.heading) : '';
    const body = s.lines.join('\n').trim();
    if (!body && !s.heading) continue;
    const prefix = s.heading ? `${s.heading}. ` : '';
    const full = (prefix + body).trim();
    if (!full) continue;
    // Soft-split oversized sections on paragraph boundaries.
    if (full.length <= maxChars) {
      chunks.push({ heading: s.heading, anchor, content: full });
      continue;
    }
    let buf = '';
    for (const para of full.split(/\n{2,}/)) {
      if ((buf + '\n\n' + para).length > maxChars && buf) {
        chunks.push({ heading: s.heading, anchor, content: buf.trim() });
        buf = prefix + para;
      } else {
        buf = buf ? `${buf}\n\n${para}` : para;
      }
    }
    if (buf.trim()) chunks.push({ heading: s.heading, anchor, content: buf.trim() });
  }
  return chunks;
}

/** Build the full corpus: per-page records + flattened retrieval chunks. */
export async function buildCorpus(): Promise<{ pages: DocPage[]; chunks: DocChunk[] }> {
  const files = await getFiles(CONTENT_DIR);
  const pages: DocPage[] = [];
  const chunks: DocChunk[] = [];

  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    // `fileToSlug` expects a path containing the `content` segment.
    const relForSlug = file.slice(file.indexOf('content'));
    const url = slugToUrl(fileToSlug(relForSlug));
    const title = data.title || url;
    const text = mdxToText(body);

    pages.push({ url, title, description: data.description || '', markdown: `# ${title}\n\n${text}` });

    const pageChunks = chunkPage(text);
    pageChunks.forEach((c, i) => {
      // Prepend the page title to every chunk so retrieval has page-level context.
      const content = `${title}${c.heading ? ` — ${c.heading}` : ''}\n${c.content}`;
      chunks.push({ id: `${url}#${i}`, url, anchor: c.anchor, title, heading: c.heading, content });
    });
  }

  return { pages, chunks };
}
