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
| helpers/corestore | holepunchto/corestore @ v7.10.1 | 22/22 | 22 | ✅ |
| helpers/localdrive | holepunchto/localdrive @ v2.2.1 | 21/21 | 21 | ✅ |
| helpers/mirrordrive | holepunchto/mirror-drive @ v1.14.2 | 25/25¹ | 25 | ✅ |
| helpers/protomux | holepunchto/protomux @ v3.11.0 | 38/38² | 38 | ✅ |
| helpers/secretstream | holepunchto/hyperswarm-secret-stream @ v6.9.1 | 31/31 | 31 | ✅ |
| tools/drives | holepunchto/drives @ v3.1.0 | 3/3³ | 3 | ✅ |
| tools/hyperbeam | holepunchto/hyperbeam @ v3.1.0 | 1/1 | 1 | ✅ |
| tools/hypershell | holepunchto/hypershell @ v0.0.15 | 4/4 | 4 | ✅ |
| tools/hyperssh | holepunchto/hyperssh @ v5.0.4 (master) | 2/2 | 2 | ✅ |
| tools/hypertele | bitfinexcom/hypertele @ 0432686 (no tags) | 2/2 | 2 | ✅ |

**Totals:** 398 documented symbols, 398 confirmed present upstream, 398 tag-pinned
definition links. 0 `blob/main` links remain.

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
| configuration | (pear dependency) | deferred — see below | ⏳ |
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

### Deferred (with reason)

- **configuration.mdx** — the `pear.*` `package.json` keys are parsed in a pear dependency
  (not `holepunchto/pear` directly), so there is no single clean source file to link per
  key. Needs investigation of which package (`pear-api`?) owns config parsing.
- **api.mdx** — deprecated `Pear.app.*` property catalog; folded into the Phase 3
  deprecation/demotion work rather than deep-linking a page that is being demoted.

## Outstanding

- **configuration.mdx linking:** resolve the config-parsing package, then link keys.
- **Reverse-accuracy pass:** this log confirms no *documented* symbol is missing/renamed
  upstream. The inverse — are there *new* upstream APIs the docs omit? — still needs a
  per-repo README/changelog diff for the high-traffic blocks (hypercore, hyperdrive,
  autobase, corestore).
## Phase 3 — IA (reconciled with ADR 0001)

Mid-restructure, `.local/decisions/0001-adopt-diataxis-ia.md` (Accepted) was found to
**explicitly forbid the high-churn regroup**: §"Out of scope" keeps
`reference/{api,cli,configuration,runtime}` flat ("those four pages stay where they are;
no redirect needed"), and §1/§4 keep `modules.mdx` flat at the reference root. The
`pear/` + `modules/` subfolder move (≈180 internal links across ≈50 files) would violate
that decision, so it was **not done**.

ADR-compatible IA changes applied:

- **Orphans fixed** — `github-actions` and `pear-ci-action` were absent from
  `reference/index.mdx`. Added a **"CI & release"** index subsection grouping
  `desktop-release-npm-scripts`, `github-actions`, `pear-ci-action` (index-level grouping,
  no file moves — matches how the ADR groups via the index/sidebar).
- **api.mdx deprecation** — replaced the contradictory `## DEPRECATED` heading + `stable`
  badge with a top-of-page deprecation `Callout` pointing to `pear-runtime`; page stays
  put per ADR §"Out of scope".

## Outstanding

- **configuration.mdx linking:** resolve the config-parsing package, then link keys.
- **Reverse-accuracy pass:** this log confirms no *documented* symbol is missing/renamed
  upstream. The inverse — are there *new* upstream APIs the docs omit? — still needs a
  per-repo README/changelog diff for the high-traffic blocks (hypercore, hyperdrive,
  autobase, corestore).
- **Optional, needs ADR amendment:** the `pear/` + `modules/` regroup and any
  `pear-ci-action`→`github-actions` content merge. Only pursue if ADR 0001 is amended.
