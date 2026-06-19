// scripts/refgen/layouts/compact-encoding.ts
//
// Editorial layout for the compact-encoding reference page. The member entries
// (signatures, source links, examples) come from the model; this manifest
// supplies only grouping + order, the intro and quickstart, see-also links, and
// the descriptions upstream doesn't provide in prose (this package is AST-only,
// so nearly every encoder's one-line description is filled here).

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Small binary encoding toolkit for protocol messages and storage formats.',
  status: 'stable',

  intro:
    '`compact-encoding` packages small binary codecs behind a shared encoder interface. ' +
    'It is commonly paired with [Protomux](/reference/helpers/protomux) message schemas and shows up in ' +
    '[Hypercore](/reference/building-blocks/hypercore) and other Holepunch protocol surfaces whenever structured ' +
    'binary payloads matter. For the upstream package and implementation details, see the ' +
    '[compact-encoding repository](https://github.com/holepunchto/compact-encoding).',

  quickstart:
    '```js\n' +
    "import cenc from 'compact-encoding'\n\n" +
    'const state = cenc.state()\n\n' +
    'cenc.uint.preencode(state, 42)\n' +
    "cenc.string.preencode(state, 'hello')\n\n" +
    'state.buffer = Buffer.allocUnsafe(state.end)\n' +
    'state.start = 0\n\n' +
    'cenc.uint.encode(state, 42)\n' +
    "cenc.string.encode(state, 'hello')\n\n" +
    'state.start = 0\n\n' +
    'console.log(cenc.uint.decode(state))\n' +
    'console.log(cenc.string.decode(state))\n' +
    '```',

  groups: [
    {
      title: 'Encoder contract',
      intro:
        'Every bundled encoder follows the same three-method contract. The top-level helpers and exported factories below all return or consume objects with this shape.',
      members: ['preencode', 'encode', 'decode'],
    },
    { title: 'State and convenience helpers', members: ['state', 'encode', 'decode', 'from'] },
    { title: 'Encoder factories', members: ['fixed', 'array', 'frame', 'record', 'stringRecord'] },
    { title: 'Numeric encodings', members: ['uint64', 'int64', 'bigint', 'float64', 'lexint'] },
    { title: 'Binary, buffer, and typed-array encodings', members: ['binary', 'arraybuffer', 'float64array', 'fixed64'] },
    { title: 'Text encodings', members: ['ucs2'] },
    { title: 'Boolean, date, and structured-value encodings', members: ['bool', 'date', 'ndjson', 'none', 'any'] },
    { title: 'Network encodings', members: ['port', 'ip', 'ipAddress'] },
    { title: 'Raw variants', members: ['raw'] },
  ],

  // This package is AST-only (no README prose), so the model has no description
  // for almost every encoder. Fill each placed member's one-line description from
  // the curated page (transcribed from its `- Returns:` text). Family headings on
  // the page collapse to one representative key here, so the description covers the
  // whole family (e.g. `uint64` documents the `uint` family).
  descriptions: {
    state: 'A mutable state object `{ start, end, buffer }` used by all encoders.',
    from:
      'Coerces `encLike` — an existing compact encoder, a named raw string encoding such as `\'utf8\'` or `\'json\'`, a codec with `encode`/`decode`, or an abstract encoding with `encodingLength` — into a compact-encoding-compatible encoder object.',
    fixed: 'An encoder for fixed-size buffers, where `length` is the exact byte length every encoded value must have.',
    array: 'An encoder that prefixes arrays with their length and encodes each item in order using `itemEncoding`.',
    frame: 'An encoder that prefixes one encoded payload with its byte length.',
    record: 'An encoder for plain object records, with `keyEncoding` for object keys and `valueEncoding` for object values.',
    stringRecord: 'A prebuilt `record(cenc.string, cenc.string)` encoder for simple string maps.',
    uint64:
      'Unsigned integer encoders (`cenc.uint`, `cenc.uint8`, `cenc.uint16`, `cenc.uint24`, `cenc.uint32`, `cenc.uint40`, `cenc.uint48`, `cenc.uint56`, `cenc.uint64`). `cenc.uint` chooses a compact size automatically; the fixed-width variants always use the named byte width.',
    int64:
      'Signed integer encoders (`cenc.int`, `cenc.int8` … `cenc.int64`) built on top of the unsigned variants with ZigZag encoding.',
    bigint:
      'BigInt-aware integer encoders (`cenc.biguint64`, `cenc.bigint64`, `cenc.biguint`, `cenc.bigint`) for fixed-width or variable-width large integer values.',
    float64: 'Floating-point encoders (`cenc.float32`, `cenc.float64`) using IEEE-754 little-endian layouts.',
    lexint: 'The exported lexicographic integer encoder family from the `./lexint` module.',
    binary:
      'Buffer-oriented encoders. `buffer` length-prefixes a byte sequence, `optionalBuffer` maps zero length to `null`, and `binary` accepts either a string or buffer-like input.',
    arraybuffer: 'An encoder for `ArrayBuffer` instances.',
    float64array:
      'Length-prefixed typed-array encoders (`cenc.uint8array`, `cenc.uint16array`, `cenc.uint32array`, `cenc.int8array`, `cenc.int16array`, `cenc.int32array`, `cenc.biguint64array`, `cenc.bigint64array`, `cenc.float32array`, `cenc.float64array`) that preserve the underlying element type.',
    fixed64: 'Prebuilt fixed-size buffer encoders (`cenc.fixed32`, `cenc.fixed64`) for 32-byte and 64-byte values.',
    ucs2:
      'String encoders for the named text encoding (`cenc.string`, `cenc.utf8`, `cenc.ascii`, `cenc.hex`, `cenc.base64`, `cenc.utf16le`, `cenc.ucs2`). Each one also exposes `.fixed(length)` for fixed-size strings.',
    bool: 'A one-byte boolean encoder.',
    date: 'A `Date` encoder backed by the signed integer timestamp value from `date.getTime()`.',
    ndjson: 'UTF-8 JSON encoders (`cenc.json`, `cenc.ndjson`). `ndjson` appends a trailing newline before encoding.',
    none: 'A sentinel encoder that always decodes to `null` and writes no payload bytes.',
    any:
      'A schemaless tagged-value encoder for JSON-like values, arrays, objects, dates, strings, buffers, booleans, integers, and floats.',
    port: 'The same encoder as `cenc.uint16`, provided for protocol readability when encoding network ports.',
    ip: 'Encoders for IPv4 addresses, IPv6 addresses, or either family with an embedded family tag (`cenc.ipv4`, `cenc.ipv6`, `cenc.ip`).',
    ipAddress:
      'Address-object encoders (`cenc.ipv4Address`, `cenc.ipv6Address`, `cenc.ipAddress`) for `{ host, family?, port }` shapes.',
    raw:
      'A namespace of non-length-prefixed variants for many buffer, string, array, JSON, and typed-array encodings such as `cenc.raw.buffer`, `cenc.raw.utf8`, `cenc.raw.array(enc)`, and `cenc.raw.json`.',
  },

  seeAlso: [
    '[Protomux](/reference/helpers/protomux)—the most common higher-level protocol surface built directly on compact-encoding schemas.',
    '[Hypercore](/reference/building-blocks/hypercore)—accepts compact encodings for structured values and message payloads.',
    '[Upstream compact-encoding repository](https://github.com/holepunchto/compact-encoding)—source, releases, and implementation details.',
  ],
};

export default layout;
