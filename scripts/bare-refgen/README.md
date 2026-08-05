# bare-refgen

Generates API reference pages for `bare-*` modules **from their TypeScript
declaration files** (`.d.ts`) — the place the public API is actually defined.
Output is deterministic and reproducible: run it in CI on deploy or by hand.
Nothing is AI-generated. Every word on a page comes from the published `.d.ts`,
the package's `package.json`, the upstream README (`## Usage`, verbatim), or a
thin per-module layout manifest (group titles/order only).

## Usage

```sh
npm run gen:bare-refs                      # top-N most-downloaded bare-* modules with types
npm run gen:bare-refs -- --top 20          # widen the selection
npm run gen:bare-refs -- --only bare-fs,bare-os
npm run gen:bare-refs -- --write           # write into content/ (+ sync the catalog)
```

Selection is `TOP_N` most-downloaded ∪ `ALLOWLIST`, or everything above
`MIN_DOWNLOADS` — all in `config.ts`. Each run refreshes the version cache
(`versions.json`); `npm run bare-refs:poll` compares it against npm `latest` and
prints which modules bumped (the regenerate workflow uses this to regenerate only what changed).

Pages are written to `generated/bare-refs/<name>.mdx` (a **preview** dir — the
live `content/reference/bare/modules/*.mdx` pages are never touched). The
deterministic intermediate is `generated/bare-refs/<name>/api-model.json`.

## How it works

| Step | File | What it does |
| --- | --- | --- |
| select | `select.ts` | Ranks the `hasTypes` candidates from `docs/bare-modules-research.json` by npm last-month downloads (falls back to inbound-dep count offline). |
| fetch | `fetch.ts` | `npm pack`s the published tarball, extracts it, resolves the declaration entry (`exports["."].types` → `types`/`typings` → `index.d.ts`). |
| extract | `extract.ts` | Walks the `.d.ts` with the TypeScript Compiler API. Enumerates module exports (resolving re-exports and `export =`), renders signatures from the declaration AST, and pulls params/returns/throws/description from JSDoc when present. → `BareModel`. |
| layout | `layout.ts` + `layouts/<name>.ts` | Optional editorial grouping (see below). |
| render | `render.ts` | `BareModel` (+ layout) → MDX matching the existing bare page format. |
| driver | `index.ts` | Ties it together and writes the preview. |

## What each page contains

- Facts-only intro + a **Node.js parity link** (config `NODE_PARITY`) when the module mirrors a core module.
- Verbatim README `## Usage`.
- Grouped API: each symbol shows its signature, params (with **type cross-links** to on-page anchors), returns/throws, and — for `fs`-style modules — the `*Sync` sibling folded in as a *Synchronous form* note instead of a duplicate entry.
- **Subpath entry points** (`bare-fs/promises`, `bare-stream/web`, …) as their own sections.

## Descriptions

Bare `.d.ts` carry no JSDoc, so descriptions come from the layout manifest's
`describe` map (author-written, e.g. transcribed from the README). This is
the permanent home for that prose — we regenerate refs from the published
`.d.ts` in this repo only and never push documentation changes upstream. To
bootstrap those maps, `npm run bare-refs:transcribe` parses each module's
README `## API`, matches the prose under every `#### ` heading to an
extracted symbol, and writes a *suggested* map to
`generated/bare-refs/<name>/describe.suggested.json` (also flagging README-only
headings and still-undocumented symbols). Review it and paste the good entries
into `layouts/<name>.ts` — nothing is applied automatically.

## Validation

`npm run check:bare-refs` re-renders each committed model and asserts **coverage**
(no exported symbol silently dropped), **layout sanity** (every manifest
`members`/`describe`/`throws` key matches a real symbol — catches typos that
would otherwise no-op), and **MDX validity**. The regenerate workflow runs it before
opening a PR, so a page that would drop a symbol or fail to compile never becomes a PR.

`npm run bare-refs:changelog` diffs the working-tree models against git HEAD and
prints a Markdown summary (added / changed / **⚠ removed** symbols per module);
the regenerate workflow puts this in the PR body so releases are reviewable at a glance.

## Layout manifests — keeping the curated structure

A `layouts/<name>.ts` module supplies the editorial layer a `.d.ts` can't — all
author-written, never AI. Members are referenced by model key or display name;
unlisted members fall through to their by-kind group. Fields:

- **`groups`** — ordered `{ title, members[] }` for the API section ("File handles", …).
- **`describe`** — member → one-line description.
- **`params`** — member → `{ paramName: description }`; rendered under Parameters and emitted as `@param`.
- **`throws`** — member → throw bullets the `.d.ts` doesn't yet annotate.
- **`intro`** — an author lead paragraph, used instead of the auto description sentence.
- **`seeAlso`** — extra "See also" bullets, prepended to the catalog/runtime links.

See `layouts/bare-os.ts` for a worked example of all of these. With no manifest a
page falls back to deterministic by-kind grouping (Functions, Classes, Types, …).

## Automation

**Regenerate docs on release** (`.github/workflows/regenerate-bare-refs.yml`).
Daily poll + manual dispatch. The poll (`poll.ts` vs `versions.json`) regenerates
only modules whose npm `latest` moved and skips entirely when nothing changed;
`gen:bare-refs --write` writes into `content/reference/bare/modules/` and
non-destructively syncs each module's catalog row (reference link + stability
badge). If the pages changed it opens a review PR into `published`. The
generator always pulls the latest published tarball, so a new release shows up
as a diff (new or changed signatures). Regen-safe: descriptions live in the
manifests, so nothing is lost. Never auto-merges. `--write` also works locally:
`npm run gen:bare-refs -- --write`.

This is pull-only: we regenerate reference pages from each module's published
`.d.ts` and never push documentation changes back upstream to `holepunchto/bare-*`.
