# Phase 2 — platform version dropdown: implementation spec

**Status:** ready to implement · **Written:** 2026-07-29
**Parent design:** [DOCS-VERSIONING-DESIGN.md](./DOCS-VERSIONING-DESIGN.md) (read §1, §2, §4, §7, §10)
**Depends on:** Phases 0–1, merged in [PR #330](https://github.com/holepunchto/pear-docs/pull/330)

Written for a cold pickup: everything below was verified against this repo, and every
unverified assumption is labelled. Facts about Fumadocs come from the **installed**
`fumadocs-ui@16.5.4` / `fumadocs-core@16.5.4` type definitions, not from documentation.

---

## 1. Goal

A version dropdown on the four Pear platform pages (`content/reference/pear/*`) that switches
which release the page describes, **without duplicating any page**.

Done means:

1. A dropdown lists the supported doc-states (minor granularity: `3.0`, `3.1`, …).
2. Selecting one filters the page to that version — including **whole sections**, not just
   inline badges.
3. The default view (no selection) still renders everything with badges, because that is what
   the canonical URL indexes.
4. Selection survives a shared link and browser back/forward.

**Explicit non-goal:** module and bare reference pages. They are versioned by their own npm
versions and must never appear behind this dropdown (design §1). This dropdown is scoped to
`/reference/pear/*`.

---

## 2. What already exists — the seams to build on

### `src/components/version/index.tsx` (client)

| Export | Signature | Notes |
| --- | --- | --- |
| `VERSION_PARAM` | `'v'` | the query-string key |
| `useDocsVersion()` | `() => string \| null` | `null` = no selection → annotate mode |
| `DocsVersionProvider` | `({children})` | reads `?v=` in an effect; **see §4, it must be hoisted** |
| `compareVersions(a,b)` | `=> number` | tolerates partial (`"3.1"`) and prerelease (`3.1.0-rc.1` sorts as `3.1.0`) |
| `Since` / `Until` | `({v, label?, children?})` | **childless = annotation (never hidden); with children = gate** |

The childless-vs-children asymmetry is load-bearing and was verified by compiling MDX:
`<Since v="3.1.0" />` yields `children === undefined`, and `<Since></Since>` collapses to
self-closing too. Do not "simplify" it — filtering a childless marker hides the *warning* while
leaving the content, which is worse than not filtering. (§10 of the design records the bug.)

### Fumadocs primitives (verified in `node_modules`)

| Primitive | Location | Signature |
| --- | --- | --- |
| `SidebarTabsDropdown` | `fumadocs-ui/components/sidebar/tabs/dropdown` | `({ options: SidebarTabWithProps[], placeholder?, ...buttonProps })` |
| `isTabActive` | same | `(tab, pathname) => boolean` |
| `SidebarTab` | `fumadocs-ui/utils/get-sidebar-tabs` | `{ url, title, description?, icon?, urls?: Set<string>, unlisted? }` |
| `getSidebarTabs` | same | derives tabs from `root: true` folders |
| `DocsLayout` `sidebar.tabs` | `fumadocs-ui/layouts/docs` | `SidebarTabWithProps[] \| GetSidebarTabsOptions \| false` — **accepts an explicit array** |
| `DocsLayout` `tabMode` | same | `'top' \| 'auto'` |
| `PageTree.Folder.root` | `fumadocs-core/page-tree` | `root?: boolean` |

`SidebarTab` is **URL-based** — it navigates. Our versions are query-param variants of one URL,
not separate pages, so `sidebar.tabs` may not fit cleanly. Two paths, decide during
implementation:

- **(a) Custom control.** Render our own dropdown (or `SidebarTabsDropdown` directly) in
  `sidebar.banner`, wired to context rather than navigation. Most control; does not fight the
  URL-based model.
- **(b) `sidebar.tabs` with query-string URLs** (`/reference/pear/cli?v=3.0`). Reuses Fumadocs'
  styling, but `isTabActive` compares *pathname* only, so active-state will be wrong across
  versions of the same page. Would need a `transform`/override.

**(a) is recommended.**

### Other relevant facts

- `src/lib/custom-tree.ts` — 638 hand-written lines with hardcoded URLs; sidebar bypasses
  `meta.json`. Any tree change is a code change here.
- `src/app/(docs)/[[...slug]]/page.tsx:37` — `<DocsPage toc={page.data.toc} …>`. The TOC is
  passed as data, so it does **not** know about version gating (see §5).
- `source.config.ts` `mdxOptions.remarkPlugins: (v) => [...]` — where a section-gating remark
  plugin registers.
- `noIndex: true` frontmatter already excludes a page from the sitemap **and** JSON-LD
  (`@tetherto/docs-seo-core` computes `indexable`, and `buildDocsSitemap` skips it).
- `canonicalUrl` is always **self-canonical** — derived from `page.url`, no override. Query
  strings are not part of `page.url`, so all `?v=` variants share one canonical automatically.
  That is exactly what requirement 4 wants; no work needed.

---

## 3. Decisions already made — do not re-litigate

| Decision | Value | Source |
| --- | --- | --- |
| Dropdown granularity | **minor** (`3.0`, `3.1`), not every release | design §7 #5 |
| Default / canonical version | **latest stable**; prereleases selectable, badged, `noIndex` | §7 #7 |
| Scope | Pear platform pages only | §1 |
| Per-version URLs for the platform | **no** — one canonical URL | req. 4 |
| Support range | every `3.x` from 3.0.0 | req. 1 |
| Release cadence | every 2 weeks → collapse releases into doc-states | §1.1 |

---

## 4. Required prerequisite: hoist the provider

**This currently blocks the dropdown.** In `src/app/(docs)/[[...slug]]/layout.tsx` the provider
is nested *inside* `DocsLayout`:

```tsx
<DocsLayout {...baseOptions()} tree={...} links={linkItems}>
  <DocsVersionProvider>{children}</DocsVersionProvider>
</DocsLayout>
```

Anything passed to `DocsLayout` via `sidebar.banner` / `sidebar.tabs` is rendered **by**
`DocsLayout`, that is, outside `DocsVersionProvider`, so it cannot call `useDocsVersion()` or a
setter. Hoist it:

```tsx
<DocsVersionProvider>
  <DocsLayout … sidebar={{ banner: <VersionDropdown /> }}>
    {children}
  </DocsLayout>
</DocsVersionProvider>
```

The provider is a client component and `DocsLayout` is used from a server component; wrapping
in that direction is fine (a client component may render server-rendered children).

### Also required: the provider needs a setter, and `popstate` is not enough

Today the provider only *reads* `?v=` and only re-reads on `popstate`. Two changes:

1. Expose a setter — for example a context value `{ version, setVersion }`, or a `useSetDocsVersion()`
   hook. Keep `useDocsVersion()` returning `string | null` so `Since`/`Until` need no change.
2. `popstate` **does not fire** for `history.pushState` or Next's client-side navigation, so a
   dropdown that only pushes a URL will not re-render. The setter must update React state *and*
   sync the URL (`history.replaceState` or `router.replace` with `scroll: false`).

Prefer `replaceState`/`router.replace` over `push` so the back button leaves the page rather
than stepping through version selections — but confirm that with whoever owns UX.

---

## 5. The blocking design decision: section-level gating

**Resolve this before writing the dropdown.** Right now, selecting `3.0` would leave 3.1-only
content visible with a badge, because a childless marker cannot gate the section it labels
(design §10). A dropdown that visibly fails to filter is worse than no dropdown.

Concretely: the `## pear cores` section, the `--vanity` flag rows, and the persisted-logs
subsection must disappear when `3.0` is selected.

### Options

**(A) Author-wrapped sections.** `<VersionGate since="3.1.0">` around each section's content.
- Cheap, no build tooling.
- Verbose; easy to forget; MDX-inside-JSX needs blank lines to keep markdown parsing.
- ⚠️ **Unverified:** whether headings inside a JSX block still land in `page.data.toc`. If they
  do, the TOC will list hidden sections. **Test this first** — it may sink the option.

**(B) Remark plugin that groups heading + body.** A marker (directive or the existing `Since`)
at the start of a section causes the plugin to wrap the heading and everything up to the next
same-or-higher heading.
- Authors keep writing plain markdown; gating is structural and hard to forget.
- The plugin can also annotate/strip TOC entries, solving the TOC problem properly.
- Most work; needs care with nested heading levels.

**(C) Plugin emits `data-*`, client filters with CSS.** Like (B), but instead of conditional
React rendering the wrapper carries `data-since` / `data-until` and a client effect toggles
visibility (plus matching TOC anchors by `id`).
- Keeps the **full** content in the SSR HTML, which suits requirement 4 — crawlers see
  everything under one canonical URL while the reader sees a filtered view.
- Avoids re-render/hydration complexity entirely.
- Hidden-but-present content is a real consideration; acceptable here because annotate mode is
  the canonical view by design, but confirm nobody objects.

**Recommendation: (C), falling back to (B).** (C) satisfies the SEO requirement most directly
and is the least invasive to rendering. Whichever is chosen, **the TOC must be filtered too** —
a TOC entry linking to a hidden section is a broken-feeling link.

---

## 6. The version list

Phase 3 builds the doc-state generator. Phase 2 should **not** block on it: introduce a small
hand-maintained module now and swap its innards later.

```ts
// src/lib/docs-versions.ts
export interface DocsVersion {
  label: string;    // dropdown text, minor granularity: "3.1"
  value: string;    // compared by compareVersions: "3.1.0"
  stable?: boolean; // exactly one true -> the default / canonical
  prerelease?: boolean; // badge it, and noIndex any dedicated route
}

export const DOCS_VERSIONS: DocsVersion[] = [
  { label: '3.1', value: '3.1.0', stable: true },
  { label: '3.0', value: '3.0.0' },
];
```

Keep the list newest-first and derive the default from `stable`, never from array position.
3.1.0 was released 2026-07-29 and is current stable; 3.0.1 was the previous stable.

Phase 3 replaces the literal by diffing `cmd/index.js` between tags — the recipe is in the
`cli.mdx` maintainer note and design §1.1.

---

## 7. Implementation order

1. **Test the TOC question from §5(A)** — it decides the gating approach. Cheapest possible
   experiment; do it before anything else.
2. Decide gating approach; record the decision in the design doc.
3. Hoist `DocsVersionProvider` above `DocsLayout`; add the setter; handle non-`popstate`
   updates (§4).
4. Add `src/lib/docs-versions.ts` (§6).
5. Build `VersionDropdown` (client) — reads `DOCS_VERSIONS`, calls the setter, renders via
   `SidebarTabsDropdown` or a custom control.
6. Mount it **only on platform pages.** The layout is shared by all 147 pages, so gate on
   pathname (`/reference/pear/`) or on a frontmatter flag. A version dropdown appearing on
   `hypercore` would assert exactly the false model the design forbids.
7. Implement section gating per the §5 decision, including TOC filtering.
8. Convert `cli.mdx`'s existing childless markers to gates **where a whole section should
   disappear** — `pear cores`, the two `--vanity` flag rows, persisted-logs. Leave the rest as
   annotations.
9. Verify (§8).

---

## 8. Acceptance criteria

Functional:

- [ ] Dropdown appears on all four `/reference/pear/*` pages and **nowhere else**.
- [ ] Default (no `?v=`) renders every version's content with badges.
- [ ] Selecting `3.0` hides the `pear cores` section entirely, hides both `--vanity` rows, hides
      persisted-logs, and **shows** the sidecar log flags removed in 3.1.0.
- [ ] Selecting `3.1` inverts all of the above.
- [ ] The TOC contains no entries for hidden sections.
- [ ] A shared `?v=3.0` link loads pre-filtered.
- [ ] Browser back/forward behaves sanely.
- [ ] Changing the selection does not scroll the page to the top.

Non-regression:

- [ ] `npm run build` passes; the components still render in the **static export** (`out/`), not
      only in dev — this is the trap that `output: export` sets.
- [ ] `npm run types:check`, `vale --minAlertLevel=error content`, `check-internal-links`,
      `check-includes`, `check-doctypes`, `check-upstream-pins` all pass.
- [ ] Sitemap unchanged for platform pages: still **one** entry each, canonical = unversioned URL.
- [ ] `<Since>`/`<Until>` childless markers still render on module pages that use them (none
      today, but the components are globally registered).

---

## 9. Traps (all hit during Phases 0–1)

- **Trailing slash.** `trailingSlash: true`. `curl http://localhost:3000/reference/pear/cli`
  returns **308**; use the trailing slash or `-L`.
- **React splits text nodes.** Grepping SSR HTML for `>v11.34.0<` finds nothing because the RSC
  payload contains `["v","11.34.0"]`. Search for the label text instead, or assert in a browser.
- **`gen-curated.ts --check` WRITES despite its name** — it rewrites five
  `generated/refs/*/curated-preview.mdx`. It runs in CI (harmless there). Locally, revert with
  `git checkout -- generated/` afterwards.
- **`next-env.d.ts` churns** between dev and prod typegen (`out/dev/types` vs `out/types`).
  Do not commit that diff.
- **Static export + client components.** Query params are unavailable at build time; read them
  after mount only, or the static HTML bakes in a selection.
- **Dev server memory.** One long-lived `next dev` degrades after ~40 route compiles and
  auto-restarts, producing spurious timeouts. Restart it between batches.

---

## 10. Out of scope for Phase 2

- Module and bare reference pages, and any per-major module URLs (design Phase 4).
- The doc-state generator (Phase 3).
- refgen per-version models (Phase 5).
- Reconciling `bare-refs:poll` with `check:upstream-pins` (design §9) — still open.
- The 40 unpinned bare pages; they resolve when the `feat/bare-docs` cutover merges.
