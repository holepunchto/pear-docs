# Instance B — findings

Progress ledger for `instance-b.md`. Scheduled resume runs read the
"Progress / resume state" section first; keep it accurate.

## Progress / resume state

- **B1 (review 34 auto-transcribed describe maps):** DONE (2026-07-08). All 34 modules reviewed against upstream README + `api-model.json`, fixed in place or pruned. `npm run check:bare-refs` green (68 modules OK) after all edits. Verdicts below.
- **B2 (draft prose for no-prose modules):** DONE (2026-07-08). All 34 modules in TODO.md §"Modules with no author-written descriptions" drafted (list turned out to be 34, not 35 — `bare-mdns-discovery` was already counted in that 34, not additional). `bare-tui` remains blocked (no `.d.ts`) — deferred, not attempted. `npm run check:bare-refs` green (68 modules OK) after all drafts. `npm run emit:ts-doc -- --only <all 34>` run successfully — every module's local `chore/ts-doc` branch in `../ts-doc-upstream/<name>` now carries the spliced TSDoc + regenerated README `## API` (except `bare-inspector`, which emitted README only — 0 `.d.ts` files spliced, see notes below). Verified via `git -C ../ts-doc-upstream/<name> show` on samples and `git ls-remote --heads origin chore/ts-doc` (empty) on samples — nothing pushed. Verdicts below.
- **B3 (draft `.d.ts` for bare-dgram / bare-env / bare-stdio):** INVESTIGATED, no drafting needed (2026-07-08) — the premise is stale. See "B3 findings" below: all three modules already have complete, correct `.d.ts` in their upstream git repos; two of the three (`bare-env`, `bare-stdio`) already ship that `.d.ts` in their **currently published npm tarball**; only `bare-dgram`'s published tarball is missing it, and that's a stale-release problem, not a missing-declaration problem — the fix already exists in git, unpublished. Nothing to author, nothing committed to `../ts-doc-upstream` beyond the plain clones (kept as evidence). Flag for Instance A: `bare-dgram`/`bare-env`/`bare-stdio` may now be addable to the pipeline's module-selection list.
- **B4 (coverage-gap triage):** NOT STARTED, but see "Notes for B4" below — several real gaps surfaced incidentally during B1 and B2.

**Resume from B4 (coverage-gap triage).** Use TODO.md §"Coverage gaps" plus the "Notes for B4" section below, which already has ~10 real candidates pre-identified from B1/B2/B3 review (bare-assert, bare-encoding, bare-format, bare-ws, bare-zlib real `.d.ts` gaps; bare-tls/bare-structured-clone/bare-stream from B1; bare-process/bare-type extractor gaps to confirm with Instance A first) — start there instead of re-deriving from TODO.md's "N symbol(s) with no prose" counts from scratch. For each confirmed real gap, draft the missing declaration on the module's `chore/ts-doc` branch (same commit discipline as B2: `npm run emit:ts-doc` regenerates from layouts, but a pure `.d.ts` addition with no describe.json backing needs a manual edit + commit directly in `../ts-doc-upstream/<name>` on the existing `chore/ts-doc` branch — check it out, edit, commit "docs: add missing `.d.ts` declaration for <symbol>", never push). Also sample-verify the high "N symbols with no prose" counts (bare-fs 66→now lower after B1/B2, bare-prom-client 37) per instance-b.md's original instruction — confirm most are folded `*Sync`/option-interface members rather than authoring prose for every one.

**Process note for future dispatches:** in this run, when batch prompts explicitly said "do this yourself with Read/Edit, do NOT spawn a sub-agent" (used for all 6 B2 batches), zero agents self-delegated — a clean improvement over the earlier B1 dispatch (see incident note below) where 3 of 6 batches initially delegated before being redirected. Keep using that explicit instruction for future parallel batch dispatches.

## Reviewed (per-module verdicts — B1)

- **bare-addon-resolve** — clean; 0 fixes, 0 deleted; `resolve` entry verified verbatim against README and api-model.json.
- **bare-atomics** — 1 deleted (`Mutex` — dangling "Options include:" fragment; the upstream README itself truncates there, nothing recoverable); 0 fixes; `Mutex.from`/`handle`/`held` verified clean.
- **bare-bluetooth-android** — clean; 0 fixes, 0 deleted; all 50 entries checked against README headings + api-model.json kinds/params, backticked identifiers verified real.
- **bare-bluetooth-apple** — 1 fixed (`peer` paraphrase didn't match README; corrected to "The UUID of the remote peer, if available." to match README/embedded JSDoc verbatim); 0 deleted.
- **bare-broadcast-channel** — clean; 0 fixes, 0 deleted; all 6 entries verified verbatim.
- **bare-collabora** — clean; 0 fixes, 0 deleted; both entries (`Document`, `saveAs`) match README and signatures exactly.
- **bare-console** — clean; 0 fixes; all 11 entries verified verbatim against README + api-model.json.
- **bare-crypto** — clean; 0 fixes; all 20 entries verified (Hash/Hmac/Cipheriv/Decipheriv methods, random*, pbkdf2, keys, sign/verify, webcrypto); shared method names correctly reuse identical README prose across classes.
- **bare-fetch** — 3 fixed (dangling "See below." fragments with no target); `Request`/`Response`/`Headers` rewritten as grounded constructor one-liners from their `new X(...)` signatures; rest of 26 entries verified clean.
- **bare-file-logger** — 1 fixed (dangling "Options include:" fragment); `FileLog` rewritten from constructor signature `new FileLog(path, options?)`.
- **bare-fs** — 1 fixed (`constants` dangling "...Commonly used constants include:" fragment closed truthfully); remaining 86 entries verified clean against full README + api-model.json.
- **bare-ipc** — 1 fixed (dangling "The arguments are:" fragment); `IPCPort` rewritten to name real constructor params (`incoming`, `outgoing`); rest of 8 entries verified clean.
- **bare-make** — all 4 entries (`generate`, `build`, `install`, `test`) were unsalvageable dangling "Options include:" fragments with no recoverable prose; all deleted. File is now empty (no entries left).
- **bare-module** — 2 deleted (`host` — cross-module contamination copy-pasted from bare-pack's README, no matching export in bare-module; `Module.createRequire` — dangling "Options include:" fragment); remaining 14 entries verified clean.
- **bare-module-lexer** — 1 fixed (`lex` was a dangling fragment describing the `imports` shape, not the function itself; rewritten grounded in the signature).
- **bare-module-resolve** — clean; 0 fixes; the 1 entry (`resolve`) matches README verbatim, params correct.
- **bare-module-traverse** — 1 fixed (`traverse` prose named param `url` but the real parameter is `entry`) + 2 trimmed dangling "...accepts the following additional options:" clauses (`bare`, `node`); `default` verified clean.
- **bare-os** — 1 fixed (`constants` prose didn't match README at all; replaced with real README sentence) + 5 trimmed dangling "...the following properties:" clauses (`networkInterfaces`, `userInfo`, `groupInfo`, `resourceUsage`, `memoryUsage`, `cpus`); remaining ~30 entries verified clean.
- **bare-pack** — clean; 0 fixes; single entry (`pack`) verbatim accurate.
- **bare-pipe** — 1 fixed (`Pipe.constants` dangling-colon truncation).
- **bare-prom-client** — 1 deleted (`metrics` — not a real export key; the prose actually described `clear()`/`removeSingleMetric()`, real symbol is `Registry.metrics`); Counter/Gauge/Histogram/Summary verified clean.
- **bare-realm** — 1 deleted (`evaluate` — truncated "Options include:" fragment, nothing recoverable from README; was the only entry in the file).
- **bare-rpc** — 1 fixed (`RPC` constructor dangling sentence); no bogus `RPC.CommandRouter` key existed (only in `unmatchedHeadings` metadata, never written as a real entry); other 9 entries verified clean.
- **bare-semver** — 1 fixed (`constants` dangling-colon truncation) + 1 deleted (`errors` — fabricated `SemVerError` description with zero README backing); remaining 17 entries verified clean.
- **bare-sidecar** — clean; 0 fixes; all 4 entries verified.
- **bare-sqlite** — 1 fixed (`columns` dangling colon closed into a full stop); no bogus `for`/`binding` keys existed (only in `unmatchedHeadings`); remaining 19 entries verified clean.
- **bare-sqlite-vector** — clean; 0 fixes; single `register` entry verified verbatim.
- **bare-stream** — 9 dangling "Options include:" fragments fixed (`Readable`, `Readable.fromWeb`, `Readable.toWeb`, `Writable`, `Writable.fromWeb`, `Transform`, `Stream.finished`, `Stream.getStreamError`, plus one more); 2 deleted (`CountQueuingStrategy`, `ByteLengthQueuingStrategy` — fabricated, README shows only empty class stubs with zero prose); 3 flat keys rescoped to dotted form (`closed` → `Readable.closed` + `Writable.closed`, `write` → `Writable.write`, `end` → `Writable.end`) because the layout's key-then-name fallback was about to bleed incorrect Node-stream prose onto unrelated WHATWG web-stream symbols (`WritableStreamDefaultWriter.write`, `ReadableStreamDefaultReader.closed`, etc.) — see render.ts's `own()` lookup. `errored` left unscoped: its collision is factually harmless (identical correct semantics on both `Readable.errored`/`Writable.errored`).
- **bare-structured-clone** — 2 deleted (`Serializable`, `Transferable` — fabricated "two methods keyed by the symbols above" prose, README shows only empty class stubs); 1 fixed (`structuredClone` dangling colon trimmed); `constants` verified clean.
- **bare-subprocess** — clean; 0 fixes.
- **bare-tcp** — clean; 0 fixes; shared `ref`/`unref`/`close`/`listening` unprefixed keys confirmed non-colliding (README reuses identical prose for Socket vs Server).
- **bare-tls** — 2 fixed: deleted fabricated `close` entry (no corresponding `.d.ts` symbol — `TLSNetServer` has no `close` method, only a `close` event — **flag for B4 as a possible real gap or transcriber artifact**); renamed `connect` → `createConnection` to match the real export key and trimmed an unverifiable `'localhost'`-default claim not supported by README/signature.
- **bare-type-stripper** — 1 fixed (backticked param name `` `source` `` didn't match real signature parameter `input`; corrected).
- **bare-url** — 1 fixed: `toString`/`toJSON` prose was written only for `URL` (referencing `url.href`, not a real identifier for `URLSearchParams`); reworded to generic phrasing accurate for both `URL` and `URLSearchParams`. Dotted static-method keys (`URL.isURL`, `URL.parse`, `URL.canParse`, `URL.fileURLToPath`, `URL.pathToFileURL`, `URLSearchParams.isURLSearchParams`) verified to match api-model.json exactly.

**Dominant failure pattern across all 34 modules:** truncated "Options include:" / "...the following properties:" dangling clauses where the README continues into a table or code block that the transcriber cut off — not wrong-symbol grabs. Only `bare-module` (`host`) had a genuine cross-module copy-paste artifact. The TODO.md-flagged `for`/`await`/`module` transcriber-artifact headings never actually leaked into any describe.json as real keys — they only ever appeared in the informational `unmatchedHeadings` arrays of the sibling `describe.suggested.json` files.

## Drafted, needs user review (B2)

All 34 modules below had NO describe.json before this run (signatures-only pages) — every entry is newly authored, not transcribed, and needs human review before it's treated as ship-ready. Grounded in `api-model.json` + upstream source (`index.js`/`lib/*`) for every module; Node.js parity docs (nodejs.org) additionally cross-checked, only where the Bare source was independently confirmed to match, for: bare-assert, bare-buffer, bare-dns, bare-events, bare-http1, bare-https, bare-inspector, bare-path, bare-process, bare-readline, bare-timers, bare-tty, bare-zlib.

- **bare-abort** — 1/1 symbols described.
- **bare-abort-controller** — 12 described, 2 omitted (bare `typeof` constructor aliases with no independent meaning).
- **bare-ansi-escapes** — 55 described, 3 omitted (structural option/event interfaces already covered via member entries).
- **bare-assert** — 6 described, 0 omitted. **Flag:** the shipped `.d.ts` is stale vs `index.js` — missing `fail`/`notOk`, and doesn't expose `ok`/`equal`/`notEqual`/`strictEqual`/`notStrictEqual` the way the JS does, so `api-model.json` (and this describe map) covers less than the real module surface. Real upstream `.d.ts` gap — candidate for B4/upstream PR.
- **bare-buffer** — 98 entries for 99 model keys, 1 omitted (typeof alias). Note: the extractor itself flattens static `Buffer.compare(a,b)` and the instance `.compare()` method to the same key — the single description was written to be accurate for both.
- **bare-bundle** — 39 described, 5 omitted (option-bag interfaces described via individual properties, not as a container).
- **bare-bundle-id** — 1/1 symbols described.
- **bare-dns** — 8 described, 3 omitted (`dns` namespace root, `LookupOptions` container, and `LookupOptions.hints` — the last because `index.js`/`binding.c` never actually read that field, so its effect isn't verifiable).
- **bare-encoding** — 8 described, 0 omitted (scope limited to what `api-model.json` extracts; `TextEncoderStream`/`TextDecoderStream` are declared in the `.d.ts` but not extracted — same class of gap as bare-assert, candidate for B4).
- **bare-events** — 18 described, 6 omitted. **Flag (architectural, not just this module):** the flat describe.json format collides same-named static-namespace and instance-method keys (e.g. `EventEmitter.setMaxListeners`); in bare-events specifically the *instance* `setMaxListeners`/`getMaxListeners` behave materially differently from Node's (instance `setMaxListeners` is a no-op, `getMaxListeners` always returns the global default) so a single description couldn't honestly cover both meanings — omitted per "omit rather than mislead." Likely recurs elsewhere; would need per-signature keys or a render.ts resolution rule to fix properly (out of B's ownership — flag for Instance A / B4).
- **bare-format** — 1 described, 0 omitted (only the top-level `format` function is in `api-model.json`; `format.formatWithOptions`/`format.format` namespace members aren't extracted — same gap class as above).
- **bare-hrtime** — 1/1 symbols described.
- **bare-http1** — 83 described, 34 omitted (constructors covered at class level; interface/event fields folded into parent prose per repo convention).
- **bare-https** — 11 described, 2 omitted (constructors, covered at class level).
- **bare-inspect** — 3 described, 4 omitted (option fields folded into the `InspectOptions` class-level entry).
- **bare-inspector** — 19 described, 25 omitted (22 `Console.*` native passthroughs described at the class level rather than fabricating per-method behavior; 3 constructors folded into class entries). **Flag:** `emit:ts-doc` spliced 0 `.d.ts` files for this module (README `## API` was still regenerated) — the splicer couldn't attach TSDoc to any declaration site for this module's shape; needs investigation, likely a pipeline (Instance A) issue, not a content issue.
- **bare-logger** — 11 described, 3 omitted (2 constructors + 1 field folded into parent prose).
- **bare-mdns-discovery** — 18 described, 34 omitted (constructor + standard EventEmitter passthroughs + fields folded into parent prose, consistent with sibling conventions). Confirmed extractable post `def975c` (12 real exports, not stale/empty).
- **bare-net** — 40 described, 2 omitted (empty intersection option interfaces). Confirmed bare-net wraps `bare-tcp`/`bare-pipe` and dispatches on `path` vs `port`/`host` — it is NOT a mirror of Node's `net` (not in NODE_PARITY, correctly not cross-checked against Node docs).
- **bare-path** — 14/14 symbols described.
- **bare-posix** — 24/24 symbols described.
- **bare-process** — 13 described, 3 omitted (`idle`/`resume`/`suspend` forwarded from the `Bare` global with no discoverable trigger semantics anywhere in-repo). **Flag:** only `process` and `ProcessEvents` appear in `api-model.json` — the full `Process` interface (stdin/stdout/cwd/kill/etc.) isn't captured by the extractor at all, so most of the module's real surface has no page content regardless of prose. Real extractor/pipeline gap — flag for Instance A.
- **bare-querystring** — 4/4 symbols described.
- **bare-readline** — 22/22 symbols described.
- **bare-signals** — 14/14 symbols described.
- **bare-stow** — 53/53 symbols described (including the `bare-stow/protocol` and `bare-stow/host` subpath exports).
- **bare-string-decoder** — 4/4 symbols described. Not in NODE_PARITY despite the name resembling Node's `string_decoder` — correctly described from Bare's own source/tests only.
- **bare-system-logger** — 1/1 symbols described (the `.d.ts` declares `SystemLog` as an empty interface extending bare-logger's `Log` with zero own members in the model — only the class itself could be truthfully described).
- **bare-timers** — 18/18 symbols described. Note: `setTimeout`/`setInterval`/`setImmediate` keys collide between the top-level and `bare-timers/promises` subpath exports (same key/name, different signatures) — phrased generically enough to hold for both, following the precedent already used in `bare-fs.describe.json`.
- **bare-tty** — 15 described, 0 omitted (`isatty` is a runtime-only alias of `isTTY`, not a separate model key — correctly not duplicated).
- **bare-type** — 1 described, 3 omitted (the `is*()` predicate interface and `createTag`/`addTag`/`checkTag` namespace members exist in `index.d.ts` but the extractor doesn't surface them as model identities — verified empirically via `check.ts`, dropped as orphaned refs). Real extractor gap — flag for Instance A.
- **bare-vm** — 3/3 symbols described. Confirmed it wraps `bare-realm`.
- **bare-ws** — 48 described, 5 omitted (constructor overload nuance folded into one line; `UNEXPECTED_MASK` is thrown in `errors.js` but absent from `errors.d.ts` — real `.d.ts` gap, candidate for B4; plus type-alias/interface shells with no independent behavior).
- **bare-zlib** — 42 described, 12 omitted (8 `ZlibError.CODE()` static factories exist in `errors.js` but aren't typed in `errors.d.ts` — real `.d.ts` gap, candidate for B4; plus pure callback-type aliases). NODE_PARITY confirmed via WebFetch against nodejs.org/api/zlib.html.

## B3 findings — bare-dgram / bare-env / bare-stdio investigated, nothing drafted

`instance-b.md`'s premise ("these three ship no usable `.d.ts`") is stale as of this run. Cloned all three fresh from holepunchto into `../ts-doc-upstream/<name>` (they weren't cloned before) and checked both the git HEAD and the actual currently-published npm tarball (downloaded via `npm view <pkg> dist.tarball` + `tar -tzf`, not just `npm pack --dry-run` which reflects local git state):

- **bare-dgram** — git HEAD has a complete, correct `index.d.ts` (`Socket` class incl. all `send()`/`bind()` overloads, `RemoteInfo`, `createSocket`) that matches `index.js`'s actual exports. But the **published npm tarball for the current version (1.0.1)** does NOT include `index.d.ts` at all — confirmed by downloading and listing the real tarball contents. `package.json`'s `files` array has an odd `"./index.d.ts"` entry (leading `./`, unlike every sibling module's plain `"index.d.ts"`), but `npm pack --dry-run` at HEAD *does* include the file correctly, so the `./` prefix isn't actually the bug — the real issue is the **published 1.0.1 tarball predates the "Add TypeScript typings" commit** and was never re-published after. This is a stale-release problem: the fix already exists on the default branch, upstream just needs to cut a new npm version. Nothing for Instance B to author.
- **bare-env** — git HEAD's `index.d.ts` (`interface Env`, `declare const env: Env; export = env`) matches `index.js`'s dynamic `Proxy`-based implementation. The **published npm tarball (3.0.1) already includes `index.d.ts`** — confirmed by direct download. Nothing to draft; this module's typing gap is already resolved upstream.
- **bare-stdio** — git HEAD's `index.d.ts` (imports `bare-tty`/`bare-pipe`/`bare-fs` stream types, declares `IO` interface, `export = io`) matches `index.js`'s `IO` singleton. The **published npm tarball (1.0.3) already includes `index.d.ts`** — confirmed by direct download. Nothing to draft; this module's typing gap is also already resolved upstream.

**Anomaly worth flagging, not acted on:** `npm view bare-env time` / `npm view bare-stdio time` show their current versions (3.0.1 and 1.0.3 respectively) were published today, close to this session's working window — an unusual coincidence given both packages had gone months between prior releases. No tool available to either Instance A or B publishes to npm, and neither B1/B2/B3's work in this session touched anything outside `../ts-doc-upstream` clones and `scripts/bare-refgen/layouts/` (no npm credentials used, no `npm publish` run by any agent this session) — so this is very likely unrelated upstream maintainer activity, not caused by this task. Noting it rather than asserting a cause, since it's worth the user's awareness.

No `chore/add-types` branches were created — there is no declaration work to do. The three plain clones are kept in `../ts-doc-upstream/` as evidence for the next person/instance to add these modules to the pipeline's selection list (Instance A's `scripts/bare-refgen/config.ts`, not Instance B's territory).

## Upstream `.d.ts` gaps drafted (B4)

<!-- none formally drafted as declarations yet — B4 (declaration-writing workstream) not started. Real gaps have been *identified* during B1/B2 and are listed under "Notes for B4" below, ready for B4 to turn into actual .d.ts additions on chore/ts-doc branches. -->

### Notes for B4 (surfaced incidentally during B1/B2, not yet drafted as declarations)

- **bare-tls** — `TLSNetServer` has no `close()` method in the `.d.ts` (only a `close` event); README/transcription implied one. Needs confirmation against upstream source whether this is a genuine missing declaration or the README documents an event, not a method.
- **bare-structured-clone** — `Serializable`/`Transferable` classes are empty stubs in the `.d.ts` with zero members; per `instance-b.md`'s pre-identified gap list, the serialize/deserialize family is a known real upstream gap — confirmed again here from the description side.
- **bare-stream** — `CountQueuingStrategy`/`ByteLengthQueuingStrategy` are empty class stubs with zero prose in both README and `.d.ts` members; likely need upstream member declarations (`highWaterMark`, `size()`).
- **bare-assert** — `.d.ts` missing `fail`, `notOk`, and doesn't expose `ok`/`equal`/`notEqual`/`strictEqual`/`notStrictEqual` the way `index.js` does. Real upstream `.d.ts` gap.
- **bare-encoding** — `TextEncoderStream`/`TextDecoderStream` declared in `.d.ts` but not extracted by the pipeline into `api-model.json` — check whether this is an extractor gap (Instance A) or a genuinely malformed declaration (B4/upstream).
- **bare-format** — `format.formatWithOptions`/`format.format` namespace members declared but not extracted — same class of gap as bare-encoding.
- **bare-ws** — `UNEXPECTED_MASK` thrown in `errors.js` but absent from `errors.d.ts`.
- **bare-zlib** — 8 `ZlibError.CODE()` static factories exist in `errors.js` but aren't typed in `errors.d.ts`.
- **bare-process** — the extractor only captures `process`/`ProcessEvents` from `api-model.json`; the full `Process` interface (stdin/stdout/cwd/kill/etc.) isn't in the model at all. This is likely an **extractor bug** (Instance A's territory, not a `.d.ts` gap) — worth Instance A confirming before B4 tries to "fix" it as a declaration gap.
- **bare-type** — `is*()` predicate interface and `createTag`/`addTag`/`checkTag` namespace members exist in `.d.ts` but aren't extracted as model identities — likely the same extractor issue as bare-process, flag for Instance A first.
- **bare-events** — flat describe.json can't hold two true meanings for one colliding key (static vs. instance `setMaxListeners`/`getMaxListeners`/`on`/`once`). Not a `.d.ts` gap — a `render.ts`/layout-format limitation. Instance A's territory.

## Packaging bugs found

- **bare-dgram** — the currently-published npm tarball (1.0.1) is missing `index.d.ts` even though `package.json` declares `"types": "./index.d.ts"` and the file exists (and is correct) on the upstream git default branch. This is a stale release, not a malformed `files` field — upstream needs to cut a new version from current HEAD and publish. See "B3 findings" above for full verification detail.

## Emit-ts-doc anomalies (B2)

- **bare-inspector** — `npm run emit:ts-doc -- --only bare-inspector` reported "TSDoc in 0 file(s)" — only the README `## API` block was regenerated; no JSDoc was spliced into any `.d.ts` file despite 19 described symbols. Needs investigation (likely a declaration-matching edge case in `emit-jsdoc.ts` for this module's `.d.ts` shape) — out of Instance B's ownership (pipeline `.ts` file), flag for Instance A.

## Deferred / blocked

- **bare-tui** — ships no usable `.d.ts` (declares one it doesn't ship); deferred pending upstream types.

## Incident note (process, not content)

During this run, 3 of 6 parallel B1 batch agents (assigned bare-console/crypto/fetch/file-logger/fs/ipc; bare-sidecar/sqlite/sqlite-vector/stream/structured-clone; bare-subprocess/tcp/tls/type-stripper/url) initially responded by spawning their own background `Agent` sub-call instead of doing the Read/Edit work directly, then reported "done" prematurely. Each was redirected with an explicit "do it yourself, no delegation" message and then completed correctly. One of the redirected agents (the bare-subprocess/tcp/tls/type-stripper/url batch) briefly misread other batches' legitimate concurrent edits to sibling `describe.json` files as damage from a "rogue" agent and attempted `git checkout --` to revert them; the harness's destructive-action safety guard correctly blocked this, and no files were lost. All 34 modules' final on-disk state was independently re-verified (JSON validity, `check:bare-refs`) after the dust settled. Lesson for future dispatches: state explicitly in the prompt "do this yourself with Read/Edit, do not use the Agent tool" when parallelizing many small same-shaped reviews, to avoid this class of self-delegation.
