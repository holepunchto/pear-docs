// scripts/refgen/emit-jsdoc.ts
//
// Reconstruct upstream JSDoc from the committed enriched models — the inverse of
// the extractor. For each documented member it writes a COMPLETE JSDoc block
// (description, typed @param/@returns or @type, @example) above the member in a
// FRESH clone, plus the model's @typedef blocks. Produces a reviewable diff per
// repo to PR back to holepunchto/*.
//
// Correctness: a model's sourceLink lines came from the agent's JSDoc-inserted
// checkout, so they don't match a clean clone. We therefore RE-EXTRACT the clean
// clone (current line numbers) and match each AST member to the model by key,
// pulling the enriched prose/types from the model.
//
// Clones live under EMIT_ROOT (persistent — NOT /tmp), default ../jsdoc-upstream.
// No git writes: leaves uncommitted diffs for review (`git -C <clone> diff`).
//
// Usage: tsx scripts/refgen/emit-jsdoc.ts [slug ...]   (default: every model)

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type { ApiModel, RefMethod, RefParam, RefTypedef } from './model';
import { extractAst, type AstMethod } from './extract-ast';
import { memberKey } from './identity';
import { loadLayout } from './layout';
import { cleanParamDesc, destrand } from './prose';

/**
 * Parse a manifest throws string ("`SESSION_CLOSED` condition") into the structured
 * shape `@throws` is emitted from. A leading `` `CODE` `` becomes the `{type}`.
 */
function parseThrows(strs: string[]): { type?: string; description: string }[] {
  return strs.map((s) => {
    const m = s.match(/^`([^`]+)`\s*(?:[—-]\s*)?([\s\S]*)$/);
    return m ? { type: m[1], description: m[2].trim() } : { description: s.trim() };
  });
}

const REFS = 'generated/refs';
const EMIT_ROOT = process.env.EMIT_ROOT ?? join(process.cwd(), '..', 'jsdoc-upstream');

function wrap(text: string, width = 76): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > width) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

function memberBlock(
  m: RefMethod,
  indent: string,
  throwsOverride?: { type?: string; description: string }[],
  descOverride?: string,
  returnsOverride?: string
): string[] {
  const out = [`${indent}/**`];
  const star = (s: string) => out.push(s ? `${indent} * ${s}` : `${indent} *`);
  const description = descOverride ?? (m.description ? destrand(m.description) : undefined);
  if (description) for (const l of description.split('\n')) for (const w of wrap(l.trim())) star(w);

  for (const p of m.params) {
    const nm = p.optional ? `[${p.name}]` : p.name;
    const ty = p.type ? `{${p.type}} ` : '';
    const cleaned = cleanParamDesc(p.name, p.description, m.description);
    const d = cleaned ? ` - ${cleaned}` : '';
    star(`@param ${ty}${nm}${d}`);
  }

  if (m.kind === 'property' || m.kind === 'getter') {
    if (m.returnType) star(`@${m.kind === 'property' ? 'type' : 'returns'} {${m.returnType}}`);
  } else if (m.kind === 'method') {
    const ty = m.returnType ? `{${m.returnType}} ` : '';
    const rawReturns = returnsOverride ?? m.returns;
    const r = rawReturns ? rawReturns.replace(/^returns?\b:?\s*/i, '').replace(/\s+/g, ' ').trim() : '';
    if (ty || r) star(`@returns ${ty}${r}`.trimEnd());
  }

  for (const t of throwsOverride ?? m.throws ?? []) {
    const ty = t.type ? `{${t.type}} ` : '';
    star(`@throws ${ty}${t.description.replace(/\s+/g, ' ').trim()}`.trimEnd());
  }

  if (m.examples.length) {
    star('@example');
    for (const l of m.examples[0].split('\n')) star(l);
  }
  out.push(`${indent} */`);
  return out;
}

function typedefBlock(t: RefTypedef): string[] {
  const out = ['/**'];
  if (t.description) for (const w of wrap(t.description)) out.push(` * ${w}`);
  out.push(` * @typedef {Object} ${t.name}`);
  for (const p of t.properties) {
    const nm = p.default != null ? `[${p.name}=${p.default}]` : p.optional ? `[${p.name}]` : p.name;
    const ty = p.type ? `{${p.type}} ` : '';
    const d = p.description ? ` - ${p.description.replace(/\s+/g, ' ').trim()}` : '';
    out.push(` * @property ${ty}${nm}${d}`);
  }
  out.push(' */');
  return out;
}

/** Same key scheme as the renderer: bare for the main class, `Class.key` for sub-objects. */
function astKey(am: AstMethod): string {
  return (am.static ? 'static:' : '') + (am.event ? `on:${am.event}` : am.name);
}

function ensureClone(slug: string, model: ApiModel): string {
  const dir = join(EMIT_ROOT, slug);
  if (existsSync(join(dir, '.git'))) {
    execFileSync('git', ['-C', dir, 'checkout', '--', '.'], { stdio: 'ignore' }); // clean start
    return dir;
  }
  mkdirSync(EMIT_ROOT, { recursive: true });
  const url = `https://github.com/${model.repo.org}/${model.repo.repo}.git`;
  execFileSync('git', ['clone', '--depth', '1', '--branch', model.tag, url, dir], { stdio: 'ignore' });
  return dir;
}

async function emit(slug: string): Promise<{ dir: string; members: number; typedefs: number }> {
  const model = JSON.parse(readFileSync(join(REFS, slug, 'api-model.json'), 'utf8')) as ApiModel;
  const dir = ensureClone(slug, model);
  // Manifest `members[key].throws` are editorial (not in the model) — emit them as
  // `@throws` so they land in the upstream PR diff. Keyed exactly like the renderer.
  const layout = await loadLayout(slug);
  // Own-property lookup — a member keyed `constructor` must NOT resolve to
  // Object.prototype.constructor (a function), which would corrupt the override.
  const own = <T,>(rec: Record<string, T> | undefined, key: string): T | undefined =>
    rec && Object.hasOwn(rec, key) ? rec[key] : undefined;
  const manifestThrows = (key: string, qualified: string | null) => {
    const md = (qualified && own(layout?.members, qualified)) || own(layout?.members, key);
    return md?.throws?.length ? parseThrows(md.throws) : undefined;
  };
  // Manifest editorial description/returns overrides (same precedence as the renderer):
  // members[key] wins, then descriptions[key]. Lets a manifest fix land in the PR JSDoc,
  // not just the docs page.
  const manifestOverride = (key: string, qualified: string | null) => {
    const md = (qualified && own(layout?.members, qualified)) || own(layout?.members, key);
    return {
      description:
        md?.description ?? (qualified ? own(layout?.descriptions, qualified) : undefined) ?? own(layout?.descriptions, key),
      returns: md?.returns,
    };
  };

  // Model lookup by key (bare + qualified for sub-objects).
  const byKey = new Map<string, RefMethod>();
  model.classes.forEach((c, i) => {
    for (const m of c.methods) {
      const k = memberKey(m);
      if (!byKey.has(k)) byKey.set(k, m);
      if (i > 0 && c.name) byKey.set(`${c.name}.${k}`, m);
    }
  });

  const hasContent = (m: RefMethod) =>
    !!(m.description || m.returnType || m.returns || m.examples.length || m.params.some((p) => p.type || p.description));

  // Re-extract the CLEAN clone for current line numbers; match to the model by key.
  // Also patch each matched member's sourceLink to use the clean line number — the
  // model was generated from an enriched checkout (JSDoc already inserted), so its
  // source links are offset by the JSDoc block sizes and point to wrong lines on GitHub.
  const { org, repo: repoName } = model.repo;
  const ast = extractAst(dir);
  type Item = {
    line: number;
    m: RefMethod;
    throws?: { type?: string; description: string }[];
    descOverride?: string;
    returnsOverride?: string;
  };
  const byFile = new Map<string, Item[]>();
  ast.classes.forEach((c, i) => {
    for (const am of c.methods) {
      if (am.kind === 'event' || am.inherited || !am.file || !am.line) continue;
      const k = astKey(am);
      const qualified = i > 0 && c.name ? `${c.name}.${k}` : null;
      const m = byKey.get(qualified ?? k) ?? byKey.get(k);
      if (!m || !hasContent(m)) continue;
      m.sourceLink = `https://github.com/${org}/${repoName}/blob/${model.tag}/${am.file}#L${am.line}`;
      const ov = manifestOverride(k, qualified);
      const item: Item = {
        line: am.line,
        m,
        throws: manifestThrows(k, qualified),
        descOverride: ov.description,
        returnsOverride: ov.returns,
      };
      (byFile.get(am.file) ?? byFile.set(am.file, []).get(am.file)!).push(item);
    }
  });
  writeFileSync(join(REFS, slug, 'api-model.json'), JSON.stringify(model, null, 2));

  let members = 0;
  for (const [file, items] of byFile) {
    const abs = join(dir, file);
    if (!existsSync(abs)) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    items.sort((a, b) => b.line - a.line); // bottom-up
    const seen = new Set<number>();
    for (const { line, m, throws, descOverride, returnsOverride } of items) {
      const idx = line - 1;
      if (idx < 0 || idx >= lines.length || seen.has(idx)) continue;
      if ((lines[idx - 1]?.trim() ?? '').endsWith('*/')) continue;
      seen.add(idx);
      const indent = lines[idx].match(/^\s*/)?.[0] ?? '';
      lines.splice(idx, 0, ...memberBlock(m, indent, throws, descOverride, returnsOverride));
      members++;
    }
    writeFileSync(abs, lines.join('\n'));
  }

  // @typedef blocks at the top of the entry file (before the class).
  if (model.typedefs?.length && existsSync(join(dir, 'index.js'))) {
    const entry = join(dir, 'index.js');
    const lines = readFileSync(entry, 'utf8').split('\n');
    let at = lines.findIndex((l) => /^\s*(module\.exports\s*=\s*)?class\s/.test(l) || /^\s*(const|let|var)\s+[\w$]+\s*=\s*class\s/.test(l));
    if (at < 0) at = 0;
    lines.splice(at, 0, ...model.typedefs.flatMap((t) => [...typedefBlock(t), '']));
    writeFileSync(entry, lines.join('\n'));
  }

  return { dir, members, typedefs: model.typedefs?.length ?? 0 };
}

async function main(): Promise<void> {
  const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync(REFS).filter((s) => existsSync(join(REFS, s, 'api-model.json')));
  for (const slug of slugs) {
    try {
      const r = await emit(slug);
      console.log(`✓ ${slug}: ${r.members} members + ${r.typedefs} typedef(s) → ${r.dir}`);
    } catch (e) {
      console.log(`✗ ${slug}: ${(e as Error).message}`);
    }
  }
  console.log(`\nReview each diff:  git -C ${EMIT_ROOT}/<slug> diff   (no git writes performed)`);
}

main();
