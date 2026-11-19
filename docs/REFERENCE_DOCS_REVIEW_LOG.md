# Reference docs review — log

Companion to [REFERENCE_DOCS_REVIEW_PLAN.md](./REFERENCE_DOCS_REVIEW_PLAN.md).
Records per-doc upstream alignment and the GitHub definition links.

- **Date:** 2026-06-08
- **Method:** clone each upstream repo at its release tag into `/tmp/pear-upstream`;
  `npm run add-api-github-links -- --write` resolves every documented symbol to its
  source definition (0 unmatched = every symbol maps to real upstream code);
  `npm run audit:reference-docs` checks structure + documented-symbol presence.
- **Pinning:** links target `blob/<tag>/…`; `hypertele` has no tags → commit SHA.

## Status — building blocks, helpers, tools (17 pages)

All 17 pass structural checks (frontmatter + no stubs). Every documented symbol
resolves to a definition at the pinned tag; the 8 audit "misses" were manually
confirmed present (see notes) — they are shallow-search artifacts, not drift.

| Doc | Repo @ pin | Symbols | Links | Status |
| --- | --- | --- | --- | --- |
| building-blocks/autobase | holepunchto/autobase @ v7.28.1 | 22/22 | 22 | ✅ |
| building-blocks/hyperbee | holepunchto/hyperbee @ v2.27.3 | 35/35 | 35 | ✅ |
| building-blocks/hypercore | holepunchto/hypercore @ v11.33.1 | 68/68 | 68 | ✅ |
| building-blocks/hyperdht | holepunchto/hyperdht @ v6.32.0 | 23/23 | 23 | ✅ |
| building-blocks/hyperdrive | holepunchto/hyperdrive @ v13.3.2 | 45/45 | 45 | ✅ |
| building-blocks/hyperswarm | holepunchto/hyperswarm @ v4.17.0 | 25/25 | 25 | ✅ |
| helpers/compact-encoding | holepunchto/compact-encoding @ v3.2.0 | 31/31 | 31 | ✅ |
| helpers/corestore | holepunchto/corestore @ v7.10.1 | 24/24 | 24 | ✅ (notifyGroup added, reverse pass) |
| helpers/localdrive | holepunchto/localdrive @ v2.2.1 | 21/21 | 21 | ✅ |
| helpers/mirrordrive | holepunchto/mirror-drive @ v1.14.2 | 25/25¹ | 25 | ✅ |
| helpers/protomux | holepunchto/protomux @ v3.11.0 | 38/38² | 38 | ✅ |
| helpers/secretstream | holepunchto/hyperswarm-secret-stream @ v6.9.1 | 31/31 | 31 | ✅ |
| tools/drives | holepunchto/drives @ v3.1.0 | 3/3³ | 3 | ✅ |
| tools/hyperbeam | holepunchto/hyperbeam @ v3.1.0 | 1/1 | 1 | ✅ |
| tools/hypershell | holepunchto/hypershell @ v0.0.15 | 4/4 | 4 | ✅ |
| tools/hyperssh | holepunchto/hyperssh @ v5.0.4 (master) | 2/2 | 2 | ✅ |
| tools/hypertele | bitfinexcom/hypertele @ 0432686 (no tags) | 2/2 | 2 | ✅ |

**Totals:** 400 documented symbols (398 original + 2 corestore `notifyGroup` headings added
by the reverse pass), all confirmed present upstream and tag-pinned. 0 `blob/main` links
remain. Plus 10 `configuration.mdx` field links (two repos) and 19 `cli.mdx` command links.

### Manually verified "misses" (audit false positives)

1. `mirrordrive` — `for await (const diff of mirror)` → `[Symbol.asyncIterator]()`, mirror-drive `index.js:109`.
2. `protomux` — `for (const channel of mux)` → `*[Symbol.iterator]()` `index.js:375`; `onopen/onclose/ondestroy/ondrain` channel callbacks → `index.js:21-40,146,211`.
3. `drives` — `drives mirror …` / `drives seed …` are `bin.js` subcommands (`bin.js:63-130`; impl in `lib/seed.js`, `lib/mirror.js`). Linked to `bin.js` (the command surface).

The audit's `searchUpstream` is word-boundary over the first ~80 files, so async-iterator
examples, callback-option signatures, and multi-word CLI subcommands read as "not found".

## Status — top-level docs

| Doc | Repo @ pin | Links | Status |
| --- | --- | --- | --- |
| cli | holepunchto/pear @ v2.6.5 | 19 command links (→ `cmd/<cmd>.js`; `build` → `cmd/index.js`) | ✅ (multisig added) |
| modules | individual `pear-*` repos | 36 module links, all resolve 200 | ✅ |
| bare-modules | holepunchto/bare + `bare-*` | 56 module links, all resolve 200 | ✅ |
| runtime | holepunchto/pear-runtime @ v1.1.4 | 3 symbol links (`Pear` ctor, `pear.run`, `pear.storage`) | ✅ |
| configuration | holepunchto/pear-state @ v1.1.0 + pear @ v2.6.5 | 10 field links (2 repos) | ✅ |
| api | (deprecated) | deferred — see below | ⏳ |

### Accuracy findings — cli.mdx (vs holepunchto/pear @ v2.6.5)

- **`pear multisig` was missing — now added.** It is a registered command
  (`cmd/multisig.js`, `cmd/index.js:151-295`) and is documented in the multisig how-tos,
  but cli.mdx had no section. Added a `## `pear multisig [command]`` section with the
  `keys get/list/add/remove`, `link`, `request`, `sign`, `verify`, `commit` subcommands.
- **`pear install` is intentional, not stale.** The section is marked *upcoming* and
  states it is not yet part of the CLI, pointing at the `pear-install` preview package —
  so the generator correctly leaves it unlinked (no source in `pear` yet). Kept as-is.
- `pear data`, `pear gc`, `pear sidecar` have upstream subcommands (`cmd/index.js:363-479`)
  not all enumerated in the doc — minor.

### Accuracy + linking — configuration.mdx (vs pear-state @ v1.1.0, pear @ v2.6.5)

Config keys are parsed across **two** repos: the `package.json` `pear` block is read by
`pear-state` (`index.js`); the `pear.stage.*` build options and `pear.assets` are consumed
by `pear`'s sidecar staging op. The generator now has a configuration pass (a per-field
code-search map, so line numbers self-heal on re-pin) linking **10 fields**:

- `pear-state @ v1.1.0`: `pear` block (`index.js:66`), `pear.name` (`:53`),
  `pear.stage.entrypoints` (`:83`), `pear.routes` (`:86`), `pear.unrouted` (`:87`),
  `pear.links` (`:80`).
- `pear @ v2.6.5`: `pear.stage.ignore` (`stage.js:71`), `pear.stage.include` (`stage.js:115`),
  `pear.stage.defer` (`stage.js:135`), `pear.assets` (`pod.js:650`).

Unlinked anchors are intentional: prose sections (`package-json`, `version`, `upgrade`) and
keys owned by UI-integration libraries (`pear.pre`, `pear.gui`, `pear.userAgent` — defined in
`pear-electron`, not core).

- 🔴 **`pear.stage.includes` → `pear.stage.include` (renamed; doc was stale).** Current `pear`
  (v2.6.5) reads **only** `state.options?.stage?.include` (singular) at `stage.js:115`; no
  plural `includes` is read anywhere in the repo, so the documented plural key was silently
  ignored. The build-distributables how-to already scopes `includes` to `pear` ≤ v2.2.15,
  confirming a rename. **Fixed:** renamed the heading/anchor to `pear.stage.include`, added a
  version note, and repointed the `prefetch` deprecation cross-reference.

### api.mdx — kept, deprecated entries now point forward

The page is **half-deprecated**: `## global.Pear` is superseded by `pear-runtime`, but
`## global.Bare` is **stable, current, and documented nowhere else** (the live Bare runtime
API — process control, lifecycle events, `Bare.Addon`, `Bare.Thread`). So the page is kept,
not deleted. Instead of source-linking a deprecated page, the deprecated `global.Pear`
entries now link to their replacements:

- Process methods → same-page Bare equivalents: `Pear.argv`→`Bare.argv`, `Pear.pid`→`Bare.pid`,
  `Pear.exitCode`→`Bare.exitCode`, `Pear.exit`→`Bare.exit`.
- `Pear.app` (and all `Pear.app.*`) → the [`pear-runtime`](/reference/pear/runtime) instance API
  (one parent pointer; `pear-runtime` exposes no per-property equivalents, so no false 1:1s).
- The remaining `Pear.*` methods already linked to their `pear-*` module replacements
  (`pear-restart`, `pear-messages`, `pear-electron ui.*`, etc.) — left as-is.
- Entries with no documented replacement (`Pear.teardown`, `Pear.checkpoint`, `Pear.versions`,
  `Pear.constructor.CUTOVER`/`IPC`) are left pointing only to the page-level banner.

## Reverse-accuracy pass — are there *new* upstream APIs the docs omit?

**Method:** diff each high-traffic building-block doc against its upstream README at the
pinned tag (the README is the canonical public surface). Compare both heading entries
**and** bullet entries (our docs document properties/events/sub-objects as bullets, e.g.
autobase `base.key`/`base.on(...)` and corestore handle methods), and skip structural
class-header labels (`AutoStore`, `AutobaseHostCalls`) whose real API is their sub-methods.

| Doc | README sigs | Doc coverage | Result |
| --- | --- | --- | --- |
| hypercore | 65 | complete | ✅ no omissions |
| hyperbee | 32 | complete | ✅ no omissions |
| hyperdrive | 45 | complete | ✅ no omissions |
| hyperswarm | 24 | complete | ✅ no omissions |
| hyperdht | 23 | complete | ✅ no omissions |
| autobase | 40 | complete | ✅ no omissions (properties + 9 events documented as bullets) |
| corestore | 17 | **gap found** | 🔧 fixed (see below) |

- 🔧 **corestore `notifyGroup` API was undocumented — now added.** corestore is pinned at
  v7.10.1, which ships an (experimental) group-notification API absent from the doc:
  `store.notifyGroup(topic)` (`index.js:306`) → a handle with `handle.updates([opts])`
  (`lib/notify.js:12`), `handle.destroy()` (`:20`), `handle.on('update')`, plus the
  `store.on('group-active', (topic) => {})` event (`index.js:298`). Added a *Group
  notifications (experimental)* section: `notifyGroup` + `group-active` as generator-linked
  `####` headings; the handle's sub-methods as bullets (deliberate — `handle.destroy()`
  collides with two earlier `destroy()` defs in `index.js`, so a `####` heading would
  mis-resolve; bullets are not touched by the generator).
- Note: the corestore README heading writes `handle.update(opts)` (singular) but the
  implemented method — and its own example — use `handle.updates()` (plural,
  `lib/notify.js:12`). The doc documents the working name, `updates`.

## Phase 3 — IA restructure (ADR 0001 amended)

ADR 0001 originally kept `reference/{api,cli,configuration,runtime}` and `modules.mdx`
flat. It was **amended (2026-06-08)** to nest reference pages by topic; the regroup was
then executed:

- **Topic subfolders.** Moved the 9 flat pages into `reference/pear/` (cli, runtime,
  configuration, api), `reference/modules/` (pear-modules ← modules, bare-modules), and
  `reference/ci-and-release/` (desktop-release-npm-scripts, github-actions, pear-ci-action).
- **184 internal links** rewritten across 40 content files. No redirects added for the
  moved pages (per decision) — legacy `/reference/{cli,api,…}` URLs are not preserved.
- **Nav** (`src/lib/custom-tree.ts`) regrouped under **Pear**, **CI & release**, **Modules**;
  `check-cross-links.ts` canonical slugs and the generator's `cliPath` updated.
- **api.mdx deprecation** — replaced the contradictory `## DEPRECATED` heading + `stable`
  badge with a top-of-page deprecation `Callout` pointing to `pear-runtime`.
- Verified: `npm run build` succeeds; internal-links, doctypes, cross-links, and
  types:check all pass.

## Outstanding

- **Reverse-accuracy pass** covered the 7 high-traffic building-blocks/helpers via README
  diff. Remaining repos (other helpers, tools, `pear-runtime`) not yet reverse-checked —
  forward linking confirms nothing *documented* is stale there, but a README diff could
  still surface *new* undocumented APIs if desired.

## Status — Bare reference modules (2026-06-23)

**Method:** a fan-out verification pass (one agent per page) diffed each Bare reference
doc against its upstream `holepunchto/bare-*` repo at the repo's **latest release tag**
(forward check on every documented signature/option/default + a lighter reverse check for
undocumented public APIs). Real affirmative-false-claim findings were re-verified directly
against source before fixing. **All 39 Bare docs are now checked** (across two runs);
the newly-added `bare/cli`, `bare/runtime`, `bare-kit`, `bare-url`, and `bare-stream` are
accurate (PASS / forward-check PASS), and `bare-union-bundle` had real default-value errors
(now fixed). The guide pass is partially complete (28/40) — see below.

**Runnable how-to code is independently verified:** `npm run test:examples` passes **6/6**
scenarios (hyperdht, hyperswarm, hypercore, corestore, hyperbee, hyperdrive) — real
`npm install` + live P2P execution against current upstream libs.

### Fixed — affirmative false claims (verified against source)

- 🔴 **`bare-sdl`** — doc documented two classes, **`Rect`** and **`Rect.F`**, that do not
  exist in the package (`index.js` exports only `constants, AudioDevice, Camera, AudioStream,
  Event, Poller, Renderer, Texture, Window`). It also gave `renderer.texture(texture[, src[,
  dst]])` and `texture.update(buffer, pitch[, rect])` optional rect args the source does not
  accept (`texture(texture)`; `update(buffer, pitch)` with `// TODO: expose SDL_Rect`).
  **Fixed:** removed the `Rect`/`Rect.F` bullets, corrected both signatures, and added the
  real but undocumented `Camera` / `AudioStream` exports. (`bare-sdl @ v1.0.0-5`)
- 🔴 **`bare-addon-resolve`** — listed `resolve.preresolved` as an exposed sub-generator, but
  it is **not exported** (it belongs to the `bare-module-resolve` dependency and is only
  called internally). **Fixed:** dropped `resolve.preresolved`, added the real
  `resolve.constants` export, and softened the "iOS and Android" linked-platform claim
  (source also handles darwin/linux/win32). (`bare-addon-resolve @ v1.10.0`)
- 🟠 **`bare-sqlite`** — the prepared-statement class was called `Statement` (heading + prose
  + frontmatter), but upstream exports it as **`StatementSync`** (`index.js:7`). **Fixed:**
  renamed to `StatementSync` throughout. (`bare-sqlite @ v0.1.4`)
- 🟠 **`bare-bluetooth-apple`** — presented `` `Constants` `` as a named export, but there is
  no `Constants` symbol; constants are static properties on `PeripheralManager` /
  `Characteristic` / related classes. **Fixed:** reworded. (`bare-bluetooth-apple @ v0.2.3`)
- 🔴 **`bare-union-bundle`** — three option defaults were wrong types: `add` `skipModules`
  and `load` `skipModules` were documented as arrays defaulting to `[]`, but are **booleans
  defaulting to `true`** (skip `node_modules` deps); `load` `cache` was `true`, but is the
  **module cache object, defaulting to `require.cache`**. **Fixed** all three.
  (`bare-union-bundle @ v1.1.1`, `index.js:57,93`)

### Fixed — guides

- 🔴 **`how-to/.../build-desktop-distributables`** — used `pear.stage.includes` (plural) in
  prose and the JSON example; the real key is **`pear.stage.include`** (singular) in *every*
  pear version (verified `include` at both v2.2.15 `stage.js:150` and v2.6.5 `stage.js:115`;
  no plural key exists). A plural block is silently ignored. **Fixed.**

### Accurate (PASS) — 21 docs

`bare-apk`, `bare-bluetooth-android`, `bare-broadcast-channel`, `bare-crypto`, `bare-fetch`,
`bare-form-data`, `bare-fs`, `bare-ipc`, `bare-mime`, `bare-module`, `bare-module-resolve`,
`bare-module-traverse`, `bare-os`, `bare-posix`, `bare-prom-client`, `bare-semver`,
`bare-sidecar`, `bare-structured-clone`, `bare-subprocess`, `bare-tcp` — all documented
signatures/options/defaults verified present and correct at the latest release tag.

### Documented omissions (not wrong, mirror upstream README; optional to add)

These docs are accurate for what they document but omit an option/export that exists in
source (and, in most cases, is likewise absent from the upstream README):
`bare-atomics` (`recursive` Mutex option) · `bare-channel` (`transfer` write option) ·
`bare-console` (`bare-console/global` subpath) · `bare-inspector` (`Server` export,
`onpaused` ctor arg, `post` callback arg) · `bare-make` (`stdio` option) ·
`bare-mdns-discovery` (`MDNS_ADDR`/`MDNS_PORT`, `query` default, `service` event shape) ·
`bare-pipe` (server options) · `bare-rpc` (`event()` fire-and-forget API — medium;
`valueEncoding` option) · `bare-tls` (Unix-socket `path` connect overload).

### Guides — complete (40/40 checked)

All 40 code-bearing guide docs were API-checked against upstream; 2 had drift (both fixed):

- 🔴 `build-desktop-distributables` — `pear.stage.includes` → `pear.stage.include` (**fixed**, above).
- 🟠 `migration.mdx` — (1) `global.Pear.run()` does not exist on the global Pear API; worker
  spawning is `Pear.worker.run(link, args)` (`pear-api @ v1.29.2 index.js:64-74`). (2) the
  `updating`/`updated` events fire on `pear.updater`, not the runtime instance
  (`pear-runtime @ v1.2.0`, README usage `pear.updater.on('updating'|'updated', …)`).
  **Fixed** both tables. (pear-runtime `run()` does exist, so that mapping was left as-is.)

The final 12 guides (`build-a-peer-to-peer-chat`, `reshape-into-a-production-app`, `ship`,
`update`, `start-from-hello-pear-bare`, `start-from-hello-pear-electron`,
`stream-stored-video-in-a-peer-to-peer-app`, and explanations
`availability-and-blind-peering`, `dependencies-and-network`, `from-logs-to-files`,
`storage-and-distribution`, `workers`) were verified directly in the main loop on a focused
checkable surface: **every `pear`/`bare` CLI command, `pear.*` config key, and `pear-runtime`
instance API** they use. Result: **no drift on API surface** (one external-link fix below).

- All `pear` subcommands used (`stage`, `build`, `seed`, `provision`, `touch`, `run`, `info`,
  `dump`, `multisig`) map to a real `cmd/*.js` in `holepunchto/pear @ v2.6.5`.
- `pear.run`, `pear.storage`, `pear.updater.on('updating'|'updated')`, and
  `pear.updater.applyUpdate()` match `pear-runtime @ v1.2.0` (`index.js` + README usage).
- Building-block API usage in these tutorials (Hyperswarm / Hypercore / corestore) is the
  same surface proven runnable by `test:examples` (6/6).

### Fixed — start-from-hello-pear-bare (external-link fix, 2026-06-24)

- 🔴 **`start-from-hello-pear-bare.mdx`** — the file table linked
  `https://github.com/holepunchto/hello-pear-bare/blob/main/bin.js` (404). The boilerplate
  renamed its entrypoint to **`bin.mjs`** (confirmed via `gh api
  repos/holepunchto/hello-pear-bare/contents/`; `package.json` `start` script and all
  `make:*` targets reference `bin.mjs`). **Fixed:** updated the GitHub link and its display
  text to `bin.mjs`, updated the `npm start` command description (`bare bin.js` →
  `bare bin.mjs`), and corrected all other prose/diagram references to the entrypoint
  filename (`bin.js` → `bin.mjs`) throughout the page. Local example file embeds
  (`examples/getting-started/hello-pear-bare/bin.js`) are a CJS adaptation kept as-is.

### Validation run (2026-06-24, completion pass)

- ✅ `check:internal-links` — 121 files, all internal links/assets valid.
- ✅ `check:cross-links` — complete; every page has ≥2 inbound links.
- ✅ `check:doctypes` — 121/121 declare the right docType.
- ✅ `audit:reference-docs` — 17/17 pages pass structural checks. (The "0/400 symbols
  matched" line is an artifact of verifying via `gh api` instead of local `UPSTREAM_ROOT`
  clones — the audit's text search has no local tree to match against; not real drift. The
  hyperssh/hypertele REVIEW notes are the known shallow-search false positives from round 1.)
- ✅ `check:redirects` — 80 redirects, all stubs and `_redirects` entries valid.
- ✅ `types:check` — MDX types generated; `tsc --noEmit` clean.
- ✅ `npm run build` — full static export succeeded: 121 pages, 80 redirect stubs, LLM `.md`
  files all written.
- ✅ `check:external-links` — all external links valid (fixed `bin.js` → `bin.mjs` above).

### Outstanding

- Optional: add the documented *omissions* listed earlier (mirror upstream READMEs; not wrong).
- Optional: machine-generate tag-pinned `Defined in:` source links for the 39 Bare pages
  (extend `scripts/add-api-github-links.ts` with a `bare-*` repo map — currently 0 such links).
