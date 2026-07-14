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
- ✅ **`Layout.returns` override added** (commit `692c4e6`). Bug: Bare's
  published `.d.ts` never carries a `@returns` JSDoc comment, so
  `e.returns.description` was always `null` and the renderer's `**Returns**`
  gate could never fire for ANY module — there was no layout-level override
  for it, unlike `describe`/`params`. Added `Layout.returns: Record<member,
  prose>`, wired into `render.ts`'s Returns gate (`returnsFor`) and
  `emit-jsdoc.ts`'s TSDoc splice (new `@returns` tag support). Also closed a
  pre-existing `check.ts` gap: layout sanity now validates `params`/`returns`
  keys against real symbols too (previously only `groups`/`describe`/`throws`
  were checked — a typo'd `params` key silently no-op'd). Per-module batches
  below should populate `layouts/<name>.ts` `returns` maps wherever
  README/source documents return-value semantics, instead of folding that
  prose into `describe`.

## Review protocol (per module, batched by npm downloads, highest first)

For each module: read `generated/bare-refs/<m>.mdx` + `api-model.json` +
`../ts-doc-upstream/<m>` (README, index.js/lib, chore/ts-doc branch JSDoc):

1. Human read-through: intro, descriptions, headings coherent; no truncated or
   context-free sentences.
2. Param-table Description/Default columns: populate from README/source via
   `layouts/<m>.ts` `params` maps (include "(default `x`)" in the description
   when the default lives only in prose/impl — `.d.ts` can't carry defaults).
3. Returns: populate `layouts/<m>.ts` `returns` map (member → prose) wherever
   README/source documents return-value semantics beyond the bare type —
   renders as a dedicated `**Returns**` line and emits `@returns` upstream.
4. Throws: `**Throws**` bullets where README/source documents error conditions
   (`layouts/<m>.ts` `throws` maps; `ERR_*` codes from lib/errors.js).
5. TSDoc branch: JSDoc syntactically valid, `@param`/`@returns` tags present
   for documented params/returns, prose natural; re-emit after layout changes.

Never fabricate: every added description must be grounded in README prose,
`.d.ts` naming/types, or implementation source in the upstream clone. If
nothing groundable exists for a param/return/throw, leave it undocumented and
note the gap in the findings log rather than inventing behavior.

Layout changes are per-module files (safe to parallelize across subagents).
Regeneration (`gen:bare-refs`, `check:bare-refs`, `test:bare-refs`, MDX
compile, `emit:ts-doc`) is run ONCE by the main loop after each batch
completes, to avoid concurrent-write races on shared output/cache files.

## Module checklist (✔ = reviewed + fixed; batch = agent batch)

Priority order = npm downloads, highest first (`downloads.json`), excluding
`bare-dgram`/`bare-tui` (no shipped `.d.ts`, not part of the 70 generated
pages).

- [ ] Batch 1: bare-events, bare-fs, bare-stream, bare-os, bare-path, bare-url, bare-module-resolve, bare-semver
- [ ] Batch 2: bare-addon-resolve, bare-type, bare-inspect, bare-ansi-escapes, bare-assert, bare-subprocess, bare-buffer, bare-pipe
- [ ] Batch 3: bare-tty, bare-signals, bare-process, bare-hrtime, bare-tls, bare-net, bare-tcp, bare-http1
- [ ] Batch 4: bare-crypto, bare-dns, bare-https, bare-env, bare-stdio, bare-abort, bare-module-lexer, bare-module
- [ ] Batch 5: bare-bundle, bare-inspector, bare-format, bare-ws, bare-encoding, bare-fetch, bare-zlib, bare-structured-clone
- [ ] Batch 6: bare-module-traverse, bare-posix, bare-abort-controller, bare-rpc, bare-pack, bare-logger, bare-make, bare-bundle-id
- [ ] Batch 7: bare-type-stripper, bare-readline, bare-console, bare-sidecar, bare-timers, bare-system-logger, bare-querystring, bare-sqlite
- [ ] Batch 8: bare-vm, bare-realm, bare-string-decoder, bare-sqlite-vector, bare-file-logger, bare-broadcast-channel, bare-ipc, bare-bluetooth-apple
- [ ] Batch 9: bare-bluetooth-android, bare-stow, bare-prom-client, bare-atomics, bare-mdns-discovery, bare-collabora

## Findings log

_(appended per batch)_

## Known pre-existing issue (not this review's scope, flagged for the user)

`content/reference/bare/modules/*.mdx` has a large amount of uncommitted
working-tree drift (many `M` + new `??` files, e.g. `bare-console.mdx` alone
is +164/-14 lines) that predates this session — confirmed `npm run
gen:bare-refs -- --top 80` (no `--write`) never touches `content/`, so this
wasn't caused by this review. Left untouched per the standing instruction not
to modify `content/reference/**`. Likely a previous session ran `--write` (or
the Loop A workflow locally) without committing the result. The user should
decide whether to commit, discard, or re-derive this drift.
