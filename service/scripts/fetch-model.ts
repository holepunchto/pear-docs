/**
 * Vendor the ONNX encoder into `models/` so the container never reaches out to
 * huggingface.co at runtime.
 *
 * transformers.js will happily download a model on first use and cache it, but
 * that makes the first request after every deploy pay a multi-second download,
 * and it makes the service fail closed on any Hub outage. Fetching at build time
 * (see the Dockerfile) keeps the runtime hermetic — `env.allowRemoteModels` is
 * hard-set to false in embedder.ts, so a missing file is a startup error rather
 * than a silent network fallback.
 *
 *   npm run fetch:model              # the configured EMBED_MODEL
 *   EMBED_MODEL=minilm npm run fetch:model
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DTYPE, resolveModel } from '../lib/models.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS_DIR = path.join(ROOT, 'models');

// transformers.js maps its `dtype` option onto these ONNX filenames.
const DTYPE_FILE: Record<string, string> = {
  q8: 'model_quantized.onnx',
  fp32: 'model.onnx',
  fp16: 'model_fp16.onnx',
};

async function download(url: string, dest: string) {
  // Skip work already done, so re-running the script (or a warm Docker layer)
  // is cheap. Zero-byte files are treated as absent — that is what a killed
  // download leaves behind, and it would otherwise be cached forever.
  try {
    const s = await stat(dest);
    if (s.size > 0) {
      console.log(`  · ${path.relative(ROOT, dest)} (cached, ${(s.size / 1e6).toFixed(1)} MB)`);
      return;
    }
  } catch {
    /* not present yet */
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log(`  ✓ ${path.relative(ROOT, dest)} (${(buf.length / 1e6).toFixed(1)} MB)`);
}

async function main() {
  const model = resolveModel();
  const onnxFile = DTYPE_FILE[DTYPE];
  if (!onnxFile) throw new Error(`Unsupported EMBED_DTYPE "${DTYPE}". Known: ${Object.keys(DTYPE_FILE).join(', ')}`);

  // Only the files transformers.js actually opens for feature extraction. The
  // repos also carry every other quantization; pulling them all would multiply
  // the image size for weights we never load.
  const files = ['config.json', 'tokenizer.json', 'tokenizer_config.json', `onnx/${onnxFile}`];
  const base = `https://huggingface.co/${model.id}/resolve/main`;
  const dir = path.join(MODELS_DIR, model.id);

  console.log(`▸ Fetching ${model.label} [${DTYPE}] → models/${model.id}/`);
  for (const f of files) await download(`${base}/${f}`, path.join(dir, f));
  console.log('✓ Model vendored');
}

main().catch((e) => {
  console.error('✖ model fetch failed:', (e as Error).message);
  process.exit(1);
});
