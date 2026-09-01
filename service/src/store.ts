/**
 * In-memory vector store: loads the prebuilt index and ranks chunks by cosine
 * similarity (a plain dot product, since all vectors are L2-normalized).
 *
 * This is the PoC's retrieval layer. The same surface (`search`) could later be
 * backed by `@qvac/rag` + HyperDB for replicated/P2P retrieval without changing
 * the server or MCP callers.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export interface ChunkMeta {
  id: string;
  url: string;
  anchor: string;
  title: string;
  heading: string;
  content: string; // prose (snippets)
  raw: string; // code-preserving markdown (RAG context)
}

export interface SearchHit extends ChunkMeta {
  /** Page URL with the heading anchor appended, for deep-linking to the section. */
  deepUrl: string;
  score: number;
}

/** page URL + heading anchor (e.g. /how-to/x/#create-signing-keys). */
export function deepUrl(m: ChunkMeta): string {
  return m.anchor ? `${m.url}#${m.anchor}` : m.url;
}

/** Lowercased, de-duplicated query terms (length ≥ 2) for lexical blending. */
function queryTerms(q: string): string[] {
  return [...new Set(q.toLowerCase().match(/[a-z0-9]+/g) || [])].filter((t) => t.length >= 2);
}

export interface DocPage {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

export class DocStore {
  dim = 0; // embedding dimensionality of the loaded index
  private meta: ChunkMeta[] = [];
  private matrix = new Float32Array(0); // [n * dim] dequantized, normalized
  private headingLc: string[] = []; // lowercased heading text, per chunk
  private contentLc: string[] = []; // lowercased title+heading+content, per chunk
  private pages = new Map<string, DocPage>();
  model = '';

  async load() {
    const index = JSON.parse(await readFile(path.join(DATA_DIR, 'index.json'), 'utf-8'));
    const pages = JSON.parse(await readFile(path.join(DATA_DIR, 'pages.json'), 'utf-8'));
    this.dim = index.dim;
    this.model = index.model;
    const n = index.chunks.length;
    this.matrix = new Float32Array(n * this.dim);
    this.meta = new Array(n);
    this.headingLc = new Array(n);
    this.contentLc = new Array(n);
    for (let i = 0; i < n; i++) {
      const c = index.chunks[i];
      this.meta[i] = { id: c.id, url: c.url, anchor: c.anchor ?? '', title: c.title, heading: c.heading, content: c.content, raw: c.raw ?? c.content };
      this.headingLc[i] = `${c.title} ${c.heading}`.toLowerCase();
      this.contentLc[i] = `${c.title} ${c.heading} ${c.content}`.toLowerCase();
      const buf = Buffer.from(c.q, 'base64');
      const off = i * this.dim;
      for (let j = 0; j < this.dim; j++) {
        // int8 stored as unsigned byte → signed value → dequantize.
        const s = buf[j] > 127 ? buf[j] - 256 : buf[j];
        this.matrix[off + j] = s / 127;
      }
    }
    for (const url of Object.keys(pages)) this.pages.set(url, pages[url] as DocPage);
    return this;
  }

  get size() {
    return this.meta.length;
  }

  /**
   * Rank chunks against a query vector. When `queryText` is given, blend a light
   * lexical signal on top of cosine: query terms appearing in the heading/title
   * (strong) or body (weak) nudge exact-term matches up — this is what makes a
   * keyword query like "create key" rank the "Create signing keys" section
   * higher than it would on embeddings alone.
   */
  search(queryVec: Float32Array, topK = 8, queryText?: string): SearchHit[] {
    const n = this.meta.length;
    const terms = queryText ? queryTerms(queryText) : [];
    const scores = new Array<{ i: number; s: number }>(n);
    for (let i = 0; i < n; i++) {
      const off = i * this.dim;
      let dot = 0;
      for (let j = 0; j < this.dim; j++) dot += queryVec[j] * this.matrix[off + j];
      let lex = 0;
      if (terms.length) {
        let inHeading = 0;
        let inBody = 0;
        for (const t of terms) {
          if (this.headingLc[i].includes(t)) inHeading++;
          else if (this.contentLc[i].includes(t)) inBody++;
        }
        // Fraction of query terms matched, heading weighted higher. Bounded boost.
        lex = (inHeading + 0.4 * inBody) / terms.length;
      }
      scores[i] = { i, s: dot + 0.12 * lex };
    }
    scores.sort((a, b) => b.s - a.s);
    return scores.slice(0, topK).map(({ i, s }) => ({ ...this.meta[i], deepUrl: deepUrl(this.meta[i]), score: s }));
  }

  /**
   * Section-level results: dedupe by deep-link URL (page#anchor) so distinct
   * sections of the same page can each surface, keeping the best chunk per
   * section. This is what lets results link straight to `…/#create-signing-keys`.
   */
  searchSections(queryVec: Float32Array, topK = 5, queryText?: string, maxPerPage = 2): SearchHit[] {
    const hits = this.search(queryVec, topK * 6, queryText);
    // Best chunk per section (deep URL)…
    const byUrl = new Map<string, SearchHit>();
    for (const h of hits) {
      const prev = byUrl.get(h.deepUrl);
      if (!prev || h.score > prev.score) byUrl.set(h.deepUrl, h);
    }
    // …then cap how many sections any single page may contribute, for diversity.
    const ranked = [...byUrl.values()].sort((a, b) => b.score - a.score);
    const perPage = new Map<string, number>();
    const out: SearchHit[] = [];
    const capped: SearchHit[] = [];
    for (const h of ranked) {
      const n = perPage.get(h.url) ?? 0;
      if (n >= maxPerPage) {
        capped.push(h); // held back by the diversity cap
        continue;
      }
      perPage.set(h.url, n + 1);
      out.push(h);
      if (out.length >= topK) return out;
    }
    // Backfill from cap-dropped sections rather than return fewer than topK.
    for (const h of capped) {
      if (out.length >= topK) break;
      out.push(h);
    }
    return out;
  }

  getPage(url: string): DocPage | undefined {
    const clean = url.split('#')[0]; // tolerate deep-link anchors
    return this.pages.get(clean) || this.pages.get(clean.endsWith('/') ? clean : `${clean}/`);
  }
}
