# Reference generation improvement plan — hyperdb
Generated from `holepunchto/hyperdb` at **v6.11.2** (`22a8de0170`) on 2026-11-19T12:42:44.777Z.
**Doc-completeness: 38%** — 8 of 21 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Missing description (1)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `bool = db.updated([collection], [query])`

### Undocumented parameters (13)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const stream = db.changes(range = {})` → range
- `const stream = db.diff(collection, query = {})` → collectionName
- `db.watch(cb)` → fn
- `db.unwatch(cb)` → fn
- `db = db.snapshot()` → options
- `db = await db.exclusiveTransaction()` → options
- `queryStream = db.find(collectionOrIndex, query, [options])` → query, options
- `doc = await db.findOne(collectionOrIndex, query, [options])` → indexName, query, options
- `bool = db.updated([collection], [query])` → collectionName, record
- `[a, b, ...] = await db.getAll([[collection, query], ...])` → batch
- `doc = await db.get(collection, query)` → collectionName, record, options
- `await db.delete(collection, query)` → collectionName, record, options
- `await db.insert(collection, doc)` → collectionName, record, options

## Enhancements
### No example (18)

_Cause: no code fence under the README entry — add a usage snippet._

- `db.closed`
- `db.writable`
- `db.readable`
- `await db.ready()`
- `await db.close()`
- `db.watch(cb)`
- `db.unwatch(cb)`
- `db = db.snapshot()`
- `db = await db.exclusiveTransaction()`
- `db = db.transaction()`
- `doc = await db.findOne(collectionOrIndex, query, [options])`
- `bool = db.updated([collection], [query])`
- `[a, b, ...] = await db.getAll([[collection, query], ...])`
- `doc = await db.get(collection, query)`
- `await db.delete(collection, query)`
- `await db.insert(collection, doc)`
- `await db.insertAll([[collection, doc, opts?], ...])`
- `await db.flush()`

## Drift
### Undocumented in README (in source) (28)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `new HyperDB(engine, definition, options = {})`
- `HyperDB.isDefinition(definition)`
- `HyperDB.rocks(storage, definition, options = {})`
- `HyperDB.bee(core, definition, options = {})`
- `HyperDB.bee2(bee, definition, options = {})`
- `db.core`
- `db.db`
- `db.traceable`
- `db.autoClose`
- `db.setVersions(versions)`
- `db.setDefinition(definition)`
- `db.cork()`
- `db.uncork()`
- `db.update()`
- `db.download()`
- `db.versions`
- `db.snapshotOptions`
- `db.context`
- `db.index`
- `db.engine`
- `db.engineSnapshot`
- `db.definition`
- `db.updates`
- `db.rootInstance`
- `db.watchers`
- `db.closing`
- `db.activeRequests`
- `db.streams`

### Stale README (not found in source) (10)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `db = Hyperdb.bee(hypercore, definition, [options])`
- `db = Hyperdb.rocks(path, definition, [options])`
- `all = await queryStream.toArray()`
- `one = await queryStream.one()`
- `db.reload()`
- `const db = HyperdbBuilder.from(SCHEMA_DIR, DB_DIR)`
- `HyperdbBuilder.toDisk(db, DB_DIR, opts = { esm: false })`
- `const namespacedDb = db.namespace(namespace)`
- `db.require(path)`
- `db.collections.register(description)`
