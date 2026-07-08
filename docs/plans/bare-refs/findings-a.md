# Instance A — findings & progress log

_Last updated: 2026-07-08 (session 2). Next scheduled resume continues at A5
(final sweep), after the dev-server crash below is triaged._

## Workstream status

- **A0 baseline** ✅ committed `5c26a74` on `feat/bare-docs` (local; nothing pushed).
- **A1 ambient declare-module fix** ✅ committed. `extract.ts` falls back to the
  ambient `declare module '<name>'` symbol; bare-mdns-discovery now yields 12
  exports; bare-tui (body-less shorthand declaration = no API) is correctly
  skipped with stale output removed; `check.ts` fails on 0-export models; new
  fixture + test (5 tests pass). Bare set is now **68 pages, all gates green**.
- **A2 pear unification** ✅ committed. Pipeline is family-aware
  (`--family bare|pear` / `REFGEN_FAMILY`; per-family out dir, layouts dir,
  version+downloads caches, catalog, See-also). New scripts: `gen:pear-refs`,
  `check:pear-refs`, `pear-refs:todo`. Candidates derive from the catalog table
  when a family has no research dossier. **KEY FINDING: all 36 pear-\* packages
  ship NO `.d.ts` whatsoever** (no `types` field, no `exports` map, no
  declaration files — verified against published tarballs for pear-pipe,
  pear-updates, pear-ipc and recorded for all 36 in
  `generated/pear-refs/_skipped.json` + `TODO.md`). Pear pages are blocked on
  upstream types; the machinery is ready the moment declarations ship.
  Stability verified from BOTH catalogs: everything `stable` except
  `pear-gunk: unstable` (seeded in config); the TODO now flags only
  uncataloged modules (bare-bundle-id, bare-collabora).
- **A3 in-site Fumadocs verification** ⚠️ DONE, with one **critical blocking
  finding**. Details below — see "Dev-server crash on bare-fs".
- **A4 cutover prep** ✅ `docs/plans/bare-refs/cutover.md` written: 30 replaced /
  38 new (2 need catalog rows) / 6 hand-written kept / 3 typeless.
  `syncCatalog` (scripts/bare-refgen/index.ts) now has **add-row support**:
  when `--write` runs for a module with no existing catalog row at all, it
  inserts a 2-column row under `## Other utilities` (description sourced from
  the module's `package.json`, never fabricated) and records the name in
  `generated/<family>-refs/_catalog-added.json`; `todo.ts` surfaces those under
  a new "Catalog rows auto-added — verify section placement" section so a
  human relocates them. Verified in isolation against a scratch copy of
  `bare-modules.mdx` (bare-bundle-id + bare-collabora inserted correctly, no
  duplicate rows for already-cataloged modules like bare-fs or
  bare-module-resolve — the latter lives in a 2-column table that the old
  4-column-only cell-count gate silently skipped; fixed as part of this
  change, see below). Not yet exercised via a real `--write` (that stays
  un-executed per the "prepare, don't flip" mandate).
- **A5 final sweep** ⬜ blocked on the dev-server crash triage below (or a
  documented decision to proceed without it). Once unblocked: full regen
  `--top 80`, all gates both families, both TODOs, final commit.

## Dev-server crash on bare-fs (new — needs the user / further triage)

While doing A3's in-site verification (copy 3 generated pages into
`content/reference/bare/modules/`, render via `next dev`), **bare-fs.mdx
(2057 lines, the largest generated page) crashes the dev server with a V8
`JavaScript heap out of memory` fatal error** inside `JsonParser::MakeString`
— i.e. something in the render path does a `JSON.parse`/stringify of an
enormous string when rendering this specific page. Reproduced twice
independently (once via the preview harness, once via a bare `next dev` +
`curl`), both times heap growth ran into the tens of GB before the process
aborted.

- **Isolated to bare-fs specifically**, not page size in general:
  bare-events.mdx (512 lines) and bare-prom-client.mdx (1196 lines) — also
  freshly generated, also copied into `content/` for the same test — render
  correctly (200 OK, verified via `preview_snapshot`/`preview_inspect`: `<mark>`
  badge, TOC anchors, `<sub>` Source links, Parameters lists all present and
  correct). Only bare-fs, the biggest file (~1.7x prom-client's heading count),
  triggers the crash — the scaling looks super-linear (quadratic/exponential),
  not a simple size ceiling.
- **Not caught by existing gates**: `npm run check:bare-refs` (plain
  `@mdx-js/mdx` compile) passes for bare-fs with 0 issues — the crash only
  happens in the site's actual Fumadocs/Next.js render path (`source.config.ts`:
  `postprocess.includeProcessedMarkdown`, `rehypeCodeOptions` w/ shiki
  transformers, `remarkMdxMermaid`, `remark-code-import`, `lastModified`'s
  per-page `git log` shellout), none of which the compile gate exercises. This
  is a real gap in the validation story: a page can pass every automated gate
  and still take the dev server down.
- **Not root-caused.** I started a bisection (binary-search the file to find
  the minimal reproducer) but stopped after the harness's destructive-action
  guard correctly flagged in-place truncation of a git-tracked content file as
  requiring explicit user sign-off — reasonable, since it's real content, not
  scratch. I did not attempt to route around it. The right way to continue
  this safely: copy bare-fs.mdx to a scratch path, bisect there, and only ever
  swap the *scratch* copy into `content/` for each trial (never edit the
  tracked file's content in place while testing).
- **content/ was left pristine either way** — the crash happened before I'd
  drawn any conclusions worth keeping mid-content, so both mutated files were
  `git checkout --`'d and the untracked bare-events.mdx copy deleted
  immediately after the render checks above. `next-env.d.ts` (dev-server
  churn, unrelated) was also reverted.
- **Source links unaffected by the crash**: sampled 6 pinned GitHub blob URLs
  across bare-fs/bare-events/bare-prom-client (2 each, first/last in file) —
  all 6 resolve 200.
- **Recommended next step for whoever picks this up**: reproduce in a
  disposable worktree, bisect bare-fs.mdx content there (not the real tracked
  file), and narrow to whether it's `includeProcessedMarkdown`, a shiki
  transformer, or something structural in the MDX (e.g., a heading/anchor
  collision pattern) before the cutover in `cutover.md` can be considered safe
  to execute — cutover would put this exact content at
  `content/reference/bare/modules/bare-fs.mdx` in production.

## Small infra fix (adjacent, needed to land A4's work)

`.gitignore`'s `todo.*` line (unanchored) was silently matching
`scripts/bare-refgen/todo.ts` at any depth, so that real source file — the
`bare-refs:todo` / `pear-refs:todo` script — was **never committed** to git
despite existing on disk and being referenced by `package.json`. Anchored it
to the repo root (`/todo.*`) so it only matches a root-level scratch file (the
original apparent intent) and staged `todo.ts` for the first time. Also
staged `generated/bare-refs/TODO.md` / `generated/pear-refs/TODO.md`, which
were likewise never committed (not gitignored — just never added since the
baseline commit predates `todo.ts` producing them).

## Needs the user (not Instance A)

- **Triage the bare-fs dev-server OOM crash above before approving any part of
  `cutover.md`** — this is the most important open item.
- Approve/execute `cutover.md` (staging choice, catalog placement for
  bare-bundle-id/bare-collabora — `syncCatalog` now handles the mechanics, a
  human still calls the actual section).
- Everything in `generated/bare-refs/TODO.md` §no-prose/§review — Instance B's
  stream + user review.
- Upstream: pear-* needs `.d.ts` shipped before pear pages can exist.

## Constraints honored

Nothing pushed anywhere; all commits local on `feat/bare-docs`. No writes
outside Instance A's ownership (layouts/ and ../ts-doc-upstream untouched —
confirmed Instance B is concurrently active in `scripts/bare-refgen/layouts/`
this session; left its in-progress `.describe.json` files alone).
