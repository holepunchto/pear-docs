# Reference generation improvement plan — hyperbee
Generated from `holepunchto/hyperbee` at **v2.27.3** (`012caaf19b`) on 2026-06-11T12:36:51.644Z.
**Doc-completeness: 67%** — 18 of 27 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 28 of 28 documented symbols (`content/reference/building-blocks/hyperbee.mdx`).
### Extra in generated model (43)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `alwaysDuplicate`
- `bee`
- `blocks`
- `clear`
- `clearUnlinked`
- `closed`
- `createRangeIterator`
- `current`
- `currentMapped`
- `destroy`
- `emit`
- `end`
- `extension`
- `feed`
- `from`
- `index`
- `keyEncoding`
- `latestDiff`
- `lock`
- `map`
- `metadata`
- `next`
- `node`
- `off`
- `on`
- `on:error`
- `on:update`
- `once`
- `opened`
- `outgoing`
- `prefix`
- `previous`
- `previousMapped`
- `push`
- `range`
- `readonly`
- `return`
- `send`
- `sep`
- `start`
- `stream`
- `update`
- `valueEncoding`
## Completeness gaps
### Undocumented parameters (9)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const stream = db.replicate(isInitiatorOrStream)` → isInitiator, opts
- `const { seq, key, value } = await db.peek([range], [options])` → range, opts
- `const stream = db.createDiffStream(otherVersion, [options])` → right, opts
- `const { seq, key, value } = await db.get(key)` → opts
- `const { key, value } = await db.getBySeq(seq, [options])` → opts
- `const batch = db.batch()` → opts
- `const snapshot = db.checkout(version)` → opts
- `const snapshot = db.snapshot()` → opts
- `const sub = db.sub('sub-prefix', options = {})` → prefix

## Enhancements
### Return value not explained (8)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const stream = db.replicate(isInitiatorOrStream)`
- `const stream = db.createReadStream([range], [options])`
- `const stream = db.createHistoryStream([options])`
- `const stream = db.createDiffStream(otherVersion, [options])`
- `const batch = db.batch()`
- `const snapshot = db.checkout(version)`
- `const snapshot = db.snapshot()`
- `const sub = db.sub('sub-prefix', options = {})`

### No example (19)

_Cause: no code fence under the README entry — add a usage snippet._

- `db.version`
- `db.id`
- `db.key`
- `db.discoveryKey`
- `db.writable`
- `db.readable`
- `const stream = db.replicate(isInitiatorOrStream)`
- `const { seq, key, value } = await db.peek([range], [options])`
- `const { seq, key, value } = await db.get(key)`
- `const { key, value } = await db.getBySeq(seq, [options])`
- `const batch = db.batch()`
- `const entryWatcher = await db.getAndWatch(key, [options])`
- `const snapshot = db.checkout(version)`
- `const snapshot = db.snapshot()`
- `const header = await db.getHeader([options])`
- `const isHyperbee = await Hyperbee.isHyperbee(core, [options])`
- `await db.ready()`
- `await db.close()`
- `db.core`

## Drift
### Undocumented in README (in source) (71)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `db.update(opts)`
- `db.createRangeIterator(range, opts = {})`
- `await db.clearUnlinked(options = {})`
- `db.opened`
- `db.closed`
- `db.on(event, listener)`
- `db.once(event, listener)`
- `db.off(event, listener)`
- `db.emit(event, [...args])`
- `db.feed`
- `db.keyEncoding`
- `db.valueEncoding`
- `db.extension`
- `db.metadata`
- `db.lock`
- `db.sep`
- `db.readonly`
- `db.prefix`
- `db.alwaysDuplicate`
- `new Batch(outgoing, from)`
- `batch.push(seq)`
- `batch.send()`
- `batch.clear()`
- `batch.blocks`
- `batch.start`
- `batch.end`
- `batch.outgoing`
- `batch.from`
- `new Watcher(bee, range, opts = {})`
- `await db.next()`
- `await db.return()`
- `db.destroy()`
- `await db.ready()`
- `await db.close()`
- `db.opened`
- `db.closed`
- `db.on(event, listener)`
- `db.once(event, listener)`
- `db.off(event, listener)`
- `db.emit(event, [...args])`
- `db.keyEncoding`
- `db.valueEncoding`
- `db.index`
- `db.bee`
- `db.core`
- `db.latestDiff`
- `db.range`
- `db.map`
- `db.current`
- `db.previous`
- `db.currentMapped`
- `db.previousMapped`
- `db.stream`
- `db.on('update', listener)`
- `new EntryWatcher(bee, key, opts = {})`
- `await db.ready()`
- `await db.close()`
- `db.opened`
- `db.closed`
- `db.on(event, listener)`
- `db.once(event, listener)`
- `db.off(event, listener)`
- `db.emit(event, [...args])`
- `db.keyEncoding`
- `db.valueEncoding`
- `db.index`
- `db.bee`
- `db.key`
- `db.node`
- `db.on('error', e)`
- `db.on('update', listener)`

### Stale README (not found in source) (1)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `await batch.flush()`
