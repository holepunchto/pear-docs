# Reference generation improvement plan — secretstream
Generated from `holepunchto/hyperswarm-secret-stream` at **v6.9.2** (`553bd08290`) on 2026-09-17T14:16:06.303Z.
**Doc-completeness: 100%** — 1 of 1 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
## Enhancements
## Drift
### Undocumented in README (in source) (30)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `NoiseSecretStream.keyPair(seed)`
- `NoiseSecretStream.id(handshakeHash, isInitiator, id)`
- `await stream.flush()`
- `stream.alloc(len)`
- `stream.toJSON()`
- `stream.write(data)`
- `stream.end()`
- `stream.destroy([err])`
- `stream.destroyed`
- `stream.on(event, listener)`
- `stream.once(event, listener)`
- `stream.off(event, listener)`
- `stream.emit(event, [...args])`
- `stream.noiseStream`
- `stream.isInitiator`
- `stream.rawStream`
- `stream.connected`
- `stream.timeout`
- `stream.enableSend`
- `stream.userData`
- `stream.opened`
- `stream.relay`
- `stream.puncher`
- `stream.on('handshake', listener)`
- `stream.on('data', listener)`
- `stream.on('end', listener)`
- `stream.on('drain', listener)`
- `stream.on('finish', listener)`
- `stream.on('close', listener)`
- `stream.on('error', listener)`

### Stale README (not found in source) (13)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `s.start(rawStream, [options])`
- `s.setTimeout(ms)`
- `s.setKeepAlive(ms)`
- `s.publicKey`
- `s.remotePublicKey`
- `s.handshakeHash`
- `s.keepAlive`
- `s.sendKeepAlive()`
- `s.rawBytesWritten`
- `s.rawBytesRead`
- `await s.send(buffer)`
- `s.trySend(buffer)`
- `keyPair = SecretStream.keyPair([seed])`
