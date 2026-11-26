# Reference docs review — plan

Bring every page under `content/reference/` current with its upstream repository,
give every documented symbol a **stable** GitHub link to its definition, and
restructure the section for a better developer experience.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Link pinning | Pin to the upstream **release tag** (`blob/<tag>/file#Lnn`); fall back to a **commit SHA** for repos with no tags. Never link `main`. |
| Link density | **One** `Defined in: <source>` link per `#### \`method\`` heading (drop the repeated Signature/Parameters/Returns `[GitHub]` bullets). |
| IA scope | **Full restructure** — fix orphans, deprecate `api.mdx`, consolidate the CI docs, regroup the flat top-level pages into subfolders (with redirects). |

## Verified doc → repo → pin map

Tags captured 2026-06-08; re-capture in Phase 0 before generating.

| Doc | Repo | Branch | Pin |
| --- | --- | --- | --- |
| building-blocks/hypercore | holepunchto/hypercore | main | v11.33.1 |
| building-blocks/hyperbee | holepunchto/hyperbee | main | v2.27.3 |
| building-blocks/hyperdrive | holepunchto/hyperdrive | main | v13.3.2 |
| building-blocks/autobase | holepunchto/autobase | main | v7.28.1 |
| building-blocks/hyperdht | holepunchto/hyperdht | main | v6.32.0 |
| building-blocks/hyperswarm | holepunchto/hyperswarm | main | v4.17.0 |
| helpers/corestore | holepunchto/corestore | main | v7.10.1 |
| helpers/localdrive | holepunchto/localdrive | main | v2.2.1 |
| helpers/mirrordrive | holepunchto/**mirror-drive** | main | v1.14.2 |
| helpers/secretstream | holepunchto/**hyperswarm-secret-stream** | main | v6.9.1 |
| helpers/compact-encoding | holepunchto/compact-encoding | main | v3.2.0 |
| helpers/protomux | holepunchto/protomux | main | v3.11.0 |
| tools/drives | holepunchto/drives | main | v3.1.0 |
| tools/hyperbeam | holepunchto/hyperbeam | main | v3.1.0 |
| tools/hypershell | holepunchto/hypershell | main | v0.0.15 |
| tools/hyperssh | holepunchto/hyperssh | **master** | v5.0.4 |
| tools/hypertele | **bitfinexcom**/hypertele | main | **no tags → pin SHA** |
| cli | holepunchto/pear | main | v2.6.5 |
| runtime | holepunchto/pear-runtime | main | v1.1.4 |
| api (deprecated) | holepunchto/pear | main | v2.6.5 |
| configuration | holepunchto/pear | main | v2.6.5 |
| modules | individual `pear-*` repos | — | per-module |
| bare-modules | holepunchto/bare (+ `bare-*`) | main | v1.28.6 |
| desktop-release-npm-scripts | holepunchto/hello-pear-electron | main | — |
| github-actions | holepunchto/actions | main | — |
| pear-ci-action | holepunchto/actions (pear-ci) | main | — |

Gotchas baked into the map: repo name ≠ slug (`mirror-drive`, `hyperswarm-secret-stream`),
different org (`bitfinexcom/hypertele`), non-`main` default branch (`hyperssh` = `master`),
no tags (`hypertele` → SHA). Some tool repos are quiet upstream (hypershell last pushed 2024).

## Existing tooling (build on, don't rebuild)

- `scripts/add-api-github-links.ts` (`npm run add-api-github-links -- --write`) — clones into
  `UPSTREAM_ROOT` (default `/tmp/pear-upstream`), matches each `#### \`method\`` heading to its
  source line, writes the links. **Currently: building-blocks + helpers only; pins `main`; emits
  links per bullet.** Reports unmatched headings.
- `scripts/audit-reference-docs.ts` (`npm run audit:reference-docs`) — frontmatter/stub checks +
  shallow symbol-presence search vs upstream clones; covers libs/helpers/tools. References
  `docs/REFERENCE_DOCS_REVIEW_LOG.md` (to be created in Phase 2).
- `npm run check:internal-links` / `check:external-links` / `check:cross-links` — link validation.

## Gaps to close

1. **Link rot** — all source links target `blob/main/…#Lnn`; line numbers drift (e.g.
   `hypercore/index.js#L45` now lands on the `class` line, constructor moved to L46). → pin to tag/SHA.
2. **Coverage** — generator skips tools, `cli`, `runtime`, `api`, `configuration`, `modules`,
   `bare-modules`. These are CLI-/flag-/key-/catalog-shaped, not `#### \`method\`` lists, so they
   need a different linking pass.
3. **Accuracy not recorded** — no systematic per-doc diff vs current upstream README/source logged.

## Phases

### Phase 0 — Setup & pin
- Clone every repo in the map into `/tmp/pear-upstream` (respect renames; `bitfinexcom/hypertele`;
  `hyperssh` on `master`).
- Re-capture each repo's latest release tag (SHA for hypertele). Record the resolved ref per repo.
- Add `branch`/`org`/`pinRef` overrides to the generator's `REPOS` map.

### Phase 1 — Links (tag-pinned, one per method)
- Extend `add-api-github-links.ts`: emit `blob/<pinRef>/…` instead of `main`; collapse to a single
  `Defined in:` link under each `#### \`method\`` heading.
- Add a CLI-doc pass for tools/`cli`/`runtime`/`api`/`configuration`: link each `## \`command\`` /
  flag / config key to its definition (`bin.js`, `lib/*.js`, `action.yml`, or README anchor).
- Add a catalog pass for `modules`/`bare-modules`: link each `pear-*` / `bare-*` entry to its repo.
- Regenerate; review the diff; confirm the per-method link count drops (hypercore 272 → ~40).

### Phase 2 — Accuracy
- `npm run audit:reference-docs` → worklist of "not found upstream" symbols + generator "unmatched".
- Per doc, diff documented surface vs current upstream README + source: flag added (undocumented),
  removed, renamed, and signature/option/default changes; fix.
- Record per-doc results in **`docs/REFERENCE_DOCS_REVIEW_LOG.md`** (format below).

### Phase 3 — IA restructure (needs redirects via `scripts/redirects.ts`; verify `check:redirects`)
Target tree:
```
reference/
  index.mdx
  pear/                       # platform docs (was top-level)
    cli.mdx
    runtime.mdx
    configuration.mdx
    api.mdx                   # deprecation banner; demoted in nav
  modules/
    pear-modules.mdx          # was modules.mdx
    bare-modules.mdx
  ci-and-release/             # NEW group
    desktop-release-npm-scripts.mdx
    github-actions.mdx        # absorbs pear-ci-action.mdx as a section
  building-blocks/  helpers/  tools/   # unchanged
```
- Fix orphans: `github-actions` + (folded) `pear-ci-action` were missing from `reference/index.mdx`.
- Fold `pear-ci-action.mdx` into `github-actions.mdx#pear-ci`; redirect old URL.
- Mark `api.mdx` deprecated (banner + demote).
- Add redirects for every moved page; rebuild the section list in `index.mdx`.
- (Lowest ROI / highest churn: the top-level `pear/` + `modules/` regroup. Do last; easy to drop if
  the redirect cost isn't worth it.)

### Phase 4 — Verify
`check:internal-links` + `check:external-links` + `check:cross-links` + `check:redirects` +
`types:check` + `npm run build`.

## Review-log format (`docs/REFERENCE_DOCS_REVIEW_LOG.md`)

Per doc: `repo @ pin` · symbols documented / found upstream · **drift** (added/removed/renamed/
changed, with upstream link) · links regenerated? · IA action · status (PASS/REVIEW/FIXED).

## Acceptance criteria
- Every reference page maps to a repo + pinned ref; every documented symbol links to its definition
  at that pin.
- No `blob/main/…#L` links remain in `content/reference/`.
- Audit reports 0 stubs / 0 frontmatter issues; remaining symbol misses are explained in the log.
- All link/redirect/type checks pass and the site builds.
