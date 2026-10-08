# JSDoc gap report — protomux

`holepunchto/protomux` at **v3.12.1** · **0%** of published members fully documented (0/17) · 21 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 65%** · **param types 0%** · **typed returns 0%** · **examples 15%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (17)

### `index.js`

- [ ] L33 `channel.opened` — add description; @returns {Type}
- [ ] L62 `channel.drained` — add description; @returns {Type}
- [ ] L235 `channel.cork()` — add @returns {Type}; @example
- [ ] L239 `channel.uncork()` — add @returns {Type}; @example
- [ ] L332 `mux = new Protomux(stream, [options])` — add @param {Type} for `stream`; @param {Type} for `options`
- [ ] L336 `mux.stream` — add description; @returns {Type}
- [ ] L338 `mux.drained` — add description; @returns {Type}
- [ ] L366 `mux = Protomux.from(stream | muxer, [options])` — add @param {Type} + description for `stream`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L372 `Protomux.isProtomux(mux)` — add description; @param {Type} + description for `mux`; @returns {Type}; @example
- [ ] L382 `mux.isIdle()` — add @returns {Type}; @example
- [ ] L386 `mux.cork()` — add @returns {Type}; @example
- [ ] L393 `mux.uncork()` — add @returns {Type}; @example
- [ ] L401 `mux.getLastChannel(options)` — add description; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L408 `mux.pair({ protocol, id }, callback)` — add @param {Type} + description for `options`; @param {Type} + description for `notify`; @returns {Type}; @example
- [ ] L412 `mux.unpair({ protocol, id })` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L416 `const opened = mux.opened({ protocol, id })` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L422 `const channel = mux.createChannel(opts)` — add @param {Type} + description for `options`; @returns {Type}

## Suggested `@typedef`s (7)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `const channel = mux.createChannel(opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `const opened = mux.opened({ protocol, id })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `mux = new Protomux(stream, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `mux.getLastChannel(options)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `mux.pair({ protocol, id }, callback)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `mux.unpair({ protocol, id })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `mux = Protomux.from(stream | muxer, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (4)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `for (const channel of muxer) { ... }`
- `m.encoding`
- `m.onmessage`
- `m.send(data)`
