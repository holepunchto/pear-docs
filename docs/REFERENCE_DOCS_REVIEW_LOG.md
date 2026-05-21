# Reference docs accuracy review (PR #287)

Branch: `feat/document-helper-tools-and-building-blocks`  
Review date: 2026-05-18  
Upstream scratch: `/tmp/pear-upstream`

## Summary

| Phase | Result |
|-------|--------|
| 0 — Automated baseline | Pass (links, build, redirects, types) |
| 1 — Structural (17 pages) | 17/17 pass |
| 2 — Building blocks API | 223/223 symbols matched upstream text search |
| 3 — Helpers API | 167/167 symbols matched (8 audit false negatives manually confirmed) |
| 4 — Tools CLI | Flags verified against upstream `bin.js` / `--help` |
| 5 — Cross-doc | How-to/explanation links use canonical `/reference/...` paths |
| 6 — Blocking fixes | None required |

**Quickstart verified:** Hypercore quickstart runs verbatim on Node 22+ (`npm i hypercore`).

## Automated checks

```
npx tsx scripts/check-internal-links.ts  # pass
npx tsx scripts/check-redirects.ts       # pass (after build)
SKIP_OG_BUILD=1 npm run build            # pass
SKIP_OG_BUILD=1 npm run types:check      # pass
npm run audit:reference-docs             # 390/398 symbol search; 17/17 structural
```

**Pre-existing failures (out of scope for this PR):**

- `npm run check:doctypes` — `deployment`, `faq`, `migration`, `recommended-practices`, `troubleshooting` under `content/reference/` have `docType` mismatches vs path.
- `npx tsx scripts/check-cross-links.ts` — five hard orphans under `/reference/` (same pages as above).

## Per-page results

### Building blocks

| Page | Symbols | Structural | Notes |
|------|---------|------------|-------|
| hypercore | 68/68 | PASS | Quickstart verified; `core.sweep({ batchSize })` matches upstream |
| hyperbee | 35/35 | PASS | |
| hyperdrive | 45/45 | PASS | |
| autobase | 22/22 | PASS | |
| hyperdht | 23/23 | PASS | |
| hyperswarm | 25/25 | PASS | |

### Helpers

| Page | Symbols | Structural | Notes |
|------|---------|------------|-------|
| corestore | 22/22 | PASS | `store.get` / `valueEncoding` align with hypercore docs |
| localdrive | 21/21 | PASS | |
| mirrordrive | 25/25 | PASS | npm package `mirror-drive`; async-iter example valid in upstream tests |
| protomux | 38/38 | PASS | `onopen`/`onclose`/`ondrain` callbacks confirmed in upstream tests |
| secretstream | 31/31 | PASS | npm `@hyperswarm/secret-stream` |
| compact-encoding | 31/31 | PASS | |

### Tools

| Page | CLI check | Notes |
|------|-----------|-------|
| drives | PASS | `touch`, `mirror`, `seed` match upstream `bin.js --help`; `--bootstrap` test-only (correctly omitted) |
| hypershell | PASS | Bins: `hypershell-keygen`, `hypershell-server`, `hypershell-copy`, `hypershell` |
| hypertele | PASS | Upstream: `bitfinexcom/hypertele` |
| hyperbeam | PASS | |
| hyperssh | PASS | |

## Audit script false negatives (non-blocking)

Text search could not match these headings; manual verification confirms they are accurate:

- `for await (const diff of mirror)` — mirror-drive tests
- Protomux channel callbacks — protomux/test.js
- `drives mirror <src> <dst>` / `drives seed [key]` — drives/bin.js + tests

## Hardening added on branch

- `npm run audit:reference-docs` — `scripts/audit-reference-docs.ts`

## Upstream repo map (for future audits)

| Doc slug | Clone directory |
|----------|-----------------|
| mirrordrive | `mirror-drive` |
| secretstream | `hyperswarm-secret-stream` |
| hypertele | `hypertele` (bitfinexcom) |
