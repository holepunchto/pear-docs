// scripts/bare-refgen/fetch.test.ts
//
// Locks the coverage floor that gates swapping in a `chore/ts-doc` PR
// branch's `.d.ts` over the published tarball's own — a stale branch must
// never win over a fresher published one.
//
// Run: npm run test:bare-refs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coversBaseline } from './fetch';

test('coversBaseline: identical content covers itself', () => {
  const dts = `export declare function foo(): void`;
  assert.equal(coversBaseline(dts, dts), true);
});

test('coversBaseline: catches a dropped class member (e.g. Response.error/.json/.redirect)', () => {
  const baseline = `
    declare class Response {
      static error(): Response
      static json(data: unknown): Response
    }
    export = Response
  `;
  const stale = `
    declare class Response {
      static error(): Response
    }
    export = Response
  `;
  assert.equal(coversBaseline(baseline, stale), false);
});

test('coversBaseline: catches a dropped `export { ... }` specifier (e.g. bare-net losing `errors`)', () => {
  const baseline = `
    import constants from './lib/constants'
    import errors from './lib/errors'
    export { constants, errors }
  `;
  const stale = `
    import constants from './lib/constants'
    export { constants }
  `;
  assert.equal(coversBaseline(baseline, stale), false);
});

test('coversBaseline: a superset (new symbols added) still covers the baseline', () => {
  const baseline = `export declare function foo(): void`;
  const superset = `
    export declare function foo(): void
    export declare function bar(): void
  `;
  assert.equal(coversBaseline(baseline, superset), true);
});
