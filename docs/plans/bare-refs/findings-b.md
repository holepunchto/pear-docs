# Instance B — findings

Progress ledger for `instance-b.md`. Scheduled resume runs read the
"Progress / resume state" section first; keep it accurate.

## Progress / resume state

- **B1 (review 34 auto-transcribed describe maps):** DONE (2026-07-08). All 34 modules reviewed against upstream README + `api-model.json`, fixed in place or pruned. `npm run check:bare-refs` green (68 modules OK) after all edits. Verdicts below.
- **B2 (draft prose for no-prose modules):** NOT STARTED. 35 modules (TODO.md §"Modules with no author-written descriptions", now includes `bare-mdns-discovery` since Instance A's extractor fix `def975c` made it extractable — 12 exports). `bare-tui` remains blocked (no `.d.ts`) — defer.
- **B3 (draft `.d.ts` for bare-dgram / bare-env / bare-stdio):** NOT STARTED. These three are NOT cloned in `../ts-doc-upstream` yet — clone from upstream (holepunchto) first, then branch `chore/add-types` locally. Never push.
- **B4 (coverage-gap triage):** NOT STARTED, but see "Notes for B4" below — a few real gaps surfaced incidentally during B1 review.

**Resume from B2.** Start with the 35-module list in TODO.md §"Modules with no author-written descriptions" (batch ~5-6 modules per agent, ≤6 concurrent agents). When dispatching parallel agents, be explicit that each agent must do the work itself with its own Read/Edit tools and must NOT spawn further nested agents — this run repeatedly saw agents delegate a self-contained review task to a background `Agent` call instead of executing it, which duplicated work and briefly triggered a false "rogue agent editing out-of-scope files" alarm (see incident note below). No actual damage occurred (the destructive revert attempt was correctly blocked), but it wasted a full round-trip per affected batch.

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

<!-- one line per module whose describe map was authored (not transcribed) -->

## Upstream `.d.ts` gaps drafted (B4)

<!-- none drafted yet — B4 not started -->

### Notes for B4 (surfaced incidentally during B1, not yet drafted)

- **bare-tls** — `TLSNetServer` has no `close()` method in the `.d.ts` (only a `close` event); README/transcription implied one. Needs confirmation against upstream source whether this is a genuine missing declaration or the README documents an event, not a method.
- **bare-structured-clone** — `Serializable`/`Transferable` classes are empty stubs in the `.d.ts` with zero members; per `instance-b.md`'s pre-identified gap list, the serialize/deserialize family is a known real upstream gap — confirmed again here from the description side.
- **bare-stream** — `CountQueuingStrategy`/`ByteLengthQueuingStrategy` are empty class stubs with zero prose in both README and `.d.ts` members; likely need upstream member declarations (`highWaterMark`, `size()`).

## Packaging bugs found

<!-- none yet — B3 not started; bare-stdio's `types: ./index.d.ts` non-shipping issue is expected to surface there -->

## Deferred / blocked

- **bare-tui** — ships no usable `.d.ts` (declares one it doesn't ship); deferred pending upstream types.

## Incident note (process, not content)

During this run, 3 of 6 parallel B1 batch agents (assigned bare-console/crypto/fetch/file-logger/fs/ipc; bare-sidecar/sqlite/sqlite-vector/stream/structured-clone; bare-subprocess/tcp/tls/type-stripper/url) initially responded by spawning their own background `Agent` sub-call instead of doing the Read/Edit work directly, then reported "done" prematurely. Each was redirected with an explicit "do it yourself, no delegation" message and then completed correctly. One of the redirected agents (the bare-subprocess/tcp/tls/type-stripper/url batch) briefly misread other batches' legitimate concurrent edits to sibling `describe.json` files as damage from a "rogue" agent and attempted `git checkout --` to revert them; the harness's destructive-action safety guard correctly blocked this, and no files were lost. All 34 modules' final on-disk state was independently re-verified (JSON validity, `check:bare-refs`) after the dust settled. Lesson for future dispatches: state explicitly in the prompt "do this yourself with Read/Edit, do not use the Agent tool" when parallelizing many small same-shaped reviews, to avoid this class of self-delegation.
