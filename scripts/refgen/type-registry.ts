// scripts/refgen/type-registry.ts
//
// Resolves JSDoc type names to links so generated entries can cross-link types
// (item 3). Two tiers:
//   * INTERNAL — types our own reference pages document. Auto-built by scanning
//     the committed models (generated/refs/*/api-model.json) for class names and
//     mapping each to its content page route, so adding a module registers its
//     types automatically. Sub-object classes (Batch, Channel…) point at the
//     page that documents them.
//   * EXTERNAL — common platform types, linked to MDN / Node docs.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REFS_DIR = 'generated/refs';
const CONTENT_ROOT = 'content/reference';

/** Platform / built-in type → external docs URL. Primitives are intentionally omitted. */
const EXTERNAL: Record<string, string> = {
  Buffer: 'https://nodejs.org/api/buffer.html#class-buffer',
  Promise: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
  Map: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
  Set: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
  Uint8Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array',
  ArrayBuffer: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer',
  Stream: 'https://nodejs.org/api/stream.html',
  Readable: 'https://nodejs.org/api/stream.html#class-streamreadable',
  Writable: 'https://nodejs.org/api/stream.html#class-streamwritable',
};

/** Alternate spellings that may appear in @param types but differ from the exported class name. */
const ALIASES: Record<string, string> = {
  DHT: 'HyperDHT',
  NoiseSecretStream: 'SecretStream',
};

/** Locate `<slug>.mdx` under content/reference and return its site route, or null. */
function routeForSlug(slug: string, dir = CONTENT_ROOT): string | null {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      const hit = routeForSlug(slug, p);
      if (hit) return hit;
    } else if (e === `${slug}.mdx`) {
      // content/reference/building-blocks/hypercore.mdx → /reference/building-blocks/hypercore
      return '/' + p.replace(/^content\//, '').replace(/\.mdx$/, '');
    }
  }
  return null;
}

let cached: Record<string, string> | null = null;

/** Class name → reference page route, built once from the committed models. */
function internal(): Record<string, string> {
  if (cached) return cached;
  const map: Record<string, string> = {};
  try {
    for (const slug of readdirSync(REFS_DIR)) {
      const modelPath = join(REFS_DIR, slug, 'api-model.json');
      if (!existsSync(modelPath)) continue;
      const route = routeForSlug(slug);
      if (!route) continue;
      const model = JSON.parse(readFileSync(modelPath, 'utf8')) as {
        classes?: { name?: string | null }[];
      };
      for (const c of model.classes ?? []) {
        if (c.name && !(c.name in map)) map[c.name] = route; // first (main) class wins
      }
    }
  } catch {
    /* no models yet — degrade to externals only */
  }
  // Apply aliases that resolve to a known class's route.
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (map[canonical] && !(alias in map)) map[alias] = map[canonical];
  }
  cached = map;
  return map;
}

/** Destination for a single type name, or null if we don't know it. */
export function typeUrl(name: string): string | null {
  return internal()[name] ?? EXTERNAL[name] ?? null;
}

/**
 * Render a JSDoc type expression as a code-styled, optionally-linked cell. A
 * code span inside a Markdown link renders as a clickable, monospaced type, so
 * we link the whole expression to its *primary* known type (internal preferred),
 * e.g. `Promise<Buffer>` → links to Buffer, `GetOptions` → plain code if unknown.
 */
export function renderType(expr: string | undefined, localTypes?: Record<string, string>): string {
  if (!expr) return '';
  const tokens = expr.match(/[A-Za-z_$][\w$.]*/g) ?? [];
  const reg = internal();
  let target: string | null = null;
  // Page-local @typedef anchors win, then cross-module pages, then platform docs.
  for (const t of tokens) if (localTypes?.[t]) { target = localTypes[t]; break; }
  if (!target) for (const t of tokens) if (reg[t]) { target = reg[t]; break; }
  if (!target) for (const t of tokens) if (EXTERNAL[t]) { target = EXTERNAL[t]; break; }
  const code = '`' + expr + '`';
  return target ? `[${code}](${target})` : code;
}
