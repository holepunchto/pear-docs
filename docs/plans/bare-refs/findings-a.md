# Instance A — findings & progress log

_Last updated: 2026-07-08 (session 4). Bare-fs OOM is ROOT-CAUSED (see below) —
it's a site-infra issue in the processed-markdown/shiki path, awaiting an owner
decision. A5 (final sweep) can otherwise proceed; cutover of bare-fs stays gated._

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
## ROOT CAUSE (session 4, 2026-07-08) — CONFIRMED

The OOM is **not** bare-fs-specific content and **not** a bare-refgen bug. It is
in the site's processed-markdown / "copy page as markdown" path, and heap use
scales **super-linearly with the number of fenced code blocks on a page**.

Chain of evidence (all at the calibrated `CAP=8192`, prom-client control OK /
full bare-fs OOM baseline):

1. **It's the `includeProcessedMarkdown` path.** Toggling
   `source.config.ts` → `postprocess.includeProcessedMarkdown: false` makes full
   bare-fs render with **no OOM** (it 500s only because `src/lib/source.ts`
   `getLLMText` then throws "requires includeProcessedMarkdown", as designed).
   Config was reverted to `true` immediately after the probe.
2. **Every page build hits it.** `src/app/(docs)/[[...slug]]/page.tsx:27` calls
   `getLLMText(page)` → `page.data.getText('processed')` unconditionally to fill
   the CopyPageButton `fallbackMarkdown`. The route is `force-static`, so this
   runs for **every page at `next build`** — production build blocker, not just
   dev.
3. **The sink is fenced code blocks.** bare-fs with all ` ```…``` ` bodies
   stripped → **OK**. A size-matched copy of the *known-good* control
   (prom-client body duplicated to ~2350 lines, ~104 fences) → **OOM**. So it's
   not size per se and not unique to bare-fs — it's fence count. bare-fs has
   **78 fenced blocks** (every interface/type/class shape + overload block +
   Usage); prom-client has 52 (passes), the doubled control ~104 (fails).
4. **Not plain serialization.** A standalone `remark().use(remarkMdx)`
   parse→stringify of the full bare-fs body (incl. all code blocks) completes in
   46ms / 56KB out at a 3GB cap. So `mdast-util-to-markdown` is cheap; the heap
   blowup comes from a code-block-specific transform in fumadocs' processed
   pipeline (shiki/`rehypeCodeOptions` is the only code-block-heavy step my
   standalone repro lacked).

**Conclusion:** fumadocs re-runs shiki highlighting (or retains the full
hast+mdast per block) when materializing `getText('processed')`, and cost grows
super-linearly in fence count. Any code-block-dense page eventually exceeds the
build heap; generated API pages are inherently fence-dense.

## RECOMMENDATION (site-infra decision — needs the user / docs-site owner)

Not something Instance A should silently change (touches `source.config.ts` /
`src/lib/source.ts` / build infra — the owner's architectural call). Options,
best first:

1. **Don't highlight in the LLM/markdown path.** `getText('processed')` feeds a
   *copy-as-markdown* button and llms.txt — it should return plain markdown with
   un-highlighted fences. Check for a fumadocs option to get raw processed
   markdown without `rehypeCodeOptions`, or derive the copy text from the raw
   source file (`page.path`) instead of the processed tree. This removes shiki
   from the path entirely and is the robust fix.
2. **Precompute/cache once at collection build**, not per-page-render.
3. **Upgrade fumadocs** — check the changelog for a processed-markdown/shiki
   memory fix (fumadocs-mdx 14.x → latest).
4. **Interim only:** raise build `NODE_OPTIONS=--max-old-space-size` — fragile,
   super-linear scaling defeats it as more code-dense pages land.

**Cutover gate:** `cutover.md` stays blocked until the site owner picks a fix —
`--write` would place bare-fs (78 fences) at
`content/reference/bare/modules/bare-fs.mdx` and break `next build`. Everything
else in the generated set is safe; bare-fs is the only page over the current
threshold, but the doubled-control result means the margin is thin for any
future large module.

Harness to reproduce (rebuild if scratch reaped): a heap-capped `next dev`
(`NODE_OPTIONS=--max-old-space-size=8192`), copy the variant over
`content/reference/bare/modules/bare-fs.mdx`, curl the **trailing-slash** route,
detect the `heap out of memory` marker in the server log (the npm wrapper
survives the worker crash). Always `git checkout --` the content file after.

---

## Superseded: session-3 triage (kept for history)

- **Session-3 triage (2026-07-08) — calibrated bisection, partial localization.**
  Method: scratch variants of bare-fs.mdx copied over the route, fresh
  heap-capped `next dev` per trial, crash detected via the OOM marker in the
  server log (the npm wrapper survives the worker crash — don't trust `kill -0`;
  and curl the **trailing-slash** URL, the bare route 308s without compiling).
  Two critical calibration findings:
  1. **Caps below ~8GB produce threshold artifacts, not signal**: the
     known-good bare-prom-client control OOMs in a fresh `next dev` at BOTH
     1.5GB and 4GB — i.e. compiling ANY sizable generated page costs 4–8GB in
     this dev setup (itself worth raising with the site owners). An earlier
     run of ~10 trials at 1.5GB was invalidated by this control and discarded.
  2. At **CAP=8192** the harness discriminates cleanly: prom-client control OK,
     full bare-fs OOM. Valid trials so far: head-only OK; **first half
     (through "Permissions, ownership, and times") OK; second half (from
     "### Directories" onward, incl. the auto-grouped Dir/Dirent/Stats/Watcher
     classes, Types like the 24-way `Flag` union, and the `bare-fs/promises` +
     `bare-fs/constants` subpath sections) OOM.**
  **Next step (scheduled run)**: continue bisecting WITHIN the second half at
  `CAP=8192` using the existing harness (`scratchpad/oom/trial.sh`; regenerate
  it from this description if the scratchpad was reaped): first split at
  `## \`bare-fs/promises\`` (subpaths vs main-body), then narrow by section.
  Restore `content/` after every trial. Cutover stays blocked until root-caused.

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
