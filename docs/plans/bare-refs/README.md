# Plan: finish the generated module references (bare + pear)

Goal: address every item in `generated/bare-refs/TODO.md`, close the remaining
gaps in the generation pipeline, and unify the approach with the **pear-side**
modules (the 37 `pear-*` packages in `content/reference/modules/pear-modules.mdx`,
which today have a catalog but no per-module reference pages).

The work is split into two independent workstreams designed to run in **two
Claude instances in parallel**, each spawning its own agents:

| | Instance A | Instance B |
|---|---|---|
| Plan file | `docs/plans/bare-refs/instance-a.md` | `docs/plans/bare-refs/instance-b.md` |
| Theme | Pipeline fixes, verification, docs-site integration, **pear-\* unification** | Prose: describe-map review, drafting TSDoc/`.d.ts`, **upstream branches** |
| Owns (writes) | `scripts/bare-refgen/**/*.ts` (tooling), `scripts/bare-refgen/config.ts`, `content/**`, `.github/workflows/**`, `generated/pear-refs/**`, final regen of `generated/bare-refs/**` | `../ts-doc-upstream/**` (all clones/branches), `scripts/bare-refgen/layouts/**` (describe.json + per-module manifests), `docs/plans/bare-refs/findings-b.md` |
| Must NOT touch | `../ts-doc-upstream/**`, `scripts/bare-refgen/layouts/**` | any `scripts/bare-refgen/*.ts`, `content/**`, `generated/**`, workflows |

## Hard rules (both instances)

1. **NEVER push anything anywhere.** All git work is local (`chore/ts-doc` /
   `chore/add-types` branches in `../ts-doc-upstream/*`, commits on the docs
   branch). No `git push`, no `gh pr create`.
2. **No silent AI prose in the docs.** Descriptions drafted by an instance must
   be (a) derived from reading the actual source/README/Node.js-parity docs,
   (b) factual and verifiable, and (c) recorded as **drafts pending human
   review** (see each plan's marking convention). The lead-dev mandate is that
   pages are generated from type declarations; prose enters only through the
   reviewed manifest/TSDoc channel.
3. Stay inside your ownership column. The split is by file path, so parallel
   work cannot conflict.
4. Validate with the existing gates: `npm run check:bare-refs`,
   `npm run test:bare-refs`, MDX compile. Instance A also uses the Fumadocs
   dev server.

## Prerequisite (run once, before either instance starts)

On branch `feat/bare-docs`, commit the current baseline so both instances share
it and diffs stay reviewable (local commit only — do not push):

```sh
git add package.json scripts/bare-refgen generated .github/workflows/regenerate-bare-refs.yml .github/workflows/sync-bare-upstream.yml docs/plans
git commit -m "chore(bare-refgen): baseline — pipeline, 69 generated refs, workflows, plans"
```

If the two instances run in separate worktrees, branch each from this commit
(`feat/bare-docs-a`, `feat/bare-docs-b`) and merge B's layouts-only diff back
first (it's disjoint by design), then A's.

## Definition of done (combined)

- `generated/bare-refs/TODO.md` regenerated; every section either resolved or
  reduced to items that genuinely need the user (listed at the top of each
  instance's findings file).
- Extractor handles ambient `declare module` declarations (no more 0-export pages).
- Pear-side: `generated/pear-refs/` preview pages exist for the documentable
  `pear-*` modules with the same page format, gates, and TODO report.
- Every no-prose bare module has draft TSDoc on its local `chore/ts-doc` branch
  and a draft describe map marked for review; the 3 type-less modules have
  draft `.d.ts` on local `chore/add-types` branches.
- All describe maps verified against source; junk fixed; findings recorded.
- All gates green over the full set; nothing pushed; `content/` changes limited
  to Instance A's deliberate integration work.
