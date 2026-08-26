/**
 * In-memory vector store: loads the prebuilt index and ranks chunks by cosine
 * similarity (a plain dot product, since all vectors are L2-normalized).
 *
 * ⚠️ MIRROR of `../../src/store.ts` from the full QVAC service, trimmed for this
 * deployment. Two deliberate differences:
 *
 *   - The per-chunk `raw` field (code-preserving markdown) is gone. It existed to
 *     feed the LLM that generated /api/ask answers; with generation stripped, it
 *     was the single largest contributor to index.json for text nothing reads.
 *     MCP clients that want the code call `fetch_doc` instead.
 *   - The data directory is resolved from cwd (see DATA_DIR), because Next's
 *     standalone output relocates compiled modules and `import.meta.url` no
 *     longer points anywhere near the project root.
 *
 * The ranking logic below is otherwise byte-compatible with the full service, so
 * both backends return identical orderings for the same index.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');

export interface ChunkMeta {
  id: string;
  url: string;
  anchor: string;
  title: string;
  heading: string;
  content: string;
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

// The lexical pass runs one `includes()` per term per chunk, so cost is
// O(terms × chunks) of synchronous string scanning on the event loop. Bodies are
// capped upstream, which is still enough distinct terms to stall the process for
// every other caller. Bound both ends: a real query is short.
const MAX_QUERY_CHARS = 512;
const MAX_QUERY_TERMS = 32;

/**
 * Normalize a title or query for exact-match comparison: lowercase, strip
 * punctuation, collapse whitespace.
 */
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Bonus for a chunk whose page title IS the query — a navigational lookup like
 * "Hyperdrive" or "Corestore", where the user wants the reference page, not
 * prose that happens to discuss it.
 *
 * The per-term lexical blend below cannot separate these cases: for "Hyperdrive"
 * both the reference page and "Create a full peer-to-peer filesystem with
 * Hyperdrive" match the single query term in their title, so both take the same
 * boost and cosine alone decides — which the wordier how-to wins (0.9161 vs
 * 0.9017). The same tie let `…/hyperdrive/#drivebatch` outrank its own page's
 * lead, and `…/corestore/#storestorage` outrank Corestore's.
 *
 * Exact title equality is a much sharper signal, so it is worth more, and it goes
 * overwhelmingly to the LEAD chunk (`anchor === ''`) so the result links to the
 * top of the page rather than an arbitrary section of it. Sections of the same
 * page get a token amount, enough to keep them ahead of unrelated pages.
 *
 * Sized against the measured gaps it has to close — 0.011 (Hyperbee) and 0.019
 * (Corestore) — with room for the ~0.04 Hyperdrive case, while staying far below
 * the ~0.1+ margins that separate genuinely different topics.
 */
const EXACT_TITLE_LEAD_BOOST = 0.15;
const EXACT_TITLE_SECTION_BOOST = 0.03;

/** Lowercased, de-duplicated query terms (length ≥ 2) for lexical blending. */
function queryTerms(q: string): string[] {
  return [...new Set(q.slice(0, MAX_QUERY_CHARS).toLowerCase().match(/[a-z0-9]+/g) || [])]
    .filter((t) => t.length >= 2)
    .slice(0, MAX_QUERY_TERMS);
}

export interface DocPage {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

/** Encoder fingerprint recorded at build time; re-checked against the runtime model. */
export interface IndexModelInfo {
  model: string;
  dim: number;
  pooling: string;
  queryPrefix: string;
}

export class DocStore {
  dim = 0;
  model = '';
  pooling = '';
  queryPrefix = '';
  builtAt = '';
  /** Docs commit the index was built from; '' for a local build. */
  sourceRef = '';
  private meta: ChunkMeta[] = [];
  private matrix = new Float32Array(0); // [n * dim] dequantized, normalized
  private headingLc: string[] = []; // lowercased title+heading, per chunk
  private contentLc: string[] = []; // lowercased title+heading+content, per chunk
  private titleNorm: string[] = []; // normalized page title, per chunk
  private pages = new Map<string, DocPage>();

  async load() {
    const index = JSON.parse(await readFile(path.join(DATA_DIR, 'index.json'), 'utf-8'));
    const pages = JSON.parse(await readFile(path.join(DATA_DIR, 'pages.json'), 'utf-8'));
    // Validate `dim` before it is used as an allocation size and a loop bound.
    // An index.json missing it (or carrying a junk value) fails SILENTLY and
    // catastrophically: `new Float32Array(n * undefined)` is `ToIndex(NaN)` = a
    // ZERO-length matrix, and `for (j = 0; j < undefined; j++)` never runs, so
    // every dot product scores 0, every chunk ties, and search returns arbitrary
    // results with no error anywhere.
    if (!Number.isInteger(index.dim) || index.dim <= 0) {
      throw new Error(`index.json has an invalid "dim" (${JSON.stringify(index.dim)}); rebuild the index`);
    }
    this.dim = index.dim;
    this.model = index.model ?? '';
    this.pooling = index.pooling ?? '';
    this.queryPrefix = index.queryPrefix ?? '';
    this.builtAt = index.builtAt ?? '';
    this.sourceRef = index.sourceRef ?? '';
    const n = index.chunks.length;
    this.matrix = new Float32Array(n * this.dim);
    this.meta = new Array(n);
    this.headingLc = new Array(n);
    this.contentLc = new Array(n);
    this.titleNorm = new Array(n);
    for (let i = 0; i < n; i++) {
      const c = index.chunks[i];
      this.meta[i] = {
        id: c.id,
        url: c.url,
        anchor: c.anchor ?? '',
        title: c.title,
        heading: c.heading,
        content: c.content,
      };
      this.headingLc[i] = `${c.title} ${c.heading}`.toLowerCase();
      this.contentLc[i] = `${c.title} ${c.heading} ${c.content}`.toLowerCase();
      this.titleNorm[i] = normalizeTitle(c.title ?? '');
      const buf = Buffer.from(c.q, 'base64');
      // A short/corrupt payload would poison the matrix without a word: reading
      // past the buffer yields `undefined`, `undefined > 127` is false, so
      // `undefined / 127` writes NaN into the row. Every dot product touching it
      // then becomes NaN and sorts arbitrarily. Fail loudly instead.
      if (buf.length !== this.dim) {
        throw new Error(`chunk ${c.id} has a ${buf.length}-byte vector, expected ${this.dim}; rebuild the index`);
      }
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

  get pageCount() {
    return this.pages.size;
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
    const qNorm = queryText ? normalizeTitle(queryText) : '';
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
      let exact = 0;
      if (qNorm && this.titleNorm[i] === qNorm) {
        exact = this.meta[i].anchor ? EXACT_TITLE_SECTION_BOOST : EXACT_TITLE_LEAD_BOOST;
      }
      scores[i] = { i, s: dot + 0.12 * lex + exact };
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
    // Backfill from cap-dropped sections rather than return fewer than topK…
    for (const h of capped) {
      if (out.length >= topK) break;
      out.push(h);
    }
    // …then re-sort. A backfilled hit was only held back for page diversity, so it
    // OUTSCORES what is already in `out`; appending it would leave the caller with
    // a list that both /api/search and the MCP tool render as a numbered ranking
    // while the last entry outranked entries above it.
    return out.sort((a, b) => b.score - a.score);
  }

  getPage(url: string): DocPage | undefined {
    const clean = url.split('#')[0]; // tolerate deep-link anchors
    return this.pages.get(clean) || this.pages.get(clean.endsWith('/') ? clean : `${clean}/`);
  }
}
