# Pear 3.3.0 docs update — review and execution plan

Status: implemented against `v3.3.0-rc.1` and shipped as the current doc-state. 3.3 is registered `stable` and the docs read as released; the only thing still pending upstream is the final `v3.3.0` tag itself (newest upstream tag is `v3.3.0-rc.1`), so `scripts/upstream-commits-state.json`'s `pear-cli` SHA and `scripts/upstream-releases-state.json`'s `holepunchto/pear` pin stay where they are until it lands.

**Decisions taken (2026-08-24):**
- Per-field hints (§7.4): fold in **constraints only** — hints that state a real constraint, interaction, or failure mode become reference prose; hints that merely restate a flag are skipped.
- Output samples (§6): **derived from upstream source** (`cmd/*.js`, `lib/terminal.js`) for this pass. Re-verify against an upgraded `pear` build before merge — the local install is v3.1.0.
- Timing (§7.1): work proceeds against `v3.3.0-rc.1`. Re-diff `v3.3.0-rc.1..v3.3.0` before merge, and leave `upstream-commits-state.json`'s `pear-cli` SHA un-bumped until the final tag exists.
- Doc-state (§5): 3.3 is registered **`stable`** and 3.2 no longer carries it — decision reversed on 2026-08-24, the docs ship with the new version rather than behind a prerelease badge. Because `STABLE_DOCS_VERSION` is what `check:internal-links` resolves bare anchors against, the `?v=3.3` query was dropped from every link to a 3.3-only anchor.

## Tag-time checklist

Done ahead of the tag (2026-08-24): 3.3 is `stable` in `src/lib/docs-versions.ts`, the `?v=3.3` queries are gone, and the "not tagged upstream yet" qualifiers are out of the `cli.mdx` callout and the Release Overview lede.

Still to do when `v3.3.0` is tagged upstream:

1. Re-diff `v3.3.0-rc.1..v3.3.0` and fold in anything that moved.
2. Bump `scripts/upstream-commits-state.json`'s `pear-cli` to the final tag's commit SHA, and `scripts/upstream-releases-state.json`'s `holepunchto/pear` to `v3.3.0`.
3. Re-verify the command output samples against an installed 3.3.0 build.

## Traps found while implementing

Recording these because each one cost time and would cost it again:

- **`npm run check:upstream-commits` is not read-only.** It rewrites `scripts/upstream-commits-state.json` as a side effect, and it does so even when GitHub rate-limits it — advancing SHAs for modules nobody reviewed and silently retiring their drift signal. Run it only with `GITHUB_TOKEN` set, and diff the state file afterward.
- **A `[!version since=…]` marker gates exactly one line, by index.** Wrapping a long help row across two lines and putting the marker on the second leaves the first line ungated, so it stays visible at versions that should hide it. Keep gated rows on one line however wide they get.
- **`check:internal-links` resolves anchors against the current stable doc-state.** An anchor introduced inside a `<VersionSection since="3.3.0">` does not exist for a 3.2 reader, so every link to it needs `?v=3.3` until 3.3 is stable. Making 3.3 `stable` prematurely silences this check rather than satisfying it.
- **Version markers are only valid on pages with a registered axis** (`src/lib/version-axes.ts`). How-to and getting-started pages have none — express the version in prose there.
- **`<VersionSection>` must sit directly under a heading.** Anywhere else it fails the build; use `<VersionGate>` for a mid-section block.
- **`npm run build` rewrites `next-env.d.ts`.** Revert it before committing.

## Pre-existing issues fixed alongside this release

Each of these was found while verifying the release and fixed rather than logged.

- **MDX comments were published.** `postprocess.includeProcessedMarkdown` serializes the mdast, and a comment survives that, so every maintainer note in `content/` was being written into the per-page `.md` files served to LLMs and to `Accept: text/markdown` — over twenty pages. `cli.mdx`'s note leaked its literal `[!version since=x.y.z]` example row, which reads as a real row of `pear touch --help` output. `src/lib/remark-strip-mdx-comments.ts` now drops comment-only MDX expressions in the remark pass, for the same reason `remarkVersionCodeLines` has to run there. Zero leak across all pages after the fix.
- **The `cli.mdx` maintainer note is gone from the page.** Its content moved to `docs/plans/VERSIONED-REFERENCE-AUTHORING.md`, extended with the three gating constraints that bit during this release.
- **`npm run lint` is clean** — 0 errors, 0 warnings, from 4 errors and 8 warnings. `check-upstream-releases.ts` no longer shadows the CommonJS `module` global; `mermaid.tsx` builds its SVG inside the `try` and returns JSX outside it, so the fallback no longer swallows the returned component's own render errors; the dead `jsx-a11y/alt-text` disable in `mdx-components.tsx` is gone; `image-zoom.tsx` passes `alt` explicitly instead of hiding it in a spread; and eslint now ignores `.claude/worktrees/**`, which was making it report every finding once per worktree.
- **`check:upstream-pins` reports zero drift** — 82 pages current, down from 71. `corestore` was the interesting one: its frontmatter said 7.11.0 while its `[src]` links pointed at two different tags. Auditing 7.11.0 → 7.12.2 found the page asserting that `store.suspend()` "resolves once the storage is flushed and suspended", which 7.12.0 made false by removing the implicit flush, and a missing `treeCache` constructor option. Both fixed, all 23 `[src]` lines remapped.
- **`bare-dns` and `bare-fs` regenerated from upstream type declarations.** `bare-dns` 2.1.4 → 2.2.0 was not a pin bump: 2.2.0 filled in the whole resolution API (`resolve`, `resolve4`/`resolve6`, `resolveAny`/`Caa`/`Cname`/`Mx`/`Naptr`/`Ns`/`Ptr`/`Soa`/`Srv`/`Tlsa`/`Txt`, `reverse`, server and local-address control, a `promises` submodule, `errors`, `constants`, and ten record types), where the page had documented only `lookup`, `resolveTxt`, and `destroy`. Regenerating grew it from 12 to 63 documented members and required fixing the layout manifest, whose `dns.resolveTxt` param keys no longer matched anything — 2.2.0 exposes it as an alias const rather than a declaration — and whose `DNSResolver` summary still said the class existed to look up TXT records. `bare-fs` 4.8.0 → 4.8.1 picked up the TSDoc upstream added in `index.d.ts` and `promises.d.ts`. `bare-buffer`, `bare-url`, `bare-http1`, `bare-inspect`, `bare-tls`, and `bare-collabora` were regenerated too, after their pins were first bumped by hand — which left `scripts/bare-refgen/versions.json` disagreeing with the page frontmatter. Regenerating is what makes a pin mean anything; hand-bumping it only moves the number.
- **The pin checker no longer reports false positives.** `/reference/bare/cli`, `/reference/bare/runtime`, and `/reference/bare/bare-kit` each document several releases behind their own dropdown (`src/lib/version-axes.ts`), so no single `upstreamVersion` can describe them. The checker now skips pages on a registered axis; the backlog dropped from 9 to 6 real gaps.

## Still open

- **Six bare module pages cannot be pinned by the pipeline.** `bare-apk`, `bare-channel`, `bare-form-data`, `bare-mime`, `bare-sdl`, and `bare-union-bundle` ship **no `.d.ts` in their published packages**, so `gen:bare-refs` skips all six and there is no generated version to pin to. Their pages are hand-written. Giving them an `upstreamVersion` means auditing each against its published source by hand — worth doing, but it is a project of its own, and inventing a pin would assert an audit nobody performed.

## How the bare reference pipeline actually works

Worth writing down, because the script's own header said the opposite.

`npm run gen:bare-refs` writes to `generated/bare-refs/` (preview) by default.
Adding `--write` **also overwrites the published page** in
`content/reference/bare/modules/` — see `generateOne` in
`scripts/bare-refgen/index.ts`. The header comment claimed it "writes ONLY to the
preview dir — never to content/", which is false and cost time here; it has been
corrected.

The practical consequence: **never hand-edit a page under
`content/reference/bare/modules/`.** The next `--write` run discards it. Change
the generator, or the module's layout manifest under
`scripts/bare-refgen/layouts/`, and regenerate:

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run gen:bare-refs -- --only bare-dns --write
```

`npm run check:bare-refs` validates coverage, layout, and MDX afterwards — it is
what caught the dangling layout keys when `bare-dns` moved to 2.2.0. It does not
check content/preview parity, so the two can still silently diverge; a parity
check would be a worthwhile addition.
Base branch: `feat/3.3.0-updates` (already exists locally at `d7e1ecb`, identical to `origin/published`).
Upstream target: `holepunchto/pear` — `v3.3.0` is **not tagged yet**. The newest tag is `v3.3.0-rc.1` (`add80796c4a06c3f2d335fc7327c42b01103da55`).

This plan mirrors the process used for 3.2.0 (`767fbfc`, shipped as PR #349): review the upstream surface diff, update the reference pages with version-gated badges, register the new doc-state, extend the release-overview changelog, and re-run the drift checks.

---

## 0. Branch and baseline

`feat/3.3.0-updates` already exists and points at `origin/published`, so there is nothing to create — but it has never been pushed. Nothing else needs to move.

```bash
git -C /Users/lucas/Documents/tether/pear-docs-0 push -u origin feat/3.3.0-updates
```

Note that `main` in this repo is the legacy GitBook content. The live docs site is `published`, and every version-update branch is cut from it. Do not branch from `main`.

The docs pin for the Pear CLI is `scripts/upstream-commits-state.json` → `pear-cli: e388e63c7571613fb99d3b519821fbb2db9f78a2` ("show help on pear build missing params", #1186). That commit is the surface 3.2.0 was documented against, so the review diff is `e388e63..v3.3.0-rc.1`, not `v3.2.0..v3.3.0-rc.1` — upstream cut the `v3.2.0` tag before several commits its own CHANGELOG lists under 3.2.0 landed on `main`.

---

## 1. Review the upstream delta

### 1.1 Commits in scope

`e388e63..v3.3.0-rc.1` is 12 commits:

| Commit | Subject |
| --- | --- |
| `df44635` | 3.3.0-rc.1 |
| `768602f` | update CHANGELOG (#1199) |
| `8d2c872` | bump deps (#1197) |
| `11f00cd` | added name + blobs boolean to pear cores (#1176) |
| `812acac` | replace stage error stack with message (#1193) |
| `10091f6` | Use PATH env var on Windows in make script (#1194) |
| `d8db6ce` | Add per-field hints for future --menu/AI consumption (#1178) |
| `ead7ce6` | Improve onboarding (#1172) |
| `39543a4` | Bump deps and remove manual printing of help on pear build (#1190) |
| `c237f9f` | Clarify command summaries, descriptions, args and flag help text (#1188) |
| `9d9199a` | updated CHANGELOG (#1187) |
| `959e1bc` | make pear dump list dir optional (#1185) |

Files touched: `cmd/index.js` (+381/-…), `cmd/cores.js`, `cmd/gc.js`, `cmd/multisig.js`, `cmd/provision.js`, `cmd/stage.js`, `cmd/touch.js`, `lib/cmd.js`, `lib/terminal.js`, `subsystems/sidecar/index.js`, `subsystems/sidecar/ops/{cores,gc}.js`, `scripts/make.js`, tests, lockfile.

### 1.2 Reproduce the diff

```bash
git clone --filter=blob:none --no-checkout https://github.com/holepunchto/pear /tmp/pear-up
```

Then diff the command definitions — that file is the complete CLI surface, per the maintainer note at the top of `content/reference/pear/cli.mdx`:

```bash
git -C /tmp/pear-up diff e388e63 v3.3.0-rc.1 -- cmd/index.js lib/cmd.js
```

### 1.3 Upstream's own CHANGELOG for v3.3.0

Features: deployment onboarding hints on `pear touch`/`stage`/`provision`/`multisig`; `pear gc cores <name>`; `pear gc cores --force|-f`.
Improvements: `pear cores` sorted table with app name and `[core]`/`[blobs]` type column; `pear gc cores` typed confirmation before clearing writable cores; command summaries/descriptions/arg/flag help text clarified across all commands; per-field help hints for all commands; deps bump.
Fixes: `pear stage` `ERR_INVALID_PROJECT_DIR` prints the message instead of a stack trace.

Nothing in 3.3.0 is breaking.

---

## 2. API and CLI surface changes to document

Every item below goes into `content/reference/pear/cli.mdx` with a `<Since v="3.3.0" />` badge, a `[!version since=3.3.0]` row gate inside the fenced help block, or a `<VersionSection since="3.3.0" />` — using the four gating tools described in that file's maintainer note.

### 2.1 `pear gc cores` — new surface (highest-impact item)

- The argument becomes `<link|name>`: cores can now be cleared by application name, not just by `pear://` link. Non-`pear://` values resolve through the new sidecar `getLinksByName` op, and an unknown name raises `ERR_INVALID_INPUT: No cores found with name <x>`.
- New `--force|-f` flag.
- Without `--force`, clearing a set that contains **any writable core** now prompts an interactive typed confirmation: the user must type literal uppercase `CLEAR`. Anything else prints `✖ uppercase CLEAR to confirm`.
- This is a behavior change for scripts: a previously non-interactive `pear gc cores <link>` against a writable core now blocks on a prompt unless `--force` is passed. Call that out explicitly — it is the one item in 3.3.0 that can break an existing automation.

Docs today: `content/reference/pear/cli.mdx:515-521` (the `pear gc` table and the 3.2.0 `<Since>`/`<Until>` notes).

### 2.2 `pear cores` — output format replaced

Output is no longer one plain line per core. It is now a sorted, column-aligned table:

```
<name-or-dash>  [core]|[blobs]  <pear://link>  (length: <n>[, writable])
```

Sorted named-first, then by name, then by drive, then core-before-blobs; unnamed rows render `-`. Each core object gains `name` and `blobs` fields, which also surface under `--json` (`"tag": "core"`).

Docs today: `content/reference/pear/cli.mdx:420-435` describes the pre-3.3.0 one-line-per-core shape and the `--json` core object as `{ link, writable, length }`. Both need `<Since v="3.3.0" />` treatment plus an updated sample.

### 2.3 Deployment onboarding hints

`pear touch`, `pear stage`, `pear provision`, `pear multisig {keys get, link, request, sign, verify, commit}` now print a trailing gray hint block suggesting the next command. Suppressed under `--json`. New `hint()` helper in `lib/terminal.js`.

Two consequences for the docs, beyond documenting the feature itself:

- `pear provision`'s `final` message **dropped** its `Seed with:\n\n   pear seed <link>` block — that content moved into a hint. `content/getting-started/build-a-peer-to-peer-chat/ship.mdx:377-387` reproduces the old output verbatim and its prose refers to "The `Seed with` line at the end". That sample is now wrong and must be re-captured.
- `pear multisig link`'s output dropped its trailing `seed: pear seed <link>` line for the same reason. Check the multisig how-tos for reproduced output.

### 2.4 `pear stage` fix

`ERR_INVALID_PROJECT_DIR` prints the error message rather than a stack trace.

### 2.5 Help-text and hint rewrites across every command

`c237f9f` and `d8db6ce` rewrote summaries, descriptions, argument and flag help strings, and attached `.hint()` metadata to essentially every arg and flag. The fenced help blocks in `cli.mdx` are transcriptions of that help text, so **every** one drifts. Notable text changes:

- `--vanity`: "Generate a vanity link with this prefix" → "Generate a link starting with this z32 prefix" (`pear touch` and `pear multisig link`).
- `pear seed` description rewritten; `--no-tty`, `--until-sync`, `--stats-interval` (`<ms>` → `<milliseconds>`) all reworded.
- `pear stage`: `--ignore`, `--purge`, `--only`, `--truncate`, `[dir]` reworded.
- `pear dump`: gains a `summary()`; `--dry-run`, `--checkout`, `--only`, `--list`, `--no-prune` reworded.
- `pear multisig keys`: `[name=default]` args reworded with a `^[\w-]+$` constraint hint; `verify`/`commit` gain a documented `rest('[...responses]')`.
- `pear info`: `--metadata`, `--manifest`, `--multisig`, `--key` reworded.
- `pear versions`: `--modules|-m` reworded.
- `pear cores`: gains a two-line `description`.
- Global: `--log-level|-L` reworded to "Verbosity to log at — 0=off, 1=error, 2=info, or 3=trace"; `--sidecar` is now **hidden** (`.hide()`) and relabeled "Internal. Boot this process as the sidecar".

Decision to make before editing: whether the per-field `.hint()` strings — several of which carry genuinely new, documentation-grade information (for example, that `pear stage --dry-run` does **not** guard `--truncate`, or that `--only` matches by path prefix while `--ignore` accepts globs) — get folded into the reference prose or left upstream-only. Recommendation: fold in the ones that state a constraint or a failure mode, skip the ones that merely restate the flag.

`--sidecar` becoming hidden is worth a `<Until v="3.3.0" />` style note if the page currently documents it.

### 2.6 Interactive menu

`pear --menu` (3.2.0) now renders the per-field hints from `d8db6ce`. Re-check `content/how-to/browse-commands-with-the-interactive-menu.mdx` and any screenshots there.

---

## 3. Dependency updates

`8d2c872` / `39543a4` bumped Pear's bundled dependencies. From the lockfile diff, `e388e63..v3.3.0-rc.1`:

| Package | From | To |
| --- | --- | --- |
| `bare-buffer` | 3.6.2 | 3.7.0 |
| `bare-http1` | 4.5.7 | 4.5.8 |
| `bare-inspect` | 3.1.4 | 3.1.5 |
| `bare-url` | 2.4.7 | 2.5.2 |
| `compact-encoding` | 3.3.0 | 3.3.2 |
| `hypercore` | 11.35.1 | 11.35.2 |
| `hypercore-storage` | 3.2.0 | 3.2.1 |
| `hyperdht` | 6.33.0 | 6.33.1 |
| `paparam` | 1.12.0 | 1.13.0 |
| `pear-build` | 1.1.1 | 1.2.0 |
| `pear-ipc` | 6.12.0 | 6.13.0 |
| `pear-runtime-updater` | 3.3.0 | 3.4.0 |
| `rocksdb-native` | 3.17.3 | 3.17.4 |
| `udx-native` | 1.21.0 | 1.21.1 |

For each of these, do the following:

1. **Reference pages with their own pins.** `compact-encoding`, `hypercore`, `hyperdht` have `content/reference/{building-blocks,helpers}/*` pages carrying an `upstreamVersion` frontmatter pin. `npm run check:upstream-pins` grades the drift — patch-level is "bump the pin, re-verify `[src]` lines only if they moved", minor-level is "re-audit defaults and signatures". `bare-buffer`, `bare-http1`, `bare-inspect`, `bare-url` have `content/reference/bare/*` pages pinned the same way. `bare-url` 2.4.7 → 2.5.2 is the largest jump here and deserves a real API re-read.
2. **`pear-build` 1.1.1 → 1.2.0 is a minor bump** and feeds `pear build`. Read its release notes; new build surface would land in `cli.mdx` under `pear build`.
3. **`pear-runtime-updater` 3.3.0 → 3.4.0** is a minor bump on the OTA path — check `content/reference/pear/runtime.mdx`.
4. **`paparam` 1.13.0** is what implements `.hint()` and `.hide()`; no user-facing docs, but it explains the surface change.
5. Not everything bumped here has a docs page (`hypercore-storage`, `rocksdb-native`, `udx-native`, `pear-ipc`). Those only need a Release Overview line if they changed observable behavior; otherwise fold them into a single "Internal — deps bump" note as the 3.1.0 entry already does.

Independently of Pear's lockfile, run the standing drift check across all 20 watched repos, since `scripts/upstream-releases-state.json` has not been advanced since 3.1.0:

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run sync:upstream-releases
```

---

## 4. Update the Release Overview page

Live at **https://docs.pears.com/release-overview/**, sourced from `content/release-overview/index.mdx`. This is the docs-team view of what each release means for an application author — not a mirror of upstream's `CHANGELOG.md`. Every release that changes the documented surface gets an entry, so 3.3.0 needs one.

### 4.1 Where the entry goes

The file carries an automation marker:

```
{/* changelog:insert — automation inserts draft entries below this marker; keep it directly above the newest entry. */}
```

`scripts/check-upstream-releases.ts` (run by `.github/workflows/upstream-releases.yml`) inserts draft entry blocks directly under it whenever a watched repo publishes a release. Entries are newest-first, so the 3.3.0 section goes **between the marker and the existing `## 2026-08-12 — Pear 3.2.0` heading**, and the marker itself must stay directly above it.

Run the watcher first and edit what it drafts, rather than hand-writing from scratch:

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run sync:upstream-releases
```

Because `scripts/upstream-releases-state.json` still records `holepunchto/pear: v3.1.0` (see §7.6), that run will want to draft 3.2.0 as well — 3.2.0 is already written by hand, so discard that half of the draft and only keep 3.3.0.

### 4.2 Format to match

Follow the 3.2.0 entry exactly:

- `## <YYYY-MM-DD> — Pear 3.3.0` where the date is the day the docs entry ships, not upstream's tag date.
- A one-paragraph lede saying what kind of release it is and whether anything is breaking. For 3.3.0: a feature release on top of 3.2.0, nothing breaking, but flag the `pear gc cores` confirmation prompt as the one thing that can change scripted behavior.
- `### <module> — v<version>` subheadings, one per module that moved.
- Bullets prefixed `Added:` / `Changed:` / `Removed:` / `Fixed:`, each deep-linking into the reference page — for example `[`pear gc cores`](/reference/pear/cli#pear-gc)`.
- Anything breaking links to migration guidance. Nothing here qualifies, but the `--force` note should still link to the `pear gc` section.

### 4.3 Draft content for `### pear (CLI) — v3.3.0`

Derived from §2; confirm against the final `v3.3.0` tag before merging.

- Added: [`pear gc cores <name>`](/reference/pear/cli#pear-gc) clears cores by application name as well as by link.
- Added: [`pear gc cores --force|-f`](/reference/pear/cli#pear-gc) clears writable cores without the confirmation prompt.
- Added: [`pear touch`](/reference/pear/cli#pear-touch), [`pear stage`](/reference/pear/cli#pear-stage), [`pear provision`](/reference/pear/cli#pear-provision), and [`pear multisig`](/reference/pear/cli#pear-multisig) print the suggested next command after each step.
- Changed: [`pear gc cores`](/reference/pear/cli#pear-gc) now asks for typed `CLEAR` confirmation before clearing any writable core — scripts that relied on it running unattended need `--force`.
- Changed: [`pear cores`](/reference/pear/cli#pear-cores) output is a sorted table with the application name and a `[core]`/`[blobs]` type column; `name` and `blobs` also appear in `--json`.
- Changed: [`pear provision`](/reference/pear/cli#pear-provision)'s and `pear multisig link`'s final output no longer include the `pear seed` line — it moved into the new hint block.
- Changed: command summaries, descriptions, argument and flag help text clarified across every command; per-field help hints added, which is also what [`pear --menu`](/reference/pear/cli#interactive-menu) now displays.
- Changed: `--sidecar` is hidden from help and marked internal.
- Fixed: [`pear stage`](/reference/pear/cli#pear-stage) prints the `ERR_INVALID_PROJECT_DIR` message instead of a stack trace.

### 4.4 Module subheadings for the dependency bump

Add a `### <module> — v<version>` block for each docs-visible module from §3 whose change is observable — at minimum `pear-build — v1.2.0` and `pear-runtime-updater — v3.4.0`, plus `Hypercore`, `HyperDHT`, and `Compact-encoding` if their patch releases changed anything a reader would notice. Fold the rest into a single `Internal — deps bump` line, as the 3.1.0 entry already does.

### 4.5 Verify

`npm run check:internal-links` and `npm run check:cross-links` cover the deep links added here — every `#anchor` must resolve on `cli.mdx` for a reader on the stable doc-state. Confirm the rendered page after `npm run build`, and check that the `changelog:insert` marker is still directly above the newest entry.

---

## 5. Bookkeeping the machinery requires

| File | Change |
| --- | --- |
| `src/lib/docs-versions.ts` | Add `{ label: '3.3', value: '3.3.0', stable: true }` and drop `stable` from the 3.2 entry. Exactly one entry may carry `stable` — `check:docs-versions` enforces it. |
| `scripts/upstream-commits-state.json` | Bump `pear-cli` from `e388e63…` to the final `v3.3.0` commit SHA. |
| `scripts/upstream-releases-state.json` | `holepunchto/pear` currently reads `v3.1.0` — stale by a release. Advance it to `v3.3.0`, and let `sync:upstream-releases` reconcile the other 19 repos. |
| `content/release-overview/index.mdx` | New `## <date> — Pear 3.3.0` section. See §4, which covers it in full. |
| `content/reference/pear/cli.mdx` | Update the "This page tracks **Pear 3.2.0**" callout at line ~28 to 3.3.0. |

The 3.2.0 commit is the reference for scope: 4 files, `cli.mdx` + `release-overview` + `docs-versions.ts` + the commit-state pin.

---

## 6. Verification

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run check:docs-versions
```

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run check:upstream-pins
```

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run check:internal-links && npm run check:cross-links && npm run check:doctypes
```

```bash
cd /Users/lucas/Documents/tether/pear-docs-0 && npm run types:check && npm run lint && npm run build
```

Also worth running given the changed command output: `npm run check:examples` and `npm run check:includes`. Vale prose-lint runs in `.github/workflows/docs-lint.yml` — the 3.2.0 branch needed a dedicated fix commit (`465f025`) for a Vale false positive, so expect to look at that.

Re-capture the affected terminal output samples against a real 3.3.0 build rather than hand-editing them: `pear cores`, `pear gc cores`, `pear touch`, `pear stage`, `pear provision`, and the `pear multisig` sequence all print differently now.

---

## 7. Flagged: items that need a decision, not just an edit

1. **`v3.3.0` is not tagged yet.** All of the above is derived from `v3.3.0-rc.1`. The 3.2.0 precedent was to document against `main`/rc once upstream's CHANGELOG section had settled, then land it. Re-diff `v3.3.0-rc.1..v3.3.0` before merging, and do not bump `upstream-commits-state.json` to an rc SHA.
2. **`pear gc cores` confirmation prompt is a scripting break.** Non-breaking by upstream's classification, but any automation calling `pear gc cores` on a writable core now hangs on a prompt. This deserves more than a bullet — recommend a callout in `cli.mdx` and a `Changed` line in the Release Overview that names `--force` as the fix.
3. ~~**Clearing by app name needs a source of truth for names.**~~ **Resolved from source:** `getLinksByName` walks the corestore, skips content cores, and reads each metadata core's staged `/package.json`, matching its `name` field. Names are not unique — every matching application's cores are cleared. Documented in `cli.mdx` and `manage-installed-applications.mdx`.
4. ~~**The per-field hint corpus is new documentation-grade content.**~~ **Resolved:** fold in constraints only. `d8db6ce` added roughly 60 hint strings; the ones that state a constraint, interaction, or failure mode the reference page does not already cover become prose in `cli.mdx`. The ones that restate an existing flag description are skipped.
5. ~~**`--sidecar` is now hidden.**~~ **No action needed:** `cli.mdx` never documented the flag. Recorded as a `Changed` line in the Release Overview only.
6. **`scripts/upstream-releases-state.json` drifted.** It recorded `holepunchto/pear: v3.1.0` even though 3.2.0 shipped, so the release watcher had been under-reporting. The six repos reviewed in this pass were advanced by hand rather than by running `sync:upstream-releases`, which would have inserted draft blocks on top of the curated entry. Still worth finding out why the 3.2.0 pass did not advance it.

7. **Pin drift outside this release.** `check:upstream-pins` still reports `bare-collabora` 0.1.1 → 0.1.2, `bare-fs` 4.8.0 → 4.8.1, `bare-tls` 3.1.8 → 3.1.9, and an unresolved `corestore` pin. None of them are in Pear 3.3.0's lockfile bump, so they were left alone — they are independent drift for a separate pass.

8. **Pear bundles HyperDHT v6.33.1, npm latest is v6.33.2.** The reference page is pinned and audited at 6.33.2 (no API change between them); the Release Overview says which one Pear ships.

---

## 8. Suggested commit sequence

1. `chore: advance upstream release + commit state for 3.3.0`
2. `docs: document Pear CLI 3.3.0` — `cli.mdx`, `docs-versions.ts`, `release-overview/index.mdx`
3. `docs: refresh command output samples for 3.3.0` — `ship.mdx` and any multisig how-to samples
4. `docs: bump module reference pins for the 3.3.0 dependency bump` — per-page `upstreamVersion` frontmatter
5. `docs: fold new CLI field hints into the reference prose` — only if item 7.4 is decided in favor
