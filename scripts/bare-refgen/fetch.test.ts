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

test('coversBaseline: rejects extra runtime symbols the published package lacks', () => {
  const baseline = `export declare function foo(): void`;
  const superset = `
    export declare function foo(): void
    export declare function bar(): void
  `;
  assert.equal(coversBaseline(baseline, superset), false);
});

test('coversBaseline: rejects API removed upstream after the branch was cut (bare-type 1.1.1)', () => {
  const baseline = `
    declare function type(value: unknown): Type
    export = type
  `;
  const stale = `
    declare function type(value: unknown): Type
    declare namespace type {
      export function addTag(object: object, tag: Uint32Array): void
    }
    export = type
  `;
  assert.equal(coversBaseline(baseline, stale), false);
});

test('coversBaseline: rejects unreleased classes from main (bare-encoding TextEncoderStream)', () => {
  const baseline = `export class TextEncoder {}`;
  const ahead = `
    export class TextEncoder {}
    export class TextEncoderStream {}
  `;
  assert.equal(coversBaseline(baseline, ahead), false);
});

test('coversBaseline: allows naming a previously inline type (bare-vm RunOptions)', () => {
  const baseline = `
    export function runInNewContext(code: string, opts?: { filename?: string; offset?: number }): unknown
  `;
  const named = `
    interface RunOptions {
      filename?: string
      offset?: number
    }
    export function runInNewContext(code: string, options?: RunOptions): unknown
  `;
  assert.equal(coversBaseline(baseline, named), true);
});

test('coversBaseline: allows typing API the published runtime already implements (bare-crypto subtle)', () => {
  const baseline = `export function randomBytes(size: number): Buffer`;
  const typed = `
    export function randomBytes(size: number): Buffer
    interface SubtleCrypto {
      digest(algorithm: string, data: Buffer): Promise<ArrayBuffer>
    }
    export const subtle: SubtleCrypto
  `;
  const runtime = `exports.subtle = { digest(algorithm, data) {} }`;
  assert.equal(coversBaseline(baseline, typed, runtime), true);
  assert.equal(coversBaseline(baseline, typed), false);
});
