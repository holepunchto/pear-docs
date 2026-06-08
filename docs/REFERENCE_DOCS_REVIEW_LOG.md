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

### Deferred (with reason)

- **api.mdx** — deprecated `Pear.app.*` property catalog; folded into the Phase 3
  deprecation/demotion work rather than deep-linking a page that is being demoted.

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

- **api.mdx** — deep-linking deferred (deprecated page, demoted in Phase 3).
- **Reverse-accuracy pass** covered the 7 high-traffic building-blocks/helpers via README
  diff. Remaining repos (other helpers, tools, `pear-runtime`) not yet reverse-checked —
  forward linking confirms nothing *documented* is stale there, but a README diff could
  still surface *new* undocumented APIs if desired.
