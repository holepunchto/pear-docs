# Instance A — pipeline fixes, verification, integration, pear unification

You are working in `pear-docs` on branch `feat/bare-docs` (or a worktree branch
from it). Read `docs/plans/bare-refs/README.md` first — especially the hard
rules (**never push**, file-ownership boundaries) and the prerequisite commit.

## Context you need

`scripts/bare-refgen/` generates API reference pages for `bare-*` modules from
their **published TypeScript declarations** (`npm pack` → parse `.d.ts` with the
TS compiler API → render MDX). Read `scripts/bare-refgen/README.md` for the
architecture. Key commands:

```sh
npm run gen:bare-refs -- --top 80        # generate all 72 typed candidates (69 succeed)
npm run gen:bare-refs -- --only a,b      # subset
npm run check:bare-refs                  # coverage + layout-sanity + MDX gate
npm run test:bare-refs                   # extractor fixture tests
npm run bare-refs:todo                   # regenerate generated/bare-refs/TODO.md
```

Output goes to `generated/bare-refs/` (preview only; live pages under
`content/reference/bare/modules/` are NOT overwritten — `--write` does that and
is a deliberate, end-stage step). The editorial layer lives in
`scripts/bare-refgen/layouts/` — **you do not edit that directory** (Instance B
owns it); your tooling only reads it.

## Workstream A1 — extractor: ambient `declare module` support (bug)

`bare-mdns-discovery` and `bare-tui` render **0 exports** because their `.d.ts`
is an ambient declaration (`declare module 'bare-mdns-discovery' { …exports… }`),
and `extract.ts` only reads the source file's own module symbol. Fix
`extractModule` in `scripts/bare-refgen/extract.ts`: when the source file has no
top-level exports, look for an ambient module declaration whose name matches the
package (or its sole `declare module`), resolve **its** symbol via the checker,
and extract from that. Add a fixture (`__fixtures__/ambient.d.ts`) + test to
`extract.test.ts`. Also make `check.ts` fail on pages whose model has 0 exports
(unless skipped) so this class of bug can't ship silently again. Regenerate the
two modules and confirm real APIs appear.

## Workstream A2 — pear-\* unification (the big one)

The pear side has a catalog of 37 `pear-*` modules
(`content/reference/modules/pear-modules.mdx`) but **no per-module reference
pages**. Extend the pipeline so the same machinery documents them:

1. **Generalize config**: `config.ts` currently assumes `bare-`. Introduce a
   per-family config (prefix `pear-`, out dir `generated/pear-refs`, layouts dir
   `scripts/bare-refgen/layouts-pear/`, catalog `pear-modules.mdx`, its own
   `versions-pear.json`/`downloads-pear.json`, no Node-parity map). Keep the CLI
   as one tool: `npm run gen:bare-refs -- --family pear` (add a thin
   `gen:pear-refs` script alias).
2. **Candidate discovery**: there is no pear research JSON. Either run a
   pear-variant of `scripts/research-bare-modules.ts` (gh CLI, org
   `holepunchto`, prefix `pear-*`, same EXCLUDE idea for kits/examples) to
   produce `docs/pear-modules-research.json`, or derive candidates directly from
   the catalog rows. Only modules that actually ship `.d.ts` get pages — record
   the rest in the pear TODO as "needs upstream types" (expect many; do not
   fabricate types here, that's Instance B's pattern for a later pass).
3. **Generate** `generated/pear-refs/<name>.mdx` with the identical page format
   (frontmatter, `<mark>` badge, intro facts, README `## Usage` verbatim, API by
   kind, subpaths, See also pointing at `/reference/modules/pear-modules` and
   `/reference/pear/api`). Extend `check`, `todo`, and the MDX-compile gate to
   cover the pear family; produce `generated/pear-refs/TODO.md`.
4. **Stability seed**: parse both catalogs' Stability columns and populate the
   STABILITY map for every module that is not `stable` (the default). This also
   closes the TODO's "Stability to confirm" section — record in your findings
   which modules you verified and how.

## Workstream A3 — in-site verification (TODO "Before going live")

Using the preview tools (`preview_start` with the repo's `dev` script — create
`.claude/launch.json` if needed):

1. Temporarily copy 3 representative generated pages into
   `content/reference/bare/modules/` (e.g. `bare-fs` large+layout, `bare-events`
   signatures-only, `bare-prom-client` generic-heavy), render them in the dev
   server, and check: `<mark>` badge, `<sub>` source links, code blocks,
   Parameters lists, anchors/cross-links (`#path` etc.), subpath sections.
   Screenshot evidence, then **revert content/ to pristine** (`git checkout --`
   + delete untracked copies — some modules have no committed page, plain
   checkout won't remove them).
2. Spot-check 5 source links resolve (curl the `blob/vX.Y.Z/...#L` URLs → 200).
3. Side-by-side 2–3 generated pages against their hand-written counterparts and
   write a short comparison into your findings file (what the hand-written page
   still does better, if anything).

## Workstream A4 — integration mapping (prepare, don't flip)

Prepare the `--write` cutover so the user can approve it as one reviewable unit:

1. Build the mapping: 69 generated bare pages vs the 36 hand-written pages in
   `content/reference/bare/modules/` — which are replaced, which generated pages
   are NEW (need catalog rows in `bare-modules.mdx`, links in
   `content/reference/index.mdx`, and redirect entries if any slug differs).
   Check `scripts/redirects.ts` for how redirects are declared.
2. Extend `syncCatalog` in `index.ts` to also ADD a row (correct section =
   "Other"/best-guess flagged in TODO) when a module is missing from the
   catalog, not just update existing rows.
3. Do NOT run `--write` into content/ as a final state. Instead produce
   `docs/plans/bare-refs/cutover.md`: exact commands, the page mapping, catalog
   diff summary, and open questions for the user.

## Workstream A5 — final sweep

After Instance B has merged its layouts changes (or on your own if running
solo): full regen `--top 80`, all gates, `npm run bare-refs:todo`, and update
`docs/plans/bare-refs/findings-a.md` with: what you fixed, what you verified,
and the short list of items that still genuinely need the user.

## Verification checklist

- `npm run test:bare-refs` includes the new ambient fixture and passes.
- `npm run check:bare-refs` green over bare + pear; 0-export pages impossible.
- All generated pages (both families) compile as MDX.
- Dev-server render screenshots captured; content/ pristine afterwards.
- Nothing pushed; `git status` shows only files in your ownership column.

Use parallel agents freely (one per module-batch or per workstream), but keep
all writes inside your ownership column.
