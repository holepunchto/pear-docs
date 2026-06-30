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
 *   2. QVAC_LLM       — a named preset: "fast" (default) | "quality"
 */
import os from 'node:os';
import path from 'node:path';
import { loadModel, completion, unloadModel } from '@qvac/sdk';
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
  quality: {
    label: 'Qwen3-4B (quality)',
    gguf: path.join(MODELS, '6dea07e2f9342ff3_Qwen3-4B-Q4_K_M.gguf'),
    noThink: true,
  },
};

function resolvePreset(opts: { preset?: string; ggufPath?: string }): Preset {
  const explicit = opts.ggufPath || process.env.QVAC_LLM_GGUF;
  if (explicit) return { label: path.basename(explicit), gguf: explicit, noThink: /qwen/i.test(explicit) };
  const name = (opts.preset || process.env.QVAC_LLM || 'fast').toLowerCase();
  return PRESETS[name] || PRESETS.fast;
}

export interface Answerer {
  label: string;
  /** Stream a grounded answer token-by-token. */
  answer(query: string, context: SearchHit[]): AsyncIterable<string>;
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
    'sources below. Be concise and technical, and cite sources inline like [1], [2]. ' +
    'When a code example is relevant, reproduce the actual code from the sources VERBATIM in a ' +
    'fenced code block — do NOT invent APIs, imports, or function names. If the sources do not ' +
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
  const modelId = await loadModel({
    modelSrc: preset.gguf,
    modelType: 'llamacpp-completion',
    modelConfig: { ctx_size: 4096 },
  });

  return {
    label: preset.label,
    async *answer(query, context) {
      const run = completion({
        modelId,
        history: buildPrompt(query, context, Boolean(preset.noThink)),
        stream: true,
      });
      const tokens = run.tokenStream as AsyncIterable<string>;
      yield* preset.noThink ? stripThink(tokens) : tokens;
    },
    async close() {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
