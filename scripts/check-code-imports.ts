// scripts/check-code-imports.ts
//
// Validates every `remark-code-import` fence under content/ — the
// ```js file=<rootDir>/examples/...#L12-L34 ``` blocks that pull doc code out
// of the runnable/vendored apps in examples/.
//
// Why this exists: a wrong `#L…` range fails SILENTLY. remark-code-import does
// a bare `lines.slice(start - 1, end)` with no bounds check and no syntax
// awareness, so an off-by-N range renders plausible-but-wrong code, and a range
// that starts mid-block renders brace-unbalanced JavaScript. Neither the MDX
// build, `check-examples.ts` (imported fences carry `skip=`, so it never runs
// them), nor executing the source file itself can catch it: the *file* is fine,
// the *excerpt* is the lie. Three such defects shipped to review on one branch
// before this check existed.
//
// Two rules:
//
//   1. RESOLUTION + BALANCE (error). The path resolves, the range is in bounds,
//      and — for brace languages — the extracted excerpt has balanced (), [], {}
//      once strings and comments are stripped. An unbalanced excerpt is nearly
//      always a range starting or ending mid-block.
//
//   2. PROSE COVERAGE (warning). If the paragraph introducing a fence names an
//      identifier in `backticks`, and that identifier exists in the imported
//      SOURCE FILE but not in the rendered excerpt, the range is probably wrong:
//      the page is explaining something it isn't showing. Scoping the check to
//      identifiers that exist in the same file is what keeps this quiet — prose
//      nouns and other files' symbols never match.
//
// Run as `npm run check:code-imports`. Exit 1 on any rule-1 error; rule-2
// warnings do not fail the build unless `--strict` is passed.
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, resolve, relative } from 'path';
import { EOL } from 'os';
import { CONTENT_DIR, getFiles } from './helpers';

const ROOT = process.cwd();

/** Languages whose excerpts we can meaningfully balance-check. */
const BRACE_LANGS = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'javascript', 'typescript']);

/**
 * Mirrors remark-code-import's own meta parsing and line slicing exactly
 * (node_modules/remark-code-import/dist/index.js). Kept byte-faithful on
 * purpose: a checker that disagrees with the renderer is worse than none.
 */
const FILE_META_RE = /^file=(?<path>.+?)(?:(?:#(?:L(?<from>\d+)(?<dash>-)?)?)(?:L(?<to>\d+))?)?$/;

interface Fence {
  mdx: string;
  line: number;
  lang: string;
  meta: string;
  /** The paragraph immediately above the fence, for rule 2. */
  lead: string;
}

interface Resolved {
  filePath: string;
  from?: number;
  to?: number;
  hasDash: boolean;
}

function parseFileMeta(meta: string): Resolved | null {
  // Same escaped-space split the plugin uses.
  const fileMeta = meta.split(/(?<!\\) /g).find((m) => m.startsWith('file='));
  if (!fileMeta) return null;
  const res = FILE_META_RE.exec(fileMeta);
  if (!res?.groups?.path) return null;
  const from = res.groups.from ? parseInt(res.groups.from, 10) : undefined;
  return {
    filePath: res.groups.path.replace(/\\ /g, ' '),
    from,
    to: res.groups.to ? parseInt(res.groups.to, 10) : undefined,
    hasDash: !!res.groups.dash || from === undefined,
  };
}

/** remark-code-import's extractLines, reproduced. */
function extractLines(content: string, from: number | undefined, hasDash: boolean, to: number | undefined) {
  const lines = content.split(EOL);
  const start = from || 1;
  let end: number;
  if (!hasDash) end = start;
  else if (to) end = to;
  else if (lines[lines.length - 1] === '') end = lines.length - 1;
  else end = lines.length;
  return { excerpt: lines.slice(start - 1, end).join('\n'), start, end, total: lines.length };
}

/**
 * Characters after which a `/` begins a regex literal rather than division.
 * The usual heuristic: an operand cannot precede a regex, so anything that
 * leaves the parser expecting a value does.
 */
const REGEX_PRECEDERS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^', '<', '>']);

/**
 * Strip line comments, block comments, string/template/regex literals so brace
 * counting isn't fooled by a `}` inside a string, a prose comment, or a `"`
 * inside a regex character class. Not a real parser — deliberately
 * conservative, and only used for balance counting.
 */
function stripLiterals(src: string): string {
  let out = '';
  let i = 0;
  let lastSig = '';
  type Mode = 'code' | 'line' | 'block' | 'single' | 'double' | 'template' | 'regex';
  let mode: Mode = 'code';
  let inCharClass = false;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && n === '*') { mode = 'block'; i += 2; continue; }
      if (c === '/' && (lastSig === '' || REGEX_PRECEDERS.has(lastSig))) {
        mode = 'regex'; inCharClass = false; i++; continue;
      }
      if (c === "'") { mode = 'single'; i++; continue; }
      if (c === '"') { mode = 'double'; i++; continue; }
      if (c === '`') { mode = 'template'; i++; continue; }
      if (!/\s/.test(c)) lastSig = c;
      out += c; i++; continue;
    }
    if (mode === 'regex') {
      if (c === '\\') { i += 2; continue; }
      if (c === '[') inCharClass = true;
      else if (c === ']') inCharClass = false;
      else if (c === '/' && !inCharClass) { mode = 'code'; lastSig = '/'; i++; continue; }
      else if (c === '\n') { mode = 'code'; out += c; i++; continue; } // unterminated: bail
      i++; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += c; } i++; continue; }
    if (mode === 'block') { if (c === '*' && n === '/') { mode = 'code'; i += 2; continue; } if (c === '\n') out += c; i++; continue; }
    // string-ish modes
    if (c === '\\') { i += 2; continue; }
    if ((mode === 'single' && c === "'") || (mode === 'double' && c === '"') || (mode === 'template' && c === '`')) {
      mode = 'code'; i++; continue;
    }
    if (c === '\n') out += c;
    i++;
  }
  return out;
}

function balanceReport(excerpt: string): string | null {
  const code = stripLiterals(excerpt);
  const pairs: [string, string, string][] = [
    ['{', '}', 'brace'],
    ['(', ')', 'paren'],
    ['[', ']', 'bracket'],
  ];
  const problems: string[] = [];
  for (const [open, close, name] of pairs) {
    let depth = 0;
    let wentNegative = false;
    for (const ch of code) {
      if (ch === open) depth++;
      else if (ch === close) { depth--; if (depth < 0) wentNegative = true; }
    }
    if (depth > 0) problems.push(`${depth} unclosed ${name}${depth > 1 ? 's' : ''}`);
    else if (depth < 0 || wentNegative) problems.push(`${Math.abs(depth) || 1} unopened ${name}${Math.abs(depth) > 1 ? 's' : ''}`);
  }
  return problems.length ? problems.join(', ') : null;
}

/** Backticked bare identifiers in the lead paragraph, e.g. `enqueue`, `send()`. */
function proseIdentifiers(lead: string): string[] {
  const out = new Set<string>();
  for (const m of lead.matchAll(/`([^`\n]+)`/g)) {
    const raw = m[1].trim().replace(/\(\)$/, '');
    if (/^[A-Za-z_$][\w$]*$/.test(raw) && raw.length >= 3) out.add(raw);
  }
  return [...out];
}

/** Whole-word presence, so `send` doesn't match `resend` or `sender`. */
function mentions(src: string, id: string): boolean {
  return new RegExp(`\\b${id.replace(/[$]/g, '\\$')}\\b`).test(src);
}

/**
 * Is `id` *declared* in this source (not merely mentioned as an event name,
 * string, or imported symbol)? Rule 2 only fires on declarations — that is what
 * separates "the prose explains a helper the excerpt forgot to show" from "the
 * prose happens to quote an event string that appears elsewhere in the file".
 */
function declares(src: string, id: string): boolean {
  const e = id.replace(/[$]/g, '\\$');
  return (
    new RegExp(`\\b(?:function|class|const|let|var)\\s+${e}\\b`).test(src) ||
    new RegExp(`^\\s*(?:async\\s+)?(?:static\\s+)?${e}\\s*\\(`, 'm').test(src) ||
    new RegExp(`\\b${e}\\s*[:=]\\s*(?:async\\s*)?(?:function\\b|\\()`).test(src)
  );
}

/** `VideoRoom` <-> video-room.js, `App` <-> app.js, `WorkerTask` <-> worker-task.js. */
function isFileSubject(filePath: string, id: string): boolean {
  const base = (filePath.split('/').pop() ?? '').replace(/\.[^.]+$/, '');
  const norm = (s: string) => s.replace(/[-_]/g, '').toLowerCase();
  return norm(base) === norm(id);
}

const FENCE_RE = /^(`{3,})([^\s`]*)([^\n]*)\n([\s\S]*?)^\1\s*$/gm;

function parseFences(mdx: string, content: string): Fence[] {
  const out: Fence[] = [];
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    const meta = (m[3] || '').trim();
    if (!meta.includes('file=')) continue;
    const before = content.slice(0, m.index);
    const line = before.split('\n').length;
    // Lead paragraph: the last non-empty block before the fence.
    const blocks = before.split(/\n\s*\n/).filter((b) => b.trim());
    out.push({ mdx, line, lang: (m[2] || '').trim(), meta, lead: blocks[blocks.length - 1] ?? '' });
  }
  return out;
}

async function main() {
  const strict = process.argv.includes('--strict');
  const files = (await getFiles(CONTENT_DIR)).filter((f) => /\.mdx?$/.test(f)).sort();

  const errors: string[] = [];
  const warnings: string[] = [];
  let checked = 0;

  for (const mdx of files) {
    const content = await readFile(mdx, 'utf8');
    for (const fence of parseFences(mdx, content)) {
      const parsed = parseFileMeta(fence.meta);
      if (!parsed) {
        errors.push(`${fence.mdx}:${fence.line}: could not parse \`file=\` meta: ${fence.meta}`);
        continue;
      }
      const abs = resolve(dirname(mdx), parsed.filePath.replace(/^<rootDir>/, ROOT));
      if (!existsSync(abs)) {
        errors.push(`${fence.mdx}:${fence.line}: imported file does not exist: ${relative(ROOT, abs)}`);
        continue;
      }
      checked++;
      const source = await readFile(abs, 'utf8');
      const { excerpt, start, end, total } = extractLines(source, parsed.from, parsed.hasDash, parsed.to);
      const rel = relative(ROOT, abs);

      if (start > total || end > total) {
        errors.push(
          `${fence.mdx}:${fence.line}: range #L${start}-L${end} is out of bounds — ${rel} has ${total} lines`,
        );
        continue;
      }
      if (!excerpt.trim()) {
        errors.push(`${fence.mdx}:${fence.line}: range #L${start}-L${end} of ${rel} is empty`);
        continue;
      }

      if (BRACE_LANGS.has(fence.lang)) {
        const problem = balanceReport(excerpt);
        if (problem) {
          errors.push(
            `${fence.mdx}:${fence.line}: range #L${start}-L${end} of ${rel} renders unbalanced code (${problem})\n` +
              `      first: ${excerpt.split('\n')[0].trim().slice(0, 72)}\n` +
              `      last:  ${excerpt.split('\n').slice(-1)[0].trim().slice(0, 72)}`,
          );
        }
      }

      // Rule 2: prose names something that lives in this file but isn't shown.
      for (const id of proseIdentifiers(fence.lead)) {
        if (mentions(excerpt, id)) continue;
        if (!declares(source, id)) continue;
        // The file's own subject — `VideoRoom` in video-room.js, `App` in
        // app.js. Prose routinely names the enclosing class while the excerpt
        // shows one method of it; that is not a wrong range.
        if (isFileSubject(rel, id)) continue;
        warnings.push(
          `${fence.mdx}:${fence.line}: prose names \`${id}\`, which exists in ${rel} but is outside the rendered range #L${start}-L${end}`,
        );
      }
    }
  }

  console.log(`🔍 Checking ${checked} code-import fence(s) across ${files.length} files...\n`);

  if (errors.length) {
    console.log('✖ Errors\n');
    for (const e of errors) console.log(`   ${e}`);
    console.log('');
  }
  if (warnings.length) {
    console.log(`⚠️  Possible range/prose mismatches (${warnings.length})\n`);
    for (const w of warnings) console.log(`   ${w}`);
    console.log('');
  }

  if (!errors.length && !warnings.length) {
    console.log('✅ Every code-import range resolves, is in bounds, and renders balanced code.');
  }

  if (errors.length || (strict && warnings.length)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
