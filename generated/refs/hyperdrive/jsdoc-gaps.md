# JSDoc gap report — hyperdrive

`holepunchto/hyperdrive` at **v13.3.3** · **0%** of published members fully documented (0/42) · 11 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 90%** · **param types 0%** · **typed returns 0%** · **examples 52%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (42)

### `index.js`

- [ ] L21 `const drive = new Hyperdrive(store, [key])` — add @param {Type} for `corestore`; @param {Type} + description for `key`; @param {Type} + description for `opts`; @example
- [ ] L29 `drive.corestore` — add @returns {Type}
- [ ] L30 `drive.db` — add @returns {Type}
- [ ] L31 `drive.core` — add @returns {Type}
- [ ] L33 `drive.supportsMetadata` — add @returns {Type}
- [ ] L83 `drive.id` — add @returns {Type}
- [ ] L87 `drive.key` — add @returns {Type}
- [ ] L91 `drive.discoveryKey` — add @returns {Type}
- [ ] L95 `drive.contentKey` — add @returns {Type}
- [ ] L99 `drive.version` — add @returns {Type}
- [ ] L103 `drive.writable` — add @returns {Type}
- [ ] L107 `drive.readable` — add @returns {Type}
- [ ] L111 `const done = drive.findingPeers()` — add @returns {Type}; @example
- [ ] L115 `await drive.truncate(version, [options] })` — add @param {Type} + description for `version`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L133 `const blobsLength = await drive.getBlobsLength(checkout)` — add description; @param {Type} + description for `checkout`; @returns {Type}; @example
- [ ] L147 `const stream = drive.replicate(isInitiatorOrStream)` — add @param {Type} + description for `isInitiator`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L151 `const updated = await drive.update([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L165 `const snapshot = drive.checkout(version)` — add @param {Type} + description for `version`; @returns {Type}; @example
- [ ] L169 `const batch = drive.batch()` — add @returns {Type}; @example
- [ ] L291 `const blobs = await drive.getBlobs()` — add description; @returns {Type}
- [ ] L316 `const buffer = await drive.get(path, [options])` — add @param {Type} + description for `name`; @param {Type} for `opts`; @returns {Type}
- [ ] L330 `await drive.put(path, buffer, [options])` — add @param {Type} + description for `name`; @param {Type} + description for `buf`; @param {Type} for `options`; @returns {Type}; @example
- [ ] L340 `await drive.del(path)` — add @param {Type} + description for `name`; @returns {Type}; @example
- [ ] L344 `const comparison = drive.compare(entryA, entryB)` — add description; @param {Type} + description for `a`; @param {Type} + description for `b`; @returns {Type}; @example
- [ ] L349 `const cleared = await drive.clear(path, [options])` — add @param {Type} + description for `name`; @param {Type} for `opts`; @returns {Type}
- [ ] L367 `const cleared = await drive.clearAll([options])` — add @param {Type} for `opts`; @returns {Type}
- [ ] L377 `await drive.purge()` — add @returns {Type}; @example
- [ ] L388 `await drive.symlink(path, linkname)` — add @param {Type} + description for `name`; @param {Type} + description for `dst`; @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L396 `const entry = await drive.entry(path, [options])` — add @param {Type} + description for `name`; @param {Type} for `opts`; @returns {Type}
- [ ] L415 `const exists = await drive.exists(path)` — add description; @param {Type} + description for `name`; @returns {Type}; @example
- [ ] L419 `const watcher = drive.watch([folder])` — add @param {Type} + description for `folder`; @returns {Type}
- [ ] L428 `const stream = drive.diff(version, folder, [options])` — add @param {Type} + description for `length`; @param {Type} + description for `folder`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L439 `await drive.downloadDiff(version, folder, [options])` — add @param {Type} + description for `length`; @param {Type} + description for `folder`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L453 `await drive.downloadRange(dbRanges, blobRanges)` — add @param {Type} + description for `dbRanges`; @param {Type} + description for `blobRanges`; @returns {Type}
- [ ] L471 `const stream = await drive.entries([range], [options])` — add @param {Type} + description for `range`; @param {Type} for `opts`; @returns {Type}; @example
- [ ] L477 `const download = drive.download(folder, [options])` — add @param {Type} + description for `folder`; @param {Type} for `opts`; @returns {Type}
- [ ] L483 `await drive.has(path)` — add @param {Type} + description for `path`; @returns {Type}; @example
- [ ] L503 `const stream = drive.list(folder, [options])` — add @param {Type} + description for `folder`; @param {Type} for `opts`; @returns {Type}
- [ ] L516 `const stream = drive.readdir(folder, [options])` — add @param {Type} + description for `folder`; @param {Type} for `opts`; @returns {Type}
- [ ] L521 `const mirror = drive.mirror(out, [options])` — add @param {Type} + description for `out`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L525 `const rs = drive.createReadStream(path, [options])` — add @param {Type} + description for `name`; @param {Type} for `opts`; @returns {Type}
- [ ] L579 `const ws = drive.createWriteStream(path, [options])` — add @param {Type} + description for `name`; @param {Type} for `options`; @returns {Type}

## Suggested `@typedef`s (19)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await drive.put(path, buffer, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await drive.symlink(path, linkname)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await drive.truncate(version, [options] })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `const ws = drive.createWriteStream(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await drive.downloadDiff(version, folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const buffer = await drive.get(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const cleared = await drive.clear(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const cleared = await drive.clearAll([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const download = drive.download(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const drive = new Hyperdrive(store, [key])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const entry = await drive.entry(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const mirror = drive.mirror(out, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const rs = drive.createReadStream(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = await drive.entries([range], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.diff(version, folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.list(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.readdir(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.replicate(isInitiatorOrStream)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const updated = await drive.update([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (1)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await batch.flush()`
