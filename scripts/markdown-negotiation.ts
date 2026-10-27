/**
 * `Accept: text/markdown` negotiation rules for out/_redirects. One rule per
 * path depth (see the comment in public/_redirects for why), generated from
 * the deepest `.md` twin in out/ so a deeper page can't silently go without.
 */
import { readdirSync } from 'fs';
import { join } from 'path';

export const NEGOTIATION_MARKER = '# @markdown-negotiation-rules';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// The `.md` twin of `/a/b/` is `a/b.md`, so its depth is its segment count.
export function maxTwinDepth(outDir: string): number {
  let max = 0;
  const walk = (dir: string, depth: number): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !/^[._]/.test(entry.name)) walk(join(dir, entry.name), depth + 1);
      else if (entry.name.endsWith('.md')) max = Math.max(max, depth + 1);
    }
  };
  walk(outDir, 0);
  return max;
}

export function negotiationRule(depth: number): [from: string, to: string] {
  if (depth === 0) return ['/', '/index.md'];
  const segments = [...LETTERS.slice(0, depth)].map((l) => `:${l}`).join('/');
  return [`/${segments}/`, `/${segments}.md`];
}

export function negotiationRules(maxDepth: number): string[] {
  const rules = Array.from({ length: maxDepth + 1 }, (_, depth) => negotiationRule(depth));
  const width = Math.max(...rules.map(([from]) => from.length)) + 2;
  const toWidth = Math.max(...rules.map(([, to]) => to.length)) + 2;
  return rules.map(
    ([from, to]) => `${from.padEnd(width)}${to.padEnd(toWidth)}303!   Header:Accept=text/markdown`,
  );
}
