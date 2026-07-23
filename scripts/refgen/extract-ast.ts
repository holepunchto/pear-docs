// scripts/refgen/extract-ast.ts
//
// Stage 2a — structural ground truth from the JS source.
//
// Parses source with acorn for the exported class and its method definitions.
// Yields authoritative names, arity, parameter identifiers, defaults and
// async-ness. Also extracts JSDoc block comments (/** … */) when present —
// these become a fallback prose tier below README in build.ts.

import { parse } from 'acorn';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { MethodKind } from './model';

const SOURCE_EXT = /\.(js|mjs|cjs)$/i;

export interface AstParam {
  name: string;
  optional: boolean;
  default?: string;
}

export interface AstJsDoc {
  description?: string;
  params: { name: string; type?: string; description: string }[];
  returns?: string;
  returnType?: string;
  throws: { type?: string; description: string }[];
  examples: string[];
}

export interface AstMethod {
  name: string;
  kind: MethodKind;
  static: boolean;
  async: boolean;
  params: AstParam[];
  file: string; // path relative to repo root ('' for inherited members)
  line: number; // 1-based (0 for inherited members)
  inherited?: boolean; // from a base class (no source link in this repo)
  event?: string; // event name when kind === 'event' (from `this.emit('name')`)
  jsdoc?: AstJsDoc; // parsed /** */ comment directly above the member, if any
}

/**
 * Documented public surface of common base classes. These libraries lack cloned
 * base deps, so we inject the canonical members when a class `extends` one — the
 * AST method-walk only sees a class's own body, not its superclass. Members get
 * no source link (they live in the base package, not this repo).
 */
const EVENT_EMITTER: { name: string; kind: MethodKind; async?: boolean; params?: string[] }[] = [
  { name: 'on', kind: 'method', params: ['event', 'listener'] },
  { name: 'once', kind: 'method', params: ['event', 'listener'] },
  { name: 'off', kind: 'method', params: ['event', 'listener'] },
  { name: 'emit', kind: 'method', params: ['event', '[...args]'] },
];

const BASE_MEMBERS: Record<string, { name: string; kind: MethodKind; async?: boolean; params?: string[] }[]> = {
  EventEmitter: EVENT_EMITTER,
  // ready-resource (extends EventEmitter)
  ReadyResource: [
    { name: 'ready', kind: 'method', async: true },
    { name: 'close', kind: 'method', async: true },
    { name: 'opened', kind: 'getter' },
    { name: 'closed', kind: 'getter' },
    ...EVENT_EMITTER,
  ],
  // streamx (streams are event emitters)
  Writable: [
    { name: 'write', kind: 'method', params: ['data'] },
    { name: 'end', kind: 'method' },
    { name: 'destroy', kind: 'method', params: ['[err]'] },
    { name: 'destroyed', kind: 'getter' },
    ...EVENT_EMITTER,
  ],
  Readable: [
    { name: 'push', kind: 'method', params: ['data'] },
    { name: 'destroy', kind: 'method', params: ['[err]'] },
    { name: 'destroyed', kind: 'getter' },
    ...EVENT_EMITTER,
  ],
  Duplex: [
    { name: 'write', kind: 'method', params: ['data'] },
    { name: 'end', kind: 'method' },
    { name: 'destroy', kind: 'method', params: ['[err]'] },
    { name: 'destroyed', kind: 'getter' },
    ...EVENT_EMITTER,
  ],
};

/** Canonical events emitted by streamx base classes — inherited, not in source. */
const BASE_EVENTS: Record<string, string[]> = {
  Readable: ['data', 'readable', 'end', 'close', 'error'],
  Writable: ['drain', 'finish', 'close', 'error'],
  Duplex: ['data', 'end', 'drain', 'finish', 'close', 'error'],
};

interface EmitInfo {
  event: string;
  args: string[];
  line: number;
}

/** Best-effort identifier name for an emit argument (for the event signature). */
function emitArgName(node: any): string | null {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && node.property?.type === 'Identifier') return node.property.name;
  return null;
}

/**
 * `<recv>.emit('name', ...args)` calls inside a class. `self` selects `this.emit`
 * (events the class raises on itself) vs. emits on some other receiver (used to
 * attribute cross-instance emits like `monitor.emit('preloaded')`).
 */
function collectEmits(node: any, self: boolean): EmitInfo[] {
  const out: EmitInfo[] = [];
  walkNodes(node, (n) => {
    if (
      n.type !== 'CallExpression' ||
      n.callee?.type !== 'MemberExpression' ||
      n.callee.property?.type !== 'Identifier' ||
      n.callee.property.name !== 'emit'
    ) {
      return;
    }
    const isThis = n.callee.object?.type === 'ThisExpression';
    if (isThis !== self) return;
    const first = n.arguments?.[0];
    if (first?.type !== 'Literal' || typeof first.value !== 'string') return;
    const args = n.arguments.slice(1).map(emitArgName).filter((x: string | null): x is string => !!x);
    out.push({ event: first.value, args, line: (n.callee.property.loc ?? n.loc).start.line });
  });
  return out;
}

function eventMethod(ev: EmitInfo, file: string): AstMethod {
  return {
    name: 'on',
    kind: 'event',
    event: ev.event,
    static: false,
    async: false,
    params: ev.args.map((name) => ({ name, optional: false })),
    file,
    line: ev.line,
  };
}

/** Base-class identifier from a `superClass` node (`Duplex` or `streamx.Duplex`). */
function superClassName(superClass: any): string | null {
  if (!superClass) return null;
  if (superClass.type === 'Identifier') return superClass.name;
  if (superClass.type === 'MemberExpression' && superClass.property?.type === 'Identifier') {
    return superClass.property.name;
  }
  return null;
}

export interface AstClass {
  name: string | null;
  methods: AstMethod[];
  /** The package's main exported class (vs. a returned sub-object class). */
  main: boolean;
}

export interface AstTypedef {
  name: string;
  description?: string;
  properties: { name: string; type?: string; optional: boolean; default?: string; description?: string }[];
}

export interface AstResult {
  classes: AstClass[];
  /** `@typedef` object shapes found anywhere in the source. */
  typedefs: AstTypedef[];
}

/** A class definition discovered in source, with the file it lives in. */
interface ClassDef {
  name: string;
  node: any;
  file: string;
  code: string;
  jsdocFor: (n: number) => AstJsDoc | undefined;
}

interface SourceFile {
  rel: string;
  code: string;
  /** Package entry point (index.js etc.) — only its export defines the main class. */
  entry: boolean;
}

const ENTRY_FILES = ['index.js', 'index.mjs', 'index.cjs'];

/** Entry file(s) + lib/* source files, test files excluded. */
function collectSourceFiles(repoDir: string): SourceFile[] {
  const files: SourceFile[] = [];
  const seen = new Set<string>();

  const add = (rel: string, entry = false) => {
    if (seen.has(rel)) return;
    const abs = join(repoDir, rel);
    if (!existsSync(abs)) return;
    seen.add(rel);
    files.push({ rel, code: readFileSync(abs, 'utf8'), entry });
  };

  const walk = (rel: string, depth: number) => {
    let entries;
    try {
      entries = readdirSync(join(repoDir, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'test' || e.name === 'tests') continue;
      const child = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth < 3) walk(child, depth + 1);
      } else if (SOURCE_EXT.test(e.name) && !/\.test\.|test\.js$/i.test(e.name)) {
        add(child);
      }
    }
  };

  for (const root of ENTRY_FILES) add(root, true);
  walk('lib', 1);
  return files;
}

function paramFrom(node: any, code: string): AstParam {
  const slice = (n: any) => code.slice(n.start, n.end);
  switch (node.type) {
    case 'Identifier':
      return { name: node.name, optional: false };
    case 'AssignmentPattern':
      return {
        // A destructured options bag (`{ force = false } = {}`) has no identifier;
        // name it `options` so it's documentable and merges with the README's
        // conventional `[options]` param. Other patterns keep their source text.
        name:
          node.left.type === 'Identifier'
            ? node.left.name
            : node.left.type === 'ObjectPattern'
              ? 'options'
              : slice(node.left),
        optional: true,
        default: slice(node.right),
      };
    case 'RestElement':
      return { name: '...' + (node.argument.name ?? slice(node.argument)), optional: true };
    case 'ObjectPattern':
      return { name: 'options', optional: false };
    case 'ArrayPattern':
      return { name: slice(node), optional: false };
    default:
      return { name: slice(node), optional: false };
  }
}

function methodKind(def: any): MethodKind {
  if (def.kind === 'constructor') return 'constructor';
  if (def.kind === 'get') return 'getter';
  if (def.kind === 'set') return 'setter';
  return 'method';
}

/** Recursively visit every AST node, invoking `visit` on each. */
function walkNodes(node: any, visit: (n: any) => void): void {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walkNodes(c, visit));
    else if (child && typeof child.type === 'string') walkNodes(child, visit);
  }
}

/**
 * If `s` starts with a JSDoc `{Type}`, return the (brace-balanced) type and the
 * remaining text; otherwise no type and the original text. Balanced scanning is
 * required for object-shape and generic types whose `{…}` nests, e.g.
 * `{Promise<{length: number, byteLength: number}>}`.
 */
function takeBracedType(s: string): { type?: string; rest: string } {
  const t = s.trimStart();
  if (t[0] !== '{') return { rest: t };
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '{') depth++;
    else if (t[i] === '}' && --depth === 0) {
      return { type: t.slice(1, i).trim() || undefined, rest: t.slice(i + 1).trimStart() };
    }
  }
  return { rest: t }; // unbalanced — treat as untyped
}

/**
 * Parse a leading JSDoc name token: `name`, `[name]`, or `[name=default]`, returning
 * the name, optional flag, default (if any) and the remaining text. The default may
 * itself contain brackets (`[]`, `{}`), so the closing `]` is found by a balanced
 * scan — a regex like `=[^\]]*` stops at the first inner `]` and leaves a stray
 * `] -` in the description (the `[messages=[]]` → `[messages=[ - ]` bug).
 */
function parseNameToken(rest: string): { name: string; optional: boolean; default?: string; rest: string } | null {
  const s = rest.trimStart();
  if (s[0] === '[') {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '[') depth++;
      else if (s[i] === ']' && --depth === 0) {
        const inner = s.slice(1, i);
        const eq = inner.indexOf('=');
        return {
          name: (eq >= 0 ? inner.slice(0, eq) : inner).trim(),
          optional: true,
          default: eq >= 0 ? inner.slice(eq + 1).trim() || undefined : undefined,
          rest: s.slice(i + 1).trimStart(),
        };
      }
    }
    // unbalanced bracket — fall through to the plain-identifier match
  }
  const m = s.match(/^([\w$.]+)\s*([\s\S]*)/);
  return m ? { name: m[1], optional: false, rest: m[2] } : null;
}

// Parse a block-comment value (the text between the opening /** and closing delimiters)
// into structured JSDoc fields: description, @param, @returns, @example.
function parseJsDoc(text: string): AstJsDoc | null {
  // Strip the leading `*` that starts a JSDoc block, then strip the per-line ` * ` prefix.
  const lines = text
    .replace(/^\*[ \t]?/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trimEnd());

  const descLines: string[] = [];
  const params: { name: string; type?: string; description: string }[] = [];
  let returns: string | undefined;
  let returnType: string | undefined;
  const throws: { type?: string; description: string }[] = [];
  const exampleLines: string[] = [];
  let mode: 'desc' | 'example' | 'skip' = 'desc';

  for (const line of lines) {
    // Capture the optional `{Type}` so the renderer can build a typed param table
    // and cross-link types. A balanced scan handles nested braces in object-shape
    // types like `{Promise<{length: number}>}`, which a regex can't.
    const paramTag = /^@param\b/.test(line);
    const returnsTag = /^@returns?\b/.test(line);
    const typeTag = /^@type\b/.test(line);
    const throwsTag = /^@(?:throws?|exception)\b/.test(line);
    const exampleM = line.match(/^@example\s*(.*)/);
    const isOtherTag = !paramTag && !returnsTag && !typeTag && !throwsTag && !exampleM && /^@\w/.test(line);

    if (paramTag) {
      mode = 'skip';
      const { type, rest } = takeBracedType(line.replace(/^@param\s*/, ''));
      // parseNameToken strips the whole `[name=default]` token (default may contain
      // brackets) so nothing leaks into the description. The default itself is sourced
      // from the AST node in paramFrom(), so only the name is kept here.
      const tok = parseNameToken(rest);
      if (tok) {
        const desc = tok.rest.trim().replace(/^[-—]\s*/, '');
        // Keep params with a type even when the description is still missing — the
        // gap report wants "typed but undescribed", and the type is useful.
        if (tok.name && (desc || type)) params.push({ name: tok.name, type, description: desc });
      }
    } else if (returnsTag) {
      mode = 'skip';
      const { type, rest } = takeBracedType(line.replace(/^@returns?\s*/, ''));
      returnType = type ?? returnType;
      const desc = rest.trim();
      if (desc) returns = desc;
    } else if (typeTag) {
      // `@type {T}` documents a property/field value's type (rendered as Returns).
      // Capture any trailing prose as the description — single-line field docs like
      // `/** @type {Buffer} The public key. */` carry their description here.
      mode = 'skip';
      const { type, rest } = takeBracedType(line.replace(/^@type\s*/, ''));
      returnType = type ?? returnType;
      const desc = rest.trim().replace(/^[-—]\s*/, '');
      if (desc) descLines.push(desc);
    } else if (throwsTag) {
      // `@throws {Type} condition` — the error type and when it's raised.
      mode = 'skip';
      const { type, rest } = takeBracedType(line.replace(/^@(?:throws?|exception)\s*/, ''));
      const desc = rest.trim().replace(/^[-—]\s*/, '');
      if (type || desc) throws.push({ type, description: desc });
    } else if (exampleM) {
      mode = 'example';
      if (exampleM[1]) exampleLines.push(exampleM[1]);
    } else if (isOtherTag) {
      mode = 'skip';
    } else if (mode === 'desc') {
      descLines.push(line);
    } else if (mode === 'example') {
      exampleLines.push(line);
    }
  }

  while (descLines.length && !descLines[0].trim()) descLines.shift();
  while (descLines.length && !descLines[descLines.length - 1].trim()) descLines.pop();

  const description = descLines.join('\n').trim() || undefined;
  const examples = exampleLines.join('\n').trim() ? [exampleLines.join('\n').trim()] : [];
  if (!description && !params.length && !returns && !returnType && !throws.length && !examples.length) return null;
  return { description, params, returns, returnType, throws, examples };
}

/**
 * Parse a standalone `@typedef {Object} Name` block (with `@property` lines) into
 * a named object type. Property defaults are read from `[name=default]` (typedefs
 * have no AST node to source them from, unlike call params).
 */
function parseTypedef(text: string): AstTypedef | null {
  const lines = text
    .replace(/^\*[ \t]?/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trimEnd());

  let name: string | undefined;
  let seenTypedef = false;
  const descLines: string[] = [];
  const properties: AstTypedef['properties'] = [];

  for (const line of lines) {
    if (/^@typedef\b/.test(line)) {
      const { rest } = takeBracedType(line.replace(/^@typedef\s*/, ''));
      name = rest.match(/^([\w$.]+)/)?.[1];
      seenTypedef = true;
    } else if (/^@property\b/.test(line)) {
      const { type, rest } = takeBracedType(line.replace(/^@property\s*/, ''));
      const tok = parseNameToken(rest);
      if (tok) {
        const desc = tok.rest.trim().replace(/^[-—]\s*/, '') || undefined;
        if (tok.name) {
          properties.push({ name: tok.name, type, optional: tok.optional, default: tok.default, description: desc });
        }
      }
    } else if (/^@\w/.test(line)) {
      // another tag — stop collecting description
    } else if (!seenTypedef) {
      descLines.push(line);
    }
  }

  if (!name) return null;
  while (descLines.length && !descLines[0].trim()) descLines.shift();
  while (descLines.length && !descLines[descLines.length - 1].trim()) descLines.pop();
  return { name, description: descLines.join('\n').trim() || undefined, properties };
}

/**
 * Build a lookup that maps a node's start position to the JSDoc comment that
 * immediately precedes it (only whitespace between comment end and node start).
 */
function buildJsDocLookup(
  comments: { type: 'Block' | 'Line'; value: string; start: number; end: number }[],
  code: string
): (nodeStart: number) => AstJsDoc | undefined {
  const entries = comments
    .filter((c) => c.type === 'Block' && c.value.startsWith('*'))
    .map((c) => ({ end: c.end, jsdoc: parseJsDoc(c.value) }))
    .filter((e): e is { end: number; jsdoc: AstJsDoc } => e.jsdoc !== null);

  return (nodeStart: number): AstJsDoc | undefined => {
    let best: { end: number; jsdoc: AstJsDoc } | undefined;
    for (const e of entries) {
      if (e.end < nodeStart && (!best || e.end > best.end)) best = e;
    }
    if (!best) return undefined;
    // Only whitespace may sit between the JSDoc and the node — but tolerate
    // intervening line/block comments (`// note` lines are common); intervening
    // *code* still breaks the association.
    const between = code
      .slice(best.end, nodeStart)
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    if (/\S/.test(between)) return undefined;
    return best.jsdoc;
  };
}

function methodsFromClassBody(
  classNode: any,
  file: string,
  code: string,
  jsdocFor?: (nodeStart: number) => AstJsDoc | undefined
): AstMethod[] {
  const out: AstMethod[] = [];
  const seen = new Set<string>();
  // Event name is part of identity so the many `on('…')` events stay distinct
  // instead of colliding on a single `on`.
  const key = (m: AstMethod) => `${m.static ? 'S' : 'I'}:${m.name}${m.event ? `:${m.event}` : ''}`;
  const push = (m: AstMethod) => {
    const k = key(m);
    if (seen.has(k)) return; // methods/getters win over later-discovered fields
    seen.add(k);
    out.push(m);
  };

  for (const member of classNode.body.body) {
    if (member.computed) continue; // skip dynamic keys
    const name = member.key?.type === 'Identifier' ? member.key.name : member.key?.value;
    if (typeof name !== 'string' || name.startsWith('_')) continue;

    if (member.type === 'MethodDefinition') {
      push({
        name,
        kind: methodKind(member),
        static: !!member.static,
        async: !!member.value.async,
        params: member.value.params.map((p: any) => paramFrom(p, code)),
        file,
        line: member.loc.start.line,
        ...(jsdocFor ? { jsdoc: jsdocFor(member.start) } : {}),
      });
    } else if (member.type === 'PropertyDefinition') {
      // Class field: `length = 0`, `static MAX = 64`.
      push({
        name, kind: 'property', static: !!member.static, async: false, params: [], file,
        line: member.loc.start.line,
        ...(jsdocFor ? { jsdoc: jsdocFor(member.start) } : {}),
      });
    }
  }

  // Inherited members from a mapped base class (`extends ReadyResource`,
  // `extends Duplex`). Own members already pushed win via the dedupe.
  const base = superClassName(classNode.superClass);
  if (base && BASE_MEMBERS[base]) {
    for (const bm of BASE_MEMBERS[base]) {
      push({
        name: bm.name,
        kind: bm.kind,
        static: false,
        async: !!bm.async,
        params: (bm.params ?? []).map((raw) => {
          const optional = raw.startsWith('[');
          return { name: optional ? raw.slice(1, -1) : raw, optional };
        }),
        file: '',
        line: 0,
        inherited: true,
      });
    }
  }

  // Instance fields assigned in the constructor: `this.publicKey = ...`. The
  // method-walk above misses these, yet they are a large share of the documented
  // public surface (e.g. secretstream's `isInitiator`, corestore's `readOnly`).
  const ctor = classNode.body.body.find((m: any) => m.kind === 'constructor');
  if (ctor) {
    walkNodes(ctor.value.body, (n) => {
      if (
        n.type === 'AssignmentExpression' &&
        n.left?.type === 'MemberExpression' &&
        n.left.object?.type === 'ThisExpression' &&
        n.left.property?.type === 'Identifier'
      ) {
        const name = n.left.property.name;
        if (name.startsWith('_')) return;
        // Attach a JSDoc comment written directly above the field assignment, so
        // public properties like `this.key = …` can be documented (`@type {T}`).
        push({
          name, kind: 'property', static: false, async: false, params: [], file,
          line: n.left.property.loc.start.line,
          ...(jsdocFor ? { jsdoc: jsdocFor(n.start) } : {}),
        });
      }
    });
  }

  // Events the class raises on itself (`this.emit('name', …)`) — source truth for
  // events upstream READMEs often omit.
  for (const ev of collectEmits(classNode, true)) push(eventMethod(ev, file));

  // Inherited stream events (`data`, `end`, …) when extending a streamx base.
  if (base && BASE_EVENTS[base]) {
    for (const event of BASE_EVENTS[base]) push({ ...eventMethod({ event, args: [], line: 0 }, ''), inherited: true });
  }

  return out;
}

/**
 * Module-of-functions surface: `exports.<name> = ...` and `module.exports = { ... }`.
 * For packages with no class (e.g. compact-encoding's `cenc.*` encodings).
 */
function moduleExports(files: SourceFile[]): AstMethod[] {
  const out: AstMethod[] = [];
  const seen = new Set<string>();

  for (const { rel, code, entry } of files) {
    if (!entry) continue; // only the package entry defines the public namespace
    let program: any;
    const rawComments: { type: 'Block' | 'Line'; value: string; start: number; end: number }[] = [];
    try {
      program = parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true, onComment: rawComments });
    } catch {
      continue;
    }
    const jsdocFor = buildJsDocLookup(rawComments, code);

    const add = (name: string, fn: any, line: number, nodeStart: number) => {
      if (!name || name.startsWith('_') || seen.has(name)) return;
      seen.add(name);
      const isFn = fn?.type === 'FunctionExpression' || fn?.type === 'ArrowFunctionExpression';
      const jsdoc = jsdocFor(nodeStart);
      out.push({
        name,
        kind: isFn ? 'method' : 'property',
        static: false,
        async: !!fn?.async,
        params: isFn ? fn.params.map((p: any) => paramFrom(p, code)) : [],
        file: rel,
        line,
        ...(jsdoc ? { jsdoc } : {}),
      });
    };

    // Iterate top-level statements so the JSDoc anchor is the *statement* start
    // (where the comment sits), not the inner assignment. This matters for the
    // common `const X = (exports.X = …)` wrapper, whose `exports.X =` assignment
    // begins mid-statement — looking there misses the comment above the `const`.
    for (const stmt of program.body) {
      const anchor = stmt.start;
      walkNodes(stmt, (n) => {
        if (n.type !== 'AssignmentExpression' || n.left?.type !== 'MemberExpression') return;
        const left = n.left;
        // exports.name = ... / module.exports.name = ... (incl. chained assignments)
        if (left.property?.type === 'Identifier') {
          const obj = left.object;
          const isExports =
            (obj?.type === 'Identifier' && obj.name === 'exports') ||
            (obj?.type === 'MemberExpression' && obj.object?.name === 'module' && obj.property?.name === 'exports');
          if (isExports && left.property.name !== 'exports') {
            add(left.property.name, n.right, left.property.loc.start.line, anchor);
          }
        }
        // module.exports = { name: fn, ... } — each property carries its own comment.
        if (left.object?.name === 'module' && left.property?.name === 'exports' && n.right?.type === 'ObjectExpression') {
          for (const prop of n.right.properties) {
            if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
              add(prop.key.name, prop.value, prop.key.loc.start.line, prop.start);
            }
          }
        }
      });
    }
  }

  return out;
}

/** Names of repo classes instantiated (`new X()`) inside the main class's public
 * methods — i.e. sub-objects it hands back (protomux `Channel`, mirrordrive
 * `Monitor`). */
function subObjectNames(mainNode: any, known: Set<string>, mainName: string | null): string[] {
  const found = new Set<string>();
  for (const member of mainNode.body.body) {
    if (member.type !== 'MethodDefinition' || member.kind === 'constructor') continue;
    const mname = member.key?.type === 'Identifier' ? member.key.name : member.key?.value;
    if (typeof mname === 'string' && mname.startsWith('_')) continue; // public methods only
    walkNodes(member.value?.body, (n) => {
      if (n.type === 'NewExpression' && n.callee?.type === 'Identifier') {
        const nm = n.callee.name;
        if (nm !== mainName && known.has(nm)) found.add(nm);
      }
    });
  }
  return [...found];
}

export function extractAst(repoDir: string): AstResult {
  const files = collectSourceFiles(repoDir);
  // All class definitions across files, in scan order (entry files first). A name
  // can appear more than once across files (e.g. hyperbee's real `Batch` in
  // index.js and an unrelated extension `Batch` in lib/); we keep them all and
  // resolve by file scope below.
  const defs: ClassDef[] = [];
  const typedefs: AstTypedef[] = [];
  let exportedName: string | null = null;

  for (const { rel, code, entry } of files) {
    let program: any;
    const rawComments: { type: 'Block' | 'Line'; value: string; start: number; end: number }[] = [];
    try {
      program = parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true, onComment: rawComments });
    } catch {
      // Some files may be ESM; retry as module before giving up.
      rawComments.length = 0;
      try {
        program = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true, onComment: rawComments });
      } catch {
        continue;
      }
    }
    const jsdocFor = buildJsDocLookup(rawComments, code);

    // Standalone `@typedef` blocks (not attached to a member node), first wins.
    for (const c of rawComments) {
      if (c.type === 'Block' && c.value.startsWith('*') && /@typedef\b/.test(c.value)) {
        const td = parseTypedef(c.value);
        if (td && !typedefs.some((x) => x.name === td.name)) typedefs.push(td);
      }
    }

    for (const stmt of program.body) {
      // class X {}
      if (stmt.type === 'ClassDeclaration' && stmt.id) {
        defs.push({ name: stmt.id.name, node: stmt, file: rel, code, jsdocFor });
      }
      // const X = class {}
      if (stmt.type === 'VariableDeclaration') {
        for (const decl of stmt.declarations) {
          if (decl.init?.type === 'ClassExpression' && decl.id.type === 'Identifier') {
            defs.push({ name: decl.id.name, node: decl.init, file: rel, code, jsdocFor });
          }
        }
      }
      // module.exports = <Identifier | ClassExpression> — entry file only, so a
      // lib/* module's own export does not masquerade as the package's main class.
      if (
        entry &&
        stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'AssignmentExpression' &&
        stmt.expression.left.type === 'MemberExpression' &&
        stmt.expression.left.object.name === 'module' &&
        stmt.expression.left.property.name === 'exports'
      ) {
        const rhs = stmt.expression.right;
        if (rhs.type === 'Identifier') {
          exportedName = rhs.name;
        } else if (rhs.type === 'ClassExpression') {
          // Inline `module.exports = class X {}` — register so it can be the main
          // class and a sub-object scan target like any other.
          const nm = rhs.id?.name ?? '__default__';
          defs.push({ name: nm, node: rhs, file: rel, code, jsdocFor });
          exportedName = nm;
        }
      }
    }
  }

  // First definition of a name wins for plain lookups (entry files scan first).
  const firstByName = (name: string): ClassDef | undefined => defs.find((d) => d.name === name);
  // A `new X()` reference resolves to a class X in the SAME file first (lexical
  // scope), falling back to any X. This stops a same-named helper in lib/ (e.g.
  // hyperbee's extension `Batch`) from shadowing the real class in index.js.
  const resolveClass = (name: string, preferFile: string): ClassDef | undefined =>
    defs.find((d) => d.name === name && d.file === preferFile) ?? firstByName(name);
  const classNames = new Set(defs.map((d) => d.name));

  // Resolve the main class node.
  let mainName = exportedName && classNames.has(exportedName) ? exportedName : null;
  if (!mainName) {
    // Fallback: the class with the most members (best-effort for odd layouts).
    let bestCount = -1;
    for (const d of defs) {
      const count = methodsFromClassBody(d.node, d.file, d.code).length;
      if (count > bestCount) {
        bestCount = count;
        mainName = d.name;
      }
    }
  }

  // No class at all — treat as a module-of-functions (e.g. compact-encoding).
  if (!mainName) {
    const fns = moduleExports(files);
    return fns.length ? { classes: [{ name: null, methods: fns, main: true }], typedefs } : { classes: [], typedefs };
  }

  const main = firstByName(mainName)!;
  const result: AstClass[] = [
    { name: mainName, methods: methodsFromClassBody(main.node, main.file, main.code, main.jsdocFor), main: true },
  ];

  // Public sub-object classes the main class returns (Channel, Monitor, …),
  // resolved preferring the main class's own file so a same-named lib/ helper
  // can't shadow them.
  const subs = subObjectNames(main.node, classNames, mainName);
  for (const sub of subs) {
    const c = resolveClass(sub, main.file)!;
    result.push({ name: sub, methods: methodsFromClassBody(c.node, c.file, c.code, c.jsdocFor), main: false });
  }

  // Cross-instance emits: the main class raising events on a held sub-object
  // (`monitor.emit('preloaded')`). Only safe to attribute when there is exactly
  // one sub-object. Skip events the sub-object already declares itself.
  if (subs.length === 1) {
    const target = result.find((c) => c.name === subs[0])!;
    const have = new Set(target.methods.filter((m) => m.kind === 'event').map((m) => m.event));
    for (const ev of collectEmits(main.node, false)) {
      if (have.has(ev.event)) continue;
      have.add(ev.event);
      target.methods.push(eventMethod(ev, main.file));
    }
  }

  return { classes: result, typedefs };
}
