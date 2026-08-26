/**
 * Embedding-model registry for the lightweight service.
 *
 * The heavy service embeds with QVAC + GTE-large (1024-dim fp16 GGUF, ~1.3 GB
 * resident, GPU by default). None of that fits a small Sevalla pod, so this
 * service runs a small ONNX sentence encoder in-process through transformers.js
 * instead — tens of MB on disk, a few hundred MB resident, CPU-only.
 *
 * Three properties have to travel together, because getting any one of them
 * wrong produces a *silently* wrong ranking rather than an error:
 *
 *   - `pooling`     BGE/GTE pool the [CLS] token; the MiniLM sentence-transformer
 *                   averages token states. Pool a BGE model with `mean` and every
 *                   cosine score shifts, so the index and the query must agree.
 *   - `queryPrefix` BGE was trained with an asymmetric instruction on the QUERY
 *                   side only. Omitting it (or applying it to documents too)
 *                   measurably degrades retrieval.
 *   - `dim`         Recorded so the server can reject an index built with a
 *                   different encoder before it serves nonsense.
 *
 * They are therefore recorded INTO index.json at build time and re-checked at
 * load time (see store.ts / engine.ts).
 */
export interface EmbedModel {
  /** transformers.js model id — also the directory name under `models/`. */
  id: string;
  label: string;
  dim: number;
  pooling: 'cls' | 'mean';
  /** Prepended to queries only (never to indexed documents). '' for none. */
  queryPrefix: string;
  /** Encoder's own token budget; inputs are cut to fit before tokenization. */
  maxTokens: number;
}

export const MODELS: Record<string, EmbedModel> = {
  'bge-small': {
    id: 'Xenova/bge-small-en-v1.5',
    label: 'BGE-small-en-v1.5 (384d)',
    dim: 384,
    pooling: 'cls',
    queryPrefix: 'Represent this sentence for searching relevant passages: ',
    maxTokens: 512,
  },
  'gte-small': {
    id: 'Xenova/gte-small',
    label: 'GTE-small (384d)',
    dim: 384,
    pooling: 'mean',
    queryPrefix: '',
    maxTokens: 512,
  },
  minilm: {
    id: 'Xenova/all-MiniLM-L6-v2',
    label: 'all-MiniLM-L6-v2 (384d)',
    dim: 384,
    pooling: 'mean',
    queryPrefix: '',
    maxTokens: 256,
  },
};

export const DEFAULT_MODEL = 'bge-small';

/** Resolve the configured preset. Unknown names fail loudly at startup. */
export function resolveModel(name = process.env.EMBED_MODEL || DEFAULT_MODEL): EmbedModel {
  const m = MODELS[name];
  if (!m) {
    throw new Error(`Unknown EMBED_MODEL "${name}". Known: ${Object.keys(MODELS).join(', ')}`);
  }
  return m;
}

/**
 * ONNX weight precision. `q8` is the CPU-friendly default: int8 kernels are
 * genuinely faster on a CPU-only pod, whereas `fp16` has no native CPU support
 * and gets upcast at runtime — bigger AND slower here.
 */
export const DTYPE = (process.env.EMBED_DTYPE || 'q8') as 'q8' | 'fp32' | 'fp16';
