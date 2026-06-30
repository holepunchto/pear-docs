/**
 * Build-time index generation.
 *
 * Extracts the docs corpus, embeds every chunk with QVAC, and writes two static
 * artifacts the server loads at startup:
 *   - data/index.json : chunk metadata + int8-quantized normalized vectors
 *   - data/pages.json : per-page markdown (backs the MCP `fetch_doc` tool)
 *
 * Run from the repo root:  node --import tsx service/src/index-build.ts
 * (Needs the harness sandbox disabled — QVAC's worker locks files under ~/.qvac.)
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildCorpus } from './corpus.ts';
import { createEmbedder } from './embedder.ts';

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

/** Quantize a normalized vector to int8 and base64-encode it. */
function quantize(v: Float32Array): string {
  const q = Buffer.allocUnsafe(v.length);
  for (let i = 0; i < v.length; i++) {
    const s = Math.round(v[i] * 127);
    q[i] = (s < -127 ? -127 : s > 127 ? 127 : s) & 0xff;
  }
  return q.toString('base64');
}

async function main() {
  const t0 = Date.now();
  console.log('▸ Extracting corpus…');
  const { pages, chunks } = await buildCorpus();
  console.log(`  ${pages.length} pages, ${chunks.length} chunks`);

  console.log('▸ Loading embedding model…');
  const embedder = await createEmbedder();
  console.log(`  model loaded, dim=${embedder.dim}`);

  console.log('▸ Embedding chunks…');
  const vectors = await embedder.embed(chunks.map((c) => c.content));
  await embedder.close();

  const index = {
    dim: embedder.dim,
    model: process.env.QVAC_EMBED_GGUF || 'gte-large_fp16.gguf',
    builtAt: new Date().toISOString(),
    chunks: chunks.map((c, i) => ({
      id: c.id,
      url: c.url,
      anchor: c.anchor,
      title: c.title,
      heading: c.heading,
      content: c.content,
      q: quantize(vectors[i]),
    })),
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'index.json'), JSON.stringify(index));
  await writeFile(
    path.join(DATA_DIR, 'pages.json'),
    JSON.stringify(Object.fromEntries(pages.map((p) => [p.url, p]))),
  );

  console.log(
    `✓ Wrote index.json (${index.chunks.length} chunks) + pages.json (${pages.length} pages) in ${(
      (Date.now() - t0) /
      1000
    ).toFixed(1)}s`,
  );
}

main().catch((e) => {
  console.error('✖ index build failed:', e);
  process.exit(1);
});
