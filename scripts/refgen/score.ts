// scripts/refgen/score.ts
//
// Stage 4 — turn the generated model into actionable feedback (replaces the
// dropped ratemyopenapi step, which only scores OpenAPI docs).
//
// Two signals:
//   * Completeness — per method: description? params documented? returns? example?
//   * Drift — methods in source but undocumented (README gap), or documented but
//     not found in source (stale docs / extractor gap).
//
// Output is a Markdown improvement plan grouped by category, each finding
// attributed to its likely cause.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ApiModel, RefMethod } from './model';
import type { Parity } from './rate';

export interface Score {
  total: number;
  scored: number; // source methods graded for completeness
  complete: number; // of `scored`, those fully documented
  pct: number;
  missingDescription: RefMethod[];
  missingReturns: RefMethod[];
  missingExample: RefMethod[];
  undocumentedParams: { method: RefMethod; params: string[] }[];
  driftUndocumented: RefMethod[]; // ast-only
  driftStale: RefMethod[]; // readme-only
}

/** Signature captures the result, e.g. `const block = await core.get(...)`. */
function returnIsCaptured(sig: string): boolean {
  return /^\s*(const|let|var)\b[^=]*=/.test(sig);
}

/** A destructured capture (`const { length } = ...`) self-documents its shape. */
function returnShapeShown(sig: string): boolean {
  return /\{[^}]*\}\s*=/.test(sig);
}

/**
 * These READMEs document params inline (in prose / the signature), not only as
 * bullet lists. Treat a param as documented if it has an explicit description or
 * its name appears in the method's prose.
 */
function paramDocumented(p: { name: string; description?: string }, description?: string): boolean {
  if (p.description) return true;
  const bare = p.name.replace(/^\.\.\./, '').replace(/[`\[\]{}]/g, '').trim();
  if (!bare) return true; // destructured/rest with no clear name — don't penalize
  if (!description) return false;
  if (/^(opts|options)$/i.test(bare)) return /\boption/i.test(description);
  return new RegExp(`\\b${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(description);
}

export function scoreModel(model: ApiModel): Score {
  const methods = model.classes.flatMap((c) => c.methods);

  const missingDescription: RefMethod[] = [];
  const missingReturns: RefMethod[] = [];
  const missingExample: RefMethod[] = [];
  const undocumentedParams: { method: RefMethod; params: string[] }[] = [];
  const driftUndocumented: RefMethod[] = [];
  const driftStale: RefMethod[] = [];

  let complete = 0;
  let scored = 0;

  for (const m of methods) {
    if (m.source.includes('ast') && !m.source.includes('readme')) driftUndocumented.push(m);
    // Events are documented only in the README (the AST exposes a generic `on`),
    // so README-only events are expected, not stale docs.
    if (m.kind !== 'event' && m.source.includes('readme') && !m.source.includes('ast')) driftStale.push(m);

    // Completeness grades the QUALITY of methods that are both in source and
    // documented. Coverage gaps (source-only / README-only) are handled as drift
    // above, so they are not double-counted here.
    if (!(m.source.includes('ast') && m.source.includes('readme'))) continue;
    scored++;

    let ok = true;
    if (!m.description) {
      missingDescription.push(m);
      ok = false;
    }
    // Returns and examples are enhancement signals, not completeness gates: the
    // README style names the return in the signature (`const block = ...`) and
    // explains it in prose, and most entries do not carry one fence per method.
    if (
      m.kind === 'method' &&
      returnIsCaptured(m.signature) &&
      !returnShapeShown(m.signature) &&
      !m.returns
    ) {
      missingReturns.push(m);
    }
    if (m.examples.length === 0) missingExample.push(m);
    const undoc = m.params.filter((p) => !paramDocumented(p, m.description)).map((p) => p.name);
    if (undoc.length > 0) {
      undocumentedParams.push({ method: m, params: undoc });
      ok = false;
    }
    if (ok) complete++;
  }

  return {
    total: methods.length,
    scored,
    complete,
    pct: scored ? Math.round((complete / scored) * 100) : 0,
    missingDescription,
    missingReturns,
    missingExample,
    undocumentedParams,
    driftUndocumented,
    driftStale,
  };
}

/**
 * Ground-truth parity block — the headline fidelity signal: how much of the
 * curated MDX page the generator reproduced, and exactly what it missed.
 */
function parityBlock(parity?: Parity | null): string[] {
  if (parity === undefined) return [];
  if (parity === null) {
    return [`## Parity vs curated page`, ``, `_No existing MDX page found for this slug._`, ``];
  }
  const lines = [
    `## Parity vs curated page`,
    ``,
    `**${parity.pct}%** of the hand-authored page is reproduced — ${parity.covered} of ${parity.totalMdx} documented symbols (\`${parity.mdxPath}\`).`,
    ``,
  ];
  if (parity.missing.length > 0) {
    lines.push(
      `### Missing from generated model (${parity.missing.length})`,
      ``,
      `_Documented by hand but not extracted — real fidelity gaps to fix before this can replace the page._`,
      ``,
      ...parity.missing.map((n) => `- \`${n}\``),
      ``
    );
  }
  if (parity.extra.length > 0) {
    lines.push(
      `### Extra in generated model (${parity.extra.length})`,
      ``,
      `_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._`,
      ``,
      ...parity.extra.map((n) => `- \`${n}\``),
      ``
    );
  }
  return lines;
}

function section(title: string, cause: string, items: string[]): string {
  if (items.length === 0) return '';
  return [
    `### ${title} (${items.length})`,
    ``,
    `_Cause: ${cause}_`,
    ``,
    ...items.map((i) => `- ${i}`),
    ``,
  ].join('\n');
}

export function writeImprovementPlan(
  model: ApiModel,
  score: Score,
  outPath: string,
  parity?: Parity | null
): void {
  const sig = (m: RefMethod) => `\`${m.signature}\``;

  const body = [
    `# Reference generation improvement plan — ${model.slug}`,
    ``,
    `Generated from \`${model.repo.org}/${model.repo.repo}\` at **${model.tag}** (\`${model.sha.slice(0, 10)}\`) on ${model.generatedAt}.`,
    ``,
    `**Doc-completeness: ${score.pct}%** — ${score.complete} of ${score.scored} source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.`,
    ``,
    `> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.`,
    ``,
    ...parityBlock(parity),
    `## Completeness gaps`,
    ``,
    section(
      'Missing description',
      'method exists in source but has no prose in the README — upstream README gap.',
      score.missingDescription.map(sig)
    ),
    section(
      'Undocumented parameters',
      'parameter present in the signature but not described — README gap or extractor name-mismatch.',
      score.undocumentedParams.map((u) => `${sig(u.method)} → ${u.params.join(', ')}`)
    ),
    `## Enhancements`,
    ``,
    section(
      'Return value not explained',
      'signature captures a scalar return but no prose/shape explains it — clarity enhancement.',
      score.missingReturns.map(sig)
    ),
    section(
      'No example',
      'no code fence under the README entry — add a usage snippet.',
      score.missingExample.map(sig)
    ),
    `## Drift`,
    ``,
    section(
      'Undocumented in README (in source)',
      'public method in source with no README entry — add upstream docs, or confirm it is internal.',
      score.driftUndocumented.map(sig)
    ),
    section(
      'Stale README (not found in source)',
      'README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports).',
      score.driftStale.map(sig)
    ),
  ]
    .filter(Boolean)
    .join('\n');

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, body.endsWith('\n') ? body : body + '\n');
}
