// scripts/refgen/render-curated.ts
//
// The hybrid renderer: merge the model (auto-refreshed factual surface) with a
// layout manifest (the editorial 20%) into a full curated-style reference page.
// This is what makes the page a generated artifact rather than a hand-edited file
// — on each release it is re-emitted, with member facts fresh and the editorial
// structure preserved. Members the manifest doesn't place land in an "Ungrouped"
// bucket so newly documented upstream API surfaces for a human to file.

import type { ApiModel, RefMethod } from './model';
import type { Layout, MemberDoc } from './layout';
import type { Augmentation } from './augment';
import { memberKey } from './identity';
import { renderType } from './type-registry';
import { cleanParamDesc, destrand } from './prose';

function frontmatter(title: string, description: string): string {
  return [
    '---',
    `title: "${title}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    'docType: reference',
    'schemaType: APIReference',
    '---',
  ].join('\n');
}

/** True for the README options object fence (rendered as a table, not a code block). */
function isOptionsFence(ex: string): boolean {
  const t = ex.trim();
  return t.startsWith('{') && t.endsWith('}') && /^\s*[A-Za-z_$][\w$]*\s*[,:]/m.test(t);
}

/**
 * Escape MDX-significant characters ({ } <) in MODEL-derived prose (README/AST
 * text we don't control), so an upstream phrase like "pass { key: x }" or a
 * generic like "Map<K, V>" isn't parsed as a JSX expression/tag and break the
 * build. Characters inside inline-code spans are already literal and left alone.
 * Manifest-authored prose is trusted (it may contain real JSX) and never passes
 * through here.
 */
function mdxSafe(text: string): string {
  return text.replace(/(`[^`]*`)|([{}<])/g, (_m, code, ch) => code ?? '\\' + ch);
}

/** mdxSafe plus pipe-escaping, for text rendered inside a Markdown table cell. */
function cellSafe(text: string): string {
  return mdxSafe(text).replace(/\|/g, '\\|');
}

/**
 * Build a Markdown table, dropping any non-first column whose cells are ALL empty
 * (an em dash counts as empty), so a table never carries a column of dashes. With
 * `dropIfBare`, returns [] when only the first column survives — a names-only param
 * table just duplicates the signature, so it's suppressed entirely.
 */
function table(headers: string[], rows: string[][], opts?: { dropIfBare?: boolean }): string[] {
  if (rows.length === 0) return [];
  const empty = (c: string) => c === '' || c === '—';
  const keep = headers.map((_, col) => col === 0 || rows.some((r) => !empty(r[col])));
  if (opts?.dropIfBare && keep.every((k, i) => (i === 0 ? k : !k))) return [];
  const pick = <T,>(arr: T[]) => arr.filter((_, i) => keep[i]);
  return [
    `| ${pick(headers).join(' | ')} |`,
    `| ${pick(headers).map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${pick(r).join(' | ')} |`),
    '',
  ];
}

/**
 * Top-level parameter identifiers from a call signature — used to label param rows
 * with the friendly README names (`path`, `buffer`) instead of the internal AST
 * names (`name`, `buf`). Returns null if any argument isn't a plain (optionally
 * `...rest`/`[optional]`/`= defaulted`) identifier: destructuring (`[{ error }]`) or
 * a union (`key | { name }`) can't be positionally mapped, so the caller keeps AST
 * names. README signatures list arguments in call order = definition order, so a
 * positional map is sound only when the argument counts also match.
 */
function signatureParamNames(signature: string): string[] | null {
  const open = signature.indexOf('(');
  if (open < 0) return null;
  let depth = 0;
  let close = -1;
  for (let i = open; i < signature.length; i++) {
    if (signature[i] === '(') depth++;
    else if (signature[i] === ')' && --depth === 0) { close = i; break; }
  }
  if (close < 0) return null;
  const inner = signature.slice(open + 1, close).trim();
  if (!inner) return [];
  const tokens: string[] = [];
  let buf = '';
  let d = 0;
  for (const c of inner) {
    if ('([{<'.includes(c)) d++;
    else if (')]}>'.includes(c)) d--;
    if (c === ',' && d === 0) { tokens.push(buf); buf = ''; } else buf += c;
  }
  if (buf.trim()) tokens.push(buf);
  const names: string[] = [];
  for (let t of tokens) {
    t = t.trim().replace(/^\[|\]$/g, '').trim().split('=')[0].trim();
    const id = t.match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)$/);
    if (!id) return null;
    names.push(id[1]);
  }
  return names;
}


function optionsTable(m: RefMethod): string[] {
  if (!m.options?.length) return [];
  const rows = m.options.map((o) => [
    `\`${o.name}\``,
    o.default ? `\`${o.default}\`` : '—',
    cellSafe(o.description ?? '') || '—',
  ]);
  return table(['Option', 'Default', 'Description'], rows);
}

/** A param's cleaned description (shared cleaner), MDX-escaped for a table cell. */
function paramDesc(p: RefMethod['params'][number], description: string | undefined): string {
  const d = cleanParamDesc(p.name, p.description, description);
  return d ? cellSafe(d) : '';
}

/**
 * Params as a table: `Parameter | Type | Default | Description`. Types are
 * cross-linked via the registry; pipes in union types are escaped so they don't
 * break the table. Rows with no documented info (no type/default/description) are
 * dropped so a bare `(a, b)` signature doesn't render an empty table.
 */
function paramsTable(m: RefMethod, description: string | undefined, localTypes?: Record<string, string>): string[] {
  // Label rows with the signature's friendly names when they map cleanly 1:1 to the
  // AST params; otherwise fall back to AST names.
  const sigNames = signatureParamNames(m.signature);
  const display = (i: number) =>
    sigNames && sigNames.length === m.params.length ? sigNames[i] : m.params[i].name;
  const rows = m.params
    .map((p, i) => ({ p, i, desc: paramDesc(p, description) }))
    .filter(({ p, desc }) => p.type || p.default || desc)
    .map(({ p, i, desc }) => [
      `\`${display(i)}\``,
      p.type ? renderType(p.type, localTypes).replace(/\|/g, '\\|') : '—',
      p.default ? `\`${p.default}\`` : '—',
      desc || '—',
    ]);
  return table(['Parameter', 'Type', 'Default', 'Description'], rows, { dropIfBare: true });
}

/** The `- Returns:` line: a linked type, the prose, or both joined by an em dash. */
function returnsLine(
  returnType: string | undefined,
  prose: string | undefined,
  localTypes?: Record<string, string>
): string | null {
  const type = returnType ? renderType(returnType, localTypes).replace(/\|/g, '\\|') : '';
  const text = prose ? prose.replace(/^returns?\b:?\s*/i, '') : '';
  if (!type && !text) return null;
  return `- Returns: ${[type, text].filter(Boolean).join(' — ')}`;
}

/**
 * "- Throws:" line(s): a single error inline, several as a nested bullet list.
 * Manifest `throws` strings (trusted, ready-to-render) win over the model's
 * structured `@throws`; model descriptions are MDX-escaped.
 */
function throwsLines(m: RefMethod, md: MemberDoc | undefined): string[] {
  const items = md?.throws?.length
    ? md.throws.slice()
    : (m.throws ?? []).map((t) =>
        t.type
          ? `\`${t.type}\`${t.description ? ` — ${mdxSafe(t.description)}` : ''}`
          : mdxSafe(t.description)
      );
  if (!items.length) return [];
  if (items.length === 1) return [`- Throws: ${items[0]}`];
  return ['- Throws:', ...items.map((t) => `  - ${t}`)];
}

/** Own-property lookup — a member named `constructor` must not hit Object.prototype. */
function own<T>(rec: Record<string, T> | undefined, key: string): T | undefined {
  return rec && Object.hasOwn(rec, key) ? rec[key] : undefined;
}

/** AI-drafted bits for a member, if a reviewed augmentation supplied any. */
function aug(augment: Augmentation | undefined, key: string): { example?: string; returns?: string } {
  return augment?.entries[key] ?? {};
}

/**
 * True when the member's loose options table (`m.options`) is fully covered by a
 * `@typedef` that one of its params is typed as — the Types section already
 * documents that shape, so the inline table is a duplicate. The subset check means
 * a loose table carrying any option the typedef lacks is kept (no silent loss).
 */
function optionsCoveredByTypedef(m: RefMethod, typedefProps?: Record<string, Set<string>>): boolean {
  if (!m.options?.length || !typedefProps) return false;
  const optNames = m.options.map((o) => o.name);
  return m.params.some(
    (p) =>
      !!p.type &&
      Object.entries(typedefProps).some(
        ([name, props]) => p.type!.includes(name) && optNames.every((n) => props.has(n))
      )
  );
}

/**
 * A `## Errors` reference: the distinct coded errors the module can throw, gathered
 * from every member's throws (manifest `throws` strings or model `@throws`). Plain
 * uncoded throws stay inline on the member and are omitted from this index.
 */
function errorsSection(model: ApiModel, layout: Layout): string[] {
  const byCode = new Map<string, Set<string>>();
  const add = (s: string) => {
    const m = s.match(/^`([^`]+)`\s*(?:[—-]\s*)?([\s\S]*)$/);
    if (!m) return;
    const set = byCode.get(m[1]) ?? new Set<string>();
    if (m[2].trim()) set.add(m[2].trim());
    byCode.set(m[1], set);
  };
  for (const md of Object.values(layout.members ?? {})) (md.throws ?? []).forEach(add);
  for (const c of model.classes)
    for (const mm of c.methods) for (const t of mm.throws ?? []) if (t.type) add(`\`${t.type}\` ${t.description}`);
  if (!byCode.size) return [];
  const rows = [...byCode.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, conds]) => `| \`${code}\` | ${cellSafe([...conds].join('; ')) || '—'} |`);
  return [
    '## Errors',
    '',
    'Coded errors this module can throw — catch them via `err.code`.',
    '',
    '| Error | Thrown when |',
    '| --- | --- |',
    ...rows,
    '',
  ];
}

function renderEntry(
  m: RefMethod,
  key: string,
  layout: Layout,
  augment?: Augmentation,
  localTypes?: Record<string, string>,
  typedefProps?: Record<string, Set<string>>
): string {
  // Headings show the clean call signature: strip any `const x = ` / `const { a } = `
  // example-assignment prefix so the rendered heading (and its anchor slug) reflects
  // the documented call, not the example's receiver variable. Keeps headings stable
  // across releases and matches the curated convention.
  const headingSig = m.signature.replace(/^(?:const|let|var)\s+(?:\{[^}]*\}|[\w$]+)\s*=\s*/, '');
  const lines: string[] = [`#### \`${headingSig}\``, ''];
  if (m.sourceLink) lines.push(`[src](${m.sourceLink})`, '');

  // A full manifest override (for sub-object members the model can't document)
  // wins over the model; `descriptions` is the shorthand for description-only.
  // Manifest prose is trusted as-is; model-derived prose is MDX-escaped.
  const md = own(layout.members, key);
  const description =
    md?.description ?? own(layout.descriptions, key) ?? (m.description ? mdxSafe(destrand(m.description)) : undefined);
  const returns = md?.returns ?? (m.returns ? mdxSafe(m.returns) : undefined);
  const drafted = aug(augment, key);

  if (m.kind === 'event') {
    if (description) lines.push('', description);
  } else if (m.kind === 'getter' || m.kind === 'setter' || m.kind === 'property') {
    // A property reads as its value: link the type, then the description prose.
    const line = returnsLine(m.returnType, returns ?? description, localTypes);
    if (m.returnType && description) {
      lines.push('', description, '', returnsLine(m.returnType, returns, localTypes) ?? '');
    } else if (line) {
      lines.push(line);
    }
  } else {
    if (description) lines.push('', description, '');
    lines.push(...paramsTable(m, description, localTypes));
    const rl = returnsLine(m.returnType, returns, localTypes);
    if (rl) lines.push(rl);
    else if (drafted.returns) lines.push(`- Returns: ${drafted.returns} {/* AI-drafted — verify */}`);
  }

  // Errors the member can throw — directly after Returns, as a sibling bullet.
  const throwsBlk = throwsLines(m, md);
  if (throwsBlk.length) lines.push(...throwsBlk);

  // Skip the loose options table when a typedef param already documents the shape.
  const optTable = optionsCoveredByTypedef(m, typedefProps) ? [] : optionsTable(m);
  if (optTable.length) lines.push('', ...optTable);

  let renderedExample = false;
  for (const ex of m.examples) {
    if (m.options?.length && isOptionsFence(ex)) continue; // shown as the table above
    lines.push('', '```js', ex, '```');
    renderedExample = true;
  }
  // Manifest-supplied example for members the model can't document from upstream.
  if (!renderedExample && md?.example) {
    lines.push('', '```js', md.example, '```');
    renderedExample = true;
  }
  // Fall back to an AI-drafted example only when nothing else exists (marked for review).
  if (!renderedExample && drafted.example) {
    lines.push('', '{/* example: AI-drafted — verify */}', '```js', drafted.example, '```');
  }

  const note = own(layout.notes, key);
  if (note) lines.push('', note);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

export interface CuratedRenderResult {
  mdx: string;
  /** Manifest member keys that did not resolve to a model member. */
  unknown: string[];
  /** Documented model members the manifest never placed (newly documented upstream). */
  ungrouped: string[];
}

export function renderCuratedPage(
  model: ApiModel,
  layout: Layout,
  pkg: string,
  augment?: Augmentation
): CuratedRenderResult {
  // Index members by key. The main class is classes[0]; iterate in order and keep
  // the first binding so a sub-object (e.g. WakeupHandler) can't shadow the main
  // class on a shared key like `constructor` or `discoveryKey`. Sub-object members
  // ALSO get a qualified `Class.key` so colliding names (hyperbee `Batch.put` vs
  // `db.put`) can still be placed and rendered as distinct entries.
  const byKey = new Map<string, RefMethod>();
  model.classes.forEach((cls, i) => {
    for (const m of cls.methods) {
      const k = memberKey(m);
      if (!byKey.has(k)) byKey.set(k, m);
      if (i > 0 && cls.name) byKey.set(`${cls.name}.${k}`, m);
    }
  });

  // Page-local @typedef anchors: a param/return type named after a typedef links
  // to its definition in the Types section below (`### GetOptions` → `#getoptions`).
  const anchor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const localTypes: Record<string, string> = {};
  const typedefProps: Record<string, Set<string>> = {};
  for (const td of model.typedefs ?? []) {
    localTypes[td.name] = `#${anchor(td.name)}`;
    typedefProps[td.name] = new Set(td.properties.map((p) => p.name));
  }

  const title = model.classes[0]?.name ?? model.slug;
  const parts: string[] = [frontmatter(title, layout.description), ''];
  if (layout.status) parts.push(`<Status level="${layout.status}" />`, '');
  parts.push(layout.intro, '');

  for (const s of layout.sections ?? []) parts.push(`## ${s.title}`, '', s.body, '');

  parts.push('## Install', '', '```sh', `npm i ${pkg}`, '```', '');
  if (layout.quickstart) parts.push('## Quickstart', '', layout.quickstart, '');

  parts.push('## API Reference', '');
  const placedMembers = new Set<RefMethod>();
  const unknown: string[] = [];
  for (const group of layout.groups) {
    parts.push(`### ${group.title}`, '');
    if (group.intro) parts.push(group.intro, '');
    for (const key of group.members) {
      const m = byKey.get(key);
      if (!m) {
        unknown.push(key);
        continue;
      }
      if (placedMembers.has(m)) continue; // already rendered under another key/group — never duplicate a member
      placedMembers.add(m);
      parts.push(renderEntry(m, key, layout, augment, localTypes, typedefProps), '');
    }
  }

  // Documented (README-backed) members the manifest never grouped. Tracked by
  // member identity (not key) so a member reachable via both a bare and a
  // qualified key isn't double-counted; sub-object members are reported with
  // their qualified key so the author knows what to add.
  const seen = new Set<RefMethod>();
  const ungrouped: string[] = [];
  model.classes.forEach((cls, i) => {
    for (const m of cls.methods) {
      if (!m.source.includes('readme') || placedMembers.has(m) || seen.has(m)) continue;
      seen.add(m);
      ungrouped.push(i > 0 && cls.name ? `${cls.name}.${memberKey(m)}` : memberKey(m));
    }
  });
  ungrouped.sort();
  if (ungrouped.length) {
    parts.push('### Ungrouped', '', '{/* Newly documented upstream — file these into a group above. */}', '');
    for (const key of ungrouped) parts.push(renderEntry(byKey.get(key)!, key, layout, augment, localTypes, typedefProps), '');
  }

  // Named object types from @typedef — linkable definitions for the types used above.
  if (model.typedefs?.length) {
    parts.push('## Types', '');
    for (const td of model.typedefs) {
      parts.push(`### ${td.name}`, '');
      if (td.description) parts.push(mdxSafe(td.description), '');
      const rows = td.properties.filter((p) => p.type || p.default || p.description);
      if (rows.length) {
        parts.push('| Property | Type | Default | Description |', '| --- | --- | --- | --- |');
        for (const p of rows) {
          const type = p.type ? renderType(p.type, localTypes).replace(/\|/g, '\\|') : '—';
          const def = p.default ? `\`${p.default}\`` : '—';
          parts.push(`| \`${p.name}\` | ${type} | ${def} | ${p.description ? cellSafe(p.description) : ''} |`);
        }
        parts.push('');
      }
    }
  }

  parts.push(...errorsSection(model, layout));

  if (layout.seeAlso?.length) {
    parts.push('## See also', '');
    for (const item of layout.seeAlso) parts.push(`- ${item}`);
  }

  const mdx = parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  return { mdx, unknown, ungrouped };
}
