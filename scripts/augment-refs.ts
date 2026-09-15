// scripts/augment-refs.ts
//
// LLM augmentation pass (prototype driver). Finds model-thin members (README-
// documented methods with no example) and asks Claude to synthesize an example
// — and a return description where missing — from the real API surface. Output
// is a REVIEWABLE artifact at generated/refs/<slug>/augment.json; the curated
// renderer merges it (clearly marked) only after a human has reviewed it.
//
// Flags:
//   [slug]    repo to augment (default: autobase)
//   --run     actually call Claude (needs @anthropic-ai/sdk + ANTHROPIC_API_KEY).
//             Without it: DRY RUN — writes the prompt to augment-prompt.md and
//             lists the thin members, no API call, no SDK required.
//
// Usage:
//   npm run refs:augment -- autobase           # dry run (safe, offline)
//   npm run refs:augment -- autobase --run     # real call (costs tokens)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel } from './refgen/model';
import {
  findThinEntries,
  buildUserPrompt,
  SYSTEM_PROMPT,
  AUGMENT_SCHEMA,
  toAugmentation,
  type AugmentResponse,
} from './refgen/augment';

const MODEL = 'claude-opus-4-8';
const REFS_DIR = 'generated/refs';

async function callClaude(system: string, user: string): Promise<AugmentResponse> {
  // Lazy, dynamically-typed import so dry-run compiles/runs without the SDK
  // installed. The call shape matches the Anthropic TS SDK docs (streaming +
  // output_config.format structured outputs + finalMessage()).
  const mod: any = await import('@anthropic-ai/sdk' as string);
  const Anthropic = mod.default;
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  // Stream (output may be long with adaptive thinking) and read the final text.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: AUGMENT_SCHEMA } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  const message = await stream.finalMessage();
  const text = message.content.find((b: any) => b.type === 'text')?.text;
  if (!text) throw new Error('no text block in response');
  return JSON.parse(text) as AugmentResponse;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const run = argv.includes('--run');
  const slug = argv.find((a) => !a.startsWith('--')) ?? 'autobase';

  const modelPath = join(REFS_DIR, slug, 'api-model.json');
  if (!existsSync(modelPath)) {
    console.error(`No model at ${modelPath} (run refs:gen first).`);
    process.exit(1);
  }
  const model = JSON.parse(readFileSync(modelPath, 'utf8')) as ApiModel;

  const thin = findThinEntries(model);
  if (thin.length === 0) {
    console.log(`${slug}: no model-thin members — nothing to augment.`);
    return;
  }
  const user = buildUserPrompt(model, thin);

  console.log(`${slug}: ${thin.length} thin member(s) (${thin.filter((t) => t.needsReturns).length} also need a return):`);
  console.log('  ' + thin.map((t) => t.key).join(', '));

  if (!run) {
    const promptPath = join(REFS_DIR, slug, 'augment-prompt.md');
    writeFileSync(promptPath, `# System\n\n${SYSTEM_PROMPT}\n\n# User\n\n${user}\n`);
    console.log(`\nDRY RUN — wrote prompt to ${promptPath}`);
    console.log(`To generate for real: npm run refs:augment -- ${slug} --run  (needs @anthropic-ai/sdk + ANTHROPIC_API_KEY)`);
    return;
  }

  console.log(`\nCalling ${MODEL} …`);
  const resp = await callClaude(SYSTEM_PROMPT, user);
  const augmentation = toAugmentation(MODEL, resp);
  const outPath = join(REFS_DIR, slug, 'augment.json');
  writeFileSync(outPath, JSON.stringify(augmentation, null, 2) + '\n');
  const n = Object.keys(augmentation.entries).length;
  console.log(`wrote ${outPath} — ${n}/${thin.length} members augmented (REVIEW before use)`);
}

main();
