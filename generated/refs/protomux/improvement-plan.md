# Reference generation improvement plan — protomux
Generated from `holepunchto/protomux` at **v3.13.0** (`30a595e292`) on 2026-10-27T15:06:00.957Z.
**Doc-completeness: 47%** — 8 of 17 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
### Undocumented parameters (9)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `mux = Protomux.from(stream | muxer, [options])` → opts
- `mux.pair({ protocol, id = null }, callback)` → options, notify
- `mux.unpair({ protocol, id = null })` → options
- `mux.watch({ protocol, id = null }, callback)` → options
- `mux.unwatch({ protocol, id = null }, callback)` → options
- `mux.unwatchAll({ protocol, id = null })` → options
- `const opened = mux.opened({ protocol, id })` → options
- `const channel = mux.createChannel(opts)` → options
- `channel.open([handshake])` → handshake

## Enhancements
### Return value not explained (3)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const opened = mux.opened({ protocol, id })`
- `const channel = mux.createChannel(opts)`
- `const m = channel.addMessage(opts)`

### No example (14)

_Cause: no code fence under the README entry — add a usage snippet._

- `mux = Protomux.from(stream | muxer, [options])`
- `mux.isIdle()`
- `mux.cork()`
- `mux.uncork()`
- `mux.pair({ protocol, id = null }, callback)`
- `mux.unpair({ protocol, id = null })`
- `mux.watch({ protocol, id = null }, callback)`
- `mux.unwatch({ protocol, id = null }, callback)`
- `mux.unwatchAll({ protocol, id = null })`
- `const opened = mux.opened({ protocol, id })`
- `channel.open([handshake])`
- `channel.cork()`
- `channel.uncork()`
- `channel.close()`

## Drift
### Undocumented in README (in source) (25)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `Protomux.isProtomux(mux)`
- `mux.getLastChannel(options)`
- `mux.destroy(err)`
- `mux.isProtomux`
- `mux.stream`
- `mux.corked`
- `mux.drained`
- `new Channel(mux, info, userData, protocol, aliases, id, handshake, messages, onopen, onclose, ondestroy, ondrain)`
- `channel.drained`
- `channel.fullyOpened()`
- `channel.fullyClosed()`
- `channel.userData`
- `channel.protocol`
- `channel.aliases`
- `channel.id`
- `channel.handshake`
- `channel.messages`
- `channel.opened`
- `channel.closed`
- `channel.destroyed`
- `channel.onopen`
- `channel.onclose`
- `channel.ondestroy`
- `channel.ondrain`
- `channel.on('warning', err)`

### Stale README (not found in source) (4)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `m.send(data)`
- `m.onmessage`
- `m.encoding`
- `for (const channel of muxer) { ... }`
