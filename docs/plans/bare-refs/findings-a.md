# Instance A — findings & progress log

_Last updated: 2026-07-02 (session 1). Next scheduled resume continues at A3._

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
- **A3 in-site Fumadocs verification** ⬜ NOT STARTED — next up. Steps in
  `instance-a.md` §A3: copy 3 representative pages (bare-fs, bare-events,
  bare-prom-client) into `content/reference/bare/modules/`, `preview_start` the
  `dev` script (create `.claude/launch.json`), verify badge/`<sub>` source
  links/params/anchors/subpath sections, screenshot, then restore content/
  (`git checkout -- <replaced>` AND `rm` the untracked new copies —
  bare-events/bare-prom-client have no committed page). Then curl 5 pinned
  source links (expect 200) and write side-by-side notes here.
- **A4 cutover prep** ✅ `docs/plans/bare-refs/cutover.md` written: 30 replaced /
  38 new (2 need catalog rows) / 6 hand-written kept / 3 typeless. Remaining
  sub-item: extend `syncCatalog` (scripts/bare-refgen/index.ts) with add-row
  support for modules missing from the catalog — small, do alongside A3/A5.
- **A5 final sweep** ⬜ after A3: full regen `--top 80`, all gates both
  families, both TODOs, update this file, final commit.

## Needs the user (not Instance A)

- Approve/execute `cutover.md` (staging choice, catalog placement for
  bare-bundle-id/bare-collabora).
- Everything in `generated/bare-refs/TODO.md` §no-prose/§review — Instance B's
  stream + user review.
- Upstream: pear-* needs `.d.ts` shipped before pear pages can exist.

## Constraints honored

Nothing pushed anywhere; all commits local on `feat/bare-docs`. No writes
outside Instance A's ownership (layouts/ and ../ts-doc-upstream untouched).
