// scripts/bare-refgen/extract.test.ts
//
// Locks the extractor + renderer behaviour on the tricky .d.ts archetypes the
// bare modules use, so the now-automated generation can't silently regress.
//
// Run: npm run test:bare-refs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractModule } from './extract';
import { renderPage } from './render';
import type { BareExport, BareModel } from './model';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const extract = (file: string, moduleName?: string): BareExport[] =>
  extractModule(join(FIXTURES, file), moduleName);

const byName = (list: BareExport[], name: string) => list.find((e) => e.name === name);
const names = (list: BareExport[]) => list.map((e) => e.name);

function collectNames(exports: BareExport[]): Set<string> {
  const out = new Set<string>();
  const walk = (e: BareExport) => {
    out.add(e.name);
    e.members.forEach(walk);
  };
  exports.forEach(walk);
  return out;
}

test('named exports: kinds, params, optionality', () => {
  const ex = extract('named.d.ts');
  const foo = byName(ex, 'foo');
  assert.equal(foo?.kind, 'function');
  assert.deepEqual(foo?.params.map((p) => [p.name, p.optional]), [
    ['a', false],
    ['b', true],
  ]);
  assert.equal(byName(ex, 'K')?.kind, 'variable');
  assert.equal(byName(ex, 'Opts')?.kind, 'interface');
  assert.equal(byName(ex, 'Name')?.kind, 'typeAlias');
});

test('export = with declaration merging exposes constructor, instance, and static members', () => {
  const ex = extract('exporteq.d.ts');
  assert.equal(ex.length, 1, 'single top-level export');
  const thing = ex[0];
  assert.equal(thing.name, 'Thing');
  assert.equal(thing.kind, 'class');
  const members = collectNames([thing]);
  assert.ok(members.has('value'), 'instance property');
  assert.ok(members.has('toString'), 'instance method');
  assert.ok(members.has('Thing.parse'), 'static rendered qualified');
  // The `export { Thing }` self-reference must not duplicate the class.
  assert.equal(thing.members.filter((m) => m.kind === 'constructor').length, 1);
});

test('export = promotes distinct sibling classes and never leaks generic params', () => {
  const ex = extract('siblings.d.ts');
  assert.ok(names(ex).includes('Base'), 'base class');
  assert.ok(names(ex).includes('Sub'), 'sibling promoted to top level');
  const all = collectNames(ex);
  assert.ok(!all.has('M'), 'generic type parameter must not appear as a member');
  const base = byName(ex, 'Base')!;
  assert.ok(base.members.some((m) => m.name === 'Base.helper' && m.static), 'static helper kept on Base');
  // Sub is its own export, not folded into Base's members.
  assert.ok(!base.members.some((m) => m.name === 'Sub'));
});

test('ambient declare-module: exports read from the ambient module symbol', () => {
  const ex = extract('ambient.d.ts', 'ambient-fixture');
  assert.equal(ex.length, 3, 'all three ambient exports found');
  assert.equal(byName(ex, 'ping')?.kind, 'function');
  assert.equal(byName(ex, 'Info')?.kind, 'interface');
  assert.equal(byName(ex, 'N')?.kind, 'variable');
  // Without a matching name it still resolves the sole ambient module.
  assert.equal(extract('ambient.d.ts').length, 3);
});

test('export = promotes a locally-declared class reachable only via a return type', () => {
  const ex = extract('reachable.d.ts');
  assert.ok(names(ex).includes('Channel'), 'export = target');
  assert.ok(names(ex).includes('Port'), 'Port is never itself exported, only returned by connect()');
  const port = byName(ex, 'Port')!;
  assert.equal(port.kind, 'class');
  assert.ok(port.members.some((m) => m.kind === 'constructor'));
  assert.ok(port.members.some((m) => m.name === 'read'));
});

test('a function merged with a namespace exposes the namespace exports as members', () => {
  const ex = extract('funcns.d.ts');
  assert.equal(ex.length, 1, 'single top-level export');
  const clone = ex[0];
  assert.equal(clone.name, 'clone');
  assert.equal(clone.kind, 'function', "symbolKind still prefers 'function' over 'namespace'");
  const memberNames = clone.members.map((m) => m.name);
  assert.ok(memberNames.includes('clone.serialize'), 'namespace-exported function surfaces as a static member');
  assert.ok(memberNames.includes('clone.tag'), 'namespace-exported const surfaces as a static member');
});

test('interface signatures flatten members inherited via `extends`, including across files', () => {
  const ex = extract('events.d.ts');
  const events = byName(ex, 'ThingEvents')!;
  assert.equal(events.kind, 'interface');
  const sig = events.signatures[0];
  assert.match(sig, /exit: \[code: number\]/, 'own member');
  assert.match(sig, /close: \[\]/, 'inherited member from another file');
  assert.match(sig, /error: \[err: Error\]/, 'inherited member from another file');
  assert.doesNotMatch(sig, /import\(/, 'inherited members render by name, not a resolved import(...) path');
});

test('@throws {TYPE} condition splits the type from the typeExpression, not the comment', () => {
  const ex = extract('throws.d.ts');
  const risky = byName(ex, 'risky')!;
  assert.deepEqual(risky.throws, [{ type: 'ALREADY_SENT', condition: 'the request has already been sent.' }]);
});

test('@param name - description strips the leading dash separator, not just the type', () => {
  const ex = extract('throws.d.ts');
  const fill = byName(ex, 'fill')!;
  assert.equal(fill.params[0].description, 'The buffer to fill.');
});

test('a description\'s dangling same-page anchor is repaired to the real one, or stripped', () => {
  const iface: BareExport = {
    key: 'IPCAcceptable', name: 'IPCAcceptable', kind: 'interface', static: false,
    signatures: ['interface IPCAcceptable {}'], description: null, deprecated: null,
    params: [], returns: null, throws: [], members: [],
  };
  const fn: BareExport = {
    key: 'write', name: 'write', kind: 'function', static: false,
    signatures: ['write(handle: IPCAcceptable): void'],
    description: 'Must implement the [`IPCAcceptable`](#ipc-handle-passing) protocol.',
    deprecated: null, params: [], returns: null, throws: [], members: [],
  };
  const noSuchType: BareExport = {
    key: 'read', name: 'read', kind: 'function', static: false,
    signatures: ['read(): void'],
    description: 'See [`NotDocumented`](#not-documented) for details.',
    deprecated: null, params: [], returns: null, throws: [], members: [],
  };
  const model: BareModel = {
    name: 'thing', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, dependencies: [], usage: null, extraSections: [],
    exports: [iface, fn, noSuchType], subpaths: [], generatedAt: null,
  };
  const { mdx } = renderPage(model, null);
  assert.match(mdx, /Must implement the \[`IPCAcceptable`\]\(#ipcacceptable\) protocol\./, 'retargeted to the real anchor');
  assert.match(mdx, /See `NotDocumented` for details\./, 'link to an undocumented type is stripped, label kept');
});

test('See also states what the module builds on, from its own bare-* dependencies', () => {
  const base: Omit<BareModel, 'dependencies'> = {
    name: 'thing', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, usage: null, extraSections: [],
    exports: [], subpaths: [], generatedAt: null,
  };
  const one = renderPage({ ...base, dependencies: ['bare-events'] }, null).mdx;
  assert.match(one, /- Builds on `bare-events`\.\n/);

  const two = renderPage({ ...base, dependencies: ['bare-events', 'bare-stream'] }, null).mdx;
  assert.match(two, /- Builds on `bare-events` and `bare-stream`\.\n/);

  const three = renderPage({ ...base, dependencies: ['bare-events', 'bare-path', 'bare-stream'] }, null).mdx;
  assert.match(three, /- Builds on `bare-events`, `bare-path`, and `bare-stream`\.\n/);

  const none = renderPage({ ...base, dependencies: [] }, null).mdx;
  assert.doesNotMatch(none, /Builds on/);
});

test('house-style fixes (no "e.g."/"i.e."/optional plurals) apply to describe text, usage blocks, and seeAlso', () => {
  const base: BareModel = {
    name: 'thing', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, dependencies: [], extraSections: [],
    exports: [], subpaths: [], generatedAt: null,
    usage: 'Accepts a flag (e.g. `--verbose`).',
  };
  const { mdx } = renderPage(base, {
    seeAlso: ['Extension(s) are matched case-insensitively, e.g. `.js` or `.JS`.'],
  });
  assert.doesNotMatch(mdx, /\be\.g\.|\bi\.e\.|\(s\)/, 'no Vale-flagged Latin abbreviation or optional plural survives');
  assert.match(mdx, /for example `--verbose`/, 'usage block gets the house-style fix');
  assert.match(mdx, /Extensions are matched case-insensitively, for example `\.js`/, 'seeAlso gets the house-style fix');
});

test('thin property-only class renders as a shape block, not expanded methods', () => {
  const ex = extract('thin.d.ts');
  const model: BareModel = {
    name: 'thin', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, dependencies: [], usage: null, extraSections: [],
    exports: ex, subpaths: [], generatedAt: null,
  };
  const { mdx } = renderPage(model, null);
  assert.match(mdx, /```ts\nclass Err \{/, 'rendered as a class shape');
  assert.match(mdx, /code: string/, 'includes the property');
  assert.doesNotMatch(mdx, /^#### `code/m, 'property is not its own heading');
});

test('a thin class shape block also renders a layout describe override (was silently dropped)', () => {
  const ex = extract('thin.d.ts');
  const model: BareModel = {
    name: 'thin', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, dependencies: [], usage: null, extraSections: [],
    exports: ex, subpaths: [], generatedAt: null,
  };
  const { mdx } = renderPage(model, { describe: { Err: 'Thrown when something goes wrong.' } });
  assert.match(mdx, /```ts\nclass Err \{[\s\S]*?\}\n```\n\nThrown when something goes wrong\./, 'description follows the shape block');
});
