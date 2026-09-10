// scripts/refgen/rate.ts
//
// Ground-truth parity: rate the generated model against the existing
// hand-authored reference page (content/reference/**/<slug>.mdx).
//
// The curated MDX is the oracle for "did we capture the API". Every method the
// human documented (`#### \`signature\`` heading) should appear in the generated
// model; anything missing is a real extraction gap (the most important fidelity
// signal). Symbols the generator found but the page lacks are reported as extra
// coverage.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel } from './model';
import { pageSymbols, memberId } from './identity';

export interface Parity {
  mdxPath: string;
  totalMdx: number;
  covered: number;
  pct: number;
  missing: string[]; // documented by hand, absent from the model — extraction gaps
  extra: string[]; // in the model, not on the curated page
}

// content/reference/ moved to content/bare/reference/ in the Phase 6 physical
// reorg (docs/plans/PEAR-BARE-SPLIT-PITCH.md).
const REFERENCE_ROOT = 'content/bare/reference';

/** Locate <slug>.mdx anywhere under content/bare/reference. */
function findMdx(slug: string, root = REFERENCE_ROOT): string | null {
  let found: string | null = null;
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (found) return;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === `${slug}.mdx`) found = p;
    }
  };
  try {
    walk(root);
  } catch {
    return null;
  }
  return found;
}

/** Compare a model to the curated MDX page; null when no page exists yet. */
export function rateAgainstMdx(model: ApiModel): Parity | null {
  const mdxPath = findMdx(model.slug);
  if (!mdxPath) return null;

  const expected = pageSymbols(readFileSync(mdxPath, 'utf8'));
  const generated = new Set(model.classes.flatMap((c) => c.methods.map(memberId)));

  const missing = [...expected].filter((n) => !generated.has(n)).sort();
  const extra = [...generated].filter((n) => !expected.has(n)).sort();
  const covered = expected.size - missing.length;

  return {
    mdxPath,
    totalMdx: expected.size,
    covered,
    pct: expected.size ? Math.round((covered / expected.size) * 100) : 100,
    missing,
    extra,
  };
}
