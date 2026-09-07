# Reference generation improvement plan — autobase
Generated from `holepunchto/autobase` at **v7.28.1** (`2c79852525`) on 2026-06-11T12:36:50.001Z.
**Doc-completeness: 63%** — 19 of 30 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 38 of 38 documented symbols (`content/reference/building-blocks/autobase.mdx`).
### Extra in generated model (75)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `ackable`
- `active`
- `activeBatch`
- `activeWriters`
- `advance`
- `appending`
- `backoff`
- `base`
- `batch`
- `bigBatches`
- `blindEncryption`
- `bootstrap`
- `bootstraps`
- `close`
- `closed`
- `core`
- `decodeValue`
- `emit`
- `encodeValue`
- `encrypt`
- `encrypted`
- `encryption`
- `encryptionKey`
- `export`
- `fastForwardEnabled`
- `fastForwardFailedAt`
- `fastForwardMinimum`
- `fastForwardTo`
- `fastForwarding`
- `flush`
- `flushing`
- `forceFastForward`
- `getBootRecord`
- `getIndexedInfo`
- `getLastError`
- `getLocalKey`
- `getSystemKey`
- `getWriterEncryption`
- `globalCache`
- `hintWakeup`
- `id`
- `indexedLength`
- `interrupted`
- `isFastForwarding`
- `keyPair`
- `linearizer`
- `local`
- `localWriter`
- `migrated`
- `nukeTip`
- `off`
- `on`
- `on:reboot`
- `on:rotate-local-writer`
- `onannounce`
- `once`
- `onlookup`
- `onpeeractive`
- `opened`
- `recouple`
- `recoveries`
- `repair`
- `setLocal`
- `setWakeup`
- `store`
- `system`
- `updating`
- `valueEncoding`
- `version`
- `views`
- `waitForWritable`
- `wakeupCapability`
- `wakeupOwner`
- `wakeupProtocol`
- `wakeupSession`
## Completeness gaps
### Missing description (5)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `const hash = await base.hash()`
- `const isBase = await Autobase.isAutobase(core, opts)`
- `const value = await base.getUserData(key)`
- `host.removeable(key)`
- `base.paused`

### Undocumented parameters (8)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const base = new Autobase(store, bootstrap, opts)` → store, handlers
- `const stream = base.replicate(isInitiator || stream, opts)` → isInitiator, opts
- `await base.append(value, opts)` → value, opts
- `const core = Autobase.getLocalCore(store, handlers, encryptionKey)` → store, encryptionKey
- `const isBase = await Autobase.isAutobase(core, opts)` → core
- `host.removeable(key)` → key
- `base.on('interrupt', (reason) => { ... })` → interrupted
- `base.on('error', (err) => { ... })` → err

## Enhancements
### Return value not explained (3)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const stream = base.replicate(isInitiator || stream, opts)`
- `const heads = base.heads()`
- `const core = Autobase.getLocalCore(store, handlers, encryptionKey)`

### No example (27)

_Cause: no code fence under the README entry — add a usage snippet._

- `base.writable`
- `base.signedLength`
- `base.length`
- `const hash = await base.hash()`
- `const heads = base.heads()`
- `base.setBigBatches(enable = true)`
- `await base.update()`
- `await base.ack(bg = false)`
- `const core = Autobase.getLocalCore(store, handlers, encryptionKey)`
- `const { referrer, view } = await Autobase.getUserData(core)`
- `const isBase = await Autobase.isAutobase(core, opts)`
- `await base.setUserData(key, value)`
- `const value = await base.getUserData(key)`
- `await base.pause()`
- `await base.resume()`
- `host.removeable(key)`
- `base.key`
- `base.discoveryKey`
- `base.isIndexer`
- `base.paused`
- `base.view`
- `base.on('interrupt', (reason) => { ... })`
- `base.on('update', () => { ... })`
- `base.on('error', (err) => { ... })`
- `base.on('fast-forward', (to, from) => { ... })`
- `base.on('is-indexer', () => { ... })`
- `base.on('is-non-indexer', () => { ... })`

## Drift
### Undocumented in README (in source) (78)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `base.bootstrap`
- `base.bootstraps`
- `base.appending`
- `base.ackable`
- `base.indexedLength`
- `base.flushing`
- `base.getSystemKey()`
- `base.system`
- `await base.getIndexedInfo()`
- `await base.export()`
- `base.hintWakeup(hints)`
- `await base.setLocal(key, { keyPair } = {})`
- `base.setWakeup(cap, discoveryKey)`
- `await Autobase.getBootRecord(store, key)`
- `await base.flush()`
- `await base.advance()`
- `base.recouple()`
- `base.getLastError()`
- `base.isFastForwarding()`
- `base.views()`
- `base.batch()`
- `Autobase.decodeValue(value, opts)`
- `Autobase.encodeValue(value, opts)`
- `await Autobase.getLocalKey(store, opts = {})`
- `base.getWriterEncryption()`
- `await base.repair()`
- `await base.forceFastForward()`
- `base.waitForWritable()`
- `await base.ready()`
- `await base.close()`
- `base.opened`
- `base.closed`
- `base.on(event, listener)`
- `base.once(event, listener)`
- `base.off(event, listener)`
- `base.emit(event, [...args])`
- `base.id`
- `base.backoff`
- `base.keyPair`
- `base.valueEncoding`
- `base.store`
- `base.globalCache`
- `base.migrated`
- `base.encrypted`
- `base.encrypt`
- `base.encryptionKey`
- `base.encryption`
- `base.blindEncryption`
- `base.activeBatch`
- `base.local`
- `base.localWriter`
- `base.activeWriters`
- `base.linearizer`
- `base.updating`
- `base.nukeTip`
- `base.wakeupOwner`
- `base.wakeupCapability`
- `base.wakeupProtocol`
- `base.wakeupSession`
- `base.fastForwardEnabled`
- `base.fastForwarding`
- `base.fastForwardTo`
- `base.fastForwardFailedAt`
- `base.fastForwardMinimum`
- `base.bigBatches`
- `base.core`
- `base.version`
- `base.interrupted`
- `base.recoveries`
- `base.on('rotate-local-writer', listener)`
- `base.on('reboot', listener)`
- `new WakeupHandler(base, discoveryKey)`
- `base.onpeeractive(peer, session)`
- `base.onlookup(req, peer, session)`
- `base.onannounce(wakeup, peer, session)`
- `base.active`
- `base.discoveryKey`
- `base.base`

### Stale README (not found in source) (5)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `const core = store.get(name || { name, valueEncoding })`
- `await host.addWriter(key, { indexer = true })`
- `await host.removeWriter(key)`
- `await host.ackWriter(key)`
- `host.interrupt(reason)`
