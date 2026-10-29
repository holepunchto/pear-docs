# JSDoc gap report — autobase

`holepunchto/autobase` at **v7.28.2** · **0%** of published members fully documented (0/23) · 68 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 83%** · **param types 0%** · **typed returns 0%** · **examples 20%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (23)

### `index.js`

- [ ] L77 `const base = new Autobase(store, bootstrap, opts)` — add @param {Type} + description for `store`; @param {Type} + description for `bootstrap`; @param {Type} + description for `handlers`
- [ ] L90 `base.key` — add @returns {Type}
- [ ] L91 `base.discoveryKey` — add @returns {Type}
- [ ] L110 `base.isIndexer` — add @returns {Type}
- [ ] L166 `base.paused` — add description; @returns {Type}
- [ ] L187 `base.view` — add @returns {Type}
- [ ] L242 `base.writable` — add @returns {Type}
- [ ] L250 `base.signedLength` — add @returns {Type}
- [ ] L258 `base.length` — add @returns {Type}
- [ ] L266 `const hash = await base.hash()` — add description; @returns {Type}; @example
- [ ] L291 `const stream = base.replicate(isInitiator || stream, opts)` — add @param {Type} + description for `isInitiator`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L297 `const heads = base.heads()` — add @returns {Type}; @example
- [ ] L326 `base.setBigBatches(enable = true)` — add @param {Type} + description for `bool`; @returns {Type}; @example
- [ ] L917 `await base.update()` — add @returns {Type}; @example
- [ ] L957 `await base.ack(bg = false)` — add @param {Type} for `bg`; @returns {Type}; @example
- [ ] L1033 `await base.append(value, opts)` — add @param {Type} + description for `value`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L1116 `const core = Autobase.getLocalCore(store, handlers, encryptionKey)` — add @param {Type} + description for `store`; @param {Type} for `handlers`; @param {Type} + description for `encryptionKey`; @returns {Type}; @example
- [ ] L1129 `const { referrer, view } = await Autobase.getUserData(core)` — add @param {Type} + description for `core`; @returns {Type}; @example
- [ ] L1138 `const isBase = await Autobase.isAutobase(core, opts)` — add description; @param {Type} + description for `core`; @param {Type} for `opts`; @returns {Type}; @example
- [ ] L1152 `await base.setUserData(key, value)` — add @param {Type} for `key`; @param {Type} for `val`; @returns {Type}; @example
- [ ] L1159 `const value = await base.getUserData(key)` — add description; @param {Type} for `key`; @returns {Type}; @example
- [ ] L2006 `await base.pause()` — add @returns {Type}; @example
- [ ] L2010 `await base.resume()` — add @returns {Type}; @example

## Suggested `@typedef`s (3)

_Define these once near the class; they become linkable types and drive options tables._

- `opts` on `await base.append(value, opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const isBase = await Autobase.isAutobase(core, opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = base.replicate(isInitiator || stream, opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (6)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await host.ackWriter(key)`
- `await host.addWriter(key, { indexer = true })`
- `await host.removeWriter(key)`
- `const core = store.get(name || { name, valueEncoding })`
- `host.interrupt(reason)`
- `host.removeable(key)`
