// Grounded in ../../../../ts-doc-upstream/bare-buffer/index.js (the actual
// implementation behind index.d.ts — the README carries no prose beyond the
// generated API block, so every fact here traces to source, not docs).

import type { Layout } from '../layout';

const readOffsetDesc = 'Byte offset to read from; defaults to `0`.';
const writeOffsetDesc = 'Byte offset to write to; defaults to `0`.';
const readByteLengthDesc = 'Number of bytes to read, from `1` to `6`.';
const writeByteLengthDesc = 'Number of bytes to write, from `1` to `6`.';

// Single-offset read accessors: `readXxx(offset = 0)`.
const singleOffsetReads = [
  'readBigInt64BE',
  'readBigInt64LE',
  'readBigUint64BE',
  'readBigUInt64BE',
  'readBigUint64LE',
  'readBigUInt64LE',
  'readDoubleBE',
  'readDoubleLE',
  'readFloatBE',
  'readFloatLE',
  'readInt16BE',
  'readInt16LE',
  'readInt32BE',
  'readInt32LE',
  'readInt8',
  'readUint16BE',
  'readUInt16BE',
  'readUint16LE',
  'readUInt16LE',
  'readUint32BE',
  'readUInt32BE',
  'readUint32LE',
  'readUInt32LE',
  'readUint8',
  'readUInt8',
];

// `readXxxBE/LE(offset, byteLength)` — variable-width integer reads. Each
// throws `RangeError('Byte length must be between 1 and 6')` for an
// out-of-range `byteLength` (see readIntBE/readUintBE/etc. in index.js).
const variableByteLengthReads = ['readIntBE', 'readIntLE', 'readUintBE', 'readUIntBE', 'readUintLE', 'readUIntLE'];

// `writeXxx(value, offset = 0)` — fixed-width writes, each returning
// `offset + N` (the offset immediately following the written value).
const fixedWidthWrites: Array<[name: string, size: number, valueDesc: string]> = [
  ['writeBigInt64BE', 8, 'The signed `bigint` to write.'],
  ['writeBigInt64LE', 8, 'The signed `bigint` to write.'],
  ['writeBigUint64BE', 8, 'The unsigned `bigint` to write.'],
  ['writeBigUInt64BE', 8, 'The unsigned `bigint` to write.'],
  ['writeBigUint64LE', 8, 'The unsigned `bigint` to write.'],
  ['writeBigUInt64LE', 8, 'The unsigned `bigint` to write.'],
  ['writeDoubleBE', 8, 'The double-precision number to write.'],
  ['writeDoubleLE', 8, 'The double-precision number to write.'],
  ['writeFloatBE', 4, 'The single-precision number to write.'],
  ['writeFloatLE', 4, 'The single-precision number to write.'],
  ['writeInt16BE', 2, 'The signed integer to write.'],
  ['writeInt16LE', 2, 'The signed integer to write.'],
  ['writeInt32BE', 4, 'The signed integer to write.'],
  ['writeInt32LE', 4, 'The signed integer to write.'],
  ['writeInt8', 1, 'The signed integer to write.'],
  ['writeUint16BE', 2, 'The unsigned integer to write.'],
  ['writeUInt16BE', 2, 'The unsigned integer to write.'],
  ['writeUint16LE', 2, 'The unsigned integer to write.'],
  ['writeUInt16LE', 2, 'The unsigned integer to write.'],
  ['writeUint32BE', 4, 'The unsigned integer to write.'],
  ['writeUInt32BE', 4, 'The unsigned integer to write.'],
  ['writeUint32LE', 4, 'The unsigned integer to write.'],
  ['writeUInt32LE', 4, 'The unsigned integer to write.'],
  ['writeUint8', 1, 'The unsigned integer to write.'],
  ['writeUInt8', 1, 'The unsigned integer to write.'],
];

// `writeXxxBE/LE(value, offset, byteLength)` — variable-width integer writes.
// Each throws `RangeError('Byte length must be between 1 and 6')` for an
// out-of-range `byteLength`, and returns `offset + byteLength`.
const variableByteLengthWrites: Array<[name: string, valueDesc: string]> = [
  ['writeIntBE', 'The signed integer to write.'],
  ['writeIntLE', 'The signed integer to write.'],
  ['writeUintBE', 'The unsigned integer to write.'],
  ['writeUIntBE', 'The unsigned integer to write.'],
  ['writeUintLE', 'The unsigned integer to write.'],
  ['writeUIntLE', 'The unsigned integer to write.'],
];

// Methods that decode a string via `codecFor(encoding)` (see index.js), which
// throws a plain `Error('Unknown encoding ...')` for an unrecognized encoding.
const unknownEncodingThrows = ['Buffer.toString', 'Buffer.write', 'Buffer.fill', 'Buffer.byteLength', 'Buffer.includes', 'Buffer.indexOf', 'Buffer.lastIndexOf', 'Buffer.from', 'Buffer.transcode'];

const params: Record<string, Record<string, string>> = {
  'Buffer.constructor': {
    arrayBuffer: 'The `ArrayBuffer` to view.',
    offset: 'Byte offset into `arrayBuffer` to start the view at; defaults to `0`.',
    length: 'Number of bytes to view from `offset`; defaults to the rest of `arrayBuffer`.',
  },
  'Buffer.alloc': {
    size: 'Number of bytes to allocate.',
    fill: 'Value to fill the buffer with — a string, `Buffer`, number byte, or boolean.',
    encoding: "Encoding used to interpret `fill` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.allocUnsafe': { size: 'Number of bytes to allocate.' },
  'Buffer.allocUnsafeSlow': { size: 'Number of bytes to allocate.' },
  'Buffer.atob': { data: 'The base64-encoded string to decode.' },
  'Buffer.btoa': { data: 'The value to encode; non-strings are coerced with `String()`.' },
  'Buffer.byteLength': {
    string: "The value whose encoded length to measure — a string, or an `ArrayBufferView`/`ArrayBufferLike` (whose own `byteLength` is returned unchanged).",
    encoding: "Encoding used to measure `string` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.coerce': { buffer: 'The value to coerce into a `Buffer`.' },
  'Buffer.compare': {
    a: 'The first buffer to compare.',
    b: 'The second buffer to compare.',
    target: 'The buffer to compare against.',
    targetStart: 'Offset within `target` to start comparing from; defaults to `0`.',
    targetEnd: 'Offset within `target` (exclusive) to stop comparing at; defaults to `target.byteLength`.',
    sourceStart: 'Offset within this buffer to start comparing from; defaults to `0`.',
    sourceEnd: 'Offset within this buffer (exclusive) to stop comparing at; defaults to `this.byteLength`.',
  },
  'Buffer.concat': {
    buffers: 'The buffers to concatenate, in order.',
    length: "Total byte length of the result; defaults to the sum of `buffers`' lengths.",
  },
  'Buffer.copyBytesFrom': {
    view: 'The typed array (or other `ArrayBufferLike` view) to copy bytes from.',
    offset: 'Index of the first element to copy; defaults to `0`.',
    length: 'Number of elements to copy; defaults to the rest of `view`.',
  },
  'Buffer.from': { data: 'The array, array-like, string, buffer, or `ArrayBuffer` to create a new `Buffer` from.' },
  'Buffer.isAscii': { buffer: 'The buffer to check.' },
  'Buffer.isASCII': { buffer: 'The buffer to check.' },
  'Buffer.isBuffer': { value: 'The value to check.' },
  'Buffer.isEncoding': { encoding: 'The encoding name to check.' },
  'Buffer.isUtf8': { buffer: 'The buffer to check.' },
  'Buffer.isUTF8': { buffer: 'The buffer to check.' },
  'Buffer.transcode': {
    buffer: 'The buffer to re-encode.',
    from: 'The encoding `buffer` is currently in.',
    to: 'The encoding to convert to.',
  },
  'Buffer.copy': {
    target: 'The buffer to copy into.',
    targetStart: 'Offset within `target` to start writing at; defaults to `0`.',
    sourceStart: 'Offset within this buffer to start copying from; defaults to `0`.',
    sourceEnd: 'Offset within this buffer (exclusive) to stop copying at; defaults to `this.byteLength`.',
  },
  'Buffer.equals': { target: "The buffer to compare this buffer's contents against." },
  'Buffer.fill': {
    value: 'The value to fill with — a string (repeated across the range), or a `Buffer`/number/boolean byte.',
    encoding: "Encoding used to interpret `value` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.includes': {
    value: 'The value to search for — a string, `Buffer`, number byte, or boolean.',
    encoding: "Encoding used to interpret `value` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.indexOf': {
    value: 'The value to search for — a string, `Buffer`, number byte, or boolean.',
    encoding: "Encoding used to interpret `value` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.lastIndexOf': {
    value: 'The value to search for — a string, `Buffer`, number byte, or boolean.',
    encoding: "Encoding used to interpret `value` when it's a string; defaults to `'utf8'`.",
  },
  'Buffer.toString': {
    encoding: "Encoding used to decode the bytes; defaults to `'utf8'`.",
    start: 'Byte offset to start decoding from; defaults to `0`.',
    end: 'Byte offset (exclusive) to stop decoding at; defaults to `this.byteLength`.',
  },
  'Buffer.write': {
    string: 'The string to write.',
    encoding: "Encoding used to encode `string`; defaults to `'utf8'`.",
  },
  'Buffer.readIntBE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
  'Buffer.readIntLE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
  'Buffer.readUintBE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
  'Buffer.readUIntBE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
  'Buffer.readUintLE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
  'Buffer.readUIntLE': { offset: 'Byte offset to read from.', byteLength: readByteLengthDesc },
};

for (const name of singleOffsetReads) {
  params[`Buffer.${name}`] = { offset: readOffsetDesc };
}

for (const [name, , valueDesc] of fixedWidthWrites) {
  params[`Buffer.${name}`] = { value: valueDesc, offset: writeOffsetDesc };
}

for (const [name, valueDesc] of variableByteLengthWrites) {
  params[`Buffer.${name}`] = { value: valueDesc, offset: 'Byte offset to write to.', byteLength: writeByteLengthDesc };
}

const returns: Record<string, string> = {};

for (const [name, size] of fixedWidthWrites) {
  returns[`Buffer.${name}`] = `\`offset + ${size}\`, the offset immediately following the written value.`;
}

for (const [name] of variableByteLengthWrites) {
  returns[`Buffer.${name}`] = '`offset + byteLength`, the offset immediately following the written value.';
}

const throws: Record<string, string[]> = {
  'Buffer.constructor': ['`RangeError` — thrown if the resulting length would exceed `Buffer.constants.MAX_LENGTH`.'],
  'Buffer.alloc': ['`RangeError` — thrown if `size` exceeds `Buffer.constants.MAX_LENGTH`.'],
  'Buffer.allocUnsafe': ['`RangeError` — thrown if `size` exceeds `Buffer.constants.MAX_LENGTH`.'],
  'Buffer.allocUnsafeSlow': ['`RangeError` — thrown if `size` exceeds `Buffer.constants.MAX_LENGTH`.'],
  'Buffer.copyBytesFrom': ['`RangeError` — thrown if `offset + length` exceeds `view.length`.'],
  'Buffer.swap16': ["`RangeError` — thrown if the buffer's length is not a multiple of 2 bytes."],
  'Buffer.swap32': ["`RangeError` — thrown if the buffer's length is not a multiple of 4 bytes."],
  'Buffer.swap64': ["`RangeError` — thrown if the buffer's length is not a multiple of 8 bytes."],
};

for (const name of variableByteLengthReads) {
  throws[`Buffer.${name}`] = ['`RangeError` — thrown if `byteLength` is not between `1` and `6`.'];
}

for (const [name] of variableByteLengthWrites) {
  throws[`Buffer.${name}`] = ['`RangeError` — thrown if `byteLength` is not between `1` and `6`.'];
}

for (const key of unknownEncodingThrows) {
  throws[key] = ["`Error` — thrown if the encoding is not a recognized `BufferEncoding`."];
}

const layout: Layout = {
  groups: [],
  params,
  returns,
  throws,
};

export default layout;
