# Authoring the versioned Pear reference pages

Moved out of `content/reference/pear/cli.mdx`, where it lived as an MDX comment.
Comments render as nothing in HTML, so it read as private — but
`postprocess.includeProcessedMarkdown` serialized it straight into
`out/reference/pear/cli.md`, the file served to LLMs and to
`Accept: text/markdown`. `src/lib/remark-strip-mdx-comments.ts` now strips MDX
comments from that export, but maintainer guidance of this length belongs in
`docs/`, where it can be read and edited like documentation.

Applies to the four platform pages under `content/reference/pear/`.

## Finding what changed between releases

There are no per-command "Command source on GitHub" links any more. They pinned
to a release tag and needed re-pinning every release; the version badges below
carry that information instead.

To find flag-level drift, diff the command definitions between two tags:

```bash
gh api "repos/holepunchto/pear/contents/cmd/index.js?ref=<tag>" -H "Accept: application/vnd.github.raw"
```

That diff is the complete CLI surface change. A local checkout works just as
well and is easier to page through:

```bash
git -C <pear-checkout> diff <old-tag> <new-tag> -- cmd/index.js lib/cmd.js
```

Note that upstream cuts its `vX.Y.0` tag before every commit its own CHANGELOG
lists under that version, so diff from the SHA recorded in
`scripts/upstream-commits-state.json` (`pear-cli`) rather than from the previous
tag.

## Marking a change

Mark anything that differs from a previous release, rather than describing it in
prose. `Since` means added in that release; `Until` means removed in it. Pass
`label` to override the badge text. The components live in `src/components/version`.

Four tools, in order of how much they gate:

| Tool | Gates |
| --- | --- |
| `<Since v="x.y.z" />` | An inline badge on a sentence. Never hidden — the badge *is* the warning. |
| `<VersionSection since="x.y.z" />` | One line directly under a heading; gates that whole section. |
| `<VersionGate since="x.y.z">…</VersionGate>` | A block that is not a whole section — a single `<Callout>`, say. |
| `--flag  Description  [!version since=x.y.z]` | One row inside a fenced help block. |

Three constraints the build enforces, each of which has bitten:

- `<VersionSection>` must sit **directly** under a heading. Anywhere else fails
  the build; use `<VersionGate>` instead.
- A `[!version …]` marker gates **exactly one line, by index**
  (`src/lib/remark-version-code-lines.ts`). Keep a gated help row on one line
  however wide it gets — wrapping it leaves the first line ungated.
- Version markers are only valid on pages with a registered axis
  (`src/lib/version-axes.ts`). How-to and getting-started pages have none;
  express the version in prose there.

## Registering a release

Add it to `DOCS_VERSIONS` in `src/lib/docs-versions.ts` or it will not appear in
the dropdown. Exactly one entry carries `stable`, and it means "the release a
reader is assumed to be running" — not "the newest thing documented". A release
that upstream has not tagged yet belongs in as `prerelease: true`, with the
previous release keeping `stable`.

This matters beyond the dropdown: `check:internal-links` resolves bare `#anchor`
links against the stable doc-state, so an anchor introduced inside a
`<VersionSection since="3.3.0">` does not resolve for a reader on 3.2 and needs
`?v=3.3` on every link to it. Marking the new release `stable` early silences
that check rather than satisfying it.

## Page structure

Commands are grouped by task — Building and staging, Production releases, and so
on; see the `##` headings. They are deliberately **not** in `cmd/index.js` order.

Keep a new command in the group matching its role, and keep the four "no direct
replacement" removals (`presets`, `shift`, `drop`, `init`) together at the end
rather than scattered next to unrelated commands.

## `describe.json` is a fallback, not an override

A module layout's `describe.json` supplies prose only for members that have **no
upstream doc comment**. The renderer prefers the `description` recorded in
`generated/bare-refs/<module>/api-model.json`, which is extracted from the
package's own TSDoc.

So once upstream documents a member, its `describe.json` entry goes inert — the
text sits in the manifest and renders nowhere, with no warning. `check:bare-refs`
does not catch it, because the key still matches a real symbol.

Two live examples: `bare-inspect`'s `inspect` entry became inert when 3.1.5
shipped TSDoc, and `bare-dns`'s `DNSResolver.destroy` entry became inert at
2.2.0. Prefer upstream's wording when this happens, and delete the dead entry.
Version-specific notes ("changed in 3.1.5") have no home in a generated page —
put them in the Release Overview instead.
