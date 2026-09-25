// scripts/refgen/identity.ts
//
// One symbol-identity scheme shared by the parity rater and the curated-page
// sync, so "the same member" means the same thing on both the curated MDX page
// and the generated model. Events are the subtle case: they all bind to the
// `on` method, so their identity is keyed by the event name (`on:close`) rather
// than collapsing to a single `on`.

import type { RefMethod } from './model';
import { primaryName, eventName } from './extract-readme';

/** Identity of a `#### \`signature\`` heading, keeping events distinct by name. */
export function symbolId(signature: string): string | null {
  const ev = eventName(signature);
  return ev ? `on:${ev}` : primaryName(signature);
}

/** Identity of a model member, matching `symbolId` for the same signature. */
export function memberId(m: RefMethod): string {
  return m.kind === 'event' && m.event ? `on:${m.event}` : m.name;
}

/**
 * Unique key for addressing a member from a layout manifest. Adds a `static:`
 * prefix so a static helper (`Autobase.getUserData`) doesn't collide with an
 * instance method of the same name (`base.getUserData`).
 */
export function memberKey(m: RefMethod): string {
  return (m.static ? 'static:' : '') + memberId(m);
}

// Documented symbols on a curated page appear in a few shapes, and the rater has
// to tell them apart from the param/option bullets that share the `- \`code\``
// form:
//   - `#### \`sig\``                 — methods (always a symbol)
//   - `- \`base.on('update', …)\``   — events, at any indent
//   - `- \`handle.destroy()\``       — sub-object method calls, at any indent
//   - `- \`base.view\``              — property list, column 0 only
// Excluded: bare params (`- \`store\``), bare-call options (`- \`open(s, h)\``)
// and indented option fields (`- \`options.seq\``).
const HEADING_RE = /^####\s+`(.+)`\s*$/;
const BULLET_RE = /^(\s*)[-*] +`([^`]+)`/;
const EVENT_BULLET = /\.on\(\s*['"]/;
const DOTTED_CALL = /[\w$]\.[\w$][\w$]*\s*\(/;
const DOTTED_PROP = /[\w$]\.[\w$]/;
// Bullets like `options.firewall(...)` or `opts.seq` document option fields, not
// API members — exclude them by their receiver even though they look dotted.
const OPTION_RECEIVERS = new Set(['options', 'opts', 'config', 'cfg', 'o']);

/** Identities of every documented symbol on a curated MDX page (headings + bullets). */
export function pageSymbols(mdx: string): Set<string> {
  const ids = new Set<string>();
  for (const line of mdx.split('\n')) {
    const hm = line.match(HEADING_RE);
    if (hm) {
      const id = symbolId(hm[1].trim());
      if (id) ids.add(id);
      continue;
    }
    const bm = line.match(BULLET_RE);
    if (!bm) continue;
    const indented = bm[1].length > 0;
    const sig = bm[2].trim();
    const receiver = sig.match(/^([\w$]+)\./)?.[1];
    if (receiver && OPTION_RECEIVERS.has(receiver)) continue;
    const isSymbol = EVENT_BULLET.test(sig) || DOTTED_CALL.test(sig) || (!indented && DOTTED_PROP.test(sig));
    if (!isSymbol) continue;
    const id = symbolId(sig);
    if (id) ids.add(id);
  }
  return ids;
}
