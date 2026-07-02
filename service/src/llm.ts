/**
 * QVAC completion wrapper for the RAG "ask the docs" endpoint.
 *
 * Loads a local instruct GGUF by file path (registry-bypassed, same reason as the
 * embedder). Exposes a streaming answer generator grounded in retrieved passages.
 * If the model can't be loaded (or QVAC_DISABLE_LLM is set), the server falls back
 * to an extractive answer, so /api/ask still works without an LLM.
 *
 * Model selection (in priority order):
 *   1. QVAC_LLM_GGUF  — explicit absolute path to any GGUF
 *   2. QVAC_LLM       — a named preset: "quality" (default) | "fast"
 *
 * Default is "quality": the small "fast" model tends to fabricate APIs in code
 * examples, which is unacceptable for a docs assistant. "fast" stays available
 * for low-resource hosts where answer latency matters more than code fidelity.
 */
import os from 'node:os';
import path from 'node:path';
import { loadModel, completion, cancel, unloadModel, InferenceCancelledError } from '@qvac/sdk';
import type { SearchHit } from './store.ts';

const MODELS = path.join(os.homedir(), '.qvac/models');

interface Preset {
  label: string;
  gguf: string;
  /** Reasoning model that emits <think>…</think> — suppress it for clean answers. */
  noThink?: boolean;
}

// Friendly presets mapped to the locally cached GGUFs.
const PRESETS: Record<string, Preset> = {
  fast: {
    label: 'Llama-3.2-1B (fast)',
    gguf: path.join(MODELS, '9856996b9b7bf6c4_Llama-3.2-1B-Instruct-Q4_0.gguf'),
  },
  balanced: {
    label: 'Qwen3-4B (balanced)',
    gguf: path.join(MODELS, '6dea07e2f9342ff3_Qwen3-4B-Q4_K_M.gguf'),
    noThink: true,
  },
  quality: {
    label: 'Qwen3-8B (quality)',
    gguf: path.join(MODELS, 'qwen3-8b-instruct-q4_k_m.gguf'),
    noThink: true,
  },
};

function resolvePreset(opts: { preset?: string; ggufPath?: string }): Preset {
  const explicit = opts.ggufPath || process.env.QVAC_LLM_GGUF;
  if (explicit) return { label: path.basename(explicit), gguf: explicit, noThink: /qwen/i.test(explicit) };
  const name = (opts.preset || process.env.QVAC_LLM || 'quality').toLowerCase();
  return PRESETS[name] || PRESETS.quality;
}

export interface Answerer {
  label: string;
  /** Stream a grounded answer token-by-token. Pass a signal to cancel generation. */
  answer(query: string, context: SearchHit[], signal?: AbortSignal): AsyncIterable<string>;
  close(): Promise<void>;
}

function buildPrompt(
  query: string,
  context: SearchHit[],
  noThink: boolean,
): { role: string; content: string }[] {
  const sources = context
    .map((c, i) => `[${i + 1}] (${c.deepUrl}) ${c.title}${c.heading ? ` — ${c.heading}` : ''}\n${c.raw}`)
    .join('\n\n');
  const system =
    'You are the Pear documentation assistant. Answer the question using ONLY the numbered ' +
    'sources below, and cite them inline like [1], [2].\n' +
    'When the question is about how to do something, include the FULL application code example ' +
    'from the sources — the actual source files (imports through the key calls), not just the ' +
    'shell command used to run it. Reproduce code VERBATIM in a fenced code block; never invent ' +
    'or paraphrase APIs, method names, imports, or options. If the sources show only a run ' +
    'command and no application code, say so rather than inventing code. If the sources do not ' +
    'contain the answer, say so plainly.';
  // `/no_think` is Qwen3's soft switch to skip its reasoning trace.
  const suffix = noThink ? '\n\n/no_think' : '';
  return [
    { role: 'system', content: system },
    { role: 'user', content: `Sources:\n${sources}\n\nQuestion: ${query}${suffix}` },
  ];
}

/** Drop any <think>…</think> spans from a token stream, tolerant of tags split across tokens. */
async function* stripThink(src: AsyncIterable<string>): AsyncIterable<string> {
  const OPEN = '<think>';
  const CLOSE = '</think>';
  let buf = '';
  let suppress = false;
  for await (const tok of src) {
    buf += tok;
    for (;;) {
      if (!suppress) {
        const i = buf.indexOf(OPEN);
        if (i === -1) {
          // Emit everything except a short tail that might be a forming "<think>".
          const keep = OPEN.length - 1;
          if (buf.length > keep) {
            yield buf.slice(0, buf.length - keep);
            buf = buf.slice(buf.length - keep);
          }
          break;
        }
        if (i > 0) yield buf.slice(0, i);
        buf = buf.slice(i + OPEN.length);
        suppress = true;
      } else {
        const j = buf.indexOf(CLOSE);
        if (j === -1) {
          const keep = CLOSE.length - 1;
          buf = buf.length > keep ? buf.slice(buf.length - keep) : buf;
          break;
        }
        buf = buf.slice(j + CLOSE.length);
        suppress = false;
      }
    }
  }
  if (!suppress && buf) yield buf;
}

export async function createAnswerer(opts: { preset?: string; ggufPath?: string } = {}): Promise<Answerer> {
  const preset = resolvePreset(opts);
  // Offload to the GPU (Metal on Apple Silicon) by default; QVAC_DEVICE=cpu opts out.
  const device = process.env.QVAC_DEVICE === 'cpu' ? 'cpu' : 'gpu';
  // 8192 gives headroom for a full topK=6 RAG context (code chunks run long)
  // plus the system prompt and generation budget, without risking overflow.
  const ctxSize = Number(process.env.QVAC_CTX_SIZE || 8192);
  const modelId = await loadModel({
    modelSrc: preset.gguf,
    modelType: 'llamacpp-completion',
    modelConfig: { ctx_size: ctxSize, device, gpu_layers: device === 'gpu' ? 99 : 0 },
  });

  return {
    label: preset.label,
    async *answer(query, context, signal) {
      const run = completion({
        modelId,
        history: buildPrompt(query, context, Boolean(preset.noThink)),
        stream: true,
      });
      // Cancel the underlying QVAC generation when the caller aborts (e.g. the
      // HTTP client disconnects), instead of running the model to completion.
      const onAbort = () => void cancel({ requestId: run.requestId }).catch(() => {});
      if (signal?.aborted) onAbort();
      else signal?.addEventListener('abort', onAbort, { once: true });
      try {
        const tokens = run.tokenStream as AsyncIterable<string>;
        yield* preset.noThink ? stripThink(tokens) : tokens;
      } catch (e) {
        if (!(e instanceof InferenceCancelledError)) throw e; // cancelled → stop quietly
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    },
    async close() {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
