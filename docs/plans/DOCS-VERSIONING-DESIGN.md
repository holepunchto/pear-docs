# Docs versioning — design proposal

**Status:** design agreed · **Phases 0–1 implemented** 2026-07-29 (§9, §10); Phase 2 (dropdown) next · **Date:** 2026-07-29
**Context:** [V3-PLATFORM-DOCS-AUDIT.md](./V3-PLATFORM-DOCS-AUDIT.md) — the audit that motivated this

**Goal:** a version dropdown for the docs, without duplicating the API reference.

Everything about Fumadocs below was verified against the **installed** `fumadocs-ui@16.5.4`
/ `fumadocs-core@16.5.4` type definitions, not from memory or blog posts. Anything not
verified is called out explicitly as such.

---

## 0. Requirements (decided 2026-07-29)

| # | Requirement | Design consequence |
| --- | --- | --- |
| 1 | Support **every version from 3.0.0**, all within `3.x.x`; no breaking changes expected | Rules out snapshots (see §1.2). Additive change means `<Since>` covers all versions with one page. |
| 2 | `reference/bare/*` must also be versioned — **per module/page, not site-wide** | A **third** axis, sharing the module-ref mechanism |
| 3 | **Releases every 2 weeks** (~26/yr) | Version granularity must be **decoupled from release cadence**. Dropping a snapshot or dropdown entry per release is untenable. |
| 4 | Per-version **SEO** for modules that change often; **not** for stable pages like the Pear CLI | Splits the strategy: modules get real indexable per-version URLs, the platform gets one canonical URL |

Requirement 4 **inverts** the earlier draft of this document. It previously proposed
duplicating the platform pages and leaving modules single-copy. The opposite is correct:
modules need indexable per-version URLs, the platform does not.

---

## 1. The key reframe: three version axes, each handled differently

The reference pages are versioned by **three unrelated things**:

| Axis | Pages | LOC | Versioned by | Per-version URLs / SEO? |
| --- | --- | --- | --- | --- |
| **Pear platform** — `reference/pear/{cli,api,configuration,runtime}` | 4 | ~1.8k | Pear releases (3.0.0 → 3.1.0 → …) | **No** — one canonical URL (req. 4) |
| **Module API refs** — hypercore, hyperbee, hyperdrive, autobase, corestore, protomux, … | ~63 | ~12.3k | Their **own** npm versions | **Yes** (req. 4) |
| **Bare modules** — `reference/bare/*` | many | — | Each module's own version | **Yes**, per page (req. 2) |

These do not move together. hypercore is at 11.35.1 while Pear is at 3.1.0; **hypercore's
API does not change because a user downgrades Pear.** `bare-subprocess` went 5 → 6 *within a
single Pear minor*. So there is no single "docs version" that means anything.

**Therefore: never put module or bare refs behind a Pear version dropdown.** That
conflation is the entire source of the "duplicate 67 pages" problem.

### 1.1 Granularity ≠ release cadence — the load-bearing decision

With releases every 2 weeks, the naive reading of requirement 1 is “26 doc versions a year,
forever.” That is untenable and unnecessary. Two separate knobs:

- **Which versions we *support*** — every 3.x since 3.0.0 (req. 1).
- **How many distinct doc artefacts we *maintain*** — far fewer.

Collapse releases into **doc-states**: a new version only exists in the docs when the
documented surface actually changes. If 3.1.4 and 3.1.5 have an identical CLI surface they
are one doc-state. The audit already proved this is cheaply computable —
`diff cmd/index.js` between two tags gives the complete CLI surface delta, and the entire
3.0.1 → 3.1.0 delta was **exactly four items**.

For modules, the natural unit is the **major** (hypercore 11 vs 12), not the patch. 26
patch-level URLs per module would be duplicate content and would dilute the very SEO
requirement 4 asks for.

### 1.2 Why "no breaking changes" makes this cheap — with one caveat

If changes are additive, a single page annotated with `<Since v="3.1.0">` documents *every*
version from 3.0.0 onward at zero marginal cost. A reader on 3.0.7 reads the current page and
the badges tell them what they do not yet have. Requirement 1 is satisfied with **one page and
zero snapshots**.

⚠️ **Caveat: 3.x is not purely additive already.** The 3.0.1 → 3.1.0 delta removed three
`pear sidecar` flags (`--log-labels`, `--log-fields`, `--log-stacks`). So a reader on 3.0.x
needs to see content that no longer applies to 3.1.0. This is why `<Until>` is required
alongside `<Since>`, and why the "no breaking changes" assumption should not be baked into
the tooling as a hard invariant.

---

## 2. What Fumadocs 16.5.4 actually gives us (verified)

A version dropdown is a **first-class feature**. The mechanism is "root folders → sidebar
tabs → rendered as a dropdown":

| Primitive | Where | Signature / note |
| --- | --- | --- |
| `Folder.root?: boolean` | `fumadocs-core/page-tree` | marking a folder `root` makes it a separate sidebar root |
| `getSidebarTabs(tree, { transform })` | `fumadocs-ui/utils/get-sidebar-tabs` | derives `SidebarTab[]` from root folders |
| `SidebarTab` | same | `{ url, title, description?, icon?, urls?: Set<string>, unlisted? }` |
| `DocsLayout` `sidebar.tabs` | `fumadocs-ui/layouts/docs` | `SidebarTabWithProps[] \| GetSidebarTabsOptions \| false` — **accepts an explicit array** |
| `DocsLayout` `tabMode` | same | `'top' \| 'auto'` |
| `SidebarTabsDropdown({ options, placeholder })` | `fumadocs-ui/components/sidebar/tabs/dropdown` | the actual **dropdown** UI, plus `isTabActive(tab, pathname)` |

Two consequences specific to this repo:

1. **We can hand it an explicit tabs array.** Because `sidebar.tabs` accepts
   `SidebarTabWithProps[]`, we do **not** need to contort the content tree to get a
   dropdown. We can declare versions directly.
2. **`meta.json` is irrelevant here.** The sidebar is a hand-written 638-line `Node[]` in
   `src/lib/custom-tree.ts` (it deliberately bypasses Fumadocs' `meta.json` tree builder),
   so adding a `root: true` folder or an explicit tab list is a code change in one file.

**Not verified — must prototype before committing:** whether multiple `loader()` instances
with distinct `baseUrl`s (the pattern used for i18n and, by extension, versions) compose
cleanly with the single catch-all route `src/app/(docs)/[[...slug]]/page.tsx` and with the
hand-built `customTree`. This is the main technical unknown.

---

## 3. Options

| | Approach | Duplication | Old versions get fixes? | Effort |
| --- | --- | --- | --- | --- |
| **A** | Single-source MDX + conditional components (`<Since>` / `<Until>`); dropdown filters | none | yes, automatically | medium |
| **B** | Version the **data**: refgen emits a per-version command/flag model; tables render from it | none | yes, automatically | high |
| **C** | Snapshot **only** `reference/pear/` per version; freeze older ones read-only | 4 pages × N | no (frozen by design) | low–medium |
| **D** | Status quo: inline "New in 3.1.0" + Release Overview, no dropdown | none | yes | ~done |

### A — conditional components

```mdx
<Since v="3.1.0">`--vanity <vanity>` mines a key with the given prefix.</Since>
<Until v="3.1.0">`--log-labels`, `--log-fields`, `--log-stacks` are available.</Until>
```

- **Pro:** one copy of the truth. Fixes land for every version at once — which matters,
  because the audit found the *same* defect class repeated across pages; N copies would
  mean N times the rot.
- **Con:** needs a version context + components. Complex restructures (a command being
  split, renamed, or re-scoped) read awkwardly as inline conditionals.
- **Con:** hidden versions still ship in the HTML payload. Usually fine — arguably good for
  search — but it is *not* true snapshotting.

### B — version the data

The audit established that `diff cmd/index.js` between two tags yields the **complete**
CLI surface delta, mechanically and reliably:

```sh
gh api "repos/holepunchto/pear/contents/cmd/index.js?ref=v3.0.1"      -H "Accept: application/vnd.github.raw" > a.js
gh api "repos/holepunchto/pear/contents/cmd/index.js?ref=v3.1.0-rc.1" -H "Accept: application/vnd.github.raw" > b.js
diff -u a.js b.js
```

That is exactly the class of fact humans keep getting wrong (the audit fixed wrong flag
lists, a wrong default, and a documented option that did not exist). Extending refgen to
emit a per-version flag/command model and rendering the tables from it makes drift
*structurally impossible* rather than a review burden.

- **Pro:** highest durable payoff; kills the recurring defect class at the root.
- **Con:** biggest build; only covers the mechanical parts. Prose still needs A's
  `<Since>`/`<Until>` for behavioural notes.

### C — snapshot only the platform pages

- **Pro:** simplest mental model; a genuine version switch; only 4 pages per version.
- **Pro:** freezing old versions is *honest* — it matches reality (nobody is going to
  re-audit 3.0.1 docs) and caps maintenance at zero.
- **Con:** old versions never receive corrections, including for defects we already know
  about.
- **Con:** each snapshot needs duplicated `customTree` entries (URLs are hardcoded) and
  touches the path-based tooling in §6.

---

## 4. Recommendation — a split strategy, driven by requirement 4

**Platform → A (one page, no per-version URLs). Modules & bare → C at major granularity
(real indexable URLs). B underneath both, later.**

| Axis | Mechanism | URLs | Why |
| --- | --- | --- | --- |
| Pear platform | **A** — one page + `<Since>` / `<Until>`; dropdown swaps the *view*, not the URL | one canonical (`/reference/pear/cli`) | req. 4 says no per-version SEO here; additive 3.x means one page covers 3.0.0→now (§1.2) |
| Module refs | **C at major** — a page per documented major | `/reference/building-blocks/hypercore` (latest, canonical) + `…/hypercore/v11` | req. 4 wants these indexed; majors are genuinely different APIs people search for |
| Bare modules | same as module refs, **per page** (req. 2) | per module | `bare-subprocess` 5→6 inside one Pear minor proves the axis is per module |

This is the only combination that satisfies all four requirements at once: it gives real
indexable URLs exactly where SEO was asked for, avoids 26-snapshots-a-year by versioning at
major/doc-state granularity, and keeps the 4 stable platform pages single-source so the
audit's corrections never have to be applied N times.

**Do not duplicate the platform pages.** With 2-week releases that would be ~26 copies/year
of the pages we just spent an entire audit correcting — and req. 4 explicitly does not want
them indexed separately.

### URL strategy

Now settled by requirement 4, differently per axis:

| Axis | URL scheme | Canonical / indexing |
| --- | --- | --- |
| Platform | single path; version selected via query param (`?v=3.0`), dropdown lists **minors** | one canonical (query strings are not part of `page.url`, so all versions collapse to it automatically). Prerelease views set `noIndex: true`. |
| Modules / bare | real path per major (`…/hypercore/v11`), minted **only when a major lands** | each version **self-canonical** — which is what req. 4 wants. Note there is no canonical-override mechanism (see §7 Q9). |

`src/app/sitemap.ts` calls `buildDocsSitemap(source, …)` — the sitemap is derived from the
**`source` loader**, so anything registered in the loader is indexed automatically. That
falls out exactly right: platform pages stay one loader entry (one sitemap URL), module
version pages are separate loader entries (indexed individually). **To confirm:** how
`@tetherto/docs-seo-next` sets canonicals, and whether a page can be loader-registered but
sitemap-excluded — needed if we ever want an unindexed older platform view.

### Phased plan

| Phase | Work | Outcome |
| --- | --- | --- |
| **0** ✅ | "Documented against" marker + semver-aware drift check (§5) across module **and** bare refs | **DONE 2026-07-29** — see §9 |
| **1** ✅ | Build `<Since>` / `<Until>` + a version context; convert `cli.mdx`'s existing inline markers | **DONE 2026-07-29** — see §10 |
| **2** | Add the platform version dropdown — **spec: [PHASE-2-VERSION-DROPDOWN-SPEC.md](./PHASE-2-VERSION-DROPDOWN-SPEC.md)** | Dropdown ships on the 4 platform pages |
| **3** | Define the doc-state list generator: derive which Pear versions are distinct by diffing `cmd/index.js` between tags | Dropdown lists doc-states, not 26 releases/yr |
| **4** | Introduce per-major URLs for one module (hypercore, which has live drift) as the pattern | Validates per-version SEO before rolling out |
| **5** | Extend refgen to emit per-version models; render flag/API tables from them | Drift structurally impossible rather than review-dependent |

Phase 1 is cheap **because the audit already did the semantic work**: `cli.mdx` carries
hand-written *New in 3.1.0* / *Changed in 3.1.0* annotations on exactly the four deltas
(`pear cores`, `touch --vanity`, `multisig link --vanity`, the sidecar log-flag removal).
Those are the conditionals — they only need to become components.

Phase 3 matters more than it looks: it is what stops the 2-week cadence from turning into
26 dropdown entries a year.

---

## 5. Module refs: "documented against" marker + drift check

Independent of the dropdown, and **ready to build now**.

Each module ref page pins its `[src]` links to an upstream tag. Surface that pin in the page
UI, and add CI to compare it against npm latest.

**Prototype already run** — extracts each page's pinned tag from its `[src]` URLs and
compares to `npm view <pkg> version`:

```
page                       repo                       pinned       npm latest   drift
autobase.mdx               autobase                   v7.28.1      7.28.1
hyperbee.mdx               hyperbee                   v2.27.3      2.27.3
hypercore.mdx              hypercore                  v11.34.0     11.35.1       <-- DRIFT
hyperdht.mdx               hyperdht                   v6.33.0      6.33.0
hyperdrive.mdx             hyperdrive                 v13.3.3      13.3.3
hyperswarm.mdx             hyperswarm                 v4.17.0      4.17.0
compact-encoding.mdx       compact-encoding           v3.3.0       3.3.0
corestore.mdx              corestore                  v7.11.0      7.12.0        <-- DRIFT
localdrive.mdx             localdrive                 v2.2.1       2.2.1
mirrordrive.mdx            mirror-drive               v1.14.2      1.14.2
protomux.mdx               protomux                   v3.11.0      3.11.0
secretstream.mdx           hyperswarm-secret-stream   v6.9.1       6.9.1

2 of 12 pinned versions are behind npm latest
```

Design notes:

- **Warn, don't fail.** Pinning to an older tag is legitimate; the page is *correct* for its
  pin. Drift means “re-audit due,” not “broken.” Suggest a scheduled job (there is already
  a `.github/workflows/upstream-releases.yml`) rather than blocking PRs.
- **Semver-aware severity — essential at a 2-week cadence.** With releases that frequent, a
  flat “is it equal?” check becomes noise that gets ignored within a month. Grade it:

  | Drift | Severity | Action |
  | --- | --- | --- |
  | patch (`11.35.0` → `11.35.1`) | info | bump the pin; re-verify citations only if line numbers moved |
  | minor (`7.11.0` → `7.12.0`) | warn | re-audit defaults/signatures — new API surface is likely |
  | **major** (`11.x` → `12.x`) | action | **new documented major** → new versioned URL per §4, *not* a pin bump |
- **This check feeds the module version axis.** A major bump is precisely the trigger for
  creating a new per-major page, so it is not just hygiene — it is the input to the
  versioning workflow.
- **Must cover `reference/bare/*` too** (req. 2). Those pages come from the separate
  `bare-refgen` pipeline; confirm how they pin upstream before assuming the same
  `[src]`-URL parsing applies.
- **Slug ≠ package name.** Two audit-confirmed traps must be encoded in the mapping:
  `mirrordrive` → **`mirror-drive`**, `secretstream` → **`@hyperswarm/secret-stream`**.
  Derive the mapping from the GitHub repo in the `[src]` URL, not from the filename.
- **Where to source the pin:** parse it from the existing `[src]` URLs (no new frontmatter
  needed, single source of truth, and it catches a page whose links are internally
  inconsistent). Alternative: a `upstreamVersion` frontmatter field — more explicit, but
  can disagree with the links.
- Fits naturally alongside `scripts/check-*.ts`; suggested `scripts/check-upstream-pins.ts`
  and `npm run check:upstream-pins`.

---

## 6. Repo-specific costs (verified)

Things that make snapshot-style versioning more expensive **here** than in a stock Fumadocs
site:

- **`src/lib/custom-tree.ts` is 638 hand-written lines with hardcoded URLs.** Every
  duplicated page needs duplicated tree entries. (It also means adding a dropdown is easy —
  cuts both ways.)
- **`check-doctypes.ts` rules are path-based.** It already prints
  `content/release-overview/index.mdx: no rule for this path (skipped)`; new version
  directories need new rules or they silently skip validation.
- **`check-internal-links.ts`** currently validates 137 files; snapshots multiply both the
  surface and the chance of a cross-version link pointing at the wrong version.
- **LLM/SEO artefacts**: `generate-llm-md-files.ts`, `llms.txt` / `llms-full.txt`, plus
  per-page OG images and JSON-LD via `@tetherto/docs-seo-*`. N copies need explicit
  canonicals or they split search authority and bloat the LLM corpus with near-duplicates.
- **⚠️ `gen-curated.ts --check` writes despite its name** — it rewrote five
  `generated/refs/*/curated-preview.mdx` files (−1730/+467) during the audit. Any versioning
  work touching refgen must not wire that into CI naively. See the audit doc.
- **PRs target `published`**, not `main` — relevant when planning a multi-PR rollout.

---

## 6b. `reference/bare/*` — requirement 2 has a prerequisite

Requirement 2 asks for per-module versioning of the bare refs. Measured state of those 37
module pages:

| Property | Count |
| --- | --- |
| Module pages | 37 |
| …with **any** upstream version pin (`blob/v…`) | **0** |
| …declaring a minimum, for example “requires Bare `>=1.7.0`” | 13 |
| …using raw `<mark style={{…}}>` for the stability badge | 26 |
| …using the `<Status>` component | **0** |

Two consequences:

1. **There is nothing to drift-check yet.** Unlike the module refs — which pin `[src]` links
   to a tag, letting §5's check parse the pin — bare pages link to the *repo root* with no
   version. So a pin source must be established first. Options: add an `upstreamVersion`
   frontmatter field (explicit, cheap, and works even for pages with no `[src]` links), or
   have `bare-refgen` emit pinned `[src]` links the way `refgen` does.

   **Decided (§7 #8): both, sequenced.** `upstreamVersion` frontmatter lands first — it is
   validated by the existing zod schema, works despite these pages having no line-level
   citations, and unblocks the drift check immediately. `[src]` citations for bare follow as a
   separate project with verification designed in from the start, rather than importing the
   attribution-bug class that produced ~14 wrong citations on the pages that already have
   them.
2. **The stability badge is inconsistent repo-wide.** 26 of 37 bare pages (29 files overall)
   still use hand-copied `<mark style={{…}}>`, while `src/components/Status.tsx` exists
   specifically to replace it — its own docstring says so ("Replaces the hand-copied `<mark
   style={{…}}>` markup so the palette lives in one place"). Any per-page version marker
   should be a component, and it would be a mistake to add a *second* piece of hand-copied
   inline-styled markup next to the first. Migrating `<mark>` → `<Status>` is a natural,
   low-risk precursor to Phase 0.

Note the 13 pages declaring "requires Bare `>=x.y.z`" are documenting a *compatibility
floor*, which is a different fact from “documented against version x.y.z”. Both are useful;
do not conflate them in the marker.

---

## 7. Resolved decisions and remaining questions

### Resolved 2026-07-29

| Question | Answer | Where it landed |
| --- | --- | --- |
| Which versions must stay browsable? | Every 3.x from **3.0.0**; no breaking changes expected | §0 req. 1, §1.2 |
| Does `reference/bare/*` need its own axis? | **Yes** — per module/page | §1 (third axis), §6b |
| Release cadence? | **Every 2 weeks** | §1.1 — forces doc-state granularity |
| Per-version SEO? | Modules **yes**; stable platform pages (Pear CLI) **no** | §4 split strategy |

### Resolved — second round (2026-07-29)

| # | Question | Decision |
| --- | --- | --- |
| 5 | Dropdown granularity | **Minor-level** — `3.0`, `3.1`. Patch-exact facts stay in `<Since v="3.0.4">` badges, so precision is not traded away for a shorter list. ~4–6 entries/yr instead of 26. |
| 6 | Which modules get per-version URLs | **Reactive** — none until a **major** lands. The drift check's `major` severity is the trigger: mint the new version's URL, freeze the outgoing major's page. Avoids ~100 thin near-duplicate URLs that would work *against* req. 4. |
| 7 | Default platform version | **Latest stable** (3.0.1 today; 3.1.0 once it finals), which is also the canonical. Prereleases selectable in the dropdown, badged, and **not indexed**. |
| 8 | Bare pin source | **Both, sequenced** — `upstreamVersion` frontmatter now to unblock the drift check; `[src]` citations for bare as a separate later project with verification designed in. |
| 9 | Can a page be loader-registered but not indexed? | **Yes — verified.** No new plumbing needed; see below. |

#### Q9 verified — `noIndex` already does what decision 7 needs

`@tetherto/docs-seo-core` computes `indexable = !(page.data.noIndex === true)`, and:

- `buildDocsSitemap` (`@tetherto/docs-seo-next/src/sitemap.ts`) does `if (!state.indexable) continue;`
- `buildJsonLdGraph` returns `null` when not indexable

So a prerelease view can live in the loader, be reachable from the dropdown, and stay out of
both the sitemap and the structured data by setting `noIndex: true` — a field **already** in
the zod frontmatter schema.

⚠️ **Limitation found while verifying:** `canonicalUrl` is derived from each page's *own* URL
(`toAbsoluteUrl(metadataBase, normalizePathname(page.url))`), so it is always
**self-canonical** — there is no override to point one page's canonical at another. That
happens to fit this design: modules *want* separate indexing (req. 4), and the platform's
query-param versions collapse to one canonical automatically because query strings are not
part of `page.url`. But if we ever want `…/hypercore/v11` to canonicalise to `…/hypercore`,
that needs an upstream change in `@tetherto/docs-seo-core`.

### Consequences to action

1. **Today's docs contradict decision 7.** `cli.mdx` presents 3.1.0 as current and pins all
   14 `cmd/*.js` source links to `v3.1.0-rc.1`. Under "default = latest stable" the default
   view should be 3.0.1 until 3.1.0 finals. Given the 2-week cadence, the cheapest resolution
   may be to **wait for 3.1.0 final** rather than re-pin twice — but that should be a
   conscious choice, not drift.
2. **Decision 6 depends on Phase 0.** Its trigger is a major bump detected by the drift
   check, which cannot see bare modules at all until they have pins (§6b). Phase 0 is a hard
   prerequisite, not a parallel nice-to-have.
3. **`bare-subprocess` is the likely first test case** (5 → 6 already happened), but we
   cannot confirm which major its page documents until it has an `upstreamVersion`.

### Still open

- Nothing blocking. Remaining unknown is the §2 technical one: whether multiple `loader()`
  instances with distinct `baseUrl`s compose with the single catch-all route and the
  hand-built `customTree`. Phase 2 is scoped to de-risk exactly that.

---

## Appendix — verification commands

```sh
# Fumadocs primitives (installed 16.5.4)
cat node_modules/fumadocs-ui/dist/components/sidebar/tabs/index.d.ts
cat node_modules/fumadocs-ui/dist/components/sidebar/tabs/dropdown.d.ts
grep -n "tabs\|tabMode" node_modules/fumadocs-ui/dist/layouts/docs/index.d.ts
sed -n '/interface Folder/,/^}/p' node_modules/fumadocs-core/dist/definitions-*.d.ts

# Scope measurement
find content/reference -name '*.mdx' | wc -l
find content/reference -name '*.mdx' | xargs wc -l | tail -1
```

```sh
# Bare refs: pin coverage + badge consistency (req. 2 prerequisite, §6b)
ls content/reference/bare/modules/*.mdx | wc -l
grep -l 'blob/v'     content/reference/bare/modules/*.mdx | wc -l   # -> 0, no pins to check
grep -l '<mark style' content/reference/bare/modules/*.mdx | wc -l  # -> 26 hand-copied badges
grep -rl '<mark style' content/ | wc -l                             # -> 29 files repo-wide

# SEO plumbing (§4)
cat src/app/sitemap.ts        # buildDocsSitemap(source, …) -> sitemap derives from the loader
```

---

## 9. Phase 0 — implemented 2026-07-29

| Piece | Where |
| --- | --- |
| `upstreamVersion` frontmatter field (zod-validated, bare SemVer, no leading `v`) | `source.config.ts` |
| Semver-graded drift check | `scripts/check-upstream-pins.ts` |
| npm script | `npm run check:upstream-pins` |
| "Documented against vX.Y.Z" marker | `src/components/UpstreamVersion.tsx`, rendered from frontmatter in `src/app/(docs)/[[...slug]]/page.tsx` |
| Scheduled, non-failing CI report | `.github/workflows/upstream-releases.yml` (daily; writes to the job summary) |
| Backfilled pins | 12 module ref pages, derived from the tag already in their `[src]` links |

Baseline output:

```
⚠️  MINOR drift — re-audit due
     reference/building-blocks/hypercore.mdx   hypercore  11.34.0 → 11.35.1  [frontmatter]
     reference/helpers/corestore.mdx           corestore  7.11.0  → 7.12.0   [frontmatter]
⬜ no pin yet (backlog): 40 page(s)   37 reference/bare/modules/ · 3 reference/bare/
✅ up to date: 10 page(s)

Checked 52 reference page(s): 10 current, 0 patch, 2 minor, 0 major, 40 unpinned, 0 unresolved
```

### Design choices worth knowing

- **Pin resolution is two-tier**: `upstreamVersion` frontmatter first, falling back to the
  tag in a page's `[src]` links. The fallback means the module refs were covered *before*
  backfill, and after backfill they report `[frontmatter]` — so the authoritative source is
  now explicit rather than inferred from URLs.
- **Advisory, not a gate.** Exits 0 by default; `--strict` exits 1 on minor/major for a job
  that should open an issue. The CI step uses `continue-on-error` and no `--strict`, because
  an older pin is *correct* for the version it documents.
- **Unpinned pages are reported, not skipped** — they are the actionable backlog. Grouped by
  directory rather than listed individually so the 40 don't drown the two real findings.
- **Conflicting tags within one page are surfaced** as their own warning. A page citing two
  different tags is itself a defect (the audit found exactly that class).
- **npm names are derived from the GitHub repo in the page's links, not the filename**, with
  a two-entry override map for the audit-confirmed traps (`mirror-drive`,
  `@hyperswarm/secret-stream`).
- **A pin ahead of npm latest is not drift** — that is a legitimately pinned prerelease, so
  it grades `ok`.

### Verified

- `npm run types:check` passes — confirms the new field flows through to `page.data`.
- The marker **renders at runtime**: the hypercore page's SSR payload contains
  `"Documented against"` followed by `["v","11.34.0"]`. (A naive grep for `>v11.34.0<` finds
  nothing because React splits the text node — check the RSC payload, not the raw string.)
- `vale`, `check-internal-links`, `check-includes`, `check-doctypes`, `eslint` all clean.
- Workflow YAML parses.

### Deliberately not done

- **Bare pages were left unpinned (40) — but for a different reason than first assumed.**

  ⚠️ **Correction.** An earlier draft of this section claimed there is no `bare-refgen` in
  the repo. That is **false and branch-scoped**: `scripts/bare-refgen/` exists on
  **`feat/bare-docs`** (not on this branch), and it already maintains
  `scripts/bare-refgen/versions.json` — a per-module pin for the whole bare surface
  (`bare-events: 2.9.1`, `bare-crypto: 1.15.3`, …) — plus a `poll.ts` (`bare-refs:poll`)
  that compares it against npm `latest`. Verify with
  `git show feat/bare-docs:scripts/bare-refgen/versions.json`.

  So the versions *are* recoverable — but they must **not** be copied onto the pages that are
  live today, because they describe different pages. `versions.json` records what the
  **generated** bare pages were built from; the 37 pages currently under
  `content/reference/bare/modules/` are the older **hand-written** ones, and the generated
  69-page cutover is committed on `feat/bare-docs` and not yet merged. Backfilling one set's
  pins from the other's manifest would assert a fact that is not true of the live pages.

  **Recommended sequencing instead:** leave them unpinned and let the pin arrive with the
  generated cutover. Those generated pages emit per-symbol links of the form
  `repoUrl/blob/v<version>/<file>#L<line>`, so `check-upstream-pins`' existing `[src]-link`
  fallback will pick them up **for free** on merge, with no extra work.

  ⚠️ **Overlap to resolve before Phase 1:** `bare-refs:poll` (on `feat/bare-docs`) and
  `check:upstream-pins` (this branch) now solve overlapping problems from different angles —
  one drives regeneration, the other reports re-audit debt. Reconcile them rather than
  shipping two competing version-drift mechanisms; the natural split is *poll decides what to
  regenerate, the pin check reports what a human must re-verify*.
- **`<mark style>` → `<Status>` migration** (26 of 37 bare pages, 29 files repo-wide) — noted
  in §6b as a precursor, still outstanding.

---

## 10. Phase 1 — implemented 2026-07-29

| Piece | Where |
| --- | --- |
| `<Since>` / `<Until>` + version context + `compareVersions` | `src/components/version/index.tsx` |
| MDX registration (usable without imports) | `src/mdx-components.tsx` |
| Provider wrapping the docs tree | `src/app/(docs)/[[...slug]]/layout.tsx` |
| Converted markers | `content/reference/pear/cli.mdx` — 6 sites |

`?v=` is already read (client-side, since the site is a static export), so Phase 2 only has
to add the dropdown UI that sets it.

### ⚠️ Semantics finding: childless markers must never be hidden

The first implementation hid any non-applicable marker. Testing `?v=3.0.1` showed why that is
wrong: the `pear cores` section and the `--vanity` prose **stayed visible while their "New in
3.1.0" badges disappeared** — removing the warning but keeping the content, which is strictly
worse than showing both.

Cause: a self-closing `<Since v="3.1.0" />` sits *beside* the content it describes, not around
it. So the rule is now:

| Form | Behaviour |
| --- | --- |
| `<Since v="3.1.0" />` (no children) | **Annotation** — always rendered, never filtered |
| `<Since v="3.1.0">…</Since>` (children) | **Gate** — children hidden for versions they don't apply to |

Verified in a real browser with a temporary sentinel, both directions:

| Selection | `<Until v="3.1.0">` | `<Since v="3.1.0">` |
| --- | --- | --- |
| `?v=3.0.1` | visible ✅ | hidden ✅ |
| `?v=3.1.0` | hidden ✅ | visible ✅ |
| none | visible | visible |

**Consequence for Phase 2:** true section-level gating — hiding a whole `##` heading *and* its
body — is still unsolved. A wrapper cannot span sibling MDX blocks, so it needs either explicit
wrapping of each section's content or a remark plugin that groups heading + body. Decide this
before wiring the dropdown, otherwise selecting "3.0" will show 3.1-only commands with a badge
rather than hiding them. Annotate mode remains correct and is what the canonical page indexes.

### Other notes

- Markers are **inline** (`<span>`) on purpose — they are used inside paragraphs and inside
  `<Callout>` bodies, where a block element would be invalid nesting.
- `compareVersions` tolerates partial versions (`3.1`, for the minor-level dropdown of decision
  5) and ignores prerelease suffixes, so `3.1.0-rc.1` sorts as `3.1.0` — a reader on an RC sees
  the features of the release it is a candidate for.
- The provider reads `?v=` in an effect, never during render, so the static HTML stays
  selection-free and cacheable, and the default (annotate) output is what gets indexed.
- `label` overrides the badge text — used for `<Until v="3.1.0" label="Fixed in 3.1.0" />`,
  where the change was a bug fix rather than a removal.

### Verified

`types:check`, `eslint` (one pre-existing unrelated warning in `MdxImg`), `vale`,
`check-internal-links`, `check-includes`, `check-doctypes`, `check-upstream-pins` all clean;
badges render in SSR HTML; gate behaviour confirmed in-browser.

---

## 11. Phase 2 — implemented 2026-07-29

The platform version dropdown, per
[PHASE-2-VERSION-DROPDOWN-SPEC.md](./PHASE-2-VERSION-DROPDOWN-SPEC.md).

| Piece | Where |
| --- | --- |
| Version list, `compareVersions`, `isGateHidden`, scope test | `src/lib/docs-versions.ts` |
| Provider with a setter (`useSetDocsVersion`) | `src/components/version/index.tsx` |
| Dropdown (sidebar banner, platform pages only) | `src/components/version/dropdown.tsx` |
| Block gate — renders always, decides nothing | `src/components/version/gate.tsx` |
| The one client consumer: content + TOC | `src/components/version/filter.tsx` |
| `<VersionSection>` pragma → `<VersionGate>` | `src/lib/remark-version-sections.ts` |
| Single fence rows | `src/lib/shiki-version-lines.ts` |
| `display: contents` / `display: none` rules | `src/app/global.css` |

### The §5 decision: option C, and the experiment that settled it

§5 flagged one unverified assumption as decisive — whether headings inside a JSX block still
land in `page.data.toc`. **They do.** `remarkHeading` (`fumadocs-core/mdx-plugins`) collects
headings with `visit(root, 'heading')`, which recurses into `mdxJsxFlowElement` children, so a
gated section's headings reach the TOC exactly as before. Confirmed by running the real plugin
over a fixture: a `##` and a `###` wrapped in a JSX block both appeared in the extracted TOC.

That inverts the reasoning in §5. The TOC is *never* filtered by wrapping, whichever option is
chosen, so **the TOC has to be filtered on the client in all three** — which removes option
B's main advantage and makes option C strictly the simplest thing that works.

**Chosen: (C).** Gated content always renders, carrying `data-version-since` /
`data-version-until`; one client effect decides what to hide. Consequences:

- The exported HTML contains **every** version's content under the single canonical URL, which
  is what requirement 4 asks for — verified: `data-version-hidden` appears in **0** exported
  files, so no selection is ever baked in.
- Filtering is a class flip, so there is no re-render, no hydration mismatch, and no
  static-export trap.
- Hidden content is present-but-`display: none`. Acceptable because annotate mode *is* the
  canonical view by design; `display: none` also keeps it out of find-in-page and the
  accessibility tree, so a filtered reader does not stumble over it.

### Three gating tools, one contract

Everything below emits the same two data attributes, so `<VersionFilter>` is the only consumer:

| Tool | Gates | Why it exists |
| --- | --- | --- |
| `<Since v="…" />` childless | nothing — pure badge | §10: it is the warning, never hide it |
| `<VersionSection since="…" />` | the whole section it sits under | one line that cannot drift out of sync with the section's extent |
| `<VersionGate since="…">…</…>` | an arbitrary block | for a `<Callout>` or paragraph that is not a section |
| `[!version since=…]` in a fence | one row | a flag added to `--help` output is a claim about one line, and no JSX can wrap it |

`<VersionSection>` grouping runs to the next heading of the same level or higher, so a gated
`##` swallows its `###` subsections and stops at the next `##`. The pragma is **explicit** on
purpose: §5(B) suggested inferring the extent from a leading `<Since>` badge, but that badge
also appears mid-paragraph as an annotation, so inferring would silently gate whole sections an
author only meant to annotate — the same class of bug as §10.

`display: contents` on the gate wrapper makes it layout-transparent. Measured: a gated `<h2>`
and an ungated one are dimensionally identical (825×32, `margin: 48px 0 24px`).

### Decided by the maintainer

**History: `pushState`,** not `replaceState` (the spec's stated preference). Each selection gets
its own history entry, so back/forward steps through selections. `popstate` covers the
back/forward direction; it does **not** fire for `pushState`, which is why the setter updates
React state directly as well.

### Notes for Phase 3 and beyond

- `DOCS_VERSIONS` in `src/lib/docs-versions.ts` is the hand-maintained literal Phase 3 replaces.
  Consumers read `DOCS_VERSIONS_NEWEST_FIRST` (sorted at module scope), so Phase 3's generator
  may emit entries in any order. `npm run check:docs-versions` pins the invariants.
- The dropdown writes the **label** (`?v=3.1`) for clean shareable URLs, and
  `resolveDocsVersion` maps any version-ish value onto its doc-state, so `?v=3.0.1` selects
  "3.0". `<Since>`/`<Until>` still compare the raw string, so a patch-level link stays precise.
- The provider re-syncs from the URL on `pathname` change. In-site links carry no `?v=`, so a
  selection deliberately **does not** follow the reader to a sibling page. Carrying it across
  navigation would mean rewriting link hrefs — out of scope here, and worth a UX decision.
- Generated `.md` / copy-page output contains the raw `<VersionGate>` wrappers and
  `[!version …]` markers. That is pre-existing behaviour for JSX in this repo (`<Callout>`,
  `<Status>`, `<Tabs>` already leak the same way — 24 occurrences in `cli.mdx` before this
  change), not a new class of problem, but it is the natural thing to fix if LLM output quality
  is ever tightened.

### Verified

All §8 acceptance criteria, against **both** `next dev` and the served static export (`out/`):

- Dropdown on exactly the four `/reference/pear/*` pages, and **0** other exported pages.
- Default renders everything with badges; `?v=3.0` hides `pear cores`, persisted-logs and both
  `--vanity` rows (fence row *and* prose) while **showing** the removed sidecar log flags;
  `?v=3.1` inverts all of it.
- TOC drops exactly `#pear-cores` and `#persisted-logs` (25 of 27 entries visible).
- Shared `?v=3.0` link loads pre-filtered; back/forward re-filters; changing selection keeps
  scroll position (~8400px, not 0 — browser scroll anchoring absorbs the reflow).
- `npm run build`, `types:check`, `vale`, `check-internal-links`, `check-includes`,
  `check-doctypes`, `check-upstream-pins` clean. Sitemap unchanged: 137 entries, one per
  platform page, no `?v=`, self-canonical. No console errors; light and dark both correct.

⚠️ **Trap found the hard way:** a stray ` ``` ` inside the `{/* maintainer note */}` in
`cli.mdx` broke `check-internal-links` for four anchors — MDX ignores it inside a comment, but
the checker's markdown parse treats it as opening a fence and swallows later headings. Keep
triple backticks out of MDX comments.

### 11.1 Post-merge review round

Merged `feat/add-json-flags-and-new-version-updates` (CLI reference regrouped by task, so every
command dropped from `##` to `###`). Git's auto-merge **duplicated** `pear cores` and
`Persisted logs`: the reorder on one side and the added pragma on the other touched the same
heading blocks. Resolved by taking the restructured file wholesale and re-applying the six
markers, then diffing against upstream to prove the only delta was those markers. The pragma is
depth-relative, so demotion needed no mechanism change.

An adversarial review panel then found four defects worth fixing. Two were **silent** — the
kind that look fine in every manual check:

1. **TOC filtering never ran below 1280px.** `TOC_CONTAINERS` listed `#nd-tocnav`, which does
   not exist in fumadocs-ui 16.5.4 (zero hits in `dist`). `#nd-toc` carries `max-xl:hidden`, so
   under 1280px the only TOC on screen is `[data-toc-popover-content]` — never touched. The
   original verification passed because it was done at 1440px. Fixed, plus a scoped
   `MutationObserver`, because Radix mounts the popover on first open.
2. **An out-of-range `?v=` filtered the page while the dropdown said "All versions".**
   `readVersionFromLocation` accepted any `\d+\.\d+`, so `?v=2.9` hid every `since` gate while
   `resolveDocsVersion` returned `null` for the control — and the reader could not undo it,
   because the `<select>` already sat on that option so choosing it fired no `change`. The
   reader now degrades to annotate mode. **Lesson: the filter and the control must read the
   selection through the same resolver.**
3. **Hidden headings kept their ids,** so `useAnchorObserver`'s fallback
   (`fumadocs-core/dist/toc.js`) could lock the TOC highlight onto an invisible heading: it
   resolves watched ids with `getElementById`, which returns `display: none` elements, and their
   all-zero rect wins the "closest to viewport top" test. Ids are now parked in
   `data-version-id` while hidden.
4. **A well-formed but unknown version silently disabled a gate.** `since="3.10"` (typo for
   `3.1.0`) compiled to a `data-version-since` no selection can match, leaving the section
   visible in every version with no error. Now caught two ways: the plugin rejects
   non-numeric values at build time, and `check:docs-versions` rejects anything that is not a
   declared doc-state.

`scripts/check-docs-versions.ts` (`npm run check:docs-versions`) is the safety net this feature
lacked — there is no test runner in the repo, so it follows the existing `check:*` pattern. It
validates every `<VersionSection>`, `<VersionGate>`, `<Since>`, `<Until>` and `[!version …]`
marker in `content/` against `DOCS_VERSIONS`, and pins the list's own invariants: exactly one
`stable`, unique labels/values, and each `label` comparing equal to its `value` (otherwise
selecting it would resolve to a different doc-state). Each failure class was verified by
deliberately introducing it. It also flags an **inert** gate — a `since` at or below the oldest
doc-state can never hide anything, so the marker is misleading.

Also fixed: `readAttrs` collected errors it could never report (`VFile#fail` returns `never`, so
every `continue` was dead) and now reports all problems with one pragma at once; the guard loop
was off by one (N pragmas need N+1 scans, so a file with exactly 500 failed with a false "this
is a bug"); `STABLE_DOCS_VERSION` was deleted as dead code.

### 11.2 Fence-marker leak fixed, and the dropdown moved into the article

**The `[!version …]` leak is fixed.** It used to survive into the processed markdown *inside a
code fence*, so `out/reference/pear/cli.md` presented it as literal `pear touch --help` output —
unlike the `<VersionGate>` wrappers, which a consumer discounts as tags around content, that
invents text inside a block claiming to be verbatim.

The cause was staging: `postprocess.includeProcessedMarkdown` serializes the **mdast**, and Shiki
is a **rehype** transformer, so anything stripped in Shiki's `preprocess` was already baked into
the `.md`. `src/lib/remark-version-code-lines.ts` now moves the marker at the remark stage, out of
the fence body and onto the info line, and `shiki-version-lines.ts` reads it back from
`this.options.meta.__raw` — the same channel `transformerMetaHighlight` uses for `{16,22-23}`:

```text
  --vanity <vanity>   Generate a vanity link  [!version since=3.1.0]   <- authored
```
becomes ```` ```text version-lines="2:since:3.1.0" ```` with a clean body. Authors keep the inline
form because it is **self-anchoring** — a line number in the info string would silently drift the
moment a flag is inserted above it.

⚠️ The pass forces `lang` to `text` on unlabelled fences. mdast serializes `meta` straight after
`lang`, so with `lang` empty the info line would read ```` ``` version-lines="…" ```` and
re-parsing it would take the meta as the language. `text` renders identically to no language.

Verified in the real export: `out/reference/pear/cli.md:107` and `:231` now read plain
`--vanity <vanity>   Generate a vanity link with this prefix`. The one remaining `[!version` in
that file is the maintainer note documenting the syntax, which is correct.

**The dropdown moved from `sidebar.banner` into the article, beside the `<h1>`.** The banner hid
it exactly when it mattered: Fumadocs renders it inside `SidebarContent`, and below 768px the
sidebar becomes a drawer — so on a phone the control *and* the only "you are reading a filtered
page" signal both vanished while `?v=` kept filtering. Confirmed at 375px: it wraps under the
heading, stays visible, and filtering still works end to end.

Two consequences:

- The provider no longer *needs* to wrap `DocsLayout`, since nothing version-aware is passed to
  it any more. It still does, deliberately — it costs nothing and stops the trap resurfacing if a
  banner or tab is ever added.
- Scoping is now enforced twice: server-side in `page.tsx` via `isPlatformPath(page.url)`, so the
  component is not shipped to the other 143 pages at all, and again inside the component.

That move also closed the aria gap: the hint is now `aria-describedby`-linked to the `<select>`
and carries `role="status"`, so a screen reader announces what changed instead of the page
silently losing sections (WCAG 2.1 SC 4.1.3).

The review panel died on rate limits twice, and both times the same two dimensions were the
casualties, so **`filter-client` and `spec-compliance` were audited by hand**. That found two
more, both fixed:

- `filter.tsx` decided id-parking per gate *while* iterating, so a gate that applies to the
  selection restored its heading ids even when an outer gate kept the subtree `display: none` —
  reintroducing the invisible-but-addressable heading for NESTED gates. Now two passes: mark
  every gate, then ask `closest()` per id, which is order-independent. `cli.mdx` has no nested
  gate yet, so it was verified by injecting one (inner `until="3.1.0"` inside outer
  `since="3.1.0"`, selected 3.0).
- A pragma inline on the heading line parses as `mdxJsxTextElement`, so `isPragma` never matched
  and the rewrite silently did not happen. The build still failed (`VersionSection` is
  deliberately unregistered) but with a message pointing nowhere near the mistake.

⚠️ **Trap: never run `npm run build` while `next dev` is running.** Both use `out/` (dev under
`out/dev/`), so the build deletes the manifests the dev server is holding open and every request
starts returning `Internal Server Error` with `ENOENT … out/dev/routes-manifest.json`. The build
itself succeeds, so it reads like a code regression when it is only a directory collision. Run
them one at a time; verify the export from `out/` first, then restart dev for runtime checks.

Worth knowing about the CSS approach: the generated rule puts `li:has(> a[href=…])` inside
`:is(…)`, whose selector list is **forgiving**. Where `:has()` is unsupported that branch is
dropped and the plain `a[href=…]` still hides the entry, instead of the whole rule being
discarded as it would be in a bare comma-separated list.

Deferred, and worth a UX decision rather than a patch: a shared `?v=3.0#pear-cores` link lands
the reader at the top of the page with no explanation, because the target is hidden by their own
selection — and `check-internal-links` cannot see gating, so it will never flag such a link.
Either fall back to annotate mode when the hash names a hidden section, or say "this section does
not exist in 3.0"; both are product calls. Also unverified either way: arrow-keying a **closed**
`<select>` fires `change` per keypress on some platforms, which would mint one history entry per
option traversed.
