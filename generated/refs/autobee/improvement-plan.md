# Reference generation improvement plan — autobee
Generated from `holepunchto/autobee` at **v2.2.2** (`30b7e97d84`) on 2026-09-08T13:41:04.756Z.
**Doc-completeness: 64%** — 14 of 22 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**98%** of the hand-authored page is reproduced — 39 of 40 documented symbols (`content/reference/building-blocks/autobee.mdx`).
### Missing from generated model (1)
_Documented by hand but not extracted — real fidelity gaps to fix before this can replace the page._
- `clock`
### Extra in generated model (45)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `activeWriters`
- `applyBacklog`
- `boot`
- `bootFrom`
- `bootstrap`
- `bootstrapWeight`
- `bumpSoon`
- `bumping`
- `busy`
- `closed`
- `conservative`
- `cores`
- `emit`
- `encryptionKey`
- `fastForwardTo`
- `fastForwarding`
- `ff`
- `flushes`
- `getExternalWriters`
- `getLastError`
- `getSystemEncryption`
- `getViewEncryption`
- `getWriterViews`
- `interrupted`
- `isTrusted`
- `keyPair`
- `legacyViews`
- `mostRecentTrusted`
- `name`
- `off`
- `on`
- `once`
- `openCore`
- `openViewAt`
- `opened`
- `prepareBatch`
- `previousDrain`
- `readOplog`
- `replay`
- `store`
- `system`
- `trusted`
- `views`
- `wakeupCapability`
- `writers`
## Completeness gaps
### Missing description (2)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `Autobee.isAutobee(val)`
- `views = db.views()`

### Undocumented parameters (7)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const db = new Autobee(store, [key], [options])` → handlers
- `Autobee.isAutobee(val)` → auto
- `stream = db.replicate(isInitiator)` → ...args
- `await db.setLocal(key, [options])` → options
- `value = Autobee.decodeValue(buf, [opts])` → buf, opts
- `await db.wakeup({ key, length })` → options
- `await db.append(value | values)` → options

## Enhancements
### No example (19)

_Cause: no code fence under the README entry — add a usage snippet._

- `Autobee.GENESIS`
- `Autobee.isAutobee(val)`
- `db.isIndexer`
- `db.writable`
- `views = db.views()`
- `await db.flush()`
- `await db.update()`
- `await db.updated()`
- `await db.setLocal(key, [options])`
- `value = Autobee.decodeValue(buf, [opts])`
- `buf = Autobee.encodeValue(value, [opts])`
- `await db.wakeup({ key, length })`
- `await db.moveTo(head)`
- `db.key`
- `db.discoveryKey`
- `db.id`
- `db.bee`
- `db.view`
- `db.local`

## Drift
### Undocumented in README (in source) (53)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `db.activeWriters`
- `db.flushes`
- `db.busy`
- `db.getExternalWriters()`
- `db.getWriterViews(key)`
- `await db.cores(options = {})`
- `Autobee.getViewEncryption(bootstrap, encryptionKey, name)`
- `db.hintWakeup(wakeup)`
- `db.openViewAt(oplog)`
- `db.openCore(key)`
- `db.getMostRecentHead()`
- `db.bumpSoon()`
- `db.getLastError()`
- `await db.readOplog(core, length, opts = null)`
- `await db.prepareBatch(batch)`
- `await db.applyBacklog(batches)`
- `db.replay()`
- `await db.ready()`
- `await db.close()`
- `db.opened`
- `db.closed`
- `db.on(event, listener)`
- `db.once(event, listener)`
- `db.off(event, listener)`
- `db.emit(event, [...args])`
- `db.encrypted`
- `db.bootstrapWeight`
- `db.getSystemEncryption`
- `db.getViewEncryption`
- `db.store`
- `db.bootstrap`
- `db.stats`
- `db.system`
- `db.optimistic`
- `db.name`
- `db.encryptionKey`
- `db.keyPair`
- `db.writers`
- `db.bumping`
- `db.bootFrom`
- `db.trusted`
- `db.ff`
- `db.fastForwarding`
- `db.fastForwardTo`
- `db.legacyViews`
- `db.interrupted`
- `db.wakeupCapability`
- `db.previousDrain`
- `db.on('interrupt', interrupted)`
- `db.on('update', listener)`
- `db.on('error', err)`
- `db.on('rotate-local-writer', listener)`
- `db.on('move-to', to, from)`

### Stale README (not found in source) (10)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `host.addWriter(key, [options])`
- `host.removeWriter(key)`
- `host.ackWriter(key)`
- `host.interrupt(reason)`
- `anchor = await host.createAnchor()`
- `host.genesis`
- `isTrusted(key, reference)`
- `mostRecentTrusted(target, reference)`
- `fastForward.boot`
- `fastForward.conservative`
