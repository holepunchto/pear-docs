# In-depth quality review — generated API pages + upstream TSDoc

_Status: IN PROGRESS (started 2026-07-13, session 7). Resumed by the
`review-bare-api-quality` scheduled task (8 PM + every 5h) until COMPLETE._

Criteria: pages read well for humans AND machines (consistent labeled
structure); tables used where possible; every callable documents types, params,
**throws**, and **returns** where the information exists in `.d.ts`/README/
source (never fabricated).

## Structural fixes applied (renderer — single-owner, done in main session)

- ✅ **Parameters now render as GFM tables** (`Parameter | Type | Default |
  Description`), pipe-escaped for union types, `?` marks optionals, cross-links
  preserved. Applied to both the MDX pages and the README emit target
  (shared renderer). Committed; all gates green.
- ✅ **`emit-jsdoc.ts` now splices TSDoc onto class/interface members** (commit
  `a2c5ffc`). Bug: `injectJsDoc`'s `walk()` only recursed into `namespace`
  bodies, never into `interface`/`class` member lists — so every instance
  method declared via Bare's `interface Foo {}` + `declare class Foo {}` merge
  pattern (EventEmitter, Buffer, streams, …) silently dropped its
  describe/params JSDoc even though `layouts/<name>.describe.json` had the
  entry. Also deduped: a merged interface/class/namespace sharing one describe
  key no longer gets the same comment stamped 3×. Re-ran `npm run emit:ts-doc`
  for all 69 modules to regenerate `chore/ts-doc` with the fix (local commits
  only). Verified with `tsc --noEmit` on a sample of the touched `.d.ts` files
  (bare-buffer, bare-crypto, bare-stream, bare-bluetooth-android, bare-sqlite)
  — all parse clean. This is the single highest-impact fix for Surface 2 (the
  upstream TSDoc branches) found so far — every per-module TSDoc review below
  should be read against the POST-fix branch state.

## Review protocol (per module, batched by npm downloads, highest first)

For each module: read `generated/bare-refs/<m>.mdx` + `api-model.json` +
`../ts-doc-upstream/<m>` (README, index.js/lib, chore/ts-doc branch JSDoc):

1. Human read-through: intro, descriptions, headings coherent; no truncated or
   context-free sentences.
2. Param-table Description/Default columns: populate from README/source via
   `layouts/<m>.ts` `params` maps (include "(default `x`)" in the description
   when the default lives only in prose/impl — `.d.ts` can't carry defaults).
3. Returns: `**Returns**` line present where `@returns`-worthy prose exists in
   README/source; add via describe (member prose) only if verifiable.
4. Throws: `**Throws**` bullets where README/source documents error conditions
   (`layouts/<m>.ts` `throws` maps; `ERR_*` codes from lib/errors.js).
5. TSDoc branch: JSDoc syntactically valid, `@param` tags present for
   documented params, prose natural; re-emit after layout changes.

## Module checklist (✔ = reviewed + fixed; batch = agent batch)

_Populated by the fan-out review below / subsequent scheduled runs._

## Findings log

_(appended per batch)_
