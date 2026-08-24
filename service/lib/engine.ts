/**
 * Shared retrieval engine used by BOTH the HTTP API and the MCP server, so the
 * docs site and AI agents get identical rankings from one backend.
 *
 * This is the full service's engine with generation removed: no LLM, no `ask`,
 * no streaming. Retrieval only.
 */
import { DocStore, type DocPage, type SearchHit } from './store.ts';
import { createEmbedder, type Embedder } from './embedder.ts';

/**
 * Coerce a caller-supplied topK to an integer in [1, max], else the default.
 *
 * Lives here, on the layer both front-ends share, so HTTP and MCP agree on one
 * policy. In the full service they once disagreed: /api/search clamped
 * out-of-range values while the MCP tool schema rejected them outright, so the
 * same topK=50 succeeded on the website and hard-failed for an agent.
 */
export function clampTopK(v: unknown, def = 5, max = 20): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

export class Engine {
  private store = new DocStore();
  private embedder!: Embedder;
  model = '';
  builtAt = '';
  sourceRef = '';

  async init() {
    await this.store.load();
    this.embedder = await createEmbedder();
    const m = this.embedder.model;
    this.model = m.id;
    this.builtAt = this.store.builtAt;
    this.sourceRef = this.store.sourceRef;

    // Query vectors and index vectors must share a space, or cosine scores are
    // meaningless (the dot loop would also read past the query vector → NaN).
    if (this.store.dim !== this.embedder.dim) {
      throw new Error(
        `Embedding dim mismatch: index=${this.store.dim}, model=${this.embedder.dim}. ` +
          'Rebuild the index (npm run build:index) with the same embedding model.',
      );
    }
    // A different model of the *same* dim passes the check above but lives in a
    // different vector space. All three 384-dim presets in models.ts are exactly
    // that trap, so this one is fatal rather than a warning — unlike the full
    // service, the index here records an exact model id we control.
    if (this.store.model && this.store.model !== m.id) {
      throw new Error(
        `Embedding model mismatch: index built with "${this.store.model}", now serving "${m.id}". ` +
          'Set EMBED_MODEL to match, or rebuild the index.',
      );
    }
    // Pooling and the query prefix are part of the vector space too: pool a BGE
    // index with `mean`, or drop its query instruction, and scores shift while
    // every guard above still passes.
    if (this.store.pooling && this.store.pooling !== m.pooling) {
      throw new Error(
        `Pooling mismatch: index built with "${this.store.pooling}", model uses "${m.pooling}". Rebuild the index.`,
      );
    }
    if (this.store.queryPrefix !== m.queryPrefix) {
      throw new Error(
        `Query-prefix mismatch between index and model config. Rebuild the index (npm run build:index).`,
      );
    }
    return this;
  }

  get size() {
    return this.store.size;
  }

  get pageCount() {
    return this.store.pageCount;
  }

  /** Section-level hybrid search (semantic + lexical), deep-linked to anchors. */
  async search(query: string, topK = 5, signal?: AbortSignal): Promise<SearchHit[]> {
    signal?.throwIfAborted();
    const v = await this.embedder.embedQuery(query);
    signal?.throwIfAborted();
    return this.store.searchSections(v, topK, query);
  }

  getPage(url: string): DocPage | undefined {
    return this.store.getPage(url);
  }
}

/**
 * Process-wide lazy singleton.
 *
 * Loading the index and the ONNX session takes ~1s and holds a few hundred MB;
 * doing it per request would be fatal. The promise (not the resolved engine) is
 * cached so concurrent cold requests share ONE initialization instead of racing
 * to load the model several times over.
 *
 * Stashed on globalThis because Next's dev server re-evaluates route modules on
 * every edit — without this, each hot reload would leak another ONNX session.
 */
const globalForEngine = globalThis as unknown as { __docsEngine?: Promise<Engine> };

export function getEngine(): Promise<Engine> {
  if (!globalForEngine.__docsEngine) {
    globalForEngine.__docsEngine = new Engine().init().catch((e) => {
      // Drop the rejected promise so the NEXT request retries instead of being
      // served the same cached failure for the life of the process.
      globalForEngine.__docsEngine = undefined;
      throw e;
    });
  }
  return globalForEngine.__docsEngine;
}
