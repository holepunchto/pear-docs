# Reference generation improvement plan — hyperswarm
Generated from `holepunchto/hyperswarm` at **v4.17.1** (`bbd9fb81ba`) on 2026-09-17T14:15:58.546Z.
**Doc-completeness: 65%** — 11 of 17 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Undocumented parameters (6)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const discovery = swarm.status(topic)` → key
- `const discovery = swarm.join(topic, opts = {})` → opts
- `await swarm.suspend({ log: () => {} })` → options
- `await swarm.resume({ log: () => {} })` → options
- `swarm.on('connection', (socket, peerInfo) => {})` → conn, peerInfo
- `swarm.on('ban', peerInfo, err)` → peerInfo

## Enhancements
### Return value not explained (1)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const discovery = swarm.status(topic)`

### No example (17)

_Cause: no code fence under the README entry — add a usage snippet._

- `const swarm = new Hyperswarm(opts = {})`
- `const discovery = swarm.status(topic)`
- `await swarm.listen()`
- `const discovery = swarm.join(topic, opts = {})`
- `await swarm.leave(topic)`
- `swarm.joinPeer(noisePublicKey)`
- `swarm.leavePeer(noisePublicKey)`
- `await swarm.flush()`
- `await swarm.suspend({ log: () => {} })`
- `await swarm.resume({ log: () => {} })`
- `swarm.dht`
- `swarm.connecting`
- `swarm.connections`
- `swarm.peers`
- `swarm.on('connection', (socket, peerInfo) => {})`
- `swarm.on('update', () => {})`
- `swarm.on('ban', peerInfo, err)`

## Drift
### Undocumented in README (in source) (17)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `await swarm.clear()`
- `swarm.on(event, listener)`
- `swarm.once(event, listener)`
- `swarm.off(event, listener)`
- `swarm.emit(event, [...args])`
- `swarm.keyPair`
- `swarm.server`
- `swarm.destroyed`
- `swarm.suspended`
- `swarm.maxPeers`
- `swarm.maxClientConnections`
- `swarm.maxServerConnections`
- `swarm.maxParallel`
- `swarm.relayThrough`
- `swarm.explicitPeers`
- `swarm.listening`
- `swarm.stats`

### Stale README (not found in source) (7)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `await discovery.flushed()`
- `await discovery.refresh({ client, server })`
- `await discovery.destroy()`
- `peerInfo.publicKey`
- `peerInfo.topics`
- `peerInfo.prioritized`
- `peerInfo.ban(banStatus = false)`
