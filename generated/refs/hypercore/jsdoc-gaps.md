# JSDoc gap report — hypercore

`holepunchto/hypercore` at **v11.35.1** · **0%** of published members fully documented (0/57) · 60 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 89%** · **param types 0%** · **typed returns 0%** · **examples 51%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (57)

### `index.js`

- [ ] L48 `const core = new Hypercore(storage, [key], [options])` — add @param {Type} for `storage`; @param {Type} for `key`; @param {Type} for `opts`
- [ ] L76 `core.keyPair` — add @returns {Type}
- [ ] L77 `core.readable` — add @returns {Type}
- [ ] L78 `core.writable` — add @returns {Type}
- [ ] L118 `Hypercore.MAX_SUGGESTED_BLOCK_SIZE` — add @returns {Type}
- [ ] L133 `const key = Hypercore.key(manifest, options = {})` — add @param {Type} + description for `manifest`; @param {Type} for `options`; @returns {Type}
- [ ] L158 `const dKey = Hypercore.discoveryKey(key)` — add description; @param {Type} + description for `key`; @returns {Type}; @example
- [ ] L162 `const bkey = Hypercore.blockEncryptionKey(key, encryptionKey)` — add description; @param {Type} + description for `key`; @param {Type} + description for `encryptionKey`; @returns {Type}; @example
- [ ] L166 `const mux = Hypercore.getProtocolMuxer(stream)` — add description; @param {Type} + description for `stream`; @returns {Type}; @example
- [ ] L170 `const core = Hypercore.createCore(storage, opts)` — add description; @param {Type} + description for `storage`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L174 `const stream = Hypercore.createProtocolStream(isInitiator, opts = {})` — add @param {Type} for `isInitiator`; @param {Type} for `opts`; @returns {Type}
- [ ] L208 `const storage = Hypercore.defaultStorage(storage, opts = {})` — add description; @param {Type} + description for `storage`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L230 `const snapshot = core.snapshot([options])` — add @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L238 `const session = core.session([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L273 `await core.setEncryptionKey(key, [opts])` — add @param {Type} + description for `key`; @param {Type} for `opts`; @returns {Type}
- [ ] L279 `await core.setEncryption(encryption)` — add @param {Type} + description for `encryption`; @returns {Type}; @example
- [ ] L294 `await core.setGroup(topic)` — add @param {Type} for `topic`; @returns {Type}; @example
- [ ] L299 `core.setKeyPair(keyPair)` — add @param {Type} + description for `keyPair`; @returns {Type}; @example
- [ ] L303 `core.setActive(active)` — add @param {Type} + description for `bool`; @returns {Type}; @example
- [ ] L510 `await core.close([{ error }])` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L570 `const { byteLength, length } = await core.commit(session, opts = {})` — add @param {Type} + description for `session`; @param {Type} for `opts`; @returns {Type}
- [ ] L577 `const stream = core.replicate(isInitiatorOrReplicationStream, opts = {})` — add @param {Type} + description for `isInitiator`; @param {Type} for `opts`; @returns {Type}
- [ ] L613 `core.id` — add @returns {Type}
- [ ] L617 `core.key` — add @returns {Type}
- [ ] L621 `core.discoveryKey` — add @returns {Type}
- [ ] L634 `core.length` — add @returns {Type}
- [ ] L639 `core.signedLength` — add @returns {Type}
- [ ] L652 `core.remoteContiguousLength` — add @returns {Type}
- [ ] L657 `core.contiguousLength` — add @returns {Type}
- [ ] L666 `core.fork` — add @returns {Type}
- [ ] L671 `core.padding` — add @returns {Type}
- [ ] L679 `core.peers` — add @returns {Type}
- [ ] L691 `await core.ready()` — add @returns {Type}; @example
- [ ] L700 `await core.setUserData(key, value)` — add @param {Type} for `key`; @param {Type} + description for `value`; @returns {Type}; @example
- [ ] L707 `const value = await core.getUserData(key)` — add @param {Type} for `key`; @returns {Type}; @example
- [ ] L737 `const done = core.findingPeers()` — add @returns {Type}; @example
- [ ] L753 `const info = await core.info([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L759 `const updated = await core.update([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L792 `const [index, relativeOffset] = await core.seek(byteOffset, [options])` — add @param {Type} + description for `bytes`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L834 `const has = await core.has(start, [end])` — add @param {Type} + description for `start`; @param {Type} + description for `end`; @returns {Type}; @example
- [ ] L866 `const block = await core.get(index, [options])` — add @param {Type} + description for `index`; @param {Type} for `opts`; @returns {Type}
- [ ] L897 `const cleared = await core.clear(start, [end], [options])` — add @param {Type} + description for `start`; @param {Type} + description for `end`; @param {Type} for `opts`; @returns {Type}
- [ ] L997 `await core.markBlock(start, end = start + 1)` — add @param {Type} + description for `start`; @param {Type} for `end`; @returns {Type}; @example
- [ ] L1011 `await core.clearMarkings()` — add @returns {Type}; @example
- [ ] L1020 `await core.startMarking()` — add @returns {Type}
- [ ] L1036 `await core.sweep(opts)` — add @param {Type} for `options`; @returns {Type}
- [ ] L1066 `const stream = core.createReadStream([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L1070 `const stream = core.createWriteStream()` — add @returns {Type}
- [ ] L1074 `const bs = core.createByteStream([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L1078 `const range = core.download([range])` — add @param {Type} + description for `range`; @returns {Type}
- [ ] L1092 `await core.truncate(newLength, [options])` — add @param {Type} + description for `newLength`; @param {Type} for `opts`; @returns {Type}
- [ ] L1114 `const { length, byteLength } = await core.append(block, options = {})` — add @param {Type} + description for `blocks`; @param {Type} for `opts`; @returns {Type}
- [ ] L1152 `const buffer = await core.signable([length], [fork])` — add description; @param {Type} + description for `length`; @param {Type} + description for `fork`; @returns {Type}; @example
- [ ] L1160 `const hash = await core.treeHash([length])` — add @param {Type} + description for `length`; @returns {Type}; @example
- [ ] L1174 `const proof = await core.proof(opts)` — add @param {Type} for `opts`; @returns {Type}
- [ ] L1191 `const batch = await core.verifyFullyRemote(proof)` — add @param {Type} + description for `proof`; @returns {Type}; @example
- [ ] L1249 `const ext = core.registerExtension(name, handlers = {})` — add @param {Type} + description for `name`; @param {Type} for `handlers`; @returns {Type}

## Suggested `@typedef`s (22)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await core.close([{ error }])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await core.sweep(opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `const key = Hypercore.key(manifest, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await core.setEncryptionKey(key, [opts])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await core.truncate(newLength, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const [index, relativeOffset] = await core.seek(byteOffset, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const block = await core.get(index, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const bs = core.createByteStream([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const cleared = await core.clear(start, [end], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const core = Hypercore.createCore(storage, opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const core = new Hypercore(storage, [key], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const info = await core.info([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const proof = await core.proof(opts)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const session = core.session([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const snapshot = core.snapshot([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const storage = Hypercore.defaultStorage(storage, opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = Hypercore.createProtocolStream(isInitiator, opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = core.createReadStream([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = core.replicate(isInitiatorOrReplicationStream, opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const updated = await core.update([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { byteLength, length } = await core.commit(session, opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { length, byteLength } = await core.append(block, options = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (3)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `ext.broadcast(message)`
- `ext.destroy()`
- `ext.send(message, peer)`
