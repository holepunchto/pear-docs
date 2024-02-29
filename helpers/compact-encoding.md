# Compact Encoding

A series of binary encoders/decoders for building small and fast parsers and serializers.

> [GitHub (Compact-Encoding)](https://github.com/holepunchto/compact-encoding)

* [Compact-Encoding](compact-encoding.md#installation)
  * Methods
    * [state()](compact-encoding.md#state)
      * [enc.preencode(state, val)](compact-encoding.md#enc.preencode)
      * [enc.encode(state, val)](compact-encoding.md#enc.encode)
      * [enc.decode(state)](compact-encoding.md#enc.decode)
  * [Helpers](compact-encoding.md#helpers)
  * [Bundled Encodings](compact-encoding.md#bundled-encodings)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install compact-encoding
```

### Encoder API

#### **`state()`** {#state}

An object with the keys`{ start, end, buffer, cache }`.

| Keys     | Description                                   |
| -------- | --------------------------------------------- |
| `start`  | Byte offset to start encoding/decoding at.    |
| `end`    | Byte offset indicating the end of the buffer. |
| `buffer` | Either a Node.js Buffer or Uint8Array.        |
| `cache`  | Used internally by codecs, starts as `null`.  |

> Users can also get a blank state object using`cenc.state()`.

```javascript
const cenc = require('compact-encoding')
const state = cenc.state()
```

#### **`enc.preencode(state, val)`** {#enc.preencode}

Performs a fast preencode dry-run that only sets `state.end`. Use this to figure out how big the buffer needs to be.

```javascript
const cenc = require('compact-encoding')

const state = cenc.state()

// use preencode to figure out how big a buffer is needed
cenc.uint.preencode(state, 42)
cenc.string.preencode(state, 'hi')

console.log(state) // { start: 0, end: 4, buffer: null, cache: null }
```

#### **`enc.encode(state, val)`** {#enc.encode}

Encodes `val` into `state.buffer` at position `state.start` and updates `state.start` to point after the encoded value when done.

```javascript
state.buffer = Buffer.allocUnsafe(state.end)

// then use encode to actually encode it to the buffer
cenc.uint.encode(state, 42)
cenc.string.encode(state, 'hi')
```

#### **`val = enc.decode(state)`** {#enc.decode}

Decodes a value from `state.buffer` as position `state.start`and updates `state.start` to point after the decoded value when done in the buffer.

```javascript
// to decode it simply use decode instead

state.start = 0
cenc.uint.decode(state) // 42
cenc.string.decode(state) // 'hi'

```

### Helpers {#helpers}

To encode to a buffer or decode from one, use the `encode` and `decode` helpers to reduce boilerplate.

```javascript
const buf = cenc.encode(cenc.bool, true)
const bool = cenc.decode(cenc.bool, buf)
```

### Bundled encodings {#bundled-encoding}

The following encodings are bundled as they are primitives that can be used to build others on top.

> Feel free to make a PR to add more encodings that are missing.

| Encodings                                     | Description                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cenc.raw`                                    | Pass through encodes a buffer, i.e., a basic copy.                                                                                                                                          |
| `cenc.uint`                                   | Encodes a uint using [compact-uint](https://github.com/mafintosh/compact-uint).                                                                                                            |
| `cenc.uint8`                                  | Encodes a fixed size uint8.                                                                                                                                                                |
| `cenc.uint16`                                 | Encodes a fixed size uint16. Useful for things like ports.                                                                                                                                 |
| `cenc.uint24`                                 | Encodes a fixed size uint24. Useful for message framing.                                                                                                                                   |
| `cenc.uint32`                                 | Encodes a fixed size uint32. Useful for very large message framing.                                                                                                                        |
| `cenc.uint40`                                 | Encodes a fixed size uint40.                                                                                                                                                               |
| `cenc.uint48`                                 | Encodes a fixed size uint48.                                                                                                                                                               |
| `cenc.uint56`                                 | Encodes a fixed size uint56.                                                                                                                                                               |
| `cenc.uint64`                                 |  Encodes a fixed size uint64.                                                                                                                                                              |
| `cenc.int`                                    | Encodes an int using `cenc.uint` with ZigZag encoding.                                                                                                                                     |
| `cenc.int8`                                   | Encodes a fixed size int8 using `cenc.uint8` with ZigZag encoding.                                                                                                                         |
| `cenc.int16`                                  | Encodes a fixed size int16 using `cenc.uint16` with ZigZag encoding.                                                                                                                       |
| `cenc.int24`                                  | Encodes a fixed size int24 using `cenc.uint24` with ZigZag encoding.                                                                                                                       |
| `cenc.int32`                                  | Encodes a fixed size int32 using `cenc.uint32` with ZigZag encoding.                                                                                                                       |
| `cenc.int40`                                  | Encodes a fixed size int40 using `cenc.uint40` with ZigZag encoding.                                                                                                                       |
| `cenc.int48`                                  | Encodes a fixed size int48 using `cenc.uint48` with ZigZag encoding.                                                                                                                       |
| `cenc.int56`                                  | Encodes a fixed size int56 using `cenc.uint56` with ZigZag encoding                                                                                                                        |
| `cenc.int64`                                  |  Encodes a fixed size int64 using `cenc.uint64` with ZigZag encoding.                                                                                                                      |
| `cenc.lexint`                                 | Encodes an int using lexicographic-integer encoding so that encoded values are lexicographically sorted in ascending numerical order. |
| `cenc.float32`                                | Encodes a fixed size float32.                                                                                                                                                              |
| `cenc.float64`                                | Encodes a fixed size float64.                                                                                                                                                              |
| `cenc.buffer`                                 | Encodes a buffer with its length uint prefixed. When decoding an empty buffer, `null` is returned.                                                                                         |
| `cenc.raw.buffer`                             | Encodes a buffer without a length prefixed.                                                                                                                                                |
| `cenc.uint8array`                             | Encodes a uint8array with its element length uint prefixed.                                                                                                                                |
| `cenc.raw.uint8array`                         | Encodes a uint8array without a length prefixed.                                                                                                                                            |
| `cenc.uint16array`                            | Encodes a uint16array with its element length uint prefixed.                                                                                                                               |
| `cenc.raw.uint16array`                        | Encodes a uint16array without a length prefixed.                                                                                                                                           |
| `cenc.uint32array`                            | Encodes a uint32array with its element length uint prefixed.                                                                                                                               |
| `cenc.raw.uint32array`                        | Encodes a uint32array without a length prefixed.                                                                                                                                           |
| `cenc.int8array`                              | Encodes a int8array with its element length uint prefixed.                                                                                                                                 |
| `cenc.raw.int8array`                          | Encodes a int8array without a length prefixed.                                                                                                                                             |
| `cenc.int16array`                             | Encodes a int16array with its element length uint prefixed.                                                                                                                                |
| `cenc.raw.int16array`                         | Encodes a int16array without a length prefixed.                                                                                                                                            |
| `cenc.int32array`                             | Encodes a int32array with its element length uint prefixed.                                                                                                                                |
| `cenc.raw.int32array`                         | Encodes a int32array without a length prefixed.                                                                                                                                            |
| `cenc.float32array`                           | Encodes a float32array with its element length uint prefixed.                                                                                                                              |
| `cenc.raw.float32array`                       | Encodes a float32array without a length prefixed.                                                                                                                                          |
| `cenc.float64array`                           | Encodes a float64array with its element length uint prefixed.                                                                                                                              |
| `cenc.raw.float64array`                       | Encodes a float64array without a length prefixed.                                                                                                                                          |
| `cenc.bool`                                   | Encodes a boolean as 1 or 0.                                                                                                                                                               |
| `cenc.string`, `cenc.utf8`                    | Encodes a utf-8 string, similar to buffer.                                                                                                                                                 |
| `cenc.raw.string`, `cenc.raw.utf8`            | Encodes a utf-8 string without a length prefixed.                                                                                                                                          |
| `cenc.string.fixed(n)`, `cenc.utf8.fixed(n)`  | Encodes a fixed sized utf-8 string.                                                                                                                                                        |
| `cenc.ascii`                                  | Encodes an ascii string.                                                                                                                                                                   |
| `cenc.raw.ascii`                              | Encodes an ascii string without a length prefixed.                                                                                                                                         |
| `cenc.ascii.fixed(n)`                         |  Encodes a fixed size ascii string.                                                                                                                                                        |
| `cenc.hex`                                    | Encodes a hex string.                                                                                                                                                                      |
| `cenc.raw.hex`                                | Encodes a hex string without a length prefixed.                                                                                                                                            |
| `cenc.hex.fixed(n)`                           | Encodes a fixed size hex string.                                                                                                                                                           |
| `cenc.base64`                                 | Encodes a base64 string.                                                                                                                                                                   |
| `cenc.raw.base64`                             | Encodes a base64 string without a length prefixed.                                                                                                                                         |
| `cenc.base64.fixed(n)`                        | Encodes a fixed size base64 string.                                                                                                                                                        |
| `cenc.utf16le`, `cenc.ucs2`                   | Encodes a utf16le string.                                                                                                                                                                  |
| `cenc.raw.utf16le`, `cenc.raw.ucs2`           | Encodes a utf16le string without a length prefixed.                                                                                                                                        |
| `cenc.utf16le.fixed(n)`, `cenc.ucs2.fixed(n)` | Encodes a fixed size utf16le string.                                                                                                                                                       |
| `cenc.fixed32`                                |  Encodes a fixed 32 byte buffer.                                                                                                                                                           |
| `cenc.fixed64`                                |  Encodes a fixed 64 byte buffer.                                                                                                                                                           |
| `cenc.fixed(n)`                               | Makes a fixed sized encoder.                                                                                                                                                               |
| `cenc.array(enc)`                             | Makes an array encoder from another encoder. Arrays are uint prefixed with their length.                                                                                                   |
| `cenc.raw.array(enc)`                         | Makes an array encoder from another encoder, without a length prefixed.                                                                                                                    |
| `cenc.json`                                   | Encodes a JSON value as utf-8.                                                                                                                                                             |
| `cenc.raw.json`                               | Encodes a JSON value as utf-8 without a length prefixed.                                                                                                                                   |
| `cenc.ndjson`                                 | Encodes a JSON value as newline delimited utf-8.                                                                                                                                           |
| `cenc.raw.ndjson`                             | Encodes a JSON value as newline delimited utf-8 without a length prefixed.                                                                                                                 |
| `cenc.from(enc)`                              | Makes a compact encoder from a [codec](https://github.com/mafintosh/codecs) or [abstract-encoding](https://github.com/mafintosh/abstract-encoding).                                        |

