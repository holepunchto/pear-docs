# 0001 — Adopt the Diátaxis information architecture

- **Status**: Accepted
- **Date**: 2026-04-28
- **Authors**: Lucas Tortora
- **Tags**: docs, information-architecture

## Context

`pear-docs` ships 33 MDX pages but the way they're organized doesn't match the way readers — or writers — think about them.

A frontmatter audit (`rg "^docType:" content/`) shows the content already half-implements [Diátaxis](https://diataxis.fr/), the four-quadrant IA framework dominant in modern dev-tool docs:

| docType | Count | Pages |
|---|---|---|
| `explanation` | 1 | `index.mdx` |
| `reference` | 21 | `building-blocks/*` (6), `helpers/*` (6), `tools/*` (5), `reference/{api,cli,configuration,runtime}` (4) |
| `how-to` | 10 | `howto/*` (6), `reference/{deployment,troubleshooting,recommended-practices,migration}` (4) |
| `faq` | 1 | `reference/faq` |
| `tutorial` | 0 | (the quadrant is empty) |

Three problems follow from this:

1. **Directory names don't match docTypes.** `building-blocks/`, `helpers/`, `tools/` look like top-level peers of `reference/`, but they're all reference content. `howto/` is the canonical-Diátaxis quadrant (`how-to/`) under a non-canonical name.
2. **Four `how-to`-tagged pages live under `reference/`** — physically misfiled. A reader landing on `/reference/deployment/` doesn't know they're reading a how-to, and the sidebar treats it like API docs.
3. **The FAQ is an anti-pattern** ([Diátaxis on FAQ](https://diataxis.fr/how-to-use-diataxis/#what-about-faqs)). Each Q&A in `reference/faq.mdx` actually belongs to one of the four quadrants — most are how-tos, some are explanations, a few are reference facts.
4. **The Tutorials quadrant doesn't exist.** Multiple in-flight tasks ("Add Content from Pear For Dummies", "Pear Conventions", "P2P from Scratch") will produce tutorial-shaped content with nowhere to put it.

The Asana parent for this work is [Reorganize information architecture (Diátaxis)](https://app.asana.com/1/1204330682799323/task/1214311360861492).

## Decision

### 1. Top-level structure

Adopt the four canonical Diátaxis quadrants as the only top-level directories under `content/`:

```text
content/
├─ index.mdx                # Four-quadrant launcher (rewritten, see #4)
├─ tutorials/               # NEW. Empty today; populated by upcoming tutorial work.
│  └─ index.mdx             # Quadrant landing page.
├─ how-to/                  # Renamed from howto/; absorbs misfiled how-tos from reference/.
│  └─ index.mdx
├─ reference/               # Stays. Topic groupings nested under it.
│  ├─ index.mdx
│  ├─ api.mdx, cli.mdx, configuration.mdx, runtime.mdx
│  ├─ building-blocks/      # Was content/building-blocks/.
│  ├─ helpers/              # Was content/helpers/.
│  └─ tools/                # Was content/tools/.
└─ explanation/             # NEW. Home for conceptual / overview content.
   └─ index.mdx
```

### 2. Directory naming

Names follow Diátaxis's own [start-here cheat sheet](https://diataxis.fr/start-here/):

- `tutorials/` (plural) — groups multiple tutorials.
- `how-to/` (singular, hyphenated, Diátaxis-canonical).
- `reference/` (singular).
- `explanation/` (singular).

The directory↔docType mapping intentionally uses **singular `tutorial`** as the docType while the directory is plural `tutorials/`. The schema enum (`@tetherto/docs-seo-schema`) defines `docType` as `tutorial | how-to | reference | explanation | page | faq | getting-started`; we use the four quadrant values exclusively after deconstructing the FAQ.

### 3. Concrete file moves (32 of 33 pages move)

| From | To |
|---|---|
| `howto/*.mdx` (×6) | `how-to/*.mdx` |
| `reference/deployment.mdx` | `how-to/deployment.mdx` |
| `reference/troubleshooting.mdx` | `how-to/troubleshooting.mdx` |
| `reference/recommended-practices.mdx` | `how-to/recommended-practices.mdx` |
| `reference/migration.mdx` | `how-to/migration.mdx` |
| `building-blocks/*.mdx` (×6) | `reference/building-blocks/*.mdx` |
| `helpers/*.mdx` (×6) | `reference/helpers/*.mdx` |
| `tools/*.mdx` (×5) | `reference/tools/*.mdx` |
| `reference/{api,cli,configuration,runtime}.mdx` | (stay) |
| `index.mdx` | (stays at `/`, rewritten) |

`reference/faq.mdx` is NOT in this table — see §5.

### 4. Homepage rewrite

`content/index.mdx` is currently a 290-line dump of inline tables and module lists (141 outbound links across 22 sections). It's rewritten as a four-quadrant launcher: a short intro paragraph, four cards linking to the quadrant landing pages (`tutorials/`, `how-to/`, `reference/`, `explanation/`), plus a "Showcase" + "Stability legend" section. Target: under 150 lines.

The current homepage's giant Pear/P2P/Bare module tables move to `reference/index.mdx` (or a dedicated `reference/modules.mdx`), where they belong — they ARE reference material.

Each quadrant gets its own `index.mdx` that briefly defines the quadrant per Diátaxis and lists its pages.

### 5. FAQ resolution — deconstruct

`reference/faq.mdx` is **deconstructed**. Each Q&A is rewritten and moved into the quadrant it actually belongs to:

- _"How do I do X?"_ entries → new pages under `how-to/`.
- _"What is X?"_ / _"Why does X work this way?"_ entries → new pages under `explanation/` (or appended to existing explanation pages).
- _"What's the value of X?"_ / _"What does X return?"_ entries → folded into the matching `reference/` page.

Once empty, `reference/faq.mdx` is deleted. No file remains with `docType: faq`.

This is the most editorially expensive option but it's the only one that fixes the underlying problem (a single page mixing all four quadrants). Cheaper alternatives (move-as-is to `explanation/faq.mdx` or keep in `reference/`) preserve the anti-pattern.

The detailed Q&A → destination mapping is recorded in subtask 9 ("Resolve the FAQ — deconstruct or move per ADR").

### 6. URL stability — redirects under static export

Pear-docs builds with `next.config.mjs` `output: 'export'`, which emits static HTML and **does not honor `redirects()` at request time** (no Node server). We use a belt-and-suspenders approach:

1. **Static HTML redirect stubs** at every old path. A build script emits `out/<old-path>/index.html` with `<meta http-equiv="refresh" content="0; url=<new>"><link rel="canonical" href="<new>">`. Search engines treat sustained meta-refresh redirects as 301-equivalent. Works on any static host with zero deploy-side config.

2. **Hosting-layer 308 redirects** via a Sevalla/Netlify-style `_redirects` file (or whatever Sevalla's deployment manifest expects), shipped in this PR. Once the next deploy lands, the hosting layer returns true 308s and the static HTML stubs become a fallback.

Concrete redirect rules (all permanent):

```text
/howto/:slug          → /how-to/:slug                 (308)
/reference/deployment             → /how-to/deployment             (308)
/reference/troubleshooting        → /how-to/troubleshooting        (308)
/reference/recommended-practices  → /how-to/recommended-practices  (308)
/reference/migration              → /how-to/migration              (308)
/building-blocks/:slug → /reference/building-blocks/:slug (308)
/helpers/:slug         → /reference/helpers/:slug         (308)
/tools/:slug           → /reference/tools/:slug           (308)
/reference/faq                    → (per FAQ deconstruct map; one redirect per old anchor) (308)
```

A small E2E test in `scripts/check-redirects.ts` (or extension to `check-internal-links`) hits every old URL and asserts a 3xx response with the expected `Location`. CI runs it against the built `out/` to prevent regression.

### 7. Sidebar / `meta.json` order

Fumadocs reads sidebar order from `meta.json` per directory (none exist today; the sidebar is alphabetical-by-filesystem). Add:

- `content/meta.json` — top-level: Tutorials, How-to Guides, Reference, Explanation. (Canonical Diátaxis order.)
- `content/{tutorials,how-to,reference,explanation}/meta.json` — per-quadrant order.
- `content/reference/meta.json` — nested order: Pear API, Bare API, CLI, Configuration, Runtime, Building Blocks, Helpers, Tools.
- `content/reference/{building-blocks,helpers,tools}/meta.json` — alphabetical.

### 8. Validator — directory ↔ docType invariants

A new `scripts/check-doctypes.ts` enforces the dir↔docType map at CI time:

```text
content/tutorials/**     must have   docType: tutorial
content/how-to/**        must have   docType: how-to
content/reference/**     must have   docType: reference
content/explanation/**   must have   docType: explanation
content/index.mdx        must have   docType: explanation  (special case: site root)
```

Wired into the existing `npm run check:internal-links` script (or run as a sibling) so CI fails on drift. This is what prevents another `reference/deployment.mdx`-style misfiling.

### 9. Cleanup of legacy artifacts

- `SUMMARY.md` (root) — deleted. GitBook-era table of contents pointing at `.md` paths that no longer exist; Fumadocs ignores it.
- The four old top-level dirs (`howto/`, `building-blocks/`, `helpers/`, `tools/`) — empty after moves; deleted.

## Consequences

### Positive

- Every page lives in the directory that matches its `docType` (validated in CI).
- URL structure is consistent: `/<quadrant>/<topic>/`. No more `/building-blocks/x` peer to `/reference/y`.
- Sidebar groups by reader intent (learn / do / look up / understand), not by topic alphabetic accident.
- Existing external links keep working via redirects (HTML stubs immediately, 308s after the next deploy).
- The Tutorials quadrant is real and ready for the in-flight tutorial work.
- The FAQ anti-pattern is gone; its content is preserved and re-routed.

### Costs

- Editorial cost of deconstructing the FAQ (subtask 9; 1 page → ~10–15 dispersed Q&A rewrites).
- One-time content rewrites: homepage launcher (subtask 4 → ~290 lines down to ~150) and four quadrant landing pages (~50–100 lines each).
- Coordination dependency on three in-flight tasks ("Add Content from Pear For Dummies", "Pear Conventions", "P2P from Scratch"): they should target `tutorials/` and `explanation/` directly, not the legacy paths.
- Hosting-layer redirects depend on Sevalla supporting a redirect rules file. If it doesn't, the HTML stubs alone cover the case at the cost of accuracy of the redirect status code.

### Out of scope (deliberately)

- **Adding a Diátaxis quadrant badge to page headers.** Mentioned as optional in the parent task. Defer to a follow-up; this PR is already large.
- **Visible URL changes for `reference/{api,cli,configuration,runtime}`.** Those four pages stay where they are; no redirect needed.

## Implementation plan

This ADR is the artifact of subtask 1. Subsequent subtasks (2–10) each become one focused commit on `feat/diataxis-reorg`:

| # | Subtask | Branch commit |
|---|---|---|
| 1 | Decide & document target IA + FAQ resolution | `docs(adr): adopt Diátaxis IA — quadrant decisions + FAQ resolution` (this commit) |
| 2 | Rename `howto/` → `how-to/`; move misfiled how-tos | `content: rename howto -> how-to and move misfiled how-tos out of reference` |
| 3 | Nest `building-blocks/`, `helpers/`, `tools/` under `reference/` | `content: nest building-blocks/helpers/tools under reference/` |
| 4 | Add `tutorials/` + `explanation/` with quadrant landing pages | `content: add tutorials/ and explanation/ with quadrant landing pages` |
| 5 | Rewrite `content/index.mdx` as four-quadrant launcher | `content(index): rewrite homepage as four-quadrant launcher` |
| 6 | `next.config.mjs` redirects + HTML stub script + Sevalla rules + E2E test | `feat(redirects): 308s for legacy paths via static stubs and hosting rules` |
| 7 | `scripts/check-doctypes.ts` enforcing dir↔docType invariants | `feat(check-doctypes): enforce dir <-> docType invariants` |
| 8 | Update README, sitemap labels, search index, takumi-og for new paths; delete `SUMMARY.md` | `chore: update README / search / OG paths and delete legacy SUMMARY.md` |
| 9 | Deconstruct FAQ per the mapping table | `chore(faq): deconstruct into how-to / explanation / reference per ADR` |
| 10 | Final QA — redirects, sidebar, link checkers, OG | `chore: final QA pass (redirects, sidebar, links, OG)` |

## References

- [Diátaxis](https://diataxis.fr/) — the four-quadrant framework.
- [Diátaxis on FAQ](https://diataxis.fr/how-to-use-diataxis/#what-about-faqs) — anti-pattern argument.
- Asana: [Reorganize information architecture (Diátaxis)](https://app.asana.com/1/1204330682799323/task/1214311360861492).
- Schema: `@tetherto/docs-seo-schema` `docTypeSchema` enum.
