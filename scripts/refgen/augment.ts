// scripts/refgen/augment.ts
//
// LLM augmentation pass (prototype). The model + manifest reproduce a curated
// page's structure and facts, but the hand pages also carry per-method *examples*
// and some *return* descriptions that upstream READMEs don't contain — the gap
// that makes a full `--write` regress. This module finds those "model-thin"
// members and builds a prompt asking Claude to synthesize, from the real API
// surface, a short example (and a return description where missing) for each.
//
// The output is written to generated/refs/<slug>/augment.json as a REVIEWABLE
// artifact (never auto-trusted): a human reviews it, then the curated renderer
// merges it for thin entries. This file has no SDK dependency — the Anthropic
// call lives in scripts/augment-refs.ts so dry-run works without the SDK.

import type { ApiModel, RefMethod } from './model';
import { memberKey } from './identity';

export interface ThinEntry {
  key: string;
  signature: string;
  description?: string;
  /** True when the signature captures a value but no return is documented. */
  needsReturns: boolean;
}

export interface Augmentation {
  /** Model id used to generate (e.g. claude-opus-4-8). */
  model: string;
  generatedAt: string;
  /** Always true — these are machine-drafted and must be reviewed before trust. */
  needsReview: true;
  /** memberKey -> generated bits. */
  entries: Record<string, { example?: string; returns?: string }>;
}

function capturesReturn(sig: string): boolean {
  return /^\s*(const|let|var)\b[^=]*=/.test(sig);
}

/** README-backed methods/constructors that render on a curated page but lack an example. */
export function findThinEntries(model: ApiModel): ThinEntry[] {
  const out: ThinEntry[] = [];
  for (const cls of model.classes) {
    for (const m of cls.methods) {
      if (!m.source.includes('readme')) continue; // only the documented surface
      if (m.kind !== 'method' && m.kind !== 'constructor') continue;
      if (m.examples.length > 0) continue; // already has an example
      out.push({
        key: memberKey(m),
        signature: m.signature,
        description: m.description,
        needsReturns: m.kind === 'method' && capturesReturn(m.signature) && !m.returns,
      });
    }
  }
  return out;
}

/** Compact listing of the whole public surface, as grounding context for the model. */
function surfaceListing(model: ApiModel): string {
  const lines: string[] = [];
  for (const cls of model.classes) {
    lines.push(`# class ${cls.name}`);
    for (const m of cls.methods) {
      const desc = m.description ? ` — ${m.description.split(/(?<=[.!?])\s/)[0]}` : '';
      lines.push(`- ${memberKey(m)}: \`${m.signature}\`${desc}`);
    }
  }
  return lines.join('\n');
}

export const SYSTEM_PROMPT =
  'You write concise, accurate API reference content for JavaScript libraries in the Holepunch/Pear ecosystem. ' +
  'You are given a library\'s full public API surface (member keys, signatures, one-line descriptions) and a list of ' +
  'members that are missing a usage example. For each listed member produce:\n' +
  '- "example": a short, idiomatic JavaScript snippet (1–5 lines) showing realistic usage, consistent with the ' +
  'signature and with the rest of the surface. Reuse the receiver/variable names from the signatures (e.g. `base`, ' +
  '`core`, `host`). Use `await` for async members. Make it copy-pasteable.\n' +
  '- "returns": one concise sentence describing the return value — ONLY when asked for that member; otherwise "".\n' +
  'Hard rules: only reference members that appear in the provided surface; never invent APIs; output nothing except ' +
  'the requested structured data; keep examples minimal.';

export function buildUserPrompt(model: ApiModel, thin: ThinEntry[]): string {
  const wantReturns = thin.filter((t) => t.needsReturns).map((t) => t.key);
  return [
    `Library: ${model.classes[0]?.name ?? model.slug} (npm: ${model.repo.repo}).`,
    '',
    'Full API surface:',
    surfaceListing(model),
    '',
    'Write an example for each of these members (use the exact member key):',
    ...thin.map((t) => `- ${t.key}: \`${t.signature}\``),
    '',
    wantReturns.length
      ? `Also write a "returns" sentence for these (others: leave "returns" as ""): ${wantReturns.join(', ')}`
      : 'Leave "returns" as "" for every member.',
  ].join('\n');
}

/** Structured-output schema for the augmentation response. */
export const AUGMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['entries'],
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['member', 'example', 'returns'],
        properties: {
          member: { type: 'string' },
          example: { type: 'string' },
          returns: { type: 'string' },
        },
      },
    },
  },
} as const;

/** Shape the model returns, validated by the schema above. */
export interface AugmentResponse {
  entries: { member: string; example: string; returns: string }[];
}

/** Fold a model response into an Augmentation, keyed by member, dropping empties. */
export function toAugmentation(model: string, resp: AugmentResponse): Augmentation {
  const entries: Augmentation['entries'] = {};
  for (const e of resp.entries) {
    const bits: { example?: string; returns?: string } = {};
    if (e.example?.trim()) bits.example = e.example.trim();
    if (e.returns?.trim()) bits.returns = e.returns.trim();
    if (Object.keys(bits).length) entries[e.member] = bits;
  }
  return { model, generatedAt: new Date().toISOString(), needsReview: true, entries };
}
