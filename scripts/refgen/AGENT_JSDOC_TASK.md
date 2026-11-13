# Agent task: enrich one module's source JSDoc

You are documenting **one** Holepunch module so the generated reference docs become
top-quality. The README's prose has already been auto-seeded into the source as
JSDoc with empty `{}` type slots; your job is to **fill the types, fix the prose,
and verify** — using the source code as the source of truth.

Work on exactly the module given to you: **`<SLUG>`** (e.g. `hyperbee`, `corestore`).
All commands run from the docs repo root: `/Users/lucas/Documents/tether/openApi/pear-docs`.

---

## 0. Read the contract first
Read [JSDOC_CONVENTION.md](./JSDOC_CONVENTION.md). It defines exactly what the
generator reads (`description`, `@param {Type} name - desc`, `@returns {Type}`,
`@example`, `@typedef`, `@type {Type}` for fields). Follow it precisely.

## 1. Ensure the checkout exists
```sh
SLUG=<SLUG>
DIR="/tmp/pear-upstream/$SLUG"
TAG=$(node -p "require('./generated/refs/$SLUG/api-model.json').tag")
ORG=$(node -p "require('./generated/refs/$SLUG/api-model.json').repo.org")
REPO=$(node -p "require('./generated/refs/$SLUG/api-model.json').repo.repo")
[ -f "$DIR/index.js" ] || git clone --depth 1 --branch "$TAG" "https://github.com/$ORG/$REPO.git" "$DIR"
git -C "$DIR" checkout -- .   # start from a clean checkout
```

## 2. Align the model, then seed JSDoc from the README
```sh
npx tsx scripts/refgen/regen-local.ts "$SLUG"     # model line numbers match the checkout
npx tsx scripts/refgen/seed-jsdoc.ts "$SLUG"      # insert README-derived JSDoc blocks
git -C "$DIR" --no-pager diff                      # this is your starting point
```

## 3. Fill the types and fix the prose — reading the SOURCE
Go through every seeded block in `$DIR` and:

- **Fill every empty `{}`** with the real type, read from the implementation:
  - Exact when clear: `Buffer`, `number`, `boolean`, `string`, `Promise<Buffer>`, `Array<object>`, `void`.
  - Cross-module types by their class name (`Hypercore`, `Hyperbee`, `Corestore`, …) — they auto-link, so use the name verbatim.
  - **Never fabricate a precise shape.** If a value is genuinely application-defined or dynamic, use `*` (e.g. a user-supplied `view`) or `object`, and move on.
- **Trim mis-seeded prose.** The seed pulls README sentences; some are imperfect:
  - A `@param` whose text is really the *method's* sentence or an *option's* text → delete the text, leave a bare `@param {Type} name`, or write a correct one-line description.
  - Terse lead-ins like ``@param {} [opts] - `options` includes:`` → replace with a real one-liner or leave bare.
- **`@returns`**: type it; a `void` return needs no prose. Getters/properties use `@returns {Type}` / `@type {Type}`.
- **`@example`**: keep the seeded one if it's real usage; otherwise write a short, runnable one. Methods and the constructor should have one.
- **`@typedef`**: when a `@param` is an options bag (`opts`/`options`), define a `@typedef {Object} <Name>Options` with `@property` lines near the class and reference it by name. The gap report's "Suggested @typedef" section lists good candidates.

Do **not** document:
- members already carrying JSDoc (the seed skipped them),
- `_`-prefixed internals,
- members the gap report lists under "Documented but not reachable in source" (built inside a callback — they can't carry JSDoc; leave them).

## 4. Verify
```sh
npx tsx scripts/refgen/regen-local.ts "$SLUG"      # re-extract with your JSDoc
npx tsx scripts/refgen/report-all.ts --summary | grep "$SLUG"   # coverage line
cat "generated/refs/$SLUG/jsdoc-gaps.md"            # remaining to-do
```
**Done when** the module's coverage line shows `desc`, `types`, `returns`, and
`examples` at (or near) 100% and `jsdoc-gaps.md` lists only genuinely-unreachable
members. Spot-check the rendered page:
```sh
npx tsx scripts/gen-curated.ts "$SLUG"             # writes generated/refs/$SLUG/curated-preview.mdx
```
Open the preview and confirm a few entries have a typed param table, a linked
return type, and an example.

## Guardrails
- **No git** in the upstream checkout or the docs repo: no `commit`, `branch`,
  `push`, or `add`. Leave edits in the working tree for human review.
- **Only edit `$DIR` source** (the upstream `.js`). Do **not** edit the docs repo's
  `content/reference/` pages or the `scripts/refgen/` tooling.
- **Types must be justified by the code** you read — accuracy over coverage. When
  unsure, use `*`/`object` and flag it (see report).

## Report back (your final message)
- Module + before→after coverage (e.g. `hyperbee: desc 100→100, types 0→100, returns 0→100, examples 35→90`).
- Count of members documented and any `@typedef`s added.
- **Ambiguous types you guessed** (`*`/`object`) — list them so a human can confirm.
- Anything skipped and why (unreachable, already-documented).
- The path to the seeded source diff: `git -C /tmp/pear-upstream/<SLUG> diff`.
