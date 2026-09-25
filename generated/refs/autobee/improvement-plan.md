# Reference generation improvement plan — autobee
Generated from `holepunchto/autobee` at **v2.9.5** (`1e29b82a6d`) on 2026-09-17T14:15:51.703Z.
**Doc-completeness: 61%** — 14 of 23 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Missing description (2)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `Autobee.isAutobee(val)`
- `views = db.views()`

### Undocumented parameters (8)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const db = new Autobee(store, [key], [options])` → handlers
- `Autobee.isAutobee(val)` → auto
- `stream = db.replicate(isInitiator)` → ...args
- `await db.setLocal(key, [options])` → options
- `value = Autobee.decodeValue(buf, [opts])` → buf, opts
- `await db.wakeup({ key, length })` → options
- `await db.append(value | values)` → options
- `await db.moveTo(head, [options])` → options

## Enhancements
### No example (20)

_Cause: no code fence under the README entry — add a usage snippet._

- `Autobee.GENESIS`
- `Autobee.isAutobee(val)`
- `db.isIndexer`
- `db.writable`
- `db.setAcking(acking, [options])`
- `views = db.views()`
- `await db.flush()`
- `await db.update()`
- `await db.updated()`
- `await db.setLocal(key, [options])`
- `value = Autobee.decodeValue(buf, [opts])`
- `buf = Autobee.encodeValue(value, [opts])`
- `await db.wakeup({ key, length })`
- `await db.moveTo(head, [options])`
- `db.key`
- `db.discoveryKey`
- `db.id`
- `db.bee`
- `db.view`
- `db.local`

## Drift
### Undocumented in README (in source) (54)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `db.activeWriters`
- `db.flushes`
- `db.busy`
- `db.isLocalTrusted()`
- `db.getExternalWriters()`
- `db.getWriterViews(key)`
- `await db.cores(options = {})`
- `Autobee.getViewEncryption(bootstrap, encryptionKey, name)`
- `db.hintWakeup(wakeup)`
- `db.openViewAt(oplog, options = {})`
- `db.openView(head, options = {})`
- `db.openCore(key)`
- `db.bumpSoon()`
- `db.getLastError()`
- `await db.readOplog(core, length, options = {})`
- `await db.prepareBatch(batch)`
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
- `db.on('anchor', anchor)`
- `db.on('move-to', to, from)`

### Stale README (not found in source) (11)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `host.addWriter(key, [options])`
- `host.removeWriter(key)`
- `host.ackWriter(key)`
- `host.interrupt(reason)`
- `anchor = await host.createAnchor()`
- `host.genesis`
- `isTrusted(key, reference)`
- `mostRecentTrusted(target, reference)`
- `warmup(view)`
- `fastForward.boot`
- `fastForward.conservative`
