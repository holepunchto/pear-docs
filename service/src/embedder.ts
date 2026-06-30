/**
 * QVAC embedding wrapper.
 *
 * Loads a local GGUF embedding model *by file path* (`modelType: llamacpp-embedding`),
 * which deliberately bypasses the QVAC model registry. On this machine the shared
 * `~/.qvac/registry-corestore` is held under an exclusive lock by the running Keet
 * app, so registry-based loads fail with "File descriptor could not be locked";
 * filesystem loads sidestep that entirely and reuse the already-cached weights.
 */
import os from 'node:os';
import path from 'node:path';
import { loadModel, embed, unloadModel } from '@qvac/sdk';

// Default to the GTE-large fp16 GGUF already cached under ~/.qvac/models.
const DEFAULT_EMBED_GGUF = path.join(
  os.homedir(),
  '.qvac/models/8441c7419e66033f_gte-large_fp16.gguf',
);

export interface Embedder {
  dim: number;
  embed(texts: string[]): Promise<Float32Array[]>;
  close(): Promise<void>;
}

function l2normalize(v: number[]): Float32Array {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

export async function createEmbedder(opts: { ggufPath?: string; batchSize?: number } = {}): Promise<Embedder> {
  const ggufPath = opts.ggufPath || process.env.QVAC_EMBED_GGUF || DEFAULT_EMBED_GGUF;
  const batchSize = opts.batchSize ?? 32;

  const modelId = await loadModel({ modelSrc: ggufPath, modelType: 'llamacpp-embedding' });

  // Probe dimensionality once.
  const probe = await embed({ modelId, text: 'dimension probe' });
  const dim = (probe.embedding as number[]).length;

  return {
    dim,
    async embed(texts: string[]): Promise<Float32Array[]> {
      const out: Float32Array[] = [];
      // GTE-large embeds at most 512 tokens; hard-cap input length as a safety net.
      // Dense/code-y text can hit ~2 chars/token, so 1000 chars stays under budget.
      const cap = (t: string) => (t.length > 1000 ? t.slice(0, 1000) : t);
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize).map(cap);
        const { embedding } = await embed({ modelId, text: batch });
        const rows = (Array.isArray(embedding[0]) ? embedding : [embedding]) as number[][];
        for (const r of rows) out.push(l2normalize(r));
      }
      return out;
    },
    async close() {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
