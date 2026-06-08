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

## Outstanding

- **Top-level docs not yet linked** (different shapes; Phase 1 remainder):
  `cli` (→ holepunchto/pear @ v2.6.5), `runtime` (→ pear-runtime @ v1.1.4),
  `api` (deprecated), `configuration` (pear `package.json` keys),
  `modules` (`pear-*` catalog), `bare-modules` (holepunchto/bare @ v1.28.6 + `bare-*`).
- **Reverse-accuracy pass:** this log confirms no *documented* symbol is missing/renamed
  upstream. The inverse — are there *new* upstream APIs the docs omit? — still needs a
  per-repo README/changelog diff for the high-traffic blocks (hypercore, hyperdrive,
  autobase, corestore).
- **IA restructure (Phase 3):** orphaned `github-actions`/`pear-ci-action`, CI-doc
  consolidation, `api.mdx` deprecation, and the `pear/` + `modules/` regroup — pending.
