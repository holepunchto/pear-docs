# Reference generation improvement plan — hyperdht
Generated from `holepunchto/hyperdht` at **v6.34.0** (`2174285add`) on 2026-09-17T14:15:56.219Z.
**Doc-completeness: 9%** — 1 of 11 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Undocumented parameters (10)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const socket = node.connect(remotePublicKey, [options])` → remotePublicKey
- `const server = node.createServer([options], [onconnection])` → onconnection
- `await node.destroy([options])` → options
- `const stream = node.lookup(topic, [options])` → opts
- `await node.unannounce(topic, keyPair, [options])` → target, keyPair, opts
- `const stream = node.announce(topic, keyPair, [relayAddresses], [options])` → target, keyPair, relayAddresses, opts
- `const { value, from } = await node.immutableGet(hash, [options])` → target, opts
- `const { hash, closestNodes } = await node.immutablePut(value, [options])` → opts
- `const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])` → publicKey, opts
- `const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])` → keyPair, opts

## Enhancements
### Return value not explained (4)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const socket = node.connect(remotePublicKey, [options])`
- `const server = node.createServer([options], [onconnection])`
- `const stream = node.lookup(topic, [options])`
- `const stream = node.announce(topic, keyPair, [relayAddresses], [options])`

### No example (7)

_Cause: no code fence under the README entry — add a usage snippet._

- `await node.destroy([options])`
- `await node.unannounce(topic, keyPair, [options])`
- `const stream = node.announce(topic, keyPair, [relayAddresses], [options])`
- `const { value, from } = await node.immutableGet(hash, [options])`
- `const { hash, closestNodes } = await node.immutablePut(value, [options])`
- `const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])`
- `const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])`

## Drift
### Undocumented in README (in source) (19)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `HyperDHT.DEFAULTS`
- `node.pool()`
- `await node.resume(options = {})`
- `await node.suspend(options = {})`
- `await node.validateLocalAddresses(addresses)`
- `node.findPeer(publicKey, opts = {})`
- `node.lookupAndUnannounce(target, keyPair, opts = {})`
- `node.onrequest(req)`
- `HyperDHT.keyPair(seed)`
- `HyperDHT.hash(data)`
- `HyperDHT.connectRawStream(encryptedStream, rawStream, remoteId)`
- `node.createRawStream(opts)`
- `node.register(name, plugin)`
- `node.defaultKeyPair`
- `node.listening`
- `node.connectionKeepAlive`
- `node.rawStreams`
- `node.plugins`
- `node.stats`

### Stale README (not found in source) (8)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `keyPair = DHT.keyPair([seed])`
- `node = DHT.bootstrapper(port, host, [options])`
- `await server.listen(keyPair)`
- `server.refresh()`
- `server.address()`
- `await server.close()`
- `socket.remotePublicKey`
- `socket.publicKey`
