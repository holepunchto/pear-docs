# Reference generation improvement plan — hyperdrive
Generated from `holepunchto/hyperdrive` at **v13.3.3** (`6b562402af`) on 2026-08-11T14:23:36.305Z.
**Doc-completeness: 52%** — 23 of 44 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 48 of 48 documented symbols (`content/reference/building-blocks/hyperdrive.mdx`).
### Extra in generated model (16)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `closeMonitors`
- `closed`
- `emit`
- `encryptionKey`
- `getContentKey`
- `getContentManifest`
- `monitors`
- `normalizePath`
- `off`
- `on`
- `on:blobs`
- `on:content-key`
- `once`
- `opened`
- `putEntry`
- `setActive`
## Completeness gaps
### Missing description (4)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `const blobsLength = await drive.getBlobsLength(checkout)`
- `const blobs = await drive.getBlobs()`
- `const comparison = drive.compare(entryA, entryB)`
- `const exists = await drive.exists(path)`

### Undocumented parameters (20)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const drive = new Hyperdrive(store, [key])` → key, opts
- `await drive.truncate(version, [options] })` → options
- `const blobsLength = await drive.getBlobsLength(checkout)` → checkout
- `const stream = drive.replicate(isInitiatorOrStream)` → isInitiator, opts
- `const buffer = await drive.get(path, [options])` → name
- `await drive.put(path, buffer, [options])` → name, buf
- `await drive.del(path)` → name
- `const comparison = drive.compare(entryA, entryB)` → a, b
- `const cleared = await drive.clear(path, [options])` → name
- `await drive.symlink(path, linkname)` → name, dst, options
- `const entry = await drive.entry(path, [options])` → name
- `const exists = await drive.exists(path)` → name
- `const watcher = drive.watch([folder])` → folder
- `const stream = drive.diff(version, folder, [options])` → length, opts
- `await drive.downloadDiff(version, folder, [options])` → length, opts
- `const stream = drive.list(folder, [options])` → folder
- `const stream = drive.readdir(folder, [options])` → folder
- `const mirror = drive.mirror(out, [options])` → out
- `const rs = drive.createReadStream(path, [options])` → name
- `const ws = drive.createWriteStream(path, [options])` → name

## Enhancements
### Return value not explained (11)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const done = drive.findingPeers()`
- `const stream = drive.replicate(isInitiatorOrStream)`
- `const updated = await drive.update([options])`
- `const snapshot = drive.checkout(version)`
- `const batch = drive.batch()`
- `const cleared = await drive.clear(path, [options])`
- `const cleared = await drive.clearAll([options])`
- `const stream = drive.diff(version, folder, [options])`
- `const download = drive.download(folder, [options])`
- `const mirror = drive.mirror(out, [options])`
- `const ws = drive.createWriteStream(path, [options])`

### No example (28)

_Cause: no code fence under the README entry — add a usage snippet._

- `const drive = new Hyperdrive(store, [key])`
- `drive.id`
- `drive.key`
- `drive.discoveryKey`
- `drive.contentKey`
- `drive.version`
- `drive.writable`
- `drive.readable`
- `const done = drive.findingPeers()`
- `await drive.truncate(version, [options] })`
- `const blobsLength = await drive.getBlobsLength(checkout)`
- `const snapshot = drive.checkout(version)`
- `const batch = drive.batch()`
- `await drive.put(path, buffer, [options])`
- `await drive.del(path)`
- `const comparison = drive.compare(entryA, entryB)`
- `await drive.purge()`
- `await drive.symlink(path, linkname)`
- `const exists = await drive.exists(path)`
- `const stream = await drive.entries([range], [options])`
- `await drive.has(path)`
- `const mirror = drive.mirror(out, [options])`
- `await drive.ready()`
- `await drive.close()`
- `drive.corestore`
- `drive.db`
- `drive.core`
- `drive.supportsMetadata`

## Drift
### Undocumented in README (in source) (19)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `await Hyperdrive.getDriveKey(corestore)`
- `Hyperdrive.getContentKey(m, key)`
- `Hyperdrive.getContentManifest(m, key)`
- `drive.setActive(bool)`
- `drive.monitor(name, opts = {})`
- `await drive.closeMonitors()`
- `await drive.putEntry(name, options = {})`
- `Hyperdrive.normalizePath(name)`
- `drive.opened`
- `drive.closed`
- `drive.on(event, listener)`
- `drive.once(event, listener)`
- `drive.off(event, listener)`
- `drive.emit(event, [...args])`
- `drive.blobs`
- `drive.encryptionKey`
- `drive.monitors`
- `drive.on('blobs', blobs)`
- `drive.on('content-key', key)`

### Stale README (not found in source) (1)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `await batch.flush()`
