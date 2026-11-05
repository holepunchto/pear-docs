// scripts/refgen/prose.ts
//
// Shared description-cleaning used by BOTH the curated-page renderer
// (render-curated.ts) and the upstream JSDoc emitter (emit-jsdoc.ts). These two
// once had separate copies that drifted — the emitter kept an over-aggressive
// sibling-name truncation the renderer had dropped, so emitted JSDoc carried
// truncated/garbled prose the docs didn't. Keep the logic here, in one place.

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Single-word param descriptions that say nothing beyond the param's own role. */
export const GENERIC_PARAM_DESC = new Set([
  'option', 'options', 'opt', 'opts', 'parameter', 'parameters', 'param', 'params',
  'argument', 'arguments', 'arg', 'args', 'callback', 'cb', 'value', 'val', 'data',
]);

/**
 * Repair a description that was split from its antecedent during extraction — one
 * that opens with a pronoun referring to an unstated prior sentence ("It also
 * returns…", "This also includes…"). Drop the dangling pronoun so it reads as a
 * standalone note. Anchored at the start and gated on the continuation word `also`,
 * so it never touches a legitimate sentence like "It is recommended to…".
 */
export function destrand(text: string): string {
  return text.replace(/^\s*(?:It|This|That|These|Those)\s+(also\b)/, (_m, also: string) =>
    also.charAt(0).toUpperCase() + also.slice(1)
  );
}

/**
 * Clean a parameter description: collapse whitespace, drop a leading restatement of
 * the param's own name ("`end` is non-inclusive…" → "is non-inclusive…"), truncate a
 * trailing options lead-in ("…can include:"), strip trailing punctuation, drop a lone
 * generic role-noun ("options", "callback"), and — when an entry description is given
 * — drop it if it merely repeats that. Returns '' when nothing meaningful remains.
 *
 * Deliberately does NOT MDX-escape (the renderer adds that) and does NOT truncate at
 * sibling param names — that heuristic mis-cut prose where a sibling name doubled as
 * a common noun ("required `buffer` size", "the new `core`").
 */
export function cleanParamDesc(name: string, raw: string | undefined, entryDescription?: string): string {
  if (!raw) return '';
  let d = raw.trim().replace(/\s+/g, ' ');
  d = d.replace(new RegExp(`^\`?${escRe(name)}\`?[\\s,:]+`, 'i'), '');
  const li = d.search(/\s+(can include\b|includes?:|are the following\b|is one of)/i);
  if (li > 0) d = d.slice(0, li);
  d = d.replace(/[\s:,;-]+$/, '').trim();
  if (!d || (entryDescription && entryDescription.includes(d))) return '';
  if (GENERIC_PARAM_DESC.has(d.toLowerCase().replace(/`/g, ''))) return '';
  return d;
}
