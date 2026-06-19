// scripts/refgen/render-curated.ts
//
// The hybrid renderer: merge the model (auto-refreshed factual surface) with a
// layout manifest (the editorial 20%) into a full curated-style reference page.
// This is what makes the page a generated artifact rather than a hand-edited file
// — on each release it is re-emitted, with member facts fresh and the editorial
// structure preserved. Members the manifest doesn't place land in an "Ungrouped"
// bucket so newly documented upstream API surfaces for a human to file.

import type { ApiModel, RefMethod } from './model';
import type { Layout } from './layout';
import type { Augmentation } from './augment';
import { memberKey } from './identity';
import { renderType } from './type-registry';

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

function optionsTable(m: RefMethod): string[] {
  if (!m.options?.length) return [];
  const rows = m.options.map(
    (o) => `| \`${o.name}\` | ${o.default ? `\`${o.default}\`` : '—'} | ${cellSafe(o.description ?? '')} |`
  );
  return ['| Option | Default | Description |', '| --- | --- | --- |', ...rows, ''];
}

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A param's cleaned description. The README extractor sometimes leads with the
 * param's own name and runs the next param's lead-in onto the end ("topic must
 * be a 32-byte Buffer opts can include:"). Strip the redundant leading name and
 * truncate before another param's clause or an options lead-in. Drop it entirely
 * if it merely repeats the entry prose.
 */
function paramDesc(p: RefMethod['params'][number], description: string | undefined, siblings: string[]): string {
  if (!p.description) return '';
  let d = p.description.trim();
  d = d.replace(new RegExp(`^\`?${escRe(p.name)}\`?[\\s,:]+`, 'i'), '');
  for (const s of siblings) {
    if (s === p.name) continue;
    const i = d.search(new RegExp(`\\s\`?${escRe(s)}\`?[\\s.]`, 'i'));
    if (i > 0) d = d.slice(0, i);
  }
  const li = d.search(/\s+(can include\b|includes?:|are the following\b|is one of)/i);
  if (li > 0) d = d.slice(0, li);
  d = d.replace(/[\s:,;-]+$/, '').trim();
  if (!d || (description && description.includes(d))) return '';
  return cellSafe(d);
}

/**
 * Params as a table: `Parameter | Type | Default | Description`. Types are
 * cross-linked via the registry; pipes in union types are escaped so they don't
 * break the table. Rows with no documented info (no type/default/description) are
 * dropped so a bare `(a, b)` signature doesn't render an empty table.
 */
function paramsTable(m: RefMethod, description: string | undefined, localTypes?: Record<string, string>): string[] {
  const names = m.params.map((x) => x.name);
  const rows = m.params
    .map((p) => ({ p, desc: paramDesc(p, description, names) }))
    .filter(({ p, desc }) => p.type || p.default || desc);
  if (rows.length === 0) return [];
  const body = rows.map(({ p, desc }) => {
    const type = p.type ? renderType(p.type, localTypes).replace(/\|/g, '\\|') : '—';
    const def = p.default ? `\`${p.default}\`` : '—';
    return `| \`${p.name}\` | ${type} | ${def} | ${desc || ''} |`;
  });
  return ['| Parameter | Type | Default | Description |', '| --- | --- | --- | --- |', ...body, ''];
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

/** Own-property lookup — a member named `constructor` must not hit Object.prototype. */
function own<T>(rec: Record<string, T> | undefined, key: string): T | undefined {
  return rec && Object.hasOwn(rec, key) ? rec[key] : undefined;
}

/** AI-drafted bits for a member, if a reviewed augmentation supplied any. */
function aug(augment: Augmentation | undefined, key: string): { example?: string; returns?: string } {
  return augment?.entries[key] ?? {};
}

function renderEntry(
  m: RefMethod,
  key: string,
  layout: Layout,
  augment?: Augmentation,
  localTypes?: Record<string, string>
): string {
  const lines: string[] = [`#### \`${m.signature}\``, ''];
  if (m.sourceLink) lines.push(`[API definition on GitHub](${m.sourceLink})`);

  // A full manifest override (for sub-object members the model can't document)
  // wins over the model; `descriptions` is the shorthand for description-only.
  // Manifest prose is trusted as-is; model-derived prose is MDX-escaped.
  const md = own(layout.members, key);
  const description =
    md?.description ?? own(layout.descriptions, key) ?? (m.description ? mdxSafe(m.description) : undefined);
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

  const optTable = optionsTable(m);
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
  for (const td of model.typedefs ?? []) localTypes[td.name] = `#${anchor(td.name)}`;

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
      placedMembers.add(m);
      parts.push(renderEntry(m, key, layout, augment, localTypes), '');
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
    for (const key of ungrouped) parts.push(renderEntry(byKey.get(key)!, key, layout, augment, localTypes), '');
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

  if (layout.seeAlso?.length) {
    parts.push('## See also', '');
    for (const item of layout.seeAlso) parts.push(`- ${item}`);
  }

  const mdx = parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  return { mdx, unknown, ungrouped };
}
