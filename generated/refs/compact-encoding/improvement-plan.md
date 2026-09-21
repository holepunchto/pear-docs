# Reference generation improvement plan — compact-encoding
Generated from `holepunchto/compact-encoding` at **v3.5.0** (`e9d5ef9345`) on 2026-09-17T14:16:00.154Z.
**Doc-completeness: 100%** — 1 of 1 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
_No existing MDX page found for this slug._
## Completeness gaps
## Enhancements
### No example (1)

_Cause: no code fence under the README entry — add a usage snippet._

- `cenc.state(start = 0, end = 0, buffer = null)`

## Drift
### Undocumented in README (in source) (74)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

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
- `cenc.bitarray`
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
- `cenc.fixed8`
- `cenc.fixed16`
- `cenc.fixed24`
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

### Stale README (not found in source) (3)

_Cause: README documents a symbol the AST pass did not find — stale docs, or an extractor miss (events/getters/re-exports)._

- `enc.preencode(state, val)`
- `enc.encode(state, val)`
- `val = enc.decode(state)`
