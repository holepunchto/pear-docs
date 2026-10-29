// scripts/bare-refgen/layout.ts
//
// Optional per-module layout manifest. This is the ONE editorial input to the
// pipeline: it names the API groups ("File handles", "Metadata", …) and the
// order of members within them — structure the docs team already authored on
// the hand-written pages. It carries no prose; the factual content under each
// heading is regenerated from the .d.ts every run.
//
// A manifest is a `scripts/bare-refgen/layouts/<name>.ts` module with a default
// export of type Layout. Members are referenced by their model key or display
// name (e.g. `open`, `URL.parse`, `parse`). Anything not listed is rendered
// under a trailing "Other" group and logged, so nothing is silently dropped.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LAYOUTS_DIR } from './config';

export interface LayoutGroup {
  title: string;
  /** Member keys or display names, in the order they should appear. */
  members: string[];
}

export interface Layout {
  /** Optional — a manifest may carry only params/returns/throws/describe overrides. */
  groups?: LayoutGroup[];
  /**
   * Throws that the .d.ts doesn't (yet) annotate, keyed by member key/name.
   * Each string is a ready-to-render bullet; a leading `` `CODE` `` becomes the
   * error type. Mirrors the refgen manifest-override pattern.
   */
  throws?: Record<string, string[]>;
  /**
   * Member descriptions, keyed by member key/name. The renderer uses them when
   * the model has no description of its own. Author-written (e.g. transcribed
   * from the README), not AI-generated.
   */
  describe?: Record<string, string>;
  /**
   * Per-parameter descriptions, keyed by member key/name → { paramName: prose }.
   * Rendered under Parameters and emitted as `@param` TSDoc. Author-written.
   */
  params?: Record<string, Record<string, string>>;
  /**
   * Return-value descriptions, keyed by member key/name. The `.d.ts` always
   * carries the return *type*, but never a `@returns` comment (no upstream
   * JSDoc yet), so without this override a callable can never get a
   * **Returns** line. Rendered as `**Returns** <type> — <prose>` and emitted
   * as an upstream `@returns` TSDoc tag. Author-written.
   */
  returns?: Record<string, string>;
  /**
   * An author-written lead paragraph for the page intro, used verbatim instead
   * of the auto-assembled description sentence (the npm-install fence and the
   * Node parity line are still added). Markdown; may include links.
   */
  intro?: string;
  /**
   * Exact-text fixes to the blocks that come from the upstream README: the
   * Usage block (`in: 'usage'`) and the extra sections the research dossier
   * carries (`in` is the section's heading). For what the README gets wrong or
   * leaves out. `in: 'intro'` targets the page intro (the lead paragraph and
   * the install fence). `from` must occur in that block exactly once, or the
   * render fails: a fix upstream has since made is noticed and dropped, not
   * left silently doing nothing.
   */
  patch?: Array<{ in: string; from: string; to: string }>;
  /**
   * Exact-text edits to one member's rendered block (`member` is its model key
   * or name, as in `groups`). For docs-page prose that the `.d.ts` TSDoc lacks
   * or gets wrong, which `describe` can't supply because it only fills a
   * missing description. Same contract as `patch`: `from` must occur in the
   * block exactly once, so an edit that upstream TSDoc has since overtaken
   * fails the render instead of hiding the new text. Docs page only; the README
   * `## API` that emit-tsdoc writes is left alone.
   */
  memberPatch?: Array<{ member: string; from: string; to: string }>;
  /**
   * Author-written blocks for symbols the `.d.ts` doesn't carry, such as a
   * factory that only the `.js` defines or an event map the package root
   * doesn't re-export. Each `body` (Markdown, usually a `####` entry) renders
   * right after the block of the member named by `after`, in its group. Docs
   * page only.
   */
  extraMembers?: Array<{ after: string; body: string }>;
  /**
   * Extra "See also" bullets (ready-to-render Markdown, e.g.
   * "[`bare-stream`](/reference/bare/modules/bare-stream) — the returned streams.").
   * Prepended to the default catalog/runtime links.
   */
  seeAlso?: string[];
  /**
   * Author-written `## heading` sections appended after the API section (and
   * before any README sections captured by the research dossier). For what a
   * `.d.ts` can't carry: event tables, aliases, untyped runtime exports.
   * `body` is Markdown and may use `###`/`####` sub-headings.
   */
  extraSections?: Array<{ heading: string; body: string }>;
}

export async function loadLayout(name: string): Promise<Layout | null> {
  const tsFile = resolve(LAYOUTS_DIR, `${name}.ts`);
  const base = existsSync(tsFile)
    ? ((await import(pathToFileURL(tsFile).href)) as { default?: Layout }).default ?? null
    : null;

  // Reviewed descriptions promoted from a transcribe run live as data alongside
  // the manifest, so the .ts stays small. Inline `describe` entries win on conflict.
  const descFile = resolve(LAYOUTS_DIR, `${name}.describe.json`);
  const external: Record<string, string> | null = existsSync(descFile)
    ? JSON.parse(await readFile(descFile, 'utf8'))
    : null;

  // Longer author-written sections live as data (`<name>.sections.json`, an
  // array of { heading, body }) so Markdown with backticks stays unescaped.
  const secFile = resolve(LAYOUTS_DIR, `${name}.sections.json`);
  const sections: Array<{ heading: string; body: string }> = existsSync(secFile)
    ? JSON.parse(await readFile(secFile, 'utf8'))
    : [];

  // Long patches and extra member blocks live as data for the same reason:
  // `<name>.patches.json` is an array of `patch` ({ in, from, to }) and
  // `memberPatch` ({ member, from, to }) entries, `<name>.members.json` an
  // array of `extraMembers` entries.
  const patchFile = resolve(LAYOUTS_DIR, `${name}.patches.json`);
  const patches: Array<{ in?: string; member?: string; from: string; to: string }> = existsSync(patchFile)
    ? JSON.parse(await readFile(patchFile, 'utf8'))
    : [];
  for (const p of patches) {
    if ((p.in === undefined) === (p.member === undefined)) {
      throw new Error(`${patchFile}: every entry needs exactly one of "in" or "member": ${JSON.stringify(p.from.slice(0, 80))}`);
    }
  }
  const membersFile = resolve(LAYOUTS_DIR, `${name}.members.json`);
  const members: Array<{ after: string; body: string }> = existsSync(membersFile)
    ? JSON.parse(await readFile(membersFile, 'utf8'))
    : [];

  if (!base && !external && sections.length === 0 && patches.length === 0 && members.length === 0) return null;
  return {
    groups: base?.groups ?? [],
    params: base?.params,
    returns: base?.returns,
    intro: base?.intro,
    patch: [
      ...(base?.patch ?? []),
      ...patches.flatMap((p) => (p.in !== undefined ? [{ in: p.in, from: p.from, to: p.to }] : [])),
    ],
    memberPatch: [
      ...(base?.memberPatch ?? []),
      ...patches.flatMap((p) => (p.member !== undefined ? [{ member: p.member, from: p.from, to: p.to }] : [])),
    ],
    extraMembers: [...(base?.extraMembers ?? []), ...members],
    seeAlso: base?.seeAlso,
    extraSections: [...(base?.extraSections ?? []), ...sections],
    throws: base?.throws,
    describe: { ...(external ?? {}), ...(base?.describe ?? {}) },
  };
}
