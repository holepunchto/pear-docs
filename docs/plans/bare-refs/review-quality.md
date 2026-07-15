# In-depth quality review — generated API pages + upstream TSDoc

_Status: **COMPLETE** (started 2026-07-13; finished 2026-07-15). Run by the
`review-bare-api-quality` scheduled task across several session-limited runs.
**This scheduled task can now be disabled.**_

## Final summary (2026-07-15)

All **70 generated pages** and **69 upstream TSDoc branches** reviewed against
the criteria and fixed. Verified end state:

- **Coverage detector**: 65/70 modules carry a `layouts/<m>.ts` manifest with
  `params`/`returns`/`throws`; the other 5 (`bare-abort`, `bare-env`,
  `bare-process`, `bare-stdio`, `bare-system-logger`) have **zero callables
  with parameters** in their model (verified) so those maps don't apply —
  their `describe` coverage was read through and is sound.
- **Result**: 39 pages now carry at least one `**Returns**` line, 34 carry a
  `**Throws**` section — both impossible before this review (see the two
  structural fixes below).
- **Gates green**: `check:bare-refs` 70/70 OK · `test:bare-refs` 5/5 ·
  70/70 MDX compile with `@mdx-js/mdx`.
- **Surface 2 (TSDoc branches)**: `emit:ts-doc` re-run for all 69 modules
  against the final layouts; **153 spliced `.d.ts` files across all branches
  parse clean under `tsc --noEmit`**; member-level TSDoc (methods, not just
  containers) confirmed present on the merge-pattern modules the earlier bug
  silently skipped (bare-sqlite, bare-rpc, bare-buffer, streams, …). Nothing
  was ever pushed.

Two systemic pipeline bugs found and fixed during the review (both would have
capped the quality of every module):
1. `emit-jsdoc.ts` only spliced TSDoc onto top-level + namespace declarations,
   never `interface`/`class` **members** — so instance methods (the bulk of
   the stateful API) got no `@param`/description. Fixed in `a2c5ffc`.
2. There was no `Layout.returns` override, and Bare `.d.ts` carry no `@returns`
   JSDoc, so **no module could ever render a Returns line**. Added in
   `692c4e6` (+ `check.ts` now validates `params`/`returns` keys).

Genuinely needs the user (nothing blocking this task's completion):
- **Uncommitted `content/reference/bare/modules/*.mdx` drift** predating this
  review (see "Known pre-existing issue" at the end). Out of scope here
  (`content/reference/**` is a user-approved staged cutover, bare-fs stays
  hand-written); the user should decide whether to commit, discard, or
  re-derive it.
- **Spawned side task**: `gen:bare-refs --only X` overwrites
  `generated/bare-refs/_skipped.json` with only the current run's skips
  (wiping `bare-dgram`/`bare-tui`). Flagged as a background task chip; worked
  around by hand during this review. Not urgent.
- Upstream TSDoc PRs are **committed locally only, never pushed** — opening
  them upstream (Loop B, `emit:ts-doc -- --pr`) remains a deliberate manual
  step for the user.

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

## ACTUAL COVERAGE (source of truth — supersedes the batch checklist below)

Ground truth = a module has a `layouts/<m>.ts` manifest carrying
`params`/`returns`/`throws` (detector, not batch labels, since session-limited
runs committed partial batches). As of 2026-07-14 session 9:

**REVIEWED (37):** the 16 from batches 1+2 plus the batch 3–5 modules committed
in `af8e46c`. Verify against the detector: `for m in $(ls generated/bare-refs/*.mdx|xargs -n1 basename|sed s/.mdx//); do grep -lqE 'params:|returns:|throws:' scripts/bare-refgen/layouts/$m.ts 2>/dev/null && echo "$m ✓"; done`

**REMAINING — 28 with callable params (real work), highest downloads first:**
bare-module, bare-structured-clone, bare-module-traverse, bare-posix,
bare-abort-controller, bare-rpc, bare-logger, bare-pack, bare-bundle-id,
bare-make, bare-type-stripper, bare-readline, bare-console, bare-timers,
bare-sidecar, bare-vm, bare-sqlite, bare-realm, bare-string-decoder,
bare-sqlite-vector, bare-file-logger, bare-bluetooth-apple,
bare-bluetooth-android, bare-stow, bare-prom-client, bare-atomics,
bare-mdns-discovery, bare-collabora.

**REMAINING — 5 with no callable params (light read-through of describe only):**
bare-process, bare-env, bare-stdio, bare-abort, bare-system-logger.

## Module checklist (batch-based — STALE, kept for history)

Priority order = npm downloads, highest first (`downloads.json`), excluding
`bare-dgram`/`bare-tui` (no shipped `.d.ts`, not part of the 70 generated
pages).

- [x] Batch 1: bare-events, bare-fs, bare-stream, bare-os, bare-path, bare-url, bare-module-resolve, bare-semver
- [x] Batch 2: bare-addon-resolve, bare-type, bare-inspect, bare-ansi-escapes, bare-assert, bare-subprocess, bare-buffer, bare-pipe
- [ ] Batch 3: bare-tty, bare-signals, bare-process, bare-hrtime, bare-tls, bare-net, bare-tcp, bare-http1
- [ ] Batch 4: bare-crypto, bare-dns, bare-https, bare-env, bare-stdio, bare-abort, bare-module-lexer, bare-module
- [ ] Batch 5: bare-bundle, bare-inspector, bare-format, bare-ws, bare-encoding, bare-fetch, bare-zlib, bare-structured-clone
- [ ] Batch 6: bare-module-traverse, bare-posix, bare-abort-controller, bare-rpc, bare-pack, bare-logger, bare-make, bare-bundle-id
- [ ] Batch 7: bare-type-stripper, bare-readline, bare-console, bare-sidecar, bare-timers, bare-system-logger, bare-querystring, bare-sqlite
- [ ] Batch 8: bare-vm, bare-realm, bare-string-decoder, bare-sqlite-vector, bare-file-logger, bare-broadcast-channel, bare-ipc, bare-bluetooth-apple
- [ ] Batch 9: bare-bluetooth-android, bare-stow, bare-prom-client, bare-atomics, bare-mdns-discovery, bare-collabora

## Findings log

### Batches 1 + 2 (2026-07-14, session 8) — 16 modules reviewed + fixed

Executed by parallel subagents (cut short by a session limit, but nearly all
edits landed on disk; bare-pipe finished by the main loop). Layout files
created: bare-events, bare-stream, bare-buffer, bare-url, bare-semver,
bare-module-resolve, bare-addon-resolve, bare-type, bare-inspect,
bare-ansi-escapes, bare-assert, bare-subprocess, bare-pipe (13 new `.ts`
manifests). Extended: bare-fs.ts (+109 lines incl. first `returns`/expanded
`params`+`throws`), bare-os.ts (+42), bare-path.ts (+49). describe.json fixes:
bare-fs (+14 entries: Dir/Watcher members, options interfaces with defaults),
bare-semver (Comparator/Range.toString, Range.test; de-duplicated throws prose
out of `Version.parse` describe), bare-url (isURLSearchParams static; moved
throws/returns prose out of describe into structured maps).

Key per-module notes:
- **bare-events**: model quirk — static utils (on/once/listenerCount/
  getMaxListeners/setMaxListeners) share their model `key` with same-named
  instance methods; overrides keyed qualified hit BOTH twins. Documented in
  the manifest header; facts added only where true for both (or keyed bare for
  instance-only). Verified `getMaxListeners()` returns `defaultMaxListeners`
  (index.js:173) and web.js `dispatchEvent` returns `!(state & CANCELED)`.
- **bare-fs**: options-interface describes now carry defaults (mode `0o777`,
  watch `persistent: true`, opendir `bufferSize: 32`, stream flags/mode) —
  grounded in README + lib source.
- **bare-url**: URLError codes (INVALID_URL, INVALID_URL_SCHEME,
  INVALID_FILE_URL_HOST, INVALID_FILE_URL_PATH) verified in lib/errors.js +
  index.js throw sites; fileURLToPath conditions per-platform.
- **bare-pipe** (main loop): constructor/server option defaults from README
  `options = {…}` blocks; PIPE_ALREADY_CONNECTED / INVALID_IPC_TARGET /
  SERVER_ALREADY_LISTENING / SERVER_IS_CLOSED verified at index.js throw
  sites; `accept` returns `target`.
- **Style rule established**: `returns` prose must NOT start with "Returns" —
  the renderer already prefixes `**Returns** <type> — ` and the emitter
  prefixes `@returns`; normalized 12 entries across bare-events/os/path/pipe/
  url.
- **bare-fetch, bare-module-traverse**: upstream releases picked up in regen
  (v3.0.1→v3.0.2 etc.) — model+page diffs are version bumps, not review edits.
- Pipeline nit (spawned as separate task): `gen:bare-refs --only X` rewrites
  `generated/bare-refs/_skipped.json` with only the current run's skips,
  wiping bare-dgram/bare-tui — reverted by hand this run.

Gates after batch: check 70/70 OK, tests 5/5, MDX compile 70/70, emit:ts-doc
re-run for all 16 reviewed modules + tsc --noEmit clean on every touched
`.d.ts` across them.

## Known pre-existing issue (not this review's scope, flagged for the user)

`content/reference/bare/modules/*.mdx` has a large amount of uncommitted
working-tree drift (many `M` + new `??` files, e.g. `bare-console.mdx` alone
is +164/-14 lines) that predates this session — confirmed `npm run
gen:bare-refs -- --top 80` (no `--write`) never touches `content/`, so this
wasn't caused by this review. Left untouched per the standing instruction not
to modify `content/reference/**`. Likely a previous session ran `--write` (or
the Loop A workflow locally) without committing the result. The user should
decide whether to commit, discard, or re-derive this drift.
