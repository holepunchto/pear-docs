/**
 * Shared retrieval/answer engine used by BOTH the HTTP API and the MCP server.
 *
 * Holds the loaded index (DocStore), the QVAC embedder (query-time embedding),
 * and an optional QVAC answerer (RAG generation). Search and ask flow through
 * here so the website and AI agents get identical results from one backend.
 */
import { DocStore, type SearchHit, type DocPage } from './store.ts';
import { createEmbedder, type Embedder } from './embedder.ts';
import { createAnswerer, type Answerer } from './llm.ts';

export interface AskChunk {
  url: string;
  title: string;
  heading: string;
}

export class Engine {
  private store = new DocStore();
  private embedder!: Embedder;
  private answerer: Answerer | null = null;
  llmEnabled = false;
  llmModel = '';
  model = '';

  async init() {
    await this.store.load();
    this.embedder = await createEmbedder();
    // Query vectors and index vectors must share a space, or cosine scores are
    // meaningless (the dot loop would also read past the query vector → NaN).
    if (this.store.dim && this.embedder.dim !== this.store.dim) {
      throw new Error(
        `Embedding dim mismatch: index=${this.store.dim}, model=${this.embedder.dim}. ` +
          'Rebuild the index (npm run build:index) with the same embedding model.',
      );
    }
    // A different model of the *same* dim passes the check above but lives in a
    // different vector space, silently wrecking cosine scores. Compare model
    // names too (ignoring the ~/.qvac cache hash prefix) and warn — don't throw,
    // since the index only records a name, not a fingerprint.
    const bareModel = (s: string) => s.replace(/^.*[/\\]/, '').replace(/^[0-9a-f]{6,}_/i, '');
    if (this.store.model && bareModel(this.store.model) !== bareModel(this.embedder.model)) {
      console.warn(
        `⚠ Embedding model mismatch: index built with "${this.store.model}", now serving ` +
          `"${this.embedder.model}". Cosine scores may be meaningless — rebuild the index ` +
          '(npm run build:index) with the same model.',
      );
    }
    this.model = this.store.model;
    if (process.env.QVAC_DISABLE_LLM !== '1') {
      try {
        this.answerer = await createAnswerer();
        this.llmEnabled = true;
        this.llmModel = this.answerer.label;
      } catch (e) {
        console.warn('⚠ LLM unavailable, /api/ask will use extractive fallback:', (e as Error).message);
      }
    }
    return this;
  }

  get size() {
    return this.store.size;
  }

  /** Section-level hybrid search (semantic + lexical), deep-linked to anchors. */
  async search(query: string, topK = 5): Promise<SearchHit[]> {
    const [v] = await this.embedder.embed([query]);
    return this.store.searchSections(v, topK, query);
  }

  /** Chunk-level retrieval (richer context for generation). */
  async retrieve(query: string, topK = 6): Promise<SearchHit[]> {
    const [v] = await this.embedder.embed([query]);
    return this.store.search(v, topK, query);
  }

  /**
   * Stream a RAG answer. Yields `{type:'sources'}` first, then `{type:'token'}`
   * chunks, then `{type:'done'}`. Falls back to an extractive answer (the lead
   * sentences of the top passages) when no LLM is loaded.
   */
  async *ask(
    query: string,
    { topK = 6, signal }: { topK?: number; signal?: AbortSignal } = {},
  ): AsyncIterable<
    | { type: 'sources'; sources: { n: number; url: string; title: string; heading: string }[] }
    | { type: 'token'; text: string }
    | { type: 'done'; extractive: boolean }
  > {
    const context = await this.retrieve(query, topK);
    const toSources = (hits: SearchHit[]) =>
      hits.map((c, i) => ({ n: i + 1, url: c.deepUrl, title: c.title, heading: c.heading }));

    if (this.answerer) {
      yield { type: 'sources', sources: toSources(context) };
      for await (const tok of this.answerer.answer(query, context, signal)) {
        yield { type: 'token', text: tok };
      }
      yield { type: 'done', extractive: false };
      return;
    }

    // Extractive fallback: emit sources for exactly the passages we cite, so the
    // [n] markers in the text line up with the source list shown in the UI.
    const top = context.slice(0, 3);
    yield { type: 'sources', sources: toSources(top) };
    const text =
      `Based on the documentation:\n\n` +
      top
        .map((c, i) => `• ${c.content.split('\n').slice(1).join(' ').slice(0, 280)} [${i + 1}]`)
        .join('\n\n');
    yield { type: 'token', text };
    yield { type: 'done', extractive: true };
  }

  getPage(url: string): DocPage | undefined {
    return this.store.getPage(url);
  }

  async close() {
    await this.embedder?.close();
    await this.answerer?.close();
  }
}
