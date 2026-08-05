# Test plan — Bare module reference docs (execute before cutover)

Acceptance test plan for the generated `bare-*` reference pages
(`generated/bare-refs/*.mdx`). **Effort is prioritised by npm downloads** — the
top 6 modules account for ~100M+ downloads/mo each and get a deep review; the
long tail gets progressively lighter spot-checks.

Branch: `feat/bare-docs`. Nothing here pushes anything. Pages live in
`generated/bare-refs/` (preview); the live `content/reference/bare/modules/`
pages are only touched by an explicit, separate cutover.

---

## How to use this plan

Work top to bottom. Phase A is automated (fast, run first). Phase B is the
manual content review, split into three tiers by download rank. Phases C–E are
cross-cutting. Record pass/fail in the tracking table at the end. A module
"passes" only when its Phase-B checklist and any flagged special-attention item
are clear.

Legend for the tracking table: **D** = deep review, **S** = standard, **s** =
spot-check.

---

## Phase A — Automated gates (run first; ~5–10 min)

Run from repo root. All must be green before manual review starts.

```sh
# 1. Regenerate the full set from the published .d.ts (network; ~3–5 min)
npm run gen:bare-refs -- --top 80
#    EXPECT: "Wrote 70/72 pages"; skipped = bare-dgram, bare-tui (see Phase D).

# 2. Coverage + layout-key sanity + MDX compile for every page
npm run check:bare-refs
#    EXPECT: "70 modules OK — coverage, layout, and MDX all pass."

# 3. Extractor archetype fixtures
npm run test:bare-refs
#    EXPECT: all tests pass (named / export= merge / sibling promotion /
#    ambient declare-module / thin class).

# 4. Type-check the tooling
npx tsc --noEmit -p tsconfig.json 2>&1 | grep bare-refgen || echo "tooling tsc clean"

# 5. Regenerate the review TODO and read it
npm run bare-refs:todo && cat generated/bare-refs/TODO.md
```

**A-PASS criteria:** steps 1–4 green; TODO.md contains no surprises beyond the
known items (2 no-prose = bare-env/bare-stdio; the flat-key limitation).

---

## Phase B — Per-module content review (prioritised by downloads)

For each module open `generated/bare-refs/<name>.mdx` alongside its extracted
model `generated/bare-refs/<name>/api-model.json`, its upstream source
`../ts-doc-upstream/<name>/` (README.md + index.js/lib), and — for the
descriptions — `scripts/bare-refgen/layouts/<name>.describe.json`.

### The per-module checklist (apply at the tier's depth)

1. **Frontmatter** — `title`, one-sentence `description`, `docType: reference`,
   `schemaType: APIReference`. Stability `<mark>` badge present and correct.
2. **Intro** — package name links to the repo; native/min-Bare facts correct;
   `npm i <name>` present; Node-parity link present iff the module mirrors a
   Node core module (see the N column).
3. **Coverage** — every public export in `api-model.json` appears on the page;
   nothing invented that isn't in the types. (Phase A step 2 already asserts
   this mechanically — here you're eyeballing that the grouping reads sensibly.)
4. **Signatures** — headings match the real `.d.ts` signatures (params,
   optionality, return types). Overloads and `*Sync` folding read correctly.
5. **Descriptions** — each describe entry actually describes THAT symbol
   (watch for prose copied from an adjacent heading), is factually true against
   source, and has no code-fragment/junk/half-sentence.
6. **Params / returns / throws** — bullet lists correct; types cross-link to
   on-page anchors where the type is documented.
7. **Source links** — the `<sub>[Source](…blob/vX.Y.Z/…#Lnn)>` link points at
   the right symbol (sampled; full resolution automated in Phase C).
8. **Subpaths** — `## bare-x/y` sections present and correct for modules with
   subpath exports (subs column > 0).

### Tier 1 — DEEP review (top 6 by downloads, ~100M+/mo each)

Full checklist, every symbol. These carry the overwhelming majority of traffic.

| # | Module | Downloads/mo | Special attention |
|---|--------|-------------:|-------------------|
| 1 | bare-events | 148M | `export =` + ambient merge; EventEmitter static vs instance methods (`EventEmitter.on` vs `on`) must be distinct. |
| 2 | **bare-fs** | 127M | Largest page (111 exports, 78 descriptions). **Blocked by the OOM issue — see Phase C-2 before any cutover.** Flat-key collision: `path`/`type`/`blocks` prose is correct for the primary class but is shared with StatFs/streams (Phase D). |
| 3 | bare-stream | 125M | Sibling-class promotion (Readable/Writable/Duplex/Transform) + `bare-stream/web` subpath. Verify `Writable.closed` etc. read correctly. |
| 4 | bare-os | 116M | Clean transcribed README; verify `EOL`/`devNull` platform literals render correctly (no over-escaping). |
| 5 | bare-url | 109M | `export =` class + `URL.parse`/`canParse` statics qualified; `bare-url/global` subpath. |
| 6 | bare-path | 114M | Node-parity; no describe from README (drafted) — verify each against Node `path` semantics. |

### Tier 2 — STANDARD review (ranks 7–29, ~180K–1.4M/mo)

Checklist items 1–5 fully; 6–8 spot-checked. Flag anything, don't exhaustively
trace every param.

Ranks 7–29: bare-module-resolve, bare-addon-resolve, bare-semver, bare-type,
bare-inspect, bare-ansi-escapes, bare-assert, bare-subprocess, bare-buffer,
bare-pipe, bare-tty, bare-signals, bare-process, bare-hrtime, bare-tls,
bare-net, bare-tcp, bare-http1, bare-crypto, bare-dns, bare-https, bare-env,
bare-stdio.

Special attention in this tier:
- **bare-buffer** (#15) — 1 export but **98 describe entries** (mostly subpath
  members); confirm that's real, not runaway.
- **bare-crypto** (#25) — known flat-key collision `update`/`final` (Hash vs
  Cipheriv/Decipheriv) that a flat map can't express; verify the prose is at
  least correct for the Hash case and note the Cipher case (Phase D).
- **bare-tcp / bare-net / bare-tls / bare-http1** — server/socket prose is NOT
  in the `.d.ts` JSDoc; confirm a sampling against `index.js` defaults.
- **bare-env / bare-stdio** (#28/29) — newly generating, **0 describe entries**
  (signatures-only). Expected; confirm the pages still read cleanly.
- **bare-module-resolve / bare-addon-resolve** — README has `for await` example
  headings; confirm they did NOT leak in as symbols.

### Tier 3 — SPOT-CHECK (ranks 30–70, <180K/mo)

Checklist items 1–3 only, in batches. Open the page, confirm it renders, badge +
intro + API section present, no obviously-wrong or junk descriptions. Deep-dive
only if something looks off.

Ranks 30–70: bare-abort, bare-module-lexer, bare-module, bare-bundle,
bare-inspector, bare-format, bare-ws, bare-encoding, bare-fetch,
bare-structured-clone, bare-zlib, bare-module-traverse, bare-abort-controller,
bare-rpc, bare-pack, bare-logger, bare-bundle-id, bare-make, bare-type-stripper,
bare-readline, bare-console, bare-sidecar, bare-timers, bare-system-logger,
bare-sqlite, bare-vm, bare-realm, bare-querystring, bare-posix,
bare-sqlite-vector, bare-string-decoder, bare-file-logger, bare-broadcast-channel,
bare-ipc, bare-stow, bare-bluetooth-android, bare-prom-client,
bare-bluetooth-apple, bare-atomics, bare-mdns-discovery, bare-collabora.

Special attention in this tier:
- **bare-rpc** (#43) / **bare-ipc** (#63) — qualified-key splits fixing
  **inverted incoming/outgoing semantics**; verify each qualified entry reads
  correctly for its class.
- **bare-prom-client** (#66) — 41 exports but only 4 describe entries; large
  coverage gap by design (flag if fuller coverage is wanted).
- **bare-make / bare-realm** — empty describe maps despite real symbols;
  signatures-only. Decide whether that's acceptable to ship.
- **bare-mdns-discovery** (#69) — the ambient `declare module` fix; confirm all
  12 exports render (regression guard for the extractor bug).

---

## Phase C — In-site rendering (Fumadocs dev server)

Phase A only proves the pages *compile* as MDX; this proves they *render* in the
real site (badge, `<sub>` source links, code blocks, TOC anchors, cross-links).

### C-1 — Render a representative sample

```sh
# Copy a few pages into content/ temporarily (pick per tier):
cp generated/bare-refs/bare-events.mdx  content/reference/bare/modules/
cp generated/bare-refs/bare-url.mdx     content/reference/bare/modules/
cp generated/bare-refs/bare-rpc.mdx     content/reference/bare/modules/
npm run dev    # then open http://localhost:3000/reference/bare/modules/<name>
```
Check on each: stability badge, intro links, `<sub>Source</sub>` links styled
and clickable, code blocks highlighted, right-hand TOC populated, in-page type
cross-links jump correctly, subpath sections present.

**Restore content/ afterwards** (critical — some copies are untracked):
```sh
git checkout -- content/reference/bare/modules/   # reverts tracked overwrites
git status --short -- content/                    # then `rm` any leftover ?? files
```

### C-2 — bare-fs OOM gate (KNOWN BLOCKER — do this deliberately)

`bare-fs` (78 code-fenced blocks) OOMs the build via the processed-markdown /
copy-as-markdown path (`getText('processed')`, called per-page at static build).
Root cause + recommended fix are in `findings-a.md`. To confirm status:

```sh
cp generated/bare-refs/bare-fs.mdx content/reference/bare/modules/
NODE_OPTIONS="--max-old-space-size=8192" npm run dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/reference/bare/modules/bare-fs/
# EXPECT today: heap OOM in the dev-server log (page never 200s). This is the
# blocker; bare-fs must NOT be cut over until the site-infra fix lands.
git checkout -- content/reference/bare/modules/bare-fs.mdx
```

---

## Phase D — Known-issue verification (targeted)

- **Skipped modules** — confirm `generated/bare-refs/` has NO `bare-dgram.mdx`
  or `bare-tui.mdx`, and both are listed in `_skipped.json`. bare-dgram = stale
  upstream release (types exist in git, unpublished); bare-tui = body-less
  ambient declaration (no API). Neither is a bug.
- **Flat-key collisions** — for bare-crypto (`update`/`final`), bare-fs
  (`path`/`type`/`blocks`): confirm the rendered prose is correct for the
  primary symbol and note where a same-named sibling gets slightly-off text.
  This is a documented limitation, not a blocker — decide if acceptable.
- **Source-link resolution (sampled)** — verify pinned GitHub links 200:
  ```sh
  for m in bare-events bare-fs bare-os bare-url bare-stream bare-tcp; do
    grep -oE 'https://github.com/[^)]+#L[0-9]+' generated/bare-refs/$m.mdx | head -2
  done   # then open/curl a handful; expect HTTP 200
  ```

---

## Phase E — Cutover readiness

- **Hand-written vs generated** — 30 modules have an existing hand-written page
  that the generated one would replace (hand-written = Y column). For at least
  the Tier-1/2 ones (bare-fs, bare-stream, bare-os, bare-url, bare-tls, bare-tcp,
  bare-crypto, bare-subprocess, bare-module, bare-semver, …) open the current
  `content/reference/bare/modules/<name>.mdx` beside the generated page and
  confirm the generated version is at least as complete/accurate. Note any
  curated prose worth preserving via the manifest `intro`/`seeAlso`.
- **Catalog / index** — per `cutover.md`: 38 pages are NEW; confirm
  bare-bundle-id + bare-collabora catalog rows land in a sensible section, and
  that new pages get links in `content/reference/index.mdx`.
- **Cutover doc** — re-read `docs/plans/bare-refs/cutover.md`; confirm the
  page mapping (30 replaced / 38 new / 6 kept / skipped) still matches reality.

---

## Sign-off tracking table

Tier: **D** deep, **S** standard, **s** spot. Mark P(ass)/F(ail)/N(ote).

| Rank | Module | DL/mo | Tier | Phase B | Phase C | Notes |
|-----:|--------|------:|:----:|:-------:|:-------:|-------|
| 1 | bare-events | 148M | D | | | |
| 2 | bare-fs | 127M | D | | | OOM-blocked (C-2) |
| 3 | bare-stream | 125M | D | | | |
| 4 | bare-os | 116M | D | | | |
| 5 | bare-path | 114M | D | | | |
| 6 | bare-url | 109M | D | | | |
| 7 | bare-module-resolve | 1.35M | S | | | for-await headings |
| 8 | bare-addon-resolve | 1.30M | S | | | |
| 9 | bare-semver | 1.21M | S | | | |
| 10 | bare-type | 398K | S | | | |
| 11 | bare-inspect | 378K | S | | | |
| 12 | bare-ansi-escapes | 376K | S | | | |
| 13 | bare-assert | 355K | S | | | |
| 14 | bare-subprocess | 288K | S | | | |
| 15 | bare-buffer | 248K | S | | | 98 describe / 1 export |
| 16 | bare-pipe | 241K | S | | | |
| 17 | bare-tty | 221K | S | | | |
| 18 | bare-signals | 219K | S | | | |
| 19 | bare-process | 216K | S | | | |
| 20 | bare-hrtime | 213K | S | | | |
| 21 | bare-tls | 204K | S | | | socket prose vs index.js |
| 22 | bare-net | 200K | S | | | |
| 23 | bare-tcp | 199K | S | | | |
| 24 | bare-http1 | 198K | S | | | |
| 25 | bare-crypto | 198K | S | | | flat-key update/final (D) |
| 26 | bare-dns | 194K | S | | | |
| 27 | bare-https | 193K | S | | | |
| 28 | bare-env | 192K | S | | | 0 describe (new) |
| 29 | bare-stdio | 183K | S | | | 0 describe (new) |
| 30–70 | (long tail) | <182K | s | | | batch spot-check per Tier 3 |

For the full ranked long-tail list and their special-attention notes, see
Tier 3 above.

**Overall sign-off:** all Tier-1 modules P; no F in Tier 2; Tier-3 spot-checks
surface no systemic issue; Phase A green; Phase C-1 renders clean; bare-fs OOM
(C-2) resolved or explicitly deferred; Phase E cutover mapping confirmed.
