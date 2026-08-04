# Pitch: Split Pear and Bare into two interlinked doc products

## Context

pear-docs currently documents two related but distinct Holepunch products in one fumadocs tree: **Pear** (the P2P app runtime/CLI/OTA-update system) and **Bare** (the lightweight embeddable JS runtime Pear is built on, which is also used completely standalone with zero Pear involvement). A past deliberate decision (PR #303, "docs: document Bare") folded Bare in as "a first-class part of the Pear stack, not separate" — Bare got a dedicated reference sub-folder (40 pages) plus a handful of explanation/how-to pages, but it's nested inside Pear's IA (e.g. Bare's explanation pages live under "About Pear → Platform foundations") rather than presented as a peer product with its own front door.

The problem this pitch addresses: a developer who wants to use **Bare alone** (embed JS in a native app, ship a standalone CLI binary, no P2P/no Pear at all) has to navigate into "Pear docs" to find their on-ramp, and there's no dedicated getting-started tutorial, landing page copy, or release-notes surface written for that reader. Meanwhile Pear's own how-to section carries ~10 pages of pure Hypercore/Hyperswarm/HyperDHT logic that have nothing to do with Pear's CLI or OTA machinery — diluting Pear's IA with content that's really Bare's.

Goal: evolve (not reverse) #303 — keep the "Pear stack" story fully intact for Pear-app developers, while giving Bare-only developers their own top-level nav root, getting-started path, and landing page, with the two products staying heavily cross-linked rather than becoming isolated silos.

**Decisions already made** (via stakeholder Q&A, do not revisit):
1. **Same app, two nav roots.** One Next.js/fumadocs app, a product switcher (fumadocs `sidebar.tabs`) between a Pear tab and a Bare tab — not separate repos/domains. Cross-links stay as relative internal paths.
2. **Bare owns the shared "building blocks" layer** (Hypercore, Hyperswarm, Autobase, Corestore, Hyperdrive, Hyperbee, HyperDHT, Localdrive, Mirrordrive, Secretstream, Compact encoding, Protomux, and the Hyper-tools) as its ecosystem/modules layer. Pear's how-tos cross-link out to Bare's copy rather than duplicating.
3. **Evolve #303.** Keep `explanation/the-pear-stack.mdx` and the "Pear stack" framing exactly as-is for Pear readers; Bare gets its own front door alongside it, not instead of it.

---

## Foundational call: no URL changes, no physical file moves (phase 1)

Product identity is a **nav-tree/sidebar-tab construct only**. `src/lib/custom-tree.ts` is already hand-written and file-path-independent (a tree node's `url` doesn't have to match where the file lives), so splitting it into two trees requires zero file moves and zero URL changes for the ~137 existing pages.

Why this matters: it means `scripts/helpers.ts` (`CONTENT_DIR`, `fileToSlug`, `getFiles`) and `check-internal-links.ts` need **no code changes at all** — the entire link-checking toolchain keeps working, because the single-content-tree assumption it's built on stays true. It also means zero redirects and zero SEO risk in this phase. A later, separately-approved physical `content/pear/**` + `content/bare/**` reorg with real URL prefixes is explicitly out of scope here (see Phase 6).

Two genuinely new pages get new paths: `content/bare/index.mdx` (Bare's landing page) and a small `content/bare/getting-started/` cluster. Everything else — all 40 `reference/bare/**` pages, building-blocks/helpers/tools, `how-to/run-on-native/**` — stays exactly where it is on disk; only which tree (`pearTree` vs. new `bareTree`) it's wired into changes.

---

## Target IA

### Pear root (`pearTree`) — what stays

| Section | Pages | Change |
|---|---|---|
| Landing | `content/index.mdx` | Light copy edit acknowledging the Bare tab |
| Getting Started | Chat tutorial (4), templates (`hello-pear-electron`, `hello-pear-bare`) | Unchanged — `hello-pear-bare` stays here (it's the Pear-on-Bare/OTA path via `pear touch`/`pear install`, not a Bare-only tutorial); add one callout pointing Bare-only readers to Bare's new hello-world tutorial |
| About Pear (explanation) | `the-pear-stack`, `peer-to-peer-demystified`, `runtime-and-languages`, `dependencies-and-network` (4, was 7); storage section keeps `storage-and-distribution`, `availability-and-blind-peering` (2, was 3); building/shipping (3); Built with Pear (2 external) | 3 pages leave for Bare (`use-bare-standalone`, `bare-runtime`, `bare-on-native`); bridge pages stay Pear-only per decision 3 |
| How To | New grouping **"Extend your chat app"** (7 pages, zero file moves — see judgment calls below); `operate-an-app/**` (17, unchanged); `manage-installed-applications`; `troubleshooting` (shared, appears in both trees) | The 5 old topic folders (connect-to-peers, store-and-replicate, blind-peering, manage-identity, stream-and-share-media) disappear as *folders* from Pear's tree — surviving Pear pages regroup under one label; `run-on-native/**` (5) leaves entirely |
| Reference | `reference/pear/*` (4); `ci-and-release/*` (3); Modules shrinks to `pear-modules.mdx` only | Bare/building-blocks/helpers/tools content drops out, replaced by one pointer to Bare's Reference tab |
| Release Overview | Unchanged, Pear-primary | Gains a cross-link to Bare's own release notes once that exists |

### Bare root (`bareTree`) — new

| Section | Pages | Notes |
|---|---|---|
| Landing | **NEW** `content/bare/index.mdx` | Tagline, CLI install, cards into getting-started/reference/how-to/explanation |
| Getting Started | **NEW** `content/bare/getting-started/index.mdx`, `hello-world.mdx`, `install-the-cli.mdx` | Entirely new — does not reuse `hello-pear-bare` (that stays Pear's) |
| About Bare | `explanation/use-bare-standalone.mdx` **repurposed in place** as this section's landing page (same file/URL, edited copy — it already has a Diátaxis-shaped "Understand it / Look it up / Do it" structure and a "Where Bare and Pear meet" bridge section, verified in the file); `bare-runtime.mdx`; `bare-on-native.mdx`; `from-logs-to-files.mdx` (judgment call below) | Biggest single reuse win — copy edit only, no new file |
| How To | `run-on-native/**` (5, wholesale move); repurposed topic pages pulled from connect-to-peers/store-and-replicate/blind-peering/manage-identity/stream-and-share-media (see table below); `troubleshooting` (shared); **NEW** "Author a native addon"; **NEW** "Debug and test a Bare app" | |
| Reference | **NEW** `content/reference/bare/index.mdx` (confirmed missing today — dir has `runtime.mdx`, `cli.mdx`, `bare-kit.mdx`, `modules/`, no index); `reference/bare/*` (40, unchanged); `bare-modules.mdx` catalog (moved out of Pear's Modules folder); Building blocks (6); Helpers (6); Tools (5) | Building-blocks/helpers/tools move wholesale per decision 2 |
| Release notes | **NEW** distinct Bare release surface | Confirmed gap — see below |

### Judgment calls on the ~10 ambiguous how-to pages

The content already self-labels this split ("this guide focuses on the Pear/Bare logic, no UI" callouts) — formalizing an existing pattern, not inventing one:

| Topic | Stays Pear (chat-app wrapper) | Moves to Bare (pure logic) |
|---|---|---|
| Connect to peers | `host-multiple-rooms-in-one-chat-app` | `connect-two-peers-by-key-with-hyperdht`, `connect-to-many-peers-by-topic-with-hyperswarm` |
| Store and replicate | — | `replicate-and-persist-with-hypercore`, `work-with-many-hypercores-using-corestore`, `share-append-only-databases-with-hyperbee` |
| Blind peering | `add-blind-peering-to-a-chat-app` | `keep-data-available-with-blind-peering` |
| Manage identity | `add-keet-identity-to-a-chat-app` | `create-a-portable-identity-with-keet-identity-key` |
| Stream and share media | `share-files-in-a-peer-to-peer-app`, `back-up-photos-in-a-peer-to-peer-app`, `stream-stored-video-in-a-peer-to-peer-app`, `stream-a-live-camera-in-a-peer-to-peer-app` | `create-a-full-peer-to-peer-filesystem-with-hyperdrive`, `store-and-serve-large-media-with-hyperblobs` |

No thin Pear-side wrapper stub is needed for the pages that move — Pear's remaining chat-app pages already gloss the building blocks inline. Two pages (`connect-to-many-peers-by-topic-with-hyperswarm`, `work-with-many-hypercores-using-corestore`) are missing the explicit "no UI" callout their siblings have — add it as part of the move.

`explanation/from-logs-to-files.mdx` moves to Bare (pure Hypercore→Hyperblobs→Hyperdrive layering, opens with "Pear storage is built from..." — reword generically). `storage-and-distribution.mdx` and `availability-and-blind-peering.mdx` stay Pear (genuinely about Pear's app directory and `pear seed`). `troubleshooting.mdx` is tagged `product: shared` and listed in both trees (its own description already says "Pear **and** Bare development issues").

---

## Missing content to fill

| Gap | Status (verified) | Action |
|---|---|---|
| Bare-first getting-started/hello-world | **Confirmed missing** — `start-from-hello-pear-bare.mdx` is 100% Pear-OTA framed (`pear touch`, `pear install`, `PearRuntime.run`) | New `content/bare/getting-started/hello-world.mdx`: `npm i -g bare`, a script, `bare script.js` |
| Bare CLI quickstart (getting-started quadrant, not reference) | Reference material exists (`reference/bare/cli.mdx`) but no getting-started-quadrant page | New `content/bare/getting-started/install-the-cli.mdx` |
| "Why Bare" positioning page | **Already exists**, just misplaced/mis-scoped | Repurpose `use-bare-standalone.mdx` in place — copy edit only |
| Native addon authoring how-to | **Confirmed genuinely missing** — only scattered reference exists (`bare-make.mdx`, `bare-addon-resolve.mdx`, a CI section in `reference/ci-and-release/github-actions.mdx`); no task-oriented walkthrough anywhere | New how-to under Bare, cross-linking the existing reference pages |
| Packaging/distributing standalone Bare apps | **Already covered, mis-framed** — `bundle-a-bare-app.mdx` fully covers `bare-pack`/`bare-build` for desktop/terminal, not just mobile, but is buried under "Run on mobile & native" | No new content; re-surface from Bare's landing page |
| Bare reference landing/index page | **Confirmed missing** — verified `content/reference/bare/` has no `index.mdx` | New `content/reference/bare/index.mdx` |
| Debug/test workflow for Bare apps | **Confirmed missing as a consolidated guide** — only scattered mentions (`--inspect` flags, `bare-inspector` reference, one passing `brittle` mention) | New how-to under Bare |
| Bare-runtime release notes | **Confirmed missing** — verified `release-overview/index.mdx`'s description claims "Pear, Bare, and their modules" coverage, but every dated entry is Pear CLI/`pear-runtime`/module bumps (Hypercore, Hyperdrive, HyperDHT, Corestore) — zero entries about the Bare runtime itself | New distinct surface under Bare; keep `release-overview` Pear-primary with a cross-link |
| Pear-side context after building-blocks move out | Mostly fine on spot-check — chat-app pages already carry explanatory paragraphs, not bare links | Light editorial audit during rollout, not a structural gap |
| `_snippets/*` Pear-branded language | New finding | `_from-a-template-callout.mdx` / `_pear-end-portability-callout.mdx` are reused by pages moving to Bare but say "start from `hello-pear-electron`/`hello-pear-bare`" — needs a Bare-safe rewrite or a parallel snippet |

---

## Technical changes required

1. **Frontmatter**: add `product: pear | bare | shared` (optional at first) to `source.config.ts`'s frontmatter schema, alongside the existing `docType`/`upstreamVersion` fields (verified: `docType` is at `source.config.ts:57`, same layering pattern applies). Orthogonal to `docType` — one-time backfill PR tags all ~137 existing pages.
2. **`src/lib/custom-tree.ts`** (verified: exports `customTree: Node[]`, wired into `layout.tsx:29` as `tree={{ name: 'docs', children: customTree }}`) splits into `pear-tree.ts` + `bare-tree.ts`, wired via `DocsLayout`'s `sidebar.tabs`. `docs/plans/DOCS-VERSIONING-DESIGN.md` already scoped the same fumadocs primitives (`Folder.root`, `getSidebarTabs`, explicit `SidebarTabWithProps[]`) for a different purpose (version switching) and flagged the one real unknown — whether this composes cleanly with the single catch-all route — as unverified. Treat that as a shared spike answering the same question for both initiatives.
3. **One `defineDocs`/`loader`, not two.** No `baseUrl` split needed since URLs don't change; product filtering happens at the nav-tree level exactly like `docType` filtering does today. This keeps sitemap, robots, search (`api/search.json/route.ts`), and `llms.txt` routes completely unchanged.
4. **`scripts/check-cross-links.ts`**: needs its orphan-exemption list extended to cover the new Bare landing pages, and its canonical-coverage report re-validated now that building-blocks terms are reached from Pear only via prose links, not a sidebar folder.
5. **`scripts/check-doctypes.ts`**: unaffected on the existing directory→docType invariant; extend it to also require every page declare a valid `product` — same pattern it already uses, and (unlike today) wire this into `.github/workflows/docs-lint.yml` from day one so it's CI-gated rather than another local-only script.
6. **`examples/` and CI**: verified `.github/workflows/examples.yml` already splits into `desktop-build` (9 Electron/Pear apps) vs. `terminal-examples` (6 pure-Bare scenarios: hyperdht-chat, hyperswarm-chat, hypercore-replicate, corestore-multi, hyperbee-kv, hyperdrive-fs) — this maps 1:1 onto the content split above. No physical `examples/` move needed for phase 1; just add comments labeling which matrix entries are Bare-only vs. Pear-desktop.
7. **`src/lib/layout.shared.tsx`**: needs per-tab title/logo parameterization (`baseOptions(product)`) — a new Bare logo/wordmark asset is a design dependency to request up front. Same GitHub link (`holepunchto/pear-docs`) on both tabs.
8. **Redirects**: none needed — verified by construction (no file moves, no URL changes in phase 1).

---

## Phased rollout

| Phase | Work | Risk |
|---|---|---|
| 0 — Frontmatter backfill | Add `product` field; tag all ~137 pages | Low |
| 1 — Nav-split spike | Prototype `sidebar.tabs` + combined tree against the single loader on a throwaway branch; confirm it composes with the catch-all route | Medium — the one real unknown |
| 2 — Nav split | Split `custom-tree.ts`; wire `DocsLayout.sidebar.tabs` + branding switch; ship minimal `content/bare/index.mdx` + repurposed `use-bare-standalone.mdx` so the tab isn't empty at launch; land Bare logo asset | Medium-high, biggest structural PR |
| 3 — Tooling hardening | Update `check-cross-links.ts` exemptions; add product-invariant to `check-doctypes.ts` and wire into CI; editorial pass on `_snippets/*` | Low, parallel to Phase 4 |
| 4 — Gap-filling content | Bare getting-started + CLI quickstart, native-addon how-to, debug/test how-to, Bare release notes, re-surface `bundle-a-bare-app.mdx`, audit chat-app pages for building-block context | Low per item, largest total effort — ship as several small PRs |
| 5 — Examples/CI documentation | Comment-only labeling in `examples.yml`; optional physical `examples/{pear,bare}` split, explicitly deferred | Low |
| 6 — Deferred, separate RFC | Physical `content/pear/**` + `content/bare/**` reorg with real URL/prefix changes; per-product SEO branding; deeper native-addon reference | Not part of this proposal |

---

## Phase 1 spike: findings (verified against installed `fumadocs-ui@16.5.4` / `fumadocs-core@16.5.4` source, not docs/memory)

The pitch flagged one real unknown: whether `sidebar.tabs` composes with the single
catch-all route. It does, but not the way "tabs" suggests — and this repo's `output:
'export'` static build adds a second constraint that matters just as much.

**Finding 1 — `sidebar.tabs` is a switcher UI, not a tree filter.** Read directly from
`fumadocs-ui`'s compiled source (`layouts/docs/index.js`, `components/sidebar/page-tree.js`,
`components/sidebar/tabs/index.js`):
- `DocsLayout`'s `sidebar.tabs` only feeds `SidebarTabsDropdown` — a switcher of links.
- The actual sidebar content (`SidebarPageTree`) unconditionally renders `root.children`,
  i.e. the *entire* `tree` prop passed to `DocsLayout`, with zero filtering by which tab is
  "active."
- `getSidebarTabs(tree)` (the auto-derivation helper) scans for `Folder.root: true` nodes
  and builds one `SidebarTab` per one, with a `urls: Set<string>` used only for
  highlighting/active-state — again, not for filtering what renders.
- Conclusion: marking two top-level folders `root: true` in one combined tree gets you a
  tab-switcher *decoration*, but the sidebar would still show Pear's and Bare's nodes
  stacked together underneath it. `DOCS-VERSIONING-DESIGN.md`'s spike question ("do
  multiple `loader()` instances with distinct `baseUrl`s compose with the catch-all
  route?") doesn't actually apply here — we aren't using multiple loaders/baseUrls (see
  the no-URL-changes decision) — but the adjacent assumption that `sidebar.tabs` alone
  produces a filtered sidebar view does not hold for either project and needed its own check.

**Finding 2 — this is a fully static export; tree selection must happen at build time,
not per-request.** `next.config.mjs` sets `output: 'export'` ("Fully static HTML + assets
in `out/`, no Node server, no API at runtime"), and both `page.tsx` and `layout.tsx` under
`(docs)/[[...slug]]/` declare `export const dynamic = 'force-static'`. There is no
request-time server to run cookie/header-based product resolution — whatever sidebar tree
a page ships with is decided once, at `next build`, and baked into that page's static HTML.

**Finding 3 — the resolution mechanism, verified end-to-end.** `layout.tsx` sits in the
same route segment as `page.tsx` and receives the same shape of `params` (confirmed via
`.next/types/routes.d.ts`'s `LayoutProps<...>`/`PageProps<...>` — both carry
`params: Promise<{ slug?: string[] }>`). `page.tsx` already does
`source.getPage(params.slug)` to load the current page; `layout.tsx` can do the identical
lookup to read that page's `product` frontmatter and pick a tree accordingly. Verified live
by temporarily adding `console.log(page.data.product)` to `page.tsx` and running
`npm run build`: **all 137 pages resolved a defined `product` value (0 `undefined`)**,
matching the Phase 0 backfill exactly. (The debug probe was reverted after verification —
it never landed in a commit.) One false alarm during this check: an earlier run on a stale
checkout of this branch showed `product: undefined` for every page — that was a wrong-branch
artifact (Phase 0's schema change wasn't present in that tree), not a real bug in the
mechanism, and re-confirmed cleanly once back on `feat/pear-bare-split` with `.source`/`.next`
caches cleared.

**Resulting Phase 2 design (supersedes the plain "wire via `sidebar.tabs`" sketch in
§Technical changes required, item 2):**
1. Split `custom-tree.ts` into `pear-tree.ts` + `bare-tree.ts` — two independent `Node[]`
   arrays, not one combined tree with `root: true` markers (Finding 1 rules that out).
2. Make `layout.tsx` async and read `params`, exactly like `page.tsx` does today. Resolve
   `source.getPage(params.slug)?.data.product`, then pick:
   - `'bare'` → `bareTree`
   - `'pear'` → `pearTree`
   - `'shared'` or missing → `pearTree` (Pear is the default/primary product)
3. Build the Pear/Bare switcher as a small custom component (two links to each product's
   landing page — `/` and `/bare`), not `sidebar.tabs`/`getSidebarTabs`. Since tree
   selection is already handled in step 2, `sidebar.tabs` can be set to `false` — or kept
   with an explicit two-item `SidebarTabWithProps[]` (the same escape hatch
   `DOCS-VERSIONING-DESIGN.md` found for its own dropdown) purely for free highlight/active
   styling on top of our own logic, if that polish is wanted.
4. **Known limitation, deferred, not blocking:** a single static HTML file can only bake in
   one sidebar tree. For the ~6 pages tagged `product: shared` (troubleshooting + the 4
   disappearing topic-folder indexes + `reference/index` + `how-to/index`), the deterministic
   default in step 2 means they always render with Pear's sidebar, regardless of which tab a
   reader arrived from. Phase 2 ships with that default plus a manual cross-link banner on
   those pages; true "remember which tab I came from" persistence (client-side
   localStorage read + conditional re-render post-hydration) is a follow-up, not a Phase 2
   blocker — it touches ~6 pages, not the other 131.

---

## Verification

- `npm run check:internal-links` — expect **zero diff** in pass/fail before vs. after the nav-split PR (hard gate, since no slugs change).
- `npm run check:doctypes` (extended) — all pages declare a valid `product`; existing directory→docType invariant stays green.
- `npm run check:cross-links` — orphan count doesn't grow beyond the newly-exempted landing pages; building-blocks canonical coverage still reads correctly via prose-only links from Pear.
- `npm run check:includes` — passes after the `_snippets/*` editorial pass.
- `npm run types:check` — catches any `product` schema mistakes.
- `npm run build` then inspect `out/sitemap.xml` — every page listed exactly once (single loader ⇒ no duplicates).
- Manual QA: both tabs render at a few nav depths; branding (title/logo) switches per tab; GitHub link stays on `holepunchto/pear-docs` in both; a Bare-specific search query (e.g. "hyperswarm", "bare-fs") returns results regardless of which tab it's searched from.
- `.github/workflows/examples.yml` CI stays green with zero changes (Phase 5 deferred).
