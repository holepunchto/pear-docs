/**
 * QVAC embedding wrapper, used only by `scripts/build-mcp-index.ts`.
 *
 * Loads a local GGUF embedding model *by file path* (`modelType: llamacpp-embedding`),
 * which deliberately bypasses the QVAC model registry: a shared
 * `~/.qvac/registry-corestore` can be held under an exclusive lock by another
 * QVAC process, so registry-based loads fail with "File descriptor could not be
 * locked". Filesystem loads sidestep that and reuse already-cached weights.
 *
 * Nothing in the site build imports this. It runs in the manual
 * "Build MCP search index" workflow, and locally via `npm run mcp:index`.
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
  model: string;
  /**
   * `onBatch`, when given, fires after each internal batch with that batch's
   * normalized vectors and its start index into `texts` — lets a caller
   * checkpoint incrementally without knowing this method's batch size.
   */
  embed(texts: string[], onBatch?: (vectors: Float32Array[], startIndex: number) => void | Promise<void>): Promise<Float32Array[]>;
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

  // Offload to the GPU (Metal on Apple Silicon) by default; override with
  // QVAC_DEVICE=cpu on hosts without a usable GPU.
  const device = process.env.QVAC_DEVICE === 'cpu' ? 'cpu' : 'gpu';
  const modelId = await loadModel({
    modelSrc: ggufPath,
    modelType: 'llamacpp-embedding',
    // NB: the embedding plugin's config uses camelCase `gpuLayers` (the
    // completion plugin uses snake_case `gpu_layers` — different schemas).
    modelConfig: { device, gpuLayers: device === 'gpu' ? 99 : 0 },
  });

  // Probe dimensionality once. Accept either shape the plugin may return — the
  // batch path below already defends against a nested `[[…]]`, and if a single
  // string ever comes back nested here too, `.length` would read 1 and every
  // later dim check (index vs model) would compare against a bogus dimension.
  const probe = await embed({ modelId, text: 'dimension probe' });
  const probeRow = (Array.isArray(probe.embedding[0]) ? probe.embedding[0] : probe.embedding) as number[];
  const dim = probeRow.length;
  if (probe.stats?.backendDevice) {
    console.log(`  embedding backend: ${probe.stats.backendDevice} (requested device=${device})`);
  }

  return {
    dim,
    model: path.basename(ggufPath),
    async embed(texts, onBatch) {
      const out: Float32Array[] = [];
      // GTE-large embeds at most 512 tokens; hard-cap input length as a safety net.
      // Dense/code-y text can hit ~2 chars/token, so 1000 chars stays under budget.
      const cap = (t: string) => (t.length > 1000 ? t.slice(0, 1000) : t);
      const logStep = Math.max(250, Math.round(texts.length / 10));
      let nextLog = logStep;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize).map(cap);
        const { embedding } = await embed({ modelId, text: batch });
        const rows = (Array.isArray(embedding[0]) ? embedding : [embedding]) as number[][];
        const vectors = rows.map(l2normalize);
        for (const v of vectors) out.push(v);
        if (onBatch) await onBatch(vectors, i);
        if (out.length >= nextLog || out.length === texts.length) {
          console.log(`  embedded ${out.length}/${texts.length} chunks (${Math.round((out.length / texts.length) * 100)}%)`);
          nextLog += logStep;
        }
      }
      return out;
    },
    async close() {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
