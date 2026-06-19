# JSDoc convention for generated reference docs

The reference pages under `content/reference/` are generated from each module's
**source JSDoc** (plus a thin editorial manifest for grouping and conceptual
prose). The richer and more consistent the JSDoc, the better the generated docs —
this document is the contract. Run the [gap report](#the-gap-report) to see exactly
what's missing in a given repo.

> **TL;DR** — on every public member write a one-line description, a
> `@param {Type} name - description` for each parameter, a `@returns {Type} description`,
> and an `@example`. That renders a fully-typed entry with a param table, linked
> types, a return type, a source link, and a usage block.

---

## What the generator reads today

### 1. Description — the leading text
Everything before the first `@tag` becomes the member's description.

```js
/**
 * Read the block stored at `index`, waiting for it to download from a peer if
 * it isn't available locally.
 */
async get (index, opts) {}
```

### 2. `@param {Type} name - description`
Drives the **typed parameter table** (`Parameter | Type | Default | Description`).

```js
/**
 * @param {number} index - Zero-based index of the block to read.
 * @param {GetOptions} [opts] - Read options.
 */
```

- **Type** `{…}` is required for the type column and cross-linking. Object-shape
  and generic types are fine, including nested braces: `{Promise<{length: number}>}`.
- **Optional** params: wrap the name in brackets — `[opts]`. You do **not** need
  `[opts={}]`; the default value is read from the code, not the JSDoc.
- **Type links**: a type that names a documented module (`Hypercore`, `Hyperbee`,
  …) links to its reference page; common platform types (`Buffer`, `Promise`,
  `Array`, …) link to Node/MDN. See [type-registry.ts](./type-registry.ts).

### 3. `@returns {Type} description`
Renders the `Returns:` line with a linked type.

```js
/**
 * @returns {Promise<Buffer>} The block value, decoded per the core's `valueEncoding`.
 */
```
Getters/properties: use `@returns {Type}` to type the value (the description reads
as the value's meaning).

### 4. `@example`
Becomes the usage code block. Use it on every method and constructor.

```js
/**
 * @example
 * const block = await core.get(42, { timeout: 5000 })
 */
```
If the upstream README already documents a richer example for the member, the
README example wins; `@example` fills the gap otherwise.

### 5. `@typedef` — named object types
Define an options/object shape once with `@typedef {Object} Name` + `@property`
lines. It renders a linkable **Types** section (with a property table), and every
`@param`/`@returns` typed with that name links to it.

```js
/**
 * Options for reading a block with `core.get()`.
 * @typedef {Object} GetOptions
 * @property {boolean} [wait=true] - Wait for the block to download if not local.
 * @property {number} [timeout=0] - Max ms to wait (0 = no timeout).
 */
```
Property defaults come from `[name=default]` here (typedefs have no code node to
read them from). Prefer a `@typedef` over an options object documented only in the
README — the typedef is the linkable, single source of truth.

### Full example

```js
/**
 * Append one or more blocks to the end of the log.
 * @param {Buffer|Array<Buffer>} blocks - A block, or an array of blocks, encoded per `valueEncoding`.
 * @param {AppendOptions} [opts] - Append options.
 * @returns {Promise<{length: number, byteLength: number}>} The new length and byte length.
 * @example
 * await core.append('hello')
 * await core.append(['a', 'b', 'c'])
 */
async append (blocks, opts = {}) {}
```

---

## Rules of thumb

- **Document the published surface.** The gap report grades members that appear in
  the page's layout manifest. Internal fields (`this._x`, untyped state) are
  ignored — don't document them, and prefix truly-internal members with `_`.
- **Types over prose for shapes.** Prefer a named type (`GetOptions`) and a
  `@typedef` for it over describing fields in prose — named types become linkable
  and drive option tables (see roadmap).
- **One source of truth.** Put the facts (params, types, returns, examples) in
  JSDoc next to the code. Leave the *conceptual* prose (why, when, cross-cutting
  notes) to the docs-repo manifest.
- **Keep examples runnable.** Short, copy-pasteable, no pseudo-code.

---

## Roadmap (write these now; generator support is landing)

These are standard JSDoc and safe to author today; the generator will consume them
in upcoming phases:

- `@memberof Batch` / explicit receiver — will deterministically attribute
  sub-object members (e.g. hyperbee's `Batch`, autobase's `host`) instead of the
  current heuristic, and give them source links.
- `@see` — will render cross-reference links.
- `@deprecated reason` — will render a deprecation badge.

---

## The gap report

Every regenerate run writes `generated/refs/<slug>/jsdoc-gaps.md`: a file:line
checklist of exactly what JSDoc each published member is missing. Work top-to-bottom
in the source repo; when a file is fully checked off, its entries render complete.

## Enforcing it in CI

Two layers:

- **Source repos** — add [eslint-jsdoc.config.mjs](./eslint-jsdoc.config.mjs) (needs
  `eslint-plugin-jsdoc`). It requires types + descriptions on `@param`/`@returns`
  for exported members, so missing JSDoc fails lint — keeping new code documented
  as it lands.
- **Docs repo** — every PR prints the completeness dashboard (`npm run refs:jsdoc`),
  and the weekly regenerate run refreshes each `jsdoc-gaps.md`. To make a floor
  mandatory once modules are enriched, change the docs-lint step to
  `report-all.ts --gate <n>` (fails the build below `<n>%`).

## Adding a new module

1. Register it in [repos.ts](./repos.ts): `<slug>: { org, repo }`.
2. Generate the model: `npm run refs:gen -- --repo <slug>`.
3. Scaffold grouping: `npx tsx scripts/refgen/extract-grouping.ts <slug>` (or
   hand-write `scripts/refgen/layouts/<slug>.ts` with `groups` + `intro` +
   `quickstart`). The manifest is the only thing you author — grouping and
   conceptual prose.
4. Preview + check gaps: `npm run refs:curated -- <slug>`, then read
   `generated/refs/<slug>/jsdoc-gaps.md` and enrich the source JSDoc.

The module then appears in the dashboard automatically, and its exported types
register in the cross-link registry automatically — no extra config. Everything
factual (signatures, params, types, returns, examples, source links) comes from
JSDoc + the model; you never hand-maintain it.
