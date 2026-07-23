// scripts/refgen/jsdoc-gap.ts
//
// The JSDoc gap report (Phase 3): for every public source member, work out what
// JSDoc is missing to render a top-quality reference entry — a description, a
// `{Type}` and description on every param, a `@returns {Type}`, and an
// `@example` — and emit an actionable, file:line-anchored checklist maintainers
// can work through in the source repo.
//
// This is the upstream to-do list: enrich the JSDoc the report points at, and
// the generated docs improve automatically. Grades AST-found members only
// (that's where JSDoc lives); README-only members are reported separately as
// "not reachable in source" since they can't carry JSDoc until refactored.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ApiModel, RefMethod } from './model';
import { memberKey } from './identity';

export interface MemberGap {
  key: string;
  signature: string;
  kind: RefMethod['kind'];
  file?: string;
  line?: number;
  /** Human-readable list of what's missing, e.g. `@param {Type} index`, `@returns`. */
  missing: string[];
}

/** have/want counts for one documentation dimension. */
export interface Coverage {
  have: number;
  want: number;
}

export interface JsDocGapReport {
  slug: string;
  graded: number; // public, source-reachable members graded
  complete: number; // of graded, those needing nothing
  pct: number;
  gaps: MemberGap[]; // graded members with ≥1 missing piece, file-ordered
  unreachable: string[]; // README-documented members the AST never found (can't carry JSDoc yet)
  typedefHints: string[]; // option-bag params that would benefit from a shared @typedef
  unpublished: number; // source members not in the manifest (internal or unfiled) — not graded
  // Per-dimension coverage so a single "complete %" isn't the only signal —
  // shows that the gap is usually types, not prose.
  coverage: {
    description: Coverage; // members with a description
    paramTypes: Coverage; // params carrying a {Type}
    returns: Coverage; // method/accessor members with a typed @returns
    examples: Coverage; // method/constructor members with an example
  };
}

/** Parse `…/blob/<ref>/<path>#L<line>` back to a source location for the checklist. */
function loc(m: RefMethod): { file?: string; line?: number } {
  if (!m.sourceLink) return {};
  const mt = m.sourceLink.match(/\/blob\/[^/]+\/(.+?)#L(\d+)/);
  return mt ? { file: mt[1], line: Number(mt[2]) } : {};
}

/** Whether this member kind should carry a usage example to be "top quality". */
function wantsExample(kind: RefMethod['kind']): boolean {
  return kind === 'method' || kind === 'constructor';
}

/** What JSDoc is missing for one member to render a complete entry. */
function gapsFor(m: RefMethod): string[] {
  const missing: string[] = [];
  if (!m.description) missing.push('description');

  for (const p of m.params) {
    const want: string[] = [];
    if (!p.type) want.push('{Type}');
    if (!p.description) want.push('description');
    if (want.length) missing.push(`@param ${want.join(' + ')} for \`${p.name}\``);
  }

  // Callables should declare a return type + prose; accessors should declare the
  // value's type (rendered as "Returns"). Constructors/setters/events don't.
  // A `void` return is self-explanatory and needs no prose.
  const isVoid = m.returnType === 'void';
  if (m.kind === 'method' && !m.returnType) missing.push('@returns {Type}');
  else if (m.kind === 'method' && !isVoid && !m.returns) missing.push('@returns description');
  if ((m.kind === 'getter' || m.kind === 'property') && !m.returnType) missing.push('@returns {Type}');

  if (wantsExample(m.kind) && m.examples.length === 0) missing.push('@example');
  return missing;
}

/**
 * @param publishedKeys When supplied (from a manifest's groups), only members on
 *   the published surface are graded — internal instance fields the AST captures
 *   (`core.state`, `core.sessions`…) aren't in any group, so they're excluded
 *   from the to-do. Omit to grade every public source member.
 */
export function jsdocGapReport(model: ApiModel, publishedKeys?: Set<string>): JsDocGapReport {
  const gaps: MemberGap[] = [];
  const unreachable: string[] = [];
  const typedefHints = new Set<string>();
  let graded = 0;
  let complete = 0;
  let unpublished = 0;
  const coverage = {
    description: { have: 0, want: 0 },
    paramTypes: { have: 0, want: 0 },
    returns: { have: 0, want: 0 },
    examples: { have: 0, want: 0 },
  };

  model.classes.forEach((cls, i) => {
    for (const m of cls.methods) {
      // README-documented but not AST-found → can't carry JSDoc until the symbol
      // is reachable in source (e.g. host calls built inside a callback).
      if (m.source.includes('readme') && !m.source.includes('ast')) {
        if (m.kind !== 'event') unreachable.push(m.signature);
        continue;
      }
      if (!m.source.includes('ast')) continue;
      // Inherited base-class members (EventEmitter/streamx) have no source link
      // and live in another package — not this repo's JSDoc to write.
      if (!m.sourceLink) continue;
      // Events come from `this.emit(...)`; JSDoc isn't the channel for them.
      if (m.kind === 'event' || m.kind === 'setter') continue;

      // Match the renderer's keying: bare for the main class, qualified for subs.
      const key = i > 0 && cls.name ? `${cls.name}.${memberKey(m)}` : memberKey(m);
      if (publishedKeys && !publishedKeys.has(key)) {
        unpublished++;
        continue;
      }

      graded++;
      const missing = gapsFor(m);

      // Per-dimension tallies (what the "complete %" is made of).
      coverage.description.want++;
      if (m.description) coverage.description.have++;
      for (const p of m.params) {
        coverage.paramTypes.want++;
        if (p.type) coverage.paramTypes.have++;
      }
      if (m.kind === 'method' || m.kind === 'getter' || m.kind === 'property') {
        coverage.returns.want++;
        if (m.returnType) coverage.returns.have++;
      }
      if (m.kind === 'method' || m.kind === 'constructor') {
        coverage.examples.want++;
        if (m.examples.length) coverage.examples.have++;
      }

      // Suggest a shared @typedef for option bags typed only as `object`/untyped.
      for (const p of m.params) {
        if (/^(opts|options|config|cfg)$/i.test(p.name) && (!p.type || /^object$/i.test(p.type))) {
          typedefHints.add(`\`${p.name}\` on \`${m.signature}\` — define a \`@typedef\` for the options shape (becomes a linkable type + options table).`);
        }
      }

      if (missing.length === 0) {
        complete++;
        continue;
      }
      const { file, line } = loc(m);
      gaps.push({ key, signature: m.signature, kind: m.kind, file, line, missing });
    }
  });

  // File-order the checklist (no source loc sorts last), then by line.
  gaps.sort((a, b) => (a.file ?? '~').localeCompare(b.file ?? '~') || (a.line ?? 0) - (b.line ?? 0));

  return {
    slug: model.slug,
    graded,
    complete,
    pct: graded ? Math.round((complete / graded) * 100) : 0,
    gaps,
    unreachable: unreachable.sort(),
    typedefHints: [...typedefHints].sort(),
    unpublished,
    coverage,
  };
}

export function writeJsDocGapReport(report: JsDocGapReport, model: ApiModel, outPath: string): void {
  const pct = (c: Coverage) => (c.want ? `${Math.round((c.have / c.want) * 100)}%` : '—');
  const cov = report.coverage;
  const lines: string[] = [
    `# JSDoc gap report — ${report.slug}`,
    ``,
    `\`${model.repo.org}/${model.repo.repo}\` at **${model.tag}** · **${report.pct}%** of published members fully documented (${report.complete}/${report.graded})${report.unpublished ? ` · ${report.unpublished} source member(s) not in the manifest (internal or unfiled) — not graded` : ''}.`,
    ``,
    `Coverage by dimension: **descriptions ${pct(cov.description)}** · **param types ${pct(cov.paramTypes)}** · **typed returns ${pct(cov.returns)}** · **examples ${pct(cov.examples)}**. (Prose is usually present; the gap is mostly types.)`,
    ``,
    `Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.`,
    ``,
    `See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.`,
    ``,
  ];

  // Group the checklist by file.
  const byFile = new Map<string, MemberGap[]>();
  for (const g of report.gaps) {
    const f = g.file ?? '(no source location)';
    (byFile.get(f) ?? byFile.set(f, []).get(f)!).push(g);
  }

  if (report.gaps.length === 0) {
    lines.push(`✅ Every graded member is fully documented.`, ``);
  } else {
    lines.push(`## To do (${report.gaps.length})`, ``);
    for (const [file, gs] of byFile) {
      lines.push(`### \`${file}\``, ``);
      for (const g of gs) {
        const at = g.line ? `L${g.line} ` : '';
        lines.push(`- [ ] ${at}\`${g.signature}\` — add ${g.missing.join('; ')}`);
      }
      lines.push(``);
    }
  }

  if (report.typedefHints.length) {
    lines.push(
      `## Suggested \`@typedef\`s (${report.typedefHints.length})`,
      ``,
      `_Define these once near the class; they become linkable types and drive options tables._`,
      ``,
      ...report.typedefHints.map((h) => `- ${h}`),
      ``
    );
  }

  if (report.unreachable.length) {
    lines.push(
      `## Documented but not reachable in source (${report.unreachable.length})`,
      ``,
      `_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest \`members\` overrides._`,
      ``,
      ...report.unreachable.map((s) => `- \`${s}\``),
      ``
    );
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines.join('\n').replace(/\n{3,}/g, '\n\n'));
}
