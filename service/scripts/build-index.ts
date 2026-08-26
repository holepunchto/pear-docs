/**
 * Build-time index generation.
 *
 * Extracts the docs corpus, embeds every chunk with the small ONNX encoder, and
 * writes the two static artifacts the server loads at startup:
 *   - data/index.json : chunk metadata + int8-quantized normalized vectors
 *   - data/pages.json : per-page markdown (backs the MCP `fetch_doc` tool)
 *
 * Corpus extraction (`scripts/corpus.ts` — build-time only, which is why it sits
 * beside this file rather than under lib/) reads `content/**` from the repo root one
 * level up, and gets its slug mapping from the docs tooling's own
 * `scripts/helpers.ts` — so indexed URLs are the same ones the link checker
 * validates. Nothing here reaches outside this repository.
 *
 * Needs no QVAC, no GPU and no GGUF cache, so it runs anywhere — including CI.
 *
 *   npm run build:index
 */
import { writeFile, mkdir, stat, readFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEmbedder } from '../lib/embedder.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');

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

  // Defaults to the repo root (this service lives in `service/`). DOCS_ROOT is
  // only for pointing at a different checkout.
  const resolved = path.resolve(process.env.DOCS_ROOT || path.join(ROOT, '..'));
  try {
    await stat(path.join(resolved, 'content'));
  } catch {
    throw new Error(`No content/ directory under ${resolved} — set DOCS_ROOT if the docs live elsewhere`);
  }
  process.env.DOCS_ROOT = resolved;

  console.log(`▸ Extracting corpus from ${resolved}…`);
  const { buildCorpus } = await import('./corpus.ts');
  const { pages, chunks } = await buildCorpus();
  console.log(`  ${pages.length} pages, ${chunks.length} chunks`);

  // Batch throughput, not single-query latency: let ONNX use the build machine's
  // cores. The runtime default is 1 (see lib/embedder.ts) for the opposite reason.
  process.env.ORT_THREADS ||= String(Math.max(1, cpus().length));

  console.log('▸ Loading embedding model…');
  const embedder = await createEmbedder();
  console.log(`  ${embedder.model.label}, dim=${embedder.dim}`);

  console.log('▸ Embedding chunks…');
  // Documents are embedded WITHOUT the query instruction prefix — that
  // asymmetry is how BGE-family models are trained, and applying the prefix on
  // both sides degrades retrieval.
  const vectors = await embedder.embed(chunks.map((c) => c.content));

  const index = {
    dim: embedder.dim,
    model: embedder.model.id,
    pooling: embedder.model.pooling,
    queryPrefix: embedder.model.queryPrefix,
    builtAt: new Date().toISOString(),
    // Which docs revision this index was built from. Set by CI (DOCS_REF); far
    // more useful than a wall-clock timestamp when you are asking "is the
    // deployed index current?".
    sourceRef: process.env.DOCS_REF || '',
    // `raw` (code-preserving markdown) is deliberately NOT carried over from the
    // full service's index: it existed to ground LLM answers, and this service
    // has no LLM. Dropping it is most of the index-size saving.
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

  // `Object.fromEntries` silently keeps the LAST record for a repeated key, and
  // sibling `x.mdx` + `x/index.mdx` both slug to `/x/`. That would drop one page
  // from fetch_doc while still indexing both files' chunks under the same URL —
  // so the per-page diversity cap would treat them as one page and a citation
  // could deep-link to an anchor that only exists on the page we discarded.
  // Surface it at build time instead of shipping a quietly wrong index.
  const seen = new Map<string, string>();
  for (const p of pages) {
    const prev = seen.get(p.url);
    if (prev) throw new Error(`Duplicate page URL ${p.url}: "${prev}" and "${p.title}" both map to it. Rename one file.`);
    seen.set(p.url, p.title);
  }

  await mkdir(DATA_DIR, { recursive: true });
  const indexPath = path.join(DATA_DIR, 'index.json');
  const pagesPath = path.join(DATA_DIR, 'pages.json');
  const indexJson = JSON.stringify(index);
  const pagesJson = JSON.stringify(Object.fromEntries(pages.map((p) => [p.url, p])));

  // Rewrite only on a REAL change.
  //
  // `builtAt` moves every run, so a naive write makes every scheduled CI build
  // produce a multi-megabyte diff, push it, and trigger a redeploy — even when
  // the docs have not changed at all. Compare the substantive fields only.
  //
  // This is an ALLOWLIST rather than a delete-the-volatile-ones mask, so that a
  // field added to the index in future is compared by default and lands on the
  // next build. The mask form silently kept the old file forever: a key absent
  // from it and deleted from the new one compares equal, so `sourceRef` was
  // introduced and then never written.
  //
  // `sourceRef` sits outside the comparison deliberately: it names the docs
  // revision whose CONTENT produced this index, so a docs commit that changes
  // nothing we index legitimately leaves it pointing at the earlier commit —
  // which is the honest answer to "what is this index built from", and avoids a
  // redeploy for a no-op.
  const SUBSTANTIVE = ['dim', 'model', 'pooling', 'queryPrefix', 'chunks'] as const;
  const substance = (json: string) => {
    const o = JSON.parse(json) as Record<string, unknown>;
    return JSON.stringify(SUBSTANTIVE.map((k) => o[k]));
  };
  const changed = async (file: string, next: string, mask = false) => {
    try {
      const prev = await readFile(file, 'utf-8');
      return mask ? substance(prev) !== substance(next) : prev !== next;
    } catch {
      return true; // absent → write it
    }
  };

  const indexChanged = await changed(indexPath, indexJson, true);
  const pagesChanged = await changed(pagesPath, pagesJson);
  if (indexChanged) await writeFile(indexPath, indexJson);
  if (pagesChanged) await writeFile(pagesPath, pagesJson);

  const mb = (s: string) => (Buffer.byteLength(s) / 1e6).toFixed(2);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (!indexChanged && !pagesChanged) {
    console.log(`✓ No change — index.json / pages.json left as they are (${secs}s)`);
    return;
  }
  console.log(
    `✓ index.json ${mb(indexJson)} MB (${index.chunks.length} chunks)${indexChanged ? '' : ' [unchanged]'} + ` +
      `pages.json ${mb(pagesJson)} MB (${pages.length} pages)${pagesChanged ? '' : ' [unchanged]'} in ${secs}s`,
  );
}

main().catch((e) => {
  console.error('✖ index build failed:', (e as Error).message);
  process.exit(1);
});
