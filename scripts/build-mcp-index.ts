/**
 * Embeds the MCP corpus into the vector index the docs search service serves.
 *
 * Reads `out/mcp/corpus.json` (written by `generate-mcp-corpus.ts` during
 * postbuild) and writes two files the service loads verbatim:
 *
 *   - `out/mcp-index/index.json` : chunk metadata + int8-quantized, L2-normalized vectors
 *   - `out/mcp-index/pages.json` : per-page markdown, backing the MCP `fetch_doc` tool
 *
 * This lives here rather than in the search service because the service runs on
 * a host that times out building its own index — embedding ~4k chunks is 10-40
 * minutes of CPU. The work happens on a GitHub runner instead, and because this
 * repo is public, the resulting release assets download without a token: the
 * service needs no credentials at all, and no cross-repo PAT is involved.
 *
 * NOT part of the site build. `next build` never invokes this, and nothing here
 * is imported by the app — it runs in the manual "Build MCP search index"
 * workflow, or locally via `npm run mcp:index`.
 *
 * `@qvac/sdk` is deliberately NOT a declared dependency. It pulls ~176 packages
 * including native binaries, and this repo's CI cannot `npm ci` anyway (the
 * `@tetherto/*` packages are token-gated), so every job already installs what it
 * needs into a throwaway prefix. Declaring it here would slow every docs
 * developer's install for a script none of them run. To run it locally:
 *
 *     npm install --no-save @qvac/sdk
 *     npm run mcp:corpus && npm run mcp:index
 *
 * ⚠️ The shape written here is a contract with the service's `DocStore.load()`.
 * Changing a field name, the quantization, or the vector layout requires a
 * matching change there. `dim` and `model` are recorded so the service can
 * refuse an index its query embedder cannot serve.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEmbedder } from './mcp-embedder';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS_PATH = process.env.MCP_CORPUS_FILE || path.join(ROOT, 'out', 'mcp', 'corpus.json');
const OUT_DIR = path.join(ROOT, 'out', 'mcp-index');

/** Highest `corpus.json` version this builder understands. */
const SUPPORTED_CORPUS_VERSION = 1;

interface DocChunk {
  id: string;
  url: string;
  anchor: string;
  title: string;
  heading: string;
  content: string;
  raw: string;
}

interface DocPage {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

interface Corpus {
  version: number;
  builtAt: string;
  corpusHash: string;
  pages: Record<string, DocPage>;
  chunks: DocChunk[];
}

/**
 * Hash of the retrieval-relevant corpus — chunk ids paired with the text that
 * gets embedded, in order.
 *
 * Must stay byte-identical to `generate-mcp-corpus.ts`'s copy: the published
 * manifest's `corpusHash` is what tells the workflow whether anything changed,
 * and a drift here would either rebuild forever or, worse, pair stale vectors
 * with new text. Recomputed rather than trusted for exactly that reason.
 */
function hashCorpus(chunks: DocChunk[]): string {
  const h = createHash('sha256');
  for (const c of chunks) h.update(JSON.stringify([c.id, c.content]));
  return h.digest('hex');
}

/**
 * Quantize a normalized vector to int8 and base64-encode it.
 *
 * Clamped to ±127 rather than ±128: the service dequantizes with `s / 127`, so
 * the two ends have to agree or every vector is subtly skewed.
 */
function quantize(v: Float32Array): string {
  const q = Buffer.allocUnsafe(v.length);
  for (let i = 0; i < v.length; i++) {
    const s = Math.round(v[i] * 127);
    q[i] = (s < -127 ? -127 : s > 127 ? 127 : s) & 0xff;
  }
  return q.toString('base64');
}

async function main(): Promise<void> {
  const t0 = Date.now();

  const corpus: Corpus = JSON.parse(await readFile(CORPUS_PATH, 'utf-8'));
  if (corpus.version > SUPPORTED_CORPUS_VERSION) {
    throw new Error(
      `corpus.json is version ${corpus.version}, this builder understands up to ` +
        `${SUPPORTED_CORPUS_VERSION}.`,
    );
  }
  const chunks = corpus.chunks;
  const pages = corpus.pages;
  if (!Array.isArray(chunks) || !chunks.length || !pages) {
    throw new Error(`${CORPUS_PATH} has no chunks/pages — refusing to build an empty index`);
  }

  const corpusHash = hashCorpus(chunks);
  if (corpus.corpusHash !== corpusHash) {
    throw new Error(
      `corpus.json declares corpusHash ${corpus.corpusHash} but its chunks hash to ` +
        `${corpusHash}. The file is truncated or was written by a mismatched generator.`,
    );
  }
  console.log(`▸ ${Object.keys(pages).length} pages, ${chunks.length} chunks (${corpusHash.slice(0, 12)}…)`);

  console.log('▸ Loading embedding model…');
  const embedder = await createEmbedder();
  console.log(`  model loaded, dim=${embedder.dim}`);

  console.log(`▸ Embedding ${chunks.length} chunk(s)…`);
  const vectors = await embedder.embed(chunks.map((c) => c.content));
  await embedder.close();
  if (vectors.length !== chunks.length) {
    throw new Error(`embedder returned ${vectors.length} vectors for ${chunks.length} chunks`);
  }

  const index = {
    dim: embedder.dim,
    model: embedder.model,
    builtAt: new Date().toISOString(),
    // Lets the service answer "is my index current?" against the published
    // manifest with a string compare, without downloading the corpus.
    corpusHash,
    chunks: chunks.map((c, i) => ({
      id: c.id,
      url: c.url,
      anchor: c.anchor,
      title: c.title,
      heading: c.heading,
      content: c.content,
      raw: c.raw,
      q: quantize(vectors[i]),
    })),
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));
  await writeFile(path.join(OUT_DIR, 'pages.json'), JSON.stringify(pages));

  console.log(
    `✓ Wrote out/mcp-index/{index,pages}.json — ${index.chunks.length} chunks, dim ${index.dim}, ` +
      `in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main().catch((e) => {
  console.error('✖ MCP index build failed:', e);
  process.exit(1);
});
