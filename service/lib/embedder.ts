/**
 * ONNX sentence-embedding wrapper (transformers.js), the light replacement for
 * the QVAC/GGUF embedder in the full service.
 *
 * Runs entirely in-process on CPU from weights vendored under `models/` by
 * scripts/fetch-model.ts. Remote loading is switched OFF deliberately: with it
 * on, a mis-vendored image would quietly reach out to huggingface.co on the
 * first request and "work" in staging while being one outage away from failing
 * in production. A missing file should be a loud startup error instead.
 */
import path from 'node:path';
import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { DTYPE, resolveModel, type EmbedModel } from './models.ts';

// Resolved from cwd, not from `import.meta.url`. This module is bundled, so at
// runtime its own URL points into `.next/server/chunks/…` — a location that
// moves with the build strategy (standalone vs `next start`) and quietly
// resolves the model directory somewhere different under each. cwd is the app
// root under every builder, which is also how store.ts finds data/.
const MODELS_DIR = process.env.MODELS_DIR
  ? path.resolve(process.env.MODELS_DIR)
  : path.join(process.cwd(), 'models');

env.allowRemoteModels = false;
env.allowLocalModels = true;
// Trailing separator: transformers.js concatenates this with the model id.
env.localModelPath = MODELS_DIR + path.sep;

export interface Embedder {
  dim: number;
  model: EmbedModel;
  /** Embed passages as indexed (no query instruction prefix). */
  embed(texts: string[]): Promise<Float32Array[]>;
  /** Embed a single search query (applies the model's instruction prefix). */
  embedQuery(text: string): Promise<Float32Array>;
}

/**
 * Rough token budget in characters. The tokenizer truncates on its own, but a
 * 1 MB body would still be fully tokenized first — O(body) work on the request
 * path for text that is then thrown away. Cut it before it reaches the encoder.
 * ~4 chars/token is generous prose; docs code is denser, so this only ever cuts
 * text the model would have truncated anyway.
 */
function capChars(model: EmbedModel): number {
  return model.maxTokens * 4;
}

/**
 * ONNX intra-op threads.
 *
 * Left unset, onnxruntime sizes its pool from the HOST's core count — which in a
 * container with a fractional CPU *quota* (0.5 vCPU on Sevalla) means a dozen-plus
 * threads fighting over half a core, all context-switch and no throughput. One
 * thread is the right default here: a query is a single short sequence through a
 * 12-layer encoder, where the measured spread between 1 and 4 threads is well
 * under a millisecond.
 *
 * The index build is the opposite workload — thousands of chunks in batches — so
 * scripts/build-index.ts raises this.
 */
function ortThreads(): number {
  return Math.max(1, Number(process.env.ORT_THREADS) || 1);
}

export async function createEmbedder(name?: string): Promise<Embedder> {
  const model = resolveModel(name);
  const extractor: FeatureExtractionPipeline = await pipeline('feature-extraction', model.id, {
    dtype: DTYPE,
    // Read here rather than at module scope: build-index.ts raises ORT_THREADS
    // from inside main(), long after this module's static import was evaluated.
    session_options: { intraOpNumThreads: ortThreads(), interOpNumThreads: 1 },
  });
  const cap = capChars(model);

  async function run(texts: string[]): Promise<Float32Array[]> {
    // `normalize` gives unit vectors, which is what makes the store's plain dot
    // product a true cosine — and what the int8 quantization assumes.
    const out = await extractor(
      texts.map((t) => (t.length > cap ? t.slice(0, cap) : t)),
      { pooling: model.pooling, normalize: true },
    );
    const [rows, dim] = out.dims as [number, number];
    if (dim !== model.dim) {
      throw new Error(`${model.id} produced ${dim}-dim vectors, registry says ${model.dim}`);
    }
    const data = out.data as Float32Array;
    const vecs: Float32Array[] = [];
    // `out.data` is one flat buffer over the whole batch; slice() copies so the
    // rows stay valid after the tensor is released.
    for (let i = 0; i < rows; i++) vecs.push(data.slice(i * dim, (i + 1) * dim));
    return vecs;
  }

  return {
    dim: model.dim,
    model,
    async embed(texts: string[]) {
      if (texts.length === 0) return [];
      const out: Float32Array[] = [];
      // Batched so a 1500-chunk index build doesn't allocate one giant padded
      // tensor. Padding is per-batch, so smaller batches also waste less compute
      // on short chunks sharing a batch with a long one.
      const BATCH = Number(process.env.EMBED_BATCH || 16);
      for (let i = 0; i < texts.length; i += BATCH) out.push(...(await run(texts.slice(i, i + BATCH))));
      return out;
    },
    async embedQuery(text: string) {
      const [v] = await run([model.queryPrefix + text]);
      return v;
    },
  };
}
