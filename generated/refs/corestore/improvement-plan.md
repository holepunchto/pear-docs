# Reference generation improvement plan — corestore
Generated from `holepunchto/corestore` at **v7.12.5** (`5f4e199def`) on 2026-09-17T14:16:01.805Z.
**Doc-completeness: 50%** — 7 of 14 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Undocumented parameters (7)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const store = new Corestore(storage, options = {})` → opts
- `store.watch((core) => {})` → fn
- `store.unwatch(callback)` → fn
- `await store.suspend()` → options
- `const store = store.namespace(name)` → opts
- `const stream = store.replicate(optsOrStream)` → isInitiator, opts
- `store.on('group-active', (topic) => {})` → update

## Enhancements
### Return value not explained (6)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const handle = store.notifyGroup(topic)`
- `const store = store.namespace(name)`
- `const stream = store.list(namespace)`
- `const stream = store.replicate(optsOrStream)`
- `const core = store.get(key | { name: 'a-name', ...hypercoreOpts})`
- `const keypair = await store.createKeyPair(name, ns = this.ns)`

### No example (10)

_Cause: no code fence under the README entry — add a usage snippet._

- `store.unwatch(callback)`
- `const handle = store.notifyGroup(topic)`
- `await store.suspend()`
- `await store.resume()`
- `const stream = store.list(namespace)`
- `const core = store.get(key | { name: 'a-name', ...hypercoreOpts})`
- `const keypair = await store.createKeyPair(name, ns = this.ns)`
- `await store.close()`
- `store.on('group-active', (topic) => {})`
- `handle.destroy()`

## Drift
### Undocumented in README (in source) (41)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `store.findingPeers()`
- `store.audit(opts = {})`
- `store.getAuth(discoveryKey)`
- `await store.staticify(core, opts)`
- `await store.ready()`
- `store.opened`
- `store.closed`
- `store.on(event, listener)`
- `store.once(event, listener)`
- `store.off(event, listener)`
- `store.emit(event, [...args])`
- `store.root`
- `store.storage`
- `store.streamTracker`
- `store.cores`
- `store.sessions`
- `store.corestores`
- `store.readOnly`
- `store.globalCache`
- `store.primaryKey`
- `store.ns`
- `store.manifestVersion`
- `store.shouldSuspend`
- `store.active`
- `store.watchers`
- `store.watchIndex`
- `new GroupNotifyHandle(store, topic)`
- `handle.updates(opts)`
- `handle.on(event, listener)`
- `handle.once(event, listener)`
- `handle.off(event, listener)`
- `handle.emit(event, [...args])`
- `handle.index`
- `new FindingPeers()`
- `handle.add(core)`
- `handle.inc(sessions)`
- `handle.dec(sessions)`
- `handle.destroy()`
- `handle.count`
- `handle.pending`
- `handle.destroyed`

### Stale README (not found in source) (2)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `const storeB = storeA.session()`
- `const stream = handle.update(opts = {})`
