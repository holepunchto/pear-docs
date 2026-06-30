/**
 * QVAC completion wrapper for the RAG "ask the docs" endpoint.
 *
 * Loads a local instruct GGUF by file path (registry-bypassed, same reason as the
 * embedder). Exposes a streaming answer generator grounded in retrieved passages.
 * If the model can't be loaded (or QVAC_DISABLE_LLM is set), the server falls back
 * to an extractive answer, so /api/ask still works without an LLM.
 */
import os from 'node:os';
import path from 'node:path';
import { loadModel, completion, unloadModel } from '@qvac/sdk';
import type { SearchHit } from './store.ts';

const DEFAULT_LLM_GGUF = path.join(
  os.homedir(),
  '.qvac/models/9856996b9b7bf6c4_Llama-3.2-1B-Instruct-Q4_0.gguf',
);

export interface Answerer {
  /** Stream a grounded answer token-by-token. */
  answer(query: string, context: SearchHit[]): AsyncIterable<string>;
  close(): Promise<void>;
}

function buildPrompt(query: string, context: SearchHit[]): { role: string; content: string }[] {
  const sources = context
    .map((c, i) => `[${i + 1}] (${c.deepUrl}) ${c.title}${c.heading ? ` — ${c.heading}` : ''}\n${c.raw}`)
    .join('\n\n');
  const system =
    'You are the Pear documentation assistant. Answer the question using ONLY the numbered ' +
    'sources below. Be concise and technical, and cite sources inline like [1], [2]. ' +
    'When a code example is relevant, reproduce the actual code from the sources VERBATIM in a ' +
    'fenced code block — do NOT invent APIs, imports, or function names. If the sources do not ' +
    'contain the answer, say so plainly.';
  return [
    { role: 'system', content: system },
    { role: 'user', content: `Sources:\n${sources}\n\nQuestion: ${query}` },
  ];
}

export async function createAnswerer(opts: { ggufPath?: string } = {}): Promise<Answerer> {
  const ggufPath = opts.ggufPath || process.env.QVAC_LLM_GGUF || DEFAULT_LLM_GGUF;
  const modelId = await loadModel({
    modelSrc: ggufPath,
    modelType: 'llamacpp-completion',
    modelConfig: { ctx_size: 4096 },
  });

  return {
    async *answer(query, context) {
      const run = completion({ modelId, history: buildPrompt(query, context), stream: true });
      for await (const token of run.tokenStream) yield token as string;
    },
    async close() {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
