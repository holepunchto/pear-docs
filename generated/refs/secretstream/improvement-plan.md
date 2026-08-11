# Reference generation improvement plan — secretstream
Generated from `holepunchto/hyperswarm-secret-stream` at **v6.9.1** (`3df4ba9571`) on 2026-06-11T12:37:04.576Z.
**Doc-completeness: 73%** — 11 of 15 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 31 of 31 documented symbols (`content/reference/helpers/secretstream.mdx`).
### Extra in generated model (14)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `destroy`
- `destroyed`
- `emit`
- `noiseStream`
- `off`
- `on`
- `on:close`
- `on:drain`
- `on:end`
- `on:error`
- `on:finish`
- `once`
- `puncher`
- `relay`
## Completeness gaps
### Undocumented parameters (4)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const s = new SecretStream(isInitiator, [rawStream], [options])` → opts
- `s.start(rawStream, [options])` → opts
- `await s.send(buffer)` → buffer
- `s.on('message', onmessage)` → plain

## Enhancements
### No example (13)

_Cause: no code fence under the README entry — add a usage snippet._

- `s.setTimeout(ms)`
- `s.setKeepAlive(ms)`
- `s.sendKeepAlive()`
- `await s.send(buffer)`
- `s.trySend(buffer)`
- `s.publicKey`
- `s.remotePublicKey`
- `s.handshakeHash`
- `s.keepAlive`
- `s.rawBytesWritten`
- `s.rawBytesRead`
- `s.on('connect', onconnect)`
- `s.on('message', onmessage)`

## Drift
### Undocumented in README (in source) (30)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `NoiseSecretStream.keyPair(seed)`
- `NoiseSecretStream.id(handshakeHash, isInitiator, id)`
- `await s.flush()`
- `s.alloc(len)`
- `s.toJSON()`
- `s.write(data)`
- `s.end()`
- `s.destroy([err])`
- `s.destroyed`
- `s.on(event, listener)`
- `s.once(event, listener)`
- `s.off(event, listener)`
- `s.emit(event, [...args])`
- `s.noiseStream`
- `s.isInitiator`
- `s.rawStream`
- `s.connected`
- `s.timeout`
- `s.enableSend`
- `s.userData`
- `s.opened`
- `s.relay`
- `s.puncher`
- `s.on('handshake', listener)`
- `s.on('data', listener)`
- `s.on('end', listener)`
- `s.on('drain', listener)`
- `s.on('finish', listener)`
- `s.on('close', listener)`
- `s.on('error', listener)`

### Stale README (not found in source) (1)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `keyPair = SecretStream.keyPair([seed])`
