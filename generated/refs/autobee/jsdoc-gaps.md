# JSDoc gap report — autobee

`holepunchto/autobee` at **v2.12.1** · **0%** of published members fully documented (0/67).

Coverage by dimension: **descriptions 31%** · **param types 0%** · **typed returns 0%** · **examples 10%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (67)

### `index.js`

- [ ] L36 `const db = new Autobee(store, [key], [options])` — add @param {Type} for `store`; @param {Type} for `key`; @param {Type} + description for `handlers`
- [ ] L52 `db.encrypted` — add description; @returns {Type}
- [ ] L53 `db.bootstrapWeight` — add description; @returns {Type}
- [ ] L55 `db.getSystemEncryption` — add description; @returns {Type}
- [ ] L56 `db.getViewEncryption` — add description; @returns {Type}
- [ ] L69 `db.store` — add description; @returns {Type}
- [ ] L71 `db.key` — add @returns {Type}
- [ ] L72 `db.discoveryKey` — add @returns {Type}
- [ ] L73 `db.id` — add @returns {Type}
- [ ] L74 `db.bootstrap` — add description; @returns {Type}
- [ ] L76 `db.stats` — add description; @returns {Type}
- [ ] L87 `db.system` — add description; @returns {Type}
- [ ] L93 `db.bee` — add @returns {Type}
- [ ] L94 `db.view` — add @returns {Type}
- [ ] L95 `db.optimistic` — add description; @returns {Type}
- [ ] L97 `db.name` — add description; @returns {Type}
- [ ] L99 `db.local` — add @returns {Type}
- [ ] L100 `db.encryptionKey` — add description; @returns {Type}
- [ ] L101 `db.keyPair` — add description; @returns {Type}
- [ ] L102 `db.writers` — add description; @returns {Type}
- [ ] L103 `db.bumping` — add description; @returns {Type}
- [ ] L111 `db.bootFrom` — add description; @returns {Type}
- [ ] L116 `db.trusted` — add description; @returns {Type}
- [ ] L118 `db.ff` — add description; @returns {Type}
- [ ] L119 `db.fastForwarding` — add description; @returns {Type}
- [ ] L120 `db.fastForwardTo` — add description; @returns {Type}
- [ ] L142 `db.legacyViews` — add description; @returns {Type}
- [ ] L166 `db.interrupted` — add description; @returns {Type}
- [ ] L171 `db.wakeupCapability` — add description; @returns {Type}
- [ ] L173 `db.previousDrain` — add description; @returns {Type}
- [ ] L182 `Autobee.GENESIS` — add @returns {Type}
- [ ] L184 `Autobee.isAutobee(val)` — add description; @param {Type} + description for `auto`; @returns {Type}; @example
- [ ] L188 `db.isIndexer` — add @returns {Type}
- [ ] L192 `db.appending` — add description; @returns {Type}
- [ ] L196 `db.writable` — add @returns {Type}
- [ ] L201 `db.activeWriters` — add description; @returns {Type}
- [ ] L205 `db.flushes` — add description; @returns {Type}
- [ ] L209 `db.busy` — add description; @returns {Type}
- [ ] L224 `db.setAcking(acking, [options])` — add @param {Type} + description for `acking`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L231 `db.isLocalTrusted()` — add description; @returns {Type}; @example
- [ ] L293 `db.getExternalWriters()` — add description; @returns {Type}; @example
- [ ] L302 `db.getWriterViews(key)` — add description; @param {Type} + description for `key`; @returns {Type}; @example
- [ ] L312 `await db.cores(options = {})` — add description; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L371 `Autobee.getViewEncryption(bootstrap, encryptionKey, name)` — add description; @param {Type} + description for `bootstrap`; @param {Type} + description for `encryptionKey`; @param {Type} + description for `name`; @returns {Type}; @example
- [ ] L375 `views = db.views()` — add description; @returns {Type}; @example
- [ ] L454 `stream = db.replicate(isInitiator)` — add @param {Type} + description for `...args`; @returns {Type}
- [ ] L460 `await db.flush()` — add @returns {Type}; @example
- [ ] L464 `db.hintWakeup(wakeup)` — add description; @param {Type} + description for `wakeup`; @returns {Type}; @example
- [ ] L469 `db.openViewAt(oplog, options = {})` — add description; @param {Type} + description for `oplog`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L477 `db.openView(head, options = {})` — add description; @param {Type} + description for `head`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L482 `db.openCore(key)` — add description; @param {Type} + description for `key`; @returns {Type}; @example
- [ ] L629 `db.bumpSoon()` — add description; @returns {Type}; @example
- [ ] L648 `await db.update()` — add @returns {Type}; @example
- [ ] L652 `await db.updated()` — add @returns {Type}; @example
- [ ] L665 `db.getLastError()` — add description; @returns {Type}; @example
- [ ] L692 `await db.compactMaybe()` — add description; @returns {Type}; @example
- [ ] L1027 `await db.readOplog(core, length, options = {})` — add description; @param {Type} + description for `core`; @param {Type} + description for `length`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L1061 `await db.setLocal(key, [options])` — add @param {Type} + description for `key`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L1371 `await db.prepareBatch(batch)` — add description; @param {Type} + description for `batch`; @returns {Type}; @example
- [ ] L1506 `value = Autobee.decodeValue(buf, [opts])` — add @param {Type} + description for `buf`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L1510 `buf = Autobee.encodeValue(value, [opts])` — add @param {Type} + description for `value`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L1516 `await db.wakeup({ key, length })` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L1522 `await db.append(value | values)` — add @param {Type} + description for `values`; @param {Type} + description for `options`; @returns {Type}
- [ ] L1607 `await db.moveTo(head, [options])` — add @param {Type} + description for `head`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L1758 `db.replay()` — add description; @returns {Type}; @example

### `lib/encryption.js`

- [ ] L193 `writerEncryption.compatKeys(ctx)` — add description; @param {Type} + description for `ctx`; @returns {Type}; @example
- [ ] L197 `writerEncryption.blockKey(entropy, ctx)` — add description; @param {Type} + description for `entropy`; @param {Type} + description for `ctx`; @returns {Type}; @example

## Suggested `@typedef`s (11)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await db.append(value | values)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await db.cores(options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await db.moveTo(head, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await db.readOplog(core, length, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await db.setLocal(key, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await db.wakeup({ key, length })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `db.openView(head, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `db.openViewAt(oplog, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `db.setAcking(acking, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `buf = Autobee.encodeValue(value, [opts])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `value = Autobee.decodeValue(buf, [opts])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (11)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `anchor = await host.createAnchor()`
- `fastForward.boot`
- `fastForward.conservative`
- `host.ackWriter(key)`
- `host.addWriter(key, [options])`
- `host.genesis`
- `host.interrupt(reason)`
- `host.removeWriter(key)`
- `isTrusted(key, reference)`
- `mostRecentTrusted(target, reference)`
- `warmup(view)`
