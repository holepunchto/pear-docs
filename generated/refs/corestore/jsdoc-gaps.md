# JSDoc gap report — corestore

`holepunchto/corestore` at **v7.13.0** · **0%** of published members fully documented (0/20) · 23 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 55%** · **param types 0%** · **typed returns 0%** · **examples 27%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (20)

### `index.js`

- [ ] L237 `const store = new Corestore(storage, options = {})` — add @param {Type} for `storage`; @param {Type} + description for `opts`
- [ ] L241 `store.storage` — add description; @returns {Type}
- [ ] L254 `store.readOnly` — add description; @returns {Type}
- [ ] L256 `store.primaryKey` — add description; @returns {Type}
- [ ] L258 `store.manifestVersion` — add description; @returns {Type}
- [ ] L260 `store.active` — add description; @returns {Type}
- [ ] L281 `store.watch((core) => {})` — add @param {Type} + description for `fn`; @returns {Type}
- [ ] L290 `store.unwatch(callback)` — add @param {Type} + description for `fn`; @returns {Type}; @example
- [ ] L310 `const handle = store.notifyGroup(topic)` — add @param {Type} + description for `topic`; @returns {Type}; @example
- [ ] L339 `store.findingPeers()` — add description; @returns {Type}; @example
- [ ] L350 `store.audit(opts = {})` — add description; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L354 `await store.suspend()` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L361 `await store.resume()` — add @returns {Type}; @example
- [ ] L375 `const store = store.namespace(name)` — add @param {Type} + description for `name`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L382 `const stream = store.list(namespace)` — add @param {Type} + description for `namespace`; @returns {Type}; @example
- [ ] L386 `store.getAuth(discoveryKey)` — add description; @param {Type} + description for `discoveryKey`; @returns {Type}; @example
- [ ] L479 `const stream = store.replicate(optsOrStream)` — add @param {Type} + description for `isInitiator`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L518 `await store.staticify(core, opts)` — add description; @param {Type} + description for `core`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L562 `const core = store.get(key | { name: 'a-name', ...hypercoreOpts})` — add @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L620 `const keypair = await store.createKeyPair(name, ns = this.ns)` — add @param {Type} + description for `name`; @param {Type} for `ns`; @returns {Type}; @example

## Suggested `@typedef`s (7)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await store.suspend()` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await store.staticify(core, opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const core = store.get(key | { name: 'a-name', ...hypercoreOpts})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const store = new Corestore(storage, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const store = store.namespace(name)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = store.replicate(optsOrStream)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `store.audit(opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (2)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `const storeB = storeA.session()`
- `const stream = handle.update(opts = {})`
