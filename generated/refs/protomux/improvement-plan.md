# Reference generation improvement plan — protomux
Generated from `holepunchto/protomux` at **v3.11.0** (`0dc481994f`) on 2026-06-11T12:37:03.361Z.
**Doc-completeness: 50%** — 7 of 14 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 34 of 34 documented symbols (`content/reference/helpers/protomux.mdx`).
### Extra in generated model (2)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `corked`
- `destroy`
## Completeness gaps
### Undocumented parameters (7)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `mux = new Protomux(stream, [options])` → { alloc }
- `mux = Protomux.from(stream | muxer, [options])` → opts
- `mux.pair({ protocol, id }, callback)` → { protocol, id = null }
- `mux.unpair({ protocol, id })` → { protocol, id = null }
- `const opened = mux.opened({ protocol, id })` → { protocol, id = null }
- `const channel = mux.createChannel(opts)` → {
    userData = null,
    protocol,
    aliases = [],
    id = null,
    unique = true,
    handshake = null,
    messages = [],
    onopen = noop,
    onclose = noop,
    ondestroy = noop,
    ondrain = noop
  }
- `channel.open([handshake])` → handshake

## Enhancements
### Return value not explained (3)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const opened = mux.opened({ protocol, id })`
- `const channel = mux.createChannel(opts)`
- `const m = channel.addMessage(opts)`

### No example (11)

_Cause: no code fence under the README entry — add a usage snippet._

- `mux = Protomux.from(stream | muxer, [options])`
- `mux.isIdle()`
- `mux.cork()`
- `mux.uncork()`
- `mux.pair({ protocol, id }, callback)`
- `mux.unpair({ protocol, id })`
- `const opened = mux.opened({ protocol, id })`
- `channel.open([handshake])`
- `channel.cork()`
- `channel.uncork()`
- `channel.close()`

## Drift
### Undocumented in README (in source) (24)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `Protomux.isProtomux(mux)`
- `mux.getLastChannel({ protocol, id = null })`
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

### Stale README (not found in source) (4)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `m.send(data)`
- `m.onmessage`
- `m.encoding`
- `for (const channel of muxer) { ... }`
