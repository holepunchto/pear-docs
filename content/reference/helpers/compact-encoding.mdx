---
title: "compact-encoding"
description: "Small binary encoding toolkit for protocol messages and storage formats."
upstreamVersion: "3.3.2"
docType: reference
schemaType: APIReference
---

<Status level="stable" />

`compact-encoding` packages small binary codecs behind a shared encoder interface. It is commonly paired with [Protomux](/reference/helpers/protomux) message schemas and shows up in [Hypercore](/reference/building-blocks/hypercore) and other Holepunch protocol surfaces whenever structured binary payloads matter. For the upstream package and implementation details, see the [compact-encoding repository](https://github.com/holepunchto/compact-encoding).

## Module-level encode and decode helpers

#### `const buffer = cenc.encode(enc, value)`

Encodes a single `value` using `enc` into a freshly allocated `Buffer` and returns it. Equivalent to manually creating a state, calling `enc.preencode` and `enc.encode`, and slicing the buffer — useful when you just want bytes back in one step.

| Param | Type | Description |
| --- | --- | --- |
| `enc` | `object` | Any compact-encoding encoder (for example `cenc.uint`, a custom encoder). |
| `value` | `*` | The value to encode. |

- Returns: `Buffer`

```js
const buf = cenc.encode(cenc.uint, 42)
// <Buffer 2a>
```

#### `const value = cenc.decode(enc, buffer)`

Decodes a single value from `buffer` using `enc`. Equivalent to constructing a state from the buffer and calling `enc.decode`.

| Param | Type | Description |
| --- | --- | --- |
| `enc` | `object` | Any compact-encoding encoder. |
| `buffer` | `Buffer` | The buffer to decode from. |

- Returns: The decoded value.

```js
const val = cenc.decode(cenc.uint, buf) // 42
```

## Install

```sh
npm i compact-encoding
```

## Quickstart

```js
import cenc from 'compact-encoding'

const state = cenc.state()

cenc.uint.preencode(state, 42)
cenc.string.preencode(state, 'hello')

state.buffer = Buffer.allocUnsafe(state.end)
state.start = 0

cenc.uint.encode(state, 42)
cenc.string.encode(state, 'hello')

state.start = 0

console.log(cenc.uint.decode(state))
console.log(cenc.string.decode(state))
```

## API Reference

### Encoder contract

Every bundled encoder follows the same three-method contract. The top-level helpers and exported factories below all return or consume objects with this shape.

#### `enc.preencode(state, val)`

Does a fast preencode dry-run that only sets state.end. Use this to figure out how big of a buffer you need.

#### `enc.encode(state, val)`

Writes the encoded form of the value into `state.buffer` at `state.start` (the buffer must have been preallocated via `preencode`), advancing `state.start` past the written bytes.

| Parameter | Type | Description |
| --- | --- | --- |
| `state` | `object` | A compact-encoding state with `start`, `end`, and `buffer`. |
| `val` | `*` | The value to encode. |

- Returns: `undefined` — the encoded bytes are written into `state.buffer` in place.

```js
const cenc = require('compact-encoding')
const state = cenc.state()
cenc.uint.preencode(state, 42)
state.buffer = Buffer.allocUnsafe(state.end)
cenc.uint.encode(state, 42)
// state.buffer is a 1-byte Buffer containing the encoded uint
```

#### `val = enc.decode(state)`

Reads and returns a value from `state.buffer` at `state.start`, advancing `state.start` past the decoded value.

| Parameter | Type | Description |
| --- | --- | --- |
| `state` | `object` | A compact-encoding state with `start`, `end`, and `buffer`. |

- Returns: `*` — The decoded value.

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.bool, true)
const state = cenc.state(0, buf.byteLength, buf)
const val = cenc.bool.decode(state) // true
```

### State and convenience helpers

#### `cenc.state(start = 0, end = 0, buffer = null)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L10)

A mutable state object `{ start, end, buffer }` used by all encoders.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `start` | `number` | `0` | Initial read/write offset. |
| `end` | `number` | `0` | Initial end offset (set by preencode to determine required buffer size). |
| `buffer` | [`Buffer\|Uint8Array\|null`](https://nodejs.org/api/buffer.html#class-buffer) | `null` | Underlying buffer; allocate after preencoding. |

- Returns: [`State`](#state) — A new state object `{ start, end, buffer }`.

```js
const cenc = require('compact-encoding')
const state = cenc.state()
cenc.uint.preencode(state, 42)
cenc.string.preencode(state, 'hi')
state.buffer = Buffer.allocUnsafe(state.end)
cenc.uint.encode(state, 42)
cenc.string.encode(state, 'hi')
```

#### `cenc.from(enc)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L971)

Coerces `enc` — an existing compact encoder, a named raw string encoding such as `'utf8'` or `'json'`, a codec with `encode`/`decode`, or an abstract encoding with `encodingLength` — into a compact-encoding-compatible encoder object.

| Parameter | Type | Description |
| --- | --- | --- |
| `enc` | `string\|object` | An encoding name, compact encoder, abstract-encoding, or codec. |

- Returns: `object` — A compact-encoding encoder with `preencode`, `encode`, and `decode`.

```js
const cenc = require('compact-encoding')
const enc = cenc.from('utf-8')
const buf = cenc.encode(enc, 'hello')
const val = cenc.decode(enc, buf) // 'hello'
```

### Encoder factories

#### `cenc.fixed(n)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L531)

An encoder for fixed-size buffers, where `n` is the exact byte length every encoded value must have.

| Parameter | Type | Description |
| --- | --- | --- |
| `n` | `number` | Exact number of bytes to encode/decode. |

- Returns: `object` — An encoder that reads and writes exactly `n` bytes.

```js
const cenc = require('compact-encoding')
const enc = cenc.fixed(4)
const buf = cenc.encode(enc, Buffer.alloc(4, 0xff))
const val = cenc.decode(enc, buf) // <Buffer ff ff ff ff>
```

#### `cenc.array(enc)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L551)

An encoder that prefixes arrays with their length and encodes each item in order using `enc`.

| Parameter | Type | Description |
| --- | --- | --- |
| `enc` | `object` | An encoder with `preencode`, `encode`, and `decode` methods. |

- Returns: `object` — An encoder for arrays of values handled by `enc`.

```js
const cenc = require('compact-encoding')
const enc = cenc.array(cenc.uint)
const buf = cenc.encode(enc, [1, 2, 3])
const val = cenc.decode(enc, buf) // [1, 2, 3]
```

#### `cenc.frame(enc)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L571)

An encoder that prefixes one encoded payload with its byte length.

| Parameter | Type | Description |
| --- | --- | --- |
| `enc` | `object` | An encoder with `preencode`, `encode`, and `decode` methods. |

- Returns: `object` — An encoder that wraps each value in a byte-length frame.

```js
const cenc = require('compact-encoding')
const enc = cenc.frame(cenc.string)
const buf = cenc.encode(enc, 'hello')
const val = cenc.decode(enc, buf) // 'hello'
```

#### `cenc.record(keyEncoding, valueEncoding)`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L924)

An encoder for plain object records, with `keyEncoding` for object keys and `valueEncoding` for object values.

| Parameter | Type | Description |
| --- | --- | --- |
| `keyEncoding` | `object` | Encoder used for each object key. |
| `valueEncoding` | `object` | Encoder used for each object value. |

- Returns: `object` — An encoder that reads/writes plain objects as key-value pairs.

```js
const cenc = require('compact-encoding')
const enc = cenc.record(cenc.string, cenc.uint)
const buf = cenc.encode(enc, { a: 1, b: 2 })
const val = cenc.decode(enc, buf) // [Object: null prototype] { a: 1, b: 2 }
```

#### `cenc.stringRecord`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L953)

A prebuilt `record(cenc.string, cenc.string)` encoder for simple string maps.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.stringRecord, { name: 'alice', role: 'admin' })
const val = cenc.decode(cenc.stringRecord, buf) // [Object: null prototype] { name: 'alice', role: 'admin' }
```

### Numeric encodings

#### `cenc.uint64`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L185)

Unsigned integer encoders (`cenc.uint`, `cenc.uint8`, `cenc.uint16`, `cenc.uint24`, `cenc.uint32`, `cenc.uint40`, `cenc.uint48`, `cenc.uint56`, `cenc.uint64`). `cenc.uint` chooses a compact size automatically; the fixed-width variants always use the named byte width.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.uint64, 2 ** 32)
const val = cenc.decode(cenc.uint64, buf) // 4294967296
```

#### `cenc.int64`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L229)

Signed integer encoders (`cenc.int`, `cenc.int8` … `cenc.int64`) built on top of the unsigned variants with ZigZag encoding.

ZigZag doubles a value's magnitude before writing it as an unsigned integer, so a signed integer only reaches half as far as an unsigned one of the same width. Since 3.3.1 the signed codecs validate that range explicitly and reject anything outside `-(2**52)` to `2**52 - 1`; use `cenc.bigint` for larger values. Earlier releases silently lost precision instead.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.int64, -4294967296)
const val = cenc.decode(cenc.int64, buf) // -4294967296
```

#### `cenc.bigint`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L296)

BigInt-aware integer encoders (`cenc.biguint64`, `cenc.bigint64`, `cenc.biguint`, `cenc.bigint`) for fixed-width or variable-width large integer values.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.bigint, -(2n ** 128n))
const val = cenc.decode(cenc.bigint, buf) // -340282366920938463463374607431768211456n
```

#### `cenc.float64`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L326)

Floating-point encoders (`cenc.float32`, `cenc.float64`) using IEEE-754 little-endian layouts.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.float64, Math.PI)
const val = cenc.decode(cenc.float64, buf) // 3.141592653589793
```

#### `cenc.lexint`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L298)

The lexicographic integer encoder exported from the `./lexint` module.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.lexint, 1000)
const val = cenc.decode(cenc.lexint, buf) // 1000
```

### Binary, buffer, and typed-array encodings

#### `cenc.binary`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L383)

Buffer-oriented encoders. `buffer` length-prefixes a byte sequence, `optionalBuffer` maps zero length to `null`, and `binary` accepts either a string or buffer-like input.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.binary, 'hello')
const val = cenc.decode(cenc.binary, buf) // <Buffer 68 65 6c 6c 6f>
```

#### `cenc.arraybuffer`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L395)

An encoder for `ArrayBuffer` instances.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const ab = new ArrayBuffer(4)
const buf = cenc.encode(cenc.arraybuffer, ab)
const val = cenc.decode(cenc.arraybuffer, buf) // ArrayBuffer { byteLength: 4 }
```

#### `cenc.float64array`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L464)

Length-prefixed typed-array encoders (`cenc.uint8array`, `cenc.uint16array`, `cenc.uint32array`, `cenc.int8array`, `cenc.int16array`, `cenc.int32array`, `cenc.biguint64array`, `cenc.bigint64array`, `cenc.float32array`, `cenc.float64array`) that preserve the underlying element type.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.float64array, new Float64Array([Math.PI]))
const val = cenc.decode(cenc.float64array, buf) // Float64Array [3.141592653589793]
```

#### `cenc.fixed64`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L549)

Prebuilt fixed-size buffer encoders (`cenc.fixed32`, `cenc.fixed64`) for 32-byte and 64-byte values.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const sig = Buffer.alloc(64)
const buf = cenc.encode(cenc.fixed64, sig)
const val = cenc.decode(cenc.fixed64, buf) // <Buffer 00 00 ... (64 bytes)>
```

### Text encodings

#### `cenc.ucs2`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L516)

String encoders for the named text encoding (`cenc.string`, `cenc.utf8`, `cenc.ascii`, `cenc.hex`, `cenc.base64`, `cenc.utf16le`, `cenc.ucs2`). Each one also exposes `.fixed(length)` for fixed-size strings.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.ucs2, 'hi')
const val = cenc.decode(cenc.ucs2, buf) // 'hi'
```

### Boolean, date, and structured-value encodings

#### `cenc.bool`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L518)

A one-byte boolean encoder.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.bool, true)
const val = cenc.decode(cenc.bool, buf) // true
```

#### `cenc.date`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L598)

A `Date` encoder backed by the signed integer timestamp value from `date.getTime()`.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.date, new Date('2024-01-01'))
const val = cenc.decode(cenc.date, buf) // Date object for 2024-01-01
```

#### `cenc.ndjson`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L622)

UTF-8 JSON encoders (`cenc.json`, `cenc.ndjson`). `ndjson` appends a trailing newline before encoding.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.ndjson, { a: 1 })
const val = cenc.decode(cenc.ndjson, buf) // { a: 1 }
```

#### `cenc.none`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L635)

A sentinel encoder that always decodes to `null` and writes no payload bytes.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.none, null)
const val = cenc.decode(cenc.none, buf) // null
```

#### `cenc.any`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L713)

A schemaless tagged-value encoder for JSON-like values, arrays, objects, dates, strings, buffers, booleans, integers, and floats.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.any, { n: 42, flag: true })
const val = cenc.decode(cenc.any, buf) // { n: 42, flag: true }
```

### Network encodings

#### `cenc.port`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L731)

The same encoder as `cenc.uint16`, provided for protocol readability when encoding network ports.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.port, 8080)
const val = cenc.decode(cenc.port, buf) // 8080
```

#### `cenc.ip`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L885)

Encoders for IPv4 addresses, IPv6 addresses, or either family with an embedded family tag (`cenc.ipv4`, `cenc.ipv6`, `cenc.ip`).

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf4 = cenc.encode(cenc.ip, '1.2.3.4')
cenc.decode(cenc.ip, buf4) // '1.2.3.4'
const buf6 = cenc.encode(cenc.ip, '::1')
cenc.decode(cenc.ip, buf6) // '0:0:0:0:0:0:0:1'
```

#### `cenc.ipAddress`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L905)

Address-object encoders (`cenc.ipv4Address`, `cenc.ipv6Address`, `cenc.ipAddress`) for `{ host, family?, port }` shapes.

- Returns: `object`

```js
const cenc = require('compact-encoding')
const buf = cenc.encode(cenc.ipAddress, { host: '1.2.3.4', port: 8080 })
const val = cenc.decode(cenc.ipAddress, buf) // { host: '1.2.3.4', family: 4, port: 8080 }
```

### Raw variants

#### `cenc.raw`

[src](https://github.com/holepunchto/compact-encoding/blob/v3.3.2/index.js#L14)

A namespace of non-length-prefixed variants for many buffer, string, array, JSON, and typed-array encodings such as `cenc.raw.buffer`, `cenc.raw.utf8`, `cenc.raw.array(enc)`, and `cenc.raw.json`.

- Returns: `object`

```js
const cenc = require('compact-encoding')
// copy raw bytes into state
const buf = Buffer.from([1, 2, 3])
const state = cenc.state()
cenc.raw.preencode(state, buf)
state.buffer = Buffer.allocUnsafe(state.end)
cenc.raw.encode(state, buf)
```

### Complete codec reference

The sections above detail the contract and the most common encoders. Below is the full catalog of bundled codecs shipped by compact-encoding v3.3.0. Every entry is an object implementing the [encoder contract](#encoder-contract) (`preencode` / `encode` / `decode`), so any of them can be composed with [`cenc.array(enc)`](#cencarrayenc), [`cenc.frame(enc)`](#cencframeenc), or used directly with [`cenc.encode`](#const-buffer--cencencodeenc-value) / [`cenc.decode`](#const-value--cencdecodeenc-buffer). Fixed-size integers are little-endian unless the name ends in `be`.

**Unsigned integers**

| Codec | Bytes | Notes |
| --- | --- | --- |
| `cenc.uint` | 1–9 | Smallest fixed-size encoding with a prefix signalling which; best for values spanning a wide range. |
| `cenc.uint8` | 1 | Fixed `uint8`. |
| `cenc.uint16` | 2 | Fixed `uint16`; useful for ports. |
| `cenc.uint24` | 3 | Fixed `uint24`; useful for message framing. |
| `cenc.uint32` | 4 | Fixed `uint32`; useful for large message framing. |
| `cenc.uint32be` | 4 | Big-endian `uint32`. |
| `cenc.uint40` | 5 | Fixed `uint40`. |
| `cenc.uint48` | 6 | Fixed `uint48`. |
| `cenc.uint56` | 7 | Fixed `uint56`. |
| `cenc.uint64` | 8 | Fixed `uint64`. |
| `cenc.uint64be` | 8 | Big-endian `uint64`. |

**Signed integers** — each is the matching unsigned codec with [ZigZag](https://en.wikipedia.org/wiki/Variable-length_quantity#Zigzag_encoding) encoding, so small-magnitude negatives stay compact.

| Codec | Bytes |
| --- | --- |
| `cenc.int` | 1–9 |
| `cenc.int8` | 1 |
| `cenc.int16` | 2 |
| `cenc.int24` | 3 |
| `cenc.int32` | 4 |
| `cenc.int40` | 5 |
| `cenc.int48` | 6 |
| `cenc.int56` | 7 |
| `cenc.int64` | 8 |

**Big integers**

| Codec | Bytes | Notes |
| --- | --- | --- |
| `cenc.biguint64` | 8 | Fixed `biguint64`. |
| `cenc.bigint64` | 8 | `biguint64` with ZigZag encoding. |
| `cenc.biguint` | variable | Word count `uint`-prefixed. |
| `cenc.bigint` | variable | `biguint` with ZigZag encoding. |

**Floating point**

| Codec | Bytes |
| --- | --- |
| `cenc.float32` | 4 |
| `cenc.float64` | 8 |

**Buffers**

| Codec | Notes |
| --- | --- |
| `cenc.buffer` | Buffer with a `uint` length prefix. |
| `cenc.optionalBuffer` | Like `cenc.buffer` but round-trips `null`/absent values. |
| `cenc.binary` | Buffer or string, length-prefixed; decodes to a buffer. |
| `cenc.arraybuffer` | `ArrayBuffer` with a `uint` length prefix. |

**Typed arrays** — each is prefixed with its element count as a `uint`.

| Codec | Element type |
| --- | --- |
| `cenc.uint8array` | `Uint8Array` |
| `cenc.uint16array` | `Uint16Array` |
| `cenc.uint32array` | `Uint32Array` |
| `cenc.int8array` | `Int8Array` |
| `cenc.int16array` | `Int16Array` |
| `cenc.int32array` | `Int32Array` |
| `cenc.biguint64array` | `BigUint64Array` |
| `cenc.bigint64array` | `BigInt64Array` |
| `cenc.float32array` | `Float32Array` |
| `cenc.float64array` | `Float64Array` |

**Strings** — each is length-prefixed and also exposes a `.fixed(n)` factory for a fixed-length variant (for example `cenc.hex.fixed(32)`).

| Codec | Encoding |
| --- | --- |
| `cenc.string`, `cenc.utf8` | UTF-8 |
| `cenc.ascii` | ASCII |
| `cenc.hex` | Hex |
| `cenc.base64` | Base64 |
| `cenc.utf16le`, `cenc.ucs2` | UTF-16LE |

**Fixed-size buffers**

| Codec | Notes |
| --- | --- |
| `cenc.fixed(n)` | Factory for an `n`-byte fixed buffer (no length prefix). |
| `cenc.fixed32` | Fixed 32-byte buffer. |
| `cenc.fixed64` | Fixed 64-byte buffer. |

**Structured & special values**

| Codec | Notes |
| --- | --- |
| `cenc.bool` | Encodes a boolean as `1` or `0`. |
| `cenc.date` | Encodes a `Date`. |
| `cenc.json` | JSON value serialized as UTF-8. |
| `cenc.ndjson` | JSON value serialized as newline-delimited UTF-8. |
| `cenc.any` | Any JSON-representable value into a self-describing buffer (compact types); useful for schemaless codecs. |
| `cenc.none` | Encodes nothing—placeholder for empty fields. |
| `cenc.array(enc)` | Length-prefixed array of `enc` values. |
| `cenc.frame(enc)` | Wraps `enc` with a `uint` byte-length frame prefix. |
| `cenc.record(keyEnc, valueEnc)` | Length-prefixed map of key/value pairs. |
| `cenc.stringRecord` | `record(utf8, utf8)`—a string-to-string map. |

**Network addresses**

| Codec | Notes |
| --- | --- |
| `cenc.port` | Port number (alias of `cenc.uint16`). |
| `cenc.ipv4` | IPv4 address. |
| `cenc.ipv4Address` | IPv4 address plus port. |
| `cenc.ipv6` | IPv6 address. |
| `cenc.ipv6Address` | IPv6 address plus port. |
| `cenc.ip` | Dual IPv4/IPv6 address. |
| `cenc.ipAddress` | Dual IPv4/IPv6 address plus port. |

**Non-prefixed variants** — [`cenc.raw`](#cencraw) exposes length-prefix-free versions of the buffer, string, typed-array, array, and JSON codecs: `cenc.raw.buffer`, `cenc.raw.arraybuffer`, `cenc.raw.<typedarray>`, `cenc.raw.utf8` / `cenc.raw.ascii` / `cenc.raw.hex` / `cenc.raw.base64` / `cenc.raw.ucs2`, `cenc.raw.array(enc)`, `cenc.raw.json`, and `cenc.raw.ndjson`.

## Types

### State

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `start` | `number` | — | Byte offset to read/write from. Advances after each encode/decode call. |
| `end` | `number` | — | Byte offset marking the end of valid data. Advances during preencode. |
| `buffer` | [`Buffer\|Uint8Array\|null`](https://nodejs.org/api/buffer.html#class-buffer) | — | The underlying byte buffer. Set to `null` until allocation. |

## See also

- [Protomux](/reference/helpers/protomux)—the most common higher-level protocol surface built directly on compact-encoding schemas.
- [Hypercore](/reference/building-blocks/hypercore)—accepts compact encodings for structured values and message payloads.
- [Upstream compact-encoding repository](https://github.com/holepunchto/compact-encoding)—source, releases, and implementation details.
