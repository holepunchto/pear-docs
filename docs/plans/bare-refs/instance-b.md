# Instance B — prose review, TSDoc drafting, upstream types

You are working in `pear-docs` on branch `feat/bare-docs` (or a worktree branch
from it). Read `docs/plans/bare-refs/README.md` first — especially the hard
rules (**never push, never `gh pr create`**) and the ownership boundaries: you
write ONLY under `../ts-doc-upstream/**`, `scripts/bare-refgen/layouts/**`, and
`docs/plans/bare-refs/findings-b.md`. You never edit pipeline `.ts` files,
`content/`, or `generated/` (read them freely).

## Context you need

Docs pages are generated from each module's published `.d.ts`
(`scripts/bare-refgen/`, see its README). Bare `.d.ts` files carry no TSDoc, so
descriptions come from `scripts/bare-refgen/layouts/<name>.describe.json`
(member key/name → one-line prose) plus optional `layouts/<name>.ts` manifests
(`groups`, `params`, `throws`, `intro`, `seeAlso`). `npm run emit:ts-doc`
splices describe/params into the upstream `.d.ts` as TSDoc on a local
`chore/ts-doc` branch under `../ts-doc-upstream/<name>` (69 clones already
exist) and regenerates the README `## API` inside marker fences. **It never
pushes.**

Validation without touching `generated/`: `npm run check:bare-refs` re-renders
from the committed models + your layouts in memory (coverage, layout-key sanity
— catches typo'd keys — and MDX compile). Run it after every batch.

Marking convention for prose you draft (rule 2 in the README): keep a
per-module `"__draft": true` is NOT possible (keys must match symbols), so
instead list every module whose describe map you authored (vs transcribed) in
`findings-b.md` under "Drafted, needs user review", and keep drafted upstream
commits on `chore/ts-doc` clearly separate (one commit per module, message
`docs: draft TSDoc for review`).

## Workstream B1 — review the 34 auto-transcribed describe maps

For each module listed in TODO.md §"Auto-transcribed descriptions to review"
(`bare-addon-resolve` … `bare-url`): open `layouts/<name>.describe.json`, and
for every entry verify against the upstream README (in
`../ts-doc-upstream/<name>/README.md`) and the `.d.ts` signature (in the model
`generated/bare-refs/<name>/api-model.json`) that:

- the prose actually describes THAT symbol (transcription matched by name — the
  known failure mode is prose grabbed from an adjacent heading or an example);
- no code fragments/junk (`{ [native code] }`-style) or truncated sentences;
- backticked identifiers in the prose exist in the signature.

Fix in place; delete irrecoverable entries. Batch with parallel agents
(~5 modules each). Record per-module verdicts in `findings-b.md`.

## Workstream B2 — draft prose for the 35 no-prose modules

TODO.md §"Modules with no author-written descriptions". For each: read the
actual implementation in `../ts-doc-upstream/<name>` (index.js, lib/) and the
`.d.ts`, plus the Node.js docs where the module mirrors a core module
(`NODE_PARITY` in `scripts/bare-refgen/config.ts` — e.g. bare-path/events/tty/
zlib/http1/readline/timers/assert…: their APIs intentionally match Node, so the
factual behavior is documented at nodejs.org). Write one-line descriptions per
exported symbol into a NEW `layouts/<name>.describe.json`. Requirements:

- every sentence must be verifiable from the source or Node parity — describe
  what the code does, never what you guess it does; omit a symbol rather than
  hand-wave;
- style-match the existing maps (imperative, terse: "Returns the …", "Close the …");
- add `params` maps in a `layouts/<name>.ts` manifest where parameter meaning is
  clear from source;
- list each module in `findings-b.md` §"Drafted, needs user review".

Then `npm run emit:ts-doc -- --only <batch>` so each module's local
`chore/ts-doc` branch carries the TSDoc + fenced README `## API` (verify with
`git -C ../ts-doc-upstream/<name> show`; **no push**).

Skip `bare-mdns-discovery` and `bare-tui` until Instance A fixes the ambient
`declare module` extractor bug (their models show 0 exports); note them as
deferred if A hasn't landed it yet.

## Workstream B3 — draft `.d.ts` for the 3 type-less modules

`bare-dgram`, `bare-env`, `bare-stdio` ship no usable `.d.ts` (bare-stdio even
declares `types: ./index.d.ts` without shipping it — flag that packaging bug in
findings). In each `../ts-doc-upstream/<name>` clone, on a new local branch
`chore/add-types` (branched from the default branch): author `index.d.ts` (and
`lib/*.d.ts` if the exports warrant) by reading the JS source, mirroring the
conventions of sibling modules (compare `bare-os`/`bare-pipe` declarations for
house style: named exports, `export =` + namespace for classes, `exports` map
`types` condition in package.json — include the package.json edit). Commit
locally, **do not push**. These are drafts for maintainer review; precision over
completeness — omit an API you can't type confidently and note it.

## Workstream B4 — coverage-gap triage

TODO.md §"Coverage gaps": for each README-only heading, classify:

- **transcriber-parse artifact** (`for`, `await`, `module` from `for await (…)`
  example headings — ignore, note the pattern);
- **naming mismatch** (README `datasync` vs `.d.ts` `fdatasync` — fix the
  describe key if the prose is salvageable);
- **genuine upstream `.d.ts` gap** (README documents API the types omit:
  bare-broadcast-channel's 11 instance members, bare-structured-clone's
  serialize/deserialize family, bare-tls/bare-tcp `Socket`-level docs,
  `URL.format`, bare-module `require`/`Module.Protocol`…). For each real gap,
  draft the missing declarations on the module's `chore/ts-doc` branch (same
  commit discipline) and list it in findings — these become upstream PR
  material.

Also skim the "N symbol(s) with no prose" counts: where the number is high
(bare-fs 66, bare-prom-client 37), most are folded `*Sync` variants or
option-interface members — sample a few, confirm, and say so in findings rather
than authoring prose for every property.

## Deliverable

`docs/plans/bare-refs/findings-b.md` with sections: Reviewed (per-module
verdicts), Drafted-needs-user-review, Upstream `.d.ts` gaps drafted, Packaging
bugs found, Deferred/blocked. Plus: all local branches in `../ts-doc-upstream`
consistent (`chore/ts-doc` refreshed for every module you touched,
`chore/add-types` for the 3), `npm run check:bare-refs` green, nothing pushed
(`git -C ../ts-doc-upstream/<m> ls-remote --heads origin chore/ts-doc` must
stay empty for all).

Use parallel agents freely (batch modules), but keep all writes inside your
ownership column.
