// scripts/bare-refgen/render.ts
//
// Turn a BareModel (+ optional layout) into an MDX page shaped like the
// existing content/reference/bare/modules/*.mdx pages: frontmatter, a <mark>
// stability badge, a facts-only intro (with a Node.js parity link), verbatim
// README usage, an ## API section grouped by the layout manifest (or by kind),
// documented subpath entry points, and a ## See also block.
//
// Every string comes from the .d.ts, package.json, the README, the layout
// manifest (author-written group titles + descriptions), or a deterministic
// map — nothing is synthesized here.

import type { BareModel, BareExport, BareParam, BareThrows } from './model';
import type { Layout } from './layout';
import {
  ORG,
  PREFIX,
  FAMILY,
  CATALOG_ROUTE,
  EXTRA_SEE_ALSO,
  STABILITY_COLORS,
  stabilityOf,
  nodeParityUrl,
} from './config';
import { extractAnchors } from '../helpers';

/** Signatures longer than this drop to a code block below the heading. */
const HEADING_MAX = 96;

interface Ctx {
  model: BareModel;
  layout: Layout | null;
  /** Documented type name → on-page anchor slug (for cross-links). */
  typeAnchors: Map<string, string>;
  /** 'mdx' for the docs page; 'readme' for a plain-markdown upstream README. */
  target: 'mdx' | 'readme';
}

interface Entry {
  key: string;
  name: string;
  group: string;
  /** Qualifier for anchor de-duplication (class name or subpath segment; '' = canonical). */
  scope: string;
  /** The `####` heading text (signature or name), for collision detection. */
  heading: string;
  /** Kept so a colliding heading can be re-rendered with a qualifier. */
  ex: BareExport;
  sync: BareExport | null;
  mdx: string;
}

// ---- small helpers -------------------------------------------------------

const code = (s: string) => `\`${s}\``;

/**
 * Make author prose safe to drop into MDX: escape `{`, `}`, `<` outside inline
 * code (they'd otherwise start a JS expression or JSX element). Code spans are
 * left untouched. No-op for the README (plain Markdown) target.
 */
function mdxProse(text: string, ctx: Ctx): string {
  if (ctx.target === 'readme') return text;
  return fixAnchorLinks(text, ctx)
    .split(/(`[^`]*`)/)
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(/[{}<]/g, (c) => `\\${c}`)))
    .join('');
}

/**
 * Repair a same-page anchor link whose label names a documented type but
 * whose target doesn't resolve — upstream TSDoc prose is sometimes reused
 * verbatim from a README section heading that doesn't exist as a heading on
 * this generated page (e.g. bare-pipe's TSDoc still links `IPCAcceptable` to
 * `#ipc-handle-passing`, the README's own section anchor, when it's
 * documented here under `#ipcacceptable`). Retargets to the real anchor when
 * the label names a documented type; strips the link (keeps the label)
 * otherwise — a dangling same-page anchor is never an improvement over plain
 * text.
 */
function fixAnchorLinks(text: string, ctx: Ctx): string {
  const knownAnchors = new Set(ctx.typeAnchors.values());
  return text.replace(/\[(`[^`]+`|[^\]]+)\]\(#([^)]+)\)/g, (match, label: string, anchor: string) => {
    if (knownAnchors.has(anchor)) return match;
    const bare = label.replace(/^`|`$/g, '');
    const known = ctx.typeAnchors.get(bare);
    return known ? `[${label}](#${known})` : label;
  });
}

/**
 * A verbatim README block (Usage, or an extra top-level section) may contain
 * GitHub-flavoured Markdown that isn't valid MDX. The one confirmed offender
 * so far: a bare autolink like `<https://example.com>` — CommonMark treats it
 * as a link, but MDX always tries to parse `<…>` as JSX and chokes on the
 * `//`. Rewritten to a normal Markdown link, which renders identically.
 * Fence-aware: never touches text inside a ``` code block, where this
 * pattern is inert either way (MDX doesn't try to parse JSX inside a fence).
 */
function mdxSafeReadmeBlock(text: string): string {
  return text
    .split(/(^```[\s\S]*?^```$)/m)
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(/<(https?:\/\/[^\s>]+)>/g, '[$1]($1)')))
    .join('');
}

/** github-slugger's result for a plain identifier heading. */
function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Safe lookup by key then name. MUST use Object.hasOwn — a member named
 * `toString`/`constructor`/`valueOf` would otherwise resolve the matching
 * Object.prototype member instead of returning undefined.
 */
function own<T>(map: Record<string, T> | undefined, ...keys: string[]): T | undefined {
  if (!map) return undefined;
  for (const k of keys) if (Object.hasOwn(map, k)) return map[k];
  return undefined;
}

function describe(ctx: Ctx, e: BareExport): string | null {
  return e.description ?? own(ctx.layout?.describe, e.key, e.name) ?? null;
}

function returnsFor(ctx: Ctx, e: BareExport): string | null {
  return e.returns?.description ?? own(ctx.layout?.returns, e.key, e.name) ?? null;
}

function throwsFor(ctx: Ctx, e: BareExport): BareThrows[] {
  if (e.throws.length > 0) return e.throws;
  const overrides = own(ctx.layout?.throws, e.key, e.name) ?? [];
  return overrides.map(parseThrows);
}

function parseThrows(s: string): BareThrows {
  const m = s.match(/^\s*`([^`]+)`\s*[—-]?\s*(.*)$/);
  return m ? { type: m[1].trim(), condition: m[2].trim() } : { type: null, condition: s.trim() };
}

/** One atom of a type (no unions), linked to its anchor when documented. */
function linkAtom(atom: string, ctx: Ctx): string {
  const trimmed = atom.trim();
  const bare = trimmed.replace(/\[\]$/, '');
  const anchor = ctx.typeAnchors.get(bare);
  return anchor ? `[${code(trimmed)}](#${anchor})` : code(trimmed);
}

/**
 * A type reference. Links documented types to their on-page anchors — including
 * each member of a simple union (`Flag | number` → the `Flag` links). Complex
 * types (objects, functions, generics) are left as a single code span. README
 * output is never cross-linked. Whitespace is collapsed so a multi-line type
 * doesn't break the inline code span it's wrapped in.
 */
function linkType(type: string, ctx: Ctx): string {
  const base = type.trim().replace(/\s+/g, ' ');
  if (ctx.target === 'readme') return code(base);
  // Only split simple unions of atoms; leave anything with structure intact.
  if (/[{}()<>]/.test(base) || !base.includes('|')) return linkAtom(base, ctx);
  return base
    .split('|')
    .map((part) => linkAtom(part, ctx))
    .join(' | ');
}

/**
 * Prepare text for a GFM table cell: escape `|` (splits cells even in code
 * spans) and collapse embedded newlines (a literal one breaks out of the row
 * entirely — some upstream JSDoc wraps a `@param` description across lines).
 */
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

/**
 * Parameters as a GFM table — one row per parameter, `?` marking optional
 * (TS-native, machine-parseable), Default `—` when none. Reads better than
 * bullets for both humans and machines at any parameter count.
 */
function paramTable(params: BareParam[], ctx: Ctx, pd: Record<string, string>): string[] {
  const rows = params.map((p) => {
    const name = code(p.name + (p.optional && !p.default ? '?' : ''));
    const type = cell(linkType(p.type, ctx));
    const def = p.default ? cell(code(p.default)) : '—';
    // A manifest entry wins even when the model already has text — the escape
    // hatch for upstream JSDoc prose that reads badly rendered raw, such as
    // an unescaped object-literal example breaking a table row or a lint rule.
    const text = own(pd, p.name) ?? p.description ?? '';
    const desc = text ? cell(mdxProse(text, ctx)) : '—';
    return `| ${name} | ${type} | ${def} | ${desc} |`;
  });
  return ['| Parameter | Type | Default | Description |', '| --- | --- | --- | --- |', ...rows];
}

function paramDescs(ctx: Ctx, e: BareExport): Record<string, string> {
  return own(ctx.layout?.params, e.key, e.name) ?? {};
}

/** The text shown inside the `####` heading (a signature, or a bare name). */
function headingText(e: BareExport, prefix: string): string {
  const sig = e.signatures[0] ?? e.name;
  const isType = e.kind === 'interface' || e.kind === 'typeAlias';
  const longOrMultiline = sig.length > HEADING_MAX || sig.includes('\n');
  return prefix + (isType || longOrMultiline ? e.name : sig);
}

// ---- rendering one exported symbol --------------------------------------

function renderSymbol(e: BareExport, ctx: Ctx, syncSibling: BareExport | null, prefix = ''): string {
  const lines: string[] = [];
  const sig = e.signatures[0] ?? e.name;
  const callable = e.kind === 'function' || e.kind === 'method' || e.kind === 'constructor';
  const isType = e.kind === 'interface' || e.kind === 'typeAlias';

  const longOrMultiline = sig.length > HEADING_MAX || sig.includes('\n');
  if (isType || longOrMultiline) {
    lines.push(`#### ${code(prefix + e.name)}`, '');
    lines.push('```ts', sig, '```', '');
  } else {
    lines.push(`#### ${code(prefix + sig)}`, '');
  }

  if (e.deprecated !== null) lines.push(`**Deprecated.** ${e.deprecated}`.trim(), '');

  const desc = describe(ctx, e);
  if (desc) lines.push(mdxProse(desc, ctx), '');

  if (callable && e.signatures.length > 1 && !longOrMultiline) {
    lines.push('Overloads:', '', '```ts', ...e.signatures, '```', '');
  }

  if (syncSibling) {
    lines.push(`Synchronous form: ${code(syncSibling.signatures[0] ?? syncSibling.name)}`, '');
  }

  if (callable && e.params.length > 0) {
    const pd = paramDescs(ctx, e);
    lines.push('**Parameters**', '', ...paramTable(e.params, ctx, pd), '');
  }
  const returnsDesc = callable ? returnsFor(ctx, e) : null;
  if (returnsDesc && e.returns) {
    lines.push(`**Returns** ${linkType(e.returns.type, ctx)} — ${mdxProse(returnsDesc, ctx)}`, '');
  }

  const throws = throwsFor(ctx, e);
  if (throws.length > 0) {
    lines.push('**Throws**', '');
    for (const t of throws) lines.push(`- ${t.type ? `${code(t.type)} — ` : ''}${mdxProse(t.condition, ctx)}`.trimEnd());
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

/** A class worth expanding into per-member `####` entries (vs. a data shape). */
function shouldExpandClass(e: BareExport): boolean {
  return e.members.some(
    (m) => m.kind === 'method' || m.kind === 'constructor' || (m.static && m.kind === 'function'),
  );
}

function renderClassShape(e: BareExport): string {
  const body = e.members.map((m) => `  ${m.signatures[0] ?? m.name}`);
  return [
    `#### ${code(e.name)}`,
    '',
    '```ts',
    `class ${e.name} {`,
    ...body,
    '}',
    '```',
  ].join('\n');
}

// ---- flattening the model into renderable entries -----------------------

function buildEntries(exportsList: BareExport[], ctx: Ctx, defaultScope = ''): Entry[] {
  const entries: Entry[] = [];
  const fnNames = new Set(exportsList.filter((e) => e.kind === 'function').map((e) => e.name));
  const fnByName = new Map(exportsList.filter((e) => e.kind === 'function').map((e) => [e.name, e]));

  const add = (e: BareExport, group: string, sync: BareExport | null = null, scope = defaultScope) =>
    entries.push({ key: e.key, name: e.name, group, scope, sync, ex: e, heading: headingText(e, ''), mdx: renderSymbol(e, ctx, sync) });

  for (const e of exportsList) {
    switch (e.kind) {
      case 'class':
        if (shouldExpandClass(e)) {
          // Members scope to the class so `Stats.isFile` ≠ `Dirent.isFile`.
          for (const m of e.members) add(m, e.name, null, e.name);
        } else {
          entries.push({ key: e.key, name: e.name, group: 'Classes', scope: defaultScope, sync: null, ex: e, heading: e.name, mdx: renderClassShape(e) });
        }
        break;
      case 'namespace':
        for (const m of e.members) add(m, e.name);
        break;
      case 'function': {
        // Fold the `*Sync` sibling into the async primary rather than repeating.
        if (e.name.endsWith('Sync') && fnNames.has(e.name.slice(0, -4))) break;
        add(e, 'Functions', fnByName.get(`${e.name}Sync`) ?? null);
        break;
      }
      case 'interface':
      case 'typeAlias':
        add(e, 'Types');
        break;
      default:
        add(e, 'Constants and variables');
    }
  }
  return entries;
}

/**
 * Anchors are page-global, so identical `####` headings across sections collide
 * (e.g. `Stats.isFile`/`Dirent.isFile`, or a main function and its
 * `bare-fs/promises` twin). For each colliding heading, qualify the entries that
 * carry a scope (class name or subpath segment) with `scope.`, leaving the
 * canonical top-level one (empty scope) bare.
 */
function dedupeHeadings(entries: Entry[], ctx: Ctx): void {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.heading, (counts.get(e.heading) ?? 0) + 1);
  for (const e of entries) {
    if (e.scope && (counts.get(e.heading) ?? 0) > 1) {
      e.mdx = renderSymbol(e.ex, ctx, e.sync, `${e.scope}.`);
      e.heading = headingText(e.ex, `${e.scope}.`);
    }
  }
}

/** Last path segment of a subpath specifier, e.g. `bare-fs/promises` → `promises`. */
function subpathScope(name: string): string {
  return name.split('/').pop() ?? name;
}

/** Documented type names (interfaces, type aliases, thin classes) → anchors. */
function buildTypeAnchors(exportsList: BareExport[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of exportsList) {
    if (e.kind === 'interface' || e.kind === 'typeAlias') map.set(e.name, slug(e.name));
    else if (e.kind === 'class' && !shouldExpandClass(e)) map.set(e.name, slug(e.name));
  }
  return map;
}

// ---- grouping ------------------------------------------------------------

interface RenderedGroup {
  title: string;
  entries: Entry[];
}

function groupByLayout(entries: Entry[], layout: Layout): { groups: RenderedGroup[]; orphans: string[] } {
  const used = new Set<Entry>();
  const groups: RenderedGroup[] = [];
  for (const g of layout.groups ?? []) {
    const picked: Entry[] = [];
    for (const ref of g.members) {
      const match = entries.find((e) => !used.has(e) && (e.key === ref || e.name === ref));
      if (match) {
        used.add(match);
        picked.push(match);
      }
    }
    if (picked.length) groups.push({ title: g.title, entries: picked });
  }
  const leftover = entries.filter((e) => !used.has(e));
  groups.push(...groupByKind(leftover));
  return { groups, orphans: leftover.map((e) => e.key) };
}

function groupByKind(entries: Entry[]): RenderedGroup[] {
  const order: string[] = [];
  const byGroup = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!byGroup.has(e.group)) {
      byGroup.set(e.group, []);
      order.push(e.group);
    }
    byGroup.get(e.group)!.push(e);
  }
  const tail = ['Functions', 'Constants and variables', 'Types', 'Classes'];
  const rank = (g: string) => (tail.indexOf(g) === -1 ? -1 : tail.indexOf(g));
  const ordered = [...order].sort((a, b) => rank(a) - rank(b));
  return ordered.map((title) => ({ title, entries: byGroup.get(title)! }));
}

function renderGroups(groups: RenderedGroup[]): string[] {
  const out: string[] = [];
  for (const g of groups) {
    out.push(`### ${g.title}`, '');
    for (const e of g.entries) out.push(e.mdx, '');
  }
  return out;
}

// ---- page assembly -------------------------------------------------------

function frontmatter(model: BareModel): string {
  const desc = (model.description ?? `Reference for ${model.name}, generated from its TypeScript declarations.`)
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return ['---', `title: "${model.name}"`, `description: "${desc}"`, 'docType: reference', 'schemaType: APIReference', '---'].join('\n');
}

function stabilityBadge(name: string): string {
  const stability = stabilityOf(name);
  return `<mark style={{ backgroundColor: '${STABILITY_COLORS[stability]}', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 500 }}>${stability}</mark>`;
}

function intro(model: BareModel, layout: Layout | null): string {
  const repo = model.repoUrl ?? `https://github.com/${ORG}/${model.name}`;
  const facts: string[] = [];
  if (model.native) facts.push('It is a native addon');
  if (model.minBare) facts.push(`requires Bare ${code(model.minBare)}`);
  const factLine = facts.length ? `${facts.join(' and ')}.` : '';
  const desc = model.description ? `${model.description}.`.replace(/\.\.$/, '.') : '';
  // An author-written manifest intro replaces the auto description sentence.
  const line = layout?.intro
    ? layout.intro.trim()
    : `[${code(model.name)}](${repo}) — ${desc} ${factLine}`.replace(/\s+/g, ' ').trim();

  const out = [line];
  const node = nodeParityUrl(model.name);
  if (node) {
    out.push('', `Mirrors the Node.js [${code(nodeModuleName(model.name, node))}](${node}) module.`);
  }
  out.push('', '```sh', `npm i ${model.name}`, '```');
  return out.join('\n');
}

function nodeModuleName(name: string, url: string): string {
  return url.replace('https://nodejs.org/api/', '').replace('.html', '');
}

/** The `## API` heading, grouped body, and subpath sections — shared by both targets. */
function apiSection(ctx: Ctx): { lines: string[]; orphans: string[] } {
  const { model, layout } = ctx;
  const mainEntries = buildEntries(model.exports, ctx);
  const subSections = model.subpaths
    .map((sub) => ({ sub, entries: buildEntries(sub.exports, ctx, subpathScope(sub.name)) }))
    .filter((s) => s.entries.length > 0);

  // De-duplicate anchors across the whole page (main + every subpath section).
  dedupeHeadings([...mainEntries, ...subSections.flatMap((s) => s.entries)], ctx);

  const { groups, orphans } = layout
    ? groupByLayout(mainEntries, layout)
    : { groups: groupByKind(mainEntries), orphans: [] as string[] };

  const lines: string[] = ['## API', ''];
  if (mainEntries.length === 0) {
    lines.push('_This module ships no documented public exports in its type declarations._', '');
  }
  lines.push(...renderGroups(groups));

  // Additional published entry points (bare-fs/promises, bare-stream/web, …).
  for (const { sub, entries } of subSections) {
    lines.push(`## \`${sub.name}\``, '');
    lines.push(...renderGroups(groupByKind(entries)));
  }
  return { lines, orphans };
}

const tidy = (s: string) => s.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

/** "Builds on `a`, `b`, and `c`." from this module's own `bare-*` dependencies. */
function buildsOnLine(model: BareModel): string | null {
  if (model.dependencies.length === 0) return null;
  const items = model.dependencies.map(code);
  const last = items[items.length - 1];
  const joined = items.length === 1 ? last : `${items.slice(0, -1).join(', ')}${items.length > 2 ? ',' : ''} and ${last}`;
  return `- Builds on ${joined}.`;
}

export function renderPage(model: BareModel, layout: Layout | null): { mdx: string; orphans: string[] } {
  const ctx: Ctx = { model, layout, typeAnchors: buildTypeAnchors(model.exports), target: 'mdx' };
  const usageBlock = model.usage ? mdxSafeReadmeBlock(model.usage.trim()) : null;
  // Defensive: committed api-model.json files predating this field lack it.
  const extraBlocks = (model.extraSections ?? []).map(({ heading, body }) => ({
    heading,
    body: mdxSafeReadmeBlock(body.trim()),
  }));
  const { lines: apiLines, orphans } = apiSection(ctx);

  // Verbatim README prose sometimes links to a same-page section that this
  // pipeline never carries over — most commonly the README's own `## API`
  // prose, which the extracted, .d.ts-derived `## API` section replaces
  // rather than supplements (e.g. bare-module's "Packages" section links to
  // `#protocols`/`#commonjs-modules`, headings that only exist in the
  // README's API prose). Compute the real anchor set this page will expose
  // and strip (never leave dangling) any same-page link that misses it —
  // same contract as `fixAnchorLinks()`, generalized to this content.
  const draftForAnchors = [
    ...(usageBlock ? ['## Usage', '', usageBlock] : []),
    ...apiLines,
    ...extraBlocks.flatMap(({ heading, body }) => [`## ${heading}`, '', body]),
  ].join('\n');
  const realAnchors = extractAnchors(draftForAnchors);
  const stripDanglingAnchors = (text: string) =>
    text.replace(/\[([^\]]+)\]\(#([^)]+)\)/g, (m, label: string, anchor: string) => (realAnchors.has(anchor) ? m : label));

  const parts: string[] = [frontmatter(model), '', stabilityBadge(model.name), '', intro(model, layout), ''];
  if (usageBlock) parts.push('## Usage', '', stripDanglingAnchors(usageBlock), '');

  parts.push(...apiLines);

  for (const { heading, body } of extraBlocks) parts.push(`## ${heading}`, '', stripDanglingAnchors(body), '');

  parts.push('## See also', '');
  const buildsOn = buildsOnLine(model);
  if (buildsOn) parts.push(buildsOn);
  for (const s of layout?.seeAlso ?? []) parts.push(`- ${s}`);
  parts.push(
    `- [${FAMILY === 'bare' ? 'Bare' : 'Pear'} modules](${CATALOG_ROUTE}) — the full \`${PREFIX}*\` catalog.`,
    ...(EXTRA_SEE_ALSO ? [`- ${EXTRA_SEE_ALSO}`] : []),
    '',
  );

  return { mdx: tidy(parts.join('\n')), orphans };
}

/**
 * The `## API` section as plain GitHub-flavoured Markdown, for splicing into an
 * upstream README. No frontmatter, MDX components, or on-page cross-links.
 */
export function renderReadmeApi(model: BareModel, layout: Layout | null): string {
  const ctx: Ctx = { model, layout, typeAnchors: new Map(), target: 'readme' };
  return tidy(apiSection(ctx).lines.join('\n'));
}
