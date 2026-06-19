// scripts/refgen/extract-grouping.ts
//
// Bootstrap a layout manifest's `groups` from an existing curated page: parse its
// `### group` / `#### member` (and qualifying bullet) structure and resolve every
// member to the model's static/event-aware `memberKey`. Emits the `groups` literal
// to paste into scripts/refgen/layouts/<slug>.ts — the mechanical, error-prone part
// of authoring a manifest. Prose (intro/quickstart/notes/seeAlso) is added by hand
// from the curated page.
//
// Also reports members documented on the page that the model lacks (unresolved —
// curation exceeds upstream) so they aren't silently dropped.
//
// Usage: npx tsx scripts/refgen/extract-grouping.ts <slug>

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiModel } from './model';
import { memberKey } from './identity';
import { primaryName, eventName } from './extract-readme';

const CONTENT_ROOT = 'content/reference';
const REFS = 'generated/refs';

function findPage(slug: string, dir = CONTENT_ROOT): string | null {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      const hit = findPage(slug, p);
      if (hit) return hit;
    } else if (e === `${slug}.mdx`) return p;
  }
  return null;
}

const HEADING = /^####\s+`(.+)`\s*$/;
const BULLET = /^(\s*)[-*]\s+`([^`]+)`/;
const EVENT = /\.on\(\s*['"]/;
const DOTTED_CALL = /[\w$]\.[\w$][\w$]*\s*\(/;
const DOTTED_PROP = /[\w$]\.[\w$]/;
const OPTION_RECEIVERS = new Set(['options', 'opts', 'config', 'cfg', 'o']);

/** Does a `- \`sig\`` bullet document a symbol (vs a param/option bullet)? Mirrors identity.pageSymbols. */
function isBulletSymbol(indent: string, sig: string): boolean {
  const receiver = sig.match(/^([\w$]+)\./)?.[1];
  if (receiver && OPTION_RECEIVERS.has(receiver)) return false;
  return EVENT.test(sig) || DOTTED_CALL.test(sig) || (indent.length === 0 && DOTTED_PROP.test(sig));
}

/** Resolve a curated signature to a model memberKey (static/event-aware), or null. */
function resolveKey(sig: string, className: string | undefined, valid: Set<string>): string | null {
  const ev = eventName(sig);
  if (ev) return valid.has(`on:${ev}`) ? `on:${ev}` : null;
  const name = primaryName(sig);
  if (!name) return null;
  const isStatic = !!className && new RegExp(`\\b${className}\\.${name}\\b`).test(sig);
  if (isStatic && valid.has(`static:${name}`)) return `static:${name}`;
  if (valid.has(name)) return name;
  if (valid.has(`static:${name}`)) return `static:${name}`;
  return null;
}

export function extractGrouping(slug: string): {
  groups: { title: string; members: string[] }[];
  unresolved: string[];
} {
  const pagePath = findPage(slug);
  if (!pagePath) throw new Error(`no curated page for ${slug}`);
  const model = JSON.parse(readFileSync(join(REFS, slug, 'api-model.json'), 'utf8')) as ApiModel;
  const className = model.classes[0]?.name;
  const valid = new Set(model.classes.flatMap((c) => c.methods.map(memberKey)));

  const groups: { title: string; members: string[] }[] = [];
  const unresolved: string[] = [];
  let group: { title: string; members: string[] } | null = null;

  for (const line of readFileSync(pagePath, 'utf8').split('\n')) {
    const g = line.match(/^###\s+(.+?)\s*$/);
    if (g) {
      group = { title: g[1], members: [] };
      groups.push(group);
      continue;
    }
    let sig: string | null = null;
    const h = line.match(HEADING);
    if (h) sig = h[1].trim();
    else {
      const b = line.match(BULLET);
      if (b && isBulletSymbol(b[1], b[2].trim())) sig = b[2].trim();
    }
    if (!sig || !group) continue;
    const key = resolveKey(sig, className, valid);
    if (key) {
      if (!group.members.includes(key)) group.members.push(key);
    } else unresolved.push(sig);
  }

  return { groups: groups.filter((g) => g.members.length), unresolved };
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/refgen/extract-grouping.ts <slug>');
    process.exit(1);
  }
  const { groups, unresolved } = extractGrouping(slug);
  const lit = groups
    .map((g) => `    { title: ${JSON.stringify(g.title)}, members: ${JSON.stringify(g.members)} },`)
    .join('\n');
  console.log(`  groups: [\n${lit}\n  ],`);
  if (unresolved.length) {
    console.error(`\n// ⚠ ${unresolved.length} page member(s) not found in the model (curation exceeds upstream):`);
    for (const u of unresolved) console.error(`//   ${u}`);
  }
}

main();
