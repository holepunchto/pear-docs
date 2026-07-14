# Reference generation improvement plan — compact-encoding
Generated from `holepunchto/compact-encoding` at **v3.2.0** (`bc92e92fde`) on 2026-06-11T13:18:06.269Z.
**Doc-completeness: 100%** — 2 of 2 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 29 of 29 documented symbols (`content/reference/helpers/compact-encoding.mdx`).
### Extra in generated model (45)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `ascii`
- `base64`
- `bigint64`
- `bigint64array`
- `biguint`
- `biguint64`
- `biguint64array`
- `buffer`
- `fixed32`
- `float32`
- `float32array`
- `hex`
- `int`
- `int16`
- `int16array`
- `int24`
- `int32`
- `int32array`
- `int40`
- `int48`
- `int56`
- `int8`
- `int8array`
- `ipv4`
- `ipv4Address`
- `ipv6`
- `ipv6Address`
- `json`
- `optionalBuffer`
- `string`
- `uint`
- `uint16`
- `uint16array`
- `uint24`
- `uint32`
- `uint32array`
- `uint32be`
- `uint40`
- `uint48`
- `uint56`
- `uint64be`
- `uint8`
- `uint8array`
- `utf16le`
- `utf8`
## Completeness gaps
## Enhancements
### No example (2)

_Cause: no code fence under the README entry — add a usage snippet._

- `enc.encode(state, val)`
- `val = enc.decode(state)`

## Drift
### Undocumented in README (in source) (71)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `cenc.state(start = 0, end = 0, buffer = null)`
- `cenc.raw`
- `cenc.uint`
- `cenc.uint8`
- `cenc.uint16`
- `cenc.uint24`
- `cenc.uint32`
- `cenc.uint32be`
- `cenc.uint40`
- `cenc.uint48`
- `cenc.uint56`
- `cenc.uint64`
- `cenc.uint64be`
- `cenc.int`
- `cenc.int8`
- `cenc.int16`
- `cenc.int24`
- `cenc.int32`
- `cenc.int40`
- `cenc.int48`
- `cenc.int56`
- `cenc.int64`
- `cenc.biguint64`
- `cenc.bigint64`
- `cenc.biguint`
- `cenc.bigint`
- `cenc.lexint`
- `cenc.float32`
- `cenc.float64`
- `cenc.buffer`
- `cenc.optionalBuffer`
- `cenc.binary`
- `cenc.arraybuffer`
- `cenc.uint8array`
- `cenc.uint16array`
- `cenc.uint32array`
- `cenc.int8array`
- `cenc.int16array`
- `cenc.int32array`
- `cenc.biguint64array`
- `cenc.bigint64array`
- `cenc.float32array`
- `cenc.float64array`
- `cenc.string`
- `cenc.utf8`
- `cenc.ascii`
- `cenc.hex`
- `cenc.base64`
- `cenc.ucs2`
- `cenc.utf16le`
- `cenc.bool`
- `cenc.fixed(n)`
- `cenc.fixed32`
- `cenc.fixed64`
- `cenc.array(enc)`
- `cenc.frame(enc)`
- `cenc.date`
- `cenc.json`
- `cenc.ndjson`
- `cenc.none`
- `cenc.any`
- `cenc.port`
- `cenc.ipv4`
- `cenc.ipv4Address`
- `cenc.ipv6`
- `cenc.ipv6Address`
- `cenc.ip`
- `cenc.ipAddress`
- `cenc.record(keyEncoding, valueEncoding)`
- `cenc.stringRecord`
- `cenc.from(enc)`

### Stale README (not found in source) (1)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `enc.preencode(state, val)`
