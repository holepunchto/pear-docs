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

test('thin property-only class renders as a shape block, not expanded methods', () => {
  const ex = extract('thin.d.ts');
  const model: BareModel = {
    name: 'thin', version: '1.0.0', description: null, repoUrl: null,
    npmUrl: '', minBare: null, native: false, usage: null,
    exports: ex, subpaths: [], generatedAt: null,
  };
  const { mdx } = renderPage(model, null);
  assert.match(mdx, /```ts\nclass Err \{/, 'rendered as a class shape');
  assert.match(mdx, /code: string/, 'includes the property');
  assert.doesNotMatch(mdx, /^#### `code/m, 'property is not its own heading');
});
