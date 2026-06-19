# Reference generation improvement plan — hypercore
Generated from `holepunchto/hypercore` at **v11.33.2** (`c8a555de54`) on 2026-06-16T17:23:33.508Z.
**Doc-completeness: 80%** — 47 of 59 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 66 of 66 documented symbols (`content/reference/building-blocks/hypercore.mdx`).
### Extra in generated model (64)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `DefaultEncryption`
- `SMALL_WANTS`
- `activeRequests`
- `applyProof`
- `byteLength`
- `cancel`
- `clearRequests`
- `closed`
- `closing`
- `compact`
- `contiguousByteLength`
- `core`
- `destroyRequests`
- `destroyed`
- `emit`
- `enable`
- `encodeBatch`
- `encryption`
- `end`
- `exclusive`
- `extensions`
- `generateRemoteProofForTreeNode`
- `globalCache`
- `live`
- `manifest`
- `missingNodes`
- `off`
- `on`
- `on:data`
- `on:drain`
- `on:end`
- `on:error`
- `on:finish`
- `on:migrate`
- `on:readable`
- `once`
- `ongc`
- `onseq`
- `onwait`
- `opened`
- `opening`
- `preload`
- `purge`
- `push`
- `recover`
- `recoverFromRemoteProof`
- `recoverTreeNodeFromPeers`
- `recovering`
- `replicator`
- `sessions`
- `setGroup`
- `setRecoveryPeers`
- `snapshotted`
- `start`
- `state`
- `timeout`
- `transferSession`
- `treeHashFromStorage`
- `undownload`
- `valueEncoding`
- `wait`
- `waits`
- `weak`
- `write`
## Completeness gaps
### Missing description (6)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `const dKey = Hypercore.discoveryKey(key)`
- `const bkey = Hypercore.blockEncryptionKey(key, encryptionKey)`
- `const mux = Hypercore.getProtocolMuxer(stream)`
- `const core = Hypercore.createCore(storage, opts)`
- `const storage = Hypercore.defaultStorage(storage, opts = {})`
- `const buffer = await core.signable([length], [fork])`

### Undocumented parameters (12)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const key = Hypercore.key(manifest, options = {})` → manifest
- `const dKey = Hypercore.discoveryKey(key)` → key
- `const bkey = Hypercore.blockEncryptionKey(key, encryptionKey)` → key, encryptionKey
- `const mux = Hypercore.getProtocolMuxer(stream)` → stream
- `const core = Hypercore.createCore(storage, opts)` → storage, opts
- `const storage = Hypercore.defaultStorage(storage, opts = {})` → opts
- `const stream = core.replicate(isInitiatorOrReplicationStream, opts = {})` → isInitiator
- `const [index, relativeOffset] = await core.seek(byteOffset, [options])` → bytes, opts
- `const block = await core.get(index, [options])` → index
- `await core.truncate(newLength, [options])` → newLength
- `const buffer = await core.signable([length], [fork])` → fork
- `const ext = core.registerExtension(name, handlers = {})` → name

## Enhancements
### Return value not explained (17)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const stream = Hypercore.createProtocolStream(isInitiator, opts = {})`
- `const snapshot = core.snapshot([options])`
- `const session = core.session([options])`
- `const stream = core.replicate(isInitiatorOrReplicationStream, opts = {})`
- `const done = core.findingPeers()`
- `const info = await core.info([options])`
- `const updated = await core.update([options])`
- `const has = await core.has(start, [end])`
- `const block = await core.get(index, [options])`
- `const cleared = await core.clear(start, [end], [options])`
- `const stream = core.createReadStream([options])`
- `const stream = core.createWriteStream()`
- `const bs = core.createByteStream([options])`
- `const range = core.download([range])`
- `const hash = await core.treeHash([length])`
- `const proof = await core.proof(opts)`
- `const ext = core.registerExtension(name, handlers = {})`

### No example (37)

_Cause: no code fence under the README entry — add a usage snippet._

- `Hypercore.MAX_SUGGESTED_BLOCK_SIZE`
- `const dKey = Hypercore.discoveryKey(key)`
- `const bkey = Hypercore.blockEncryptionKey(key, encryptionKey)`
- `const mux = Hypercore.getProtocolMuxer(stream)`
- `const core = Hypercore.createCore(storage, opts)`
- `const storage = Hypercore.defaultStorage(storage, opts = {})`
- `const snapshot = core.snapshot([options])`
- `await core.setEncryption(encryption)`
- `await core.setGroup(topic)`
- `core.setKeyPair(keyPair)`
- `core.setActive(active)`
- `await core.close([{ error }])`
- `core.id`
- `core.key`
- `core.discoveryKey`
- `core.length`
- `core.signedLength`
- `core.remoteContiguousLength`
- `core.contiguousLength`
- `core.fork`
- `core.padding`
- `core.peers`
- `await core.ready()`
- `await core.setUserData(key, value)`
- `const value = await core.getUserData(key)`
- `const done = core.findingPeers()`
- `const has = await core.has(start, [end])`
- `await core.markBlock(start, end = start + 1)`
- `await core.clearMarkings()`
- `const buffer = await core.signable([length], [fork])`
- `const hash = await core.treeHash([length])`
- `const batch = await core.verifyFullyRemote(proof)`
- `core.keyPair`
- `core.readable`
- `core.writable`
- `core.on('close')`
- `core.on('ready')`

## Drift
### Undocumented in README (in source) (99)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `Hypercore.DefaultEncryption`
- `Hypercore.SMALL_WANTS`
- `Hypercore.enable(flag)`
- `Hypercore.setRecoveryPeers(peers)`
- `Hypercore.clearRequests(session, err)`
- `Hypercore.destroyRequests(session, err)`
- `await Hypercore.treeHashFromStorage(session, length = session.length)`
- `core.compact()`
- `core.replicator`
- `core.clearRequests(activeRequests, error)`
- `core.manifest`
- `core.byteLength`
- `core.contiguousByteLength`
- `core.globalCache`
- `core.recovering`
- `await core.recover()`
- `core.transferSession(core)`
- `await core.purge()`
- `core.undownload(range)`
- `core.cancel(request)`
- `await core.missingNodes(index)`
- `await core.applyProof(proof, from)`
- `core.generateRemoteProofForTreeNode(treeNodeIndex)`
- `await core.recoverFromRemoteProof(remoteProof)`
- `core.recoverTreeNodeFromPeers()`
- `core.on(event, listener)`
- `core.once(event, listener)`
- `core.off(event, listener)`
- `core.emit(event, [...args])`
- `core.core`
- `core.state`
- `core.encryption`
- `core.extensions`
- `core.valueEncoding`
- `core.encodeBatch`
- `core.activeRequests`
- `core.sessions`
- `core.ongc`
- `core.exclusive`
- `core.opened`
- `core.closed`
- `core.weak`
- `core.snapshotted`
- `core.onseq`
- `core.onwait`
- `core.wait`
- `core.timeout`
- `core.preload`
- `core.closing`
- `core.opening`
- `core.waits`
- `core.on('migrate', key)`
- `new ReadStream(core, opts = {})`
- `readStream.push(data)`
- `readStream.destroy([err])`
- `readStream.destroyed`
- `readStream.on(event, listener)`
- `readStream.once(event, listener)`
- `readStream.off(event, listener)`
- `readStream.emit(event, [...args])`
- `readStream.core`
- `readStream.start`
- `readStream.end`
- `readStream.snapshot`
- `readStream.live`
- `readStream.wait`
- `readStream.timeout`
- `readStream.on('data', listener)`
- `readStream.on('readable', listener)`
- `readStream.on('end', listener)`
- `readStream.on('close', listener)`
- `readStream.on('error', listener)`
- `new WriteStream(core)`
- `writeStream.write(data)`
- `writeStream.end()`
- `writeStream.destroy([err])`
- `writeStream.destroyed`
- `writeStream.on(event, listener)`
- `writeStream.once(event, listener)`
- `writeStream.off(event, listener)`
- `writeStream.emit(event, [...args])`
- `writeStream.core`
- `writeStream.on('drain', listener)`
- `writeStream.on('finish', listener)`
- `writeStream.on('close', listener)`
- `writeStream.on('error', listener)`
- `new ByteStream(core, opts = {})`
- `byteStream.push(data)`
- `byteStream.destroy([err])`
- `byteStream.destroyed`
- `byteStream.on(event, listener)`
- `byteStream.once(event, listener)`
- `byteStream.off(event, listener)`
- `byteStream.emit(event, [...args])`
- `byteStream.on('data', listener)`
- `byteStream.on('readable', listener)`
- `byteStream.on('end', listener)`
- `byteStream.on('close', listener)`
- `byteStream.on('error', listener)`

### Stale README (not found in source) (3)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `ext.send(message, peer)`
- `ext.broadcast(message)`
- `ext.destroy()`
