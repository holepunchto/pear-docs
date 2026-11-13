// scripts/bare-refgen/layouts/bare-zlib.ts
// Editorial layout for bare-zlib: param/throws prose grounded in the upstream
// index.js and lib/errors.js (holepunchto/bare-zlib, main branch). The
// upstream README has no API prose; option defaults come from the
// destructuring defaults in index.js (folded into the ZlibOptions member
// entries in bare-zlib.describe.json). The one-shot async functions deliver
// errors through `cb`, so only the synchronous variants list throws.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'Zlib.createDeflate': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.createInflate': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.createDeflateRaw': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.createInflateRaw': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.createGzip': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.createGunzip': { opts: 'Options for the stream and the underlying zlib state.' },
    'Zlib.deflate': {
      buffer: 'The data to compress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.inflate': {
      buffer: 'The data to decompress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.deflateRaw': {
      buffer: 'The data to compress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.inflateRaw': {
      buffer: 'The data to decompress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.gzip': {
      buffer: 'The data to compress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.gunzip': {
      buffer: 'The data to decompress.',
      opts: 'The zlib options to apply for this operation.',
      cb: 'Called with the resulting `Buffer`, or with an error if the operation fails.',
    },
    'Zlib.deflateSync': {
      buffer: 'The data to compress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'Zlib.inflateSync': {
      buffer: 'The data to decompress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'Zlib.deflateRawSync': {
      buffer: 'The data to compress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'Zlib.inflateRawSync': {
      buffer: 'The data to decompress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'Zlib.gzipSync': {
      buffer: 'The data to compress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'Zlib.gunzipSync': {
      buffer: 'The data to decompress; a string is converted to a `Buffer`.',
      opts: 'The zlib options to apply for this operation.',
    },
    'ZlibStream.flush': {
      mode: 'The flush mode, from `constants` (default `Z_FULL_FLUSH`).',
      cb: 'Called once the flush completes, for Node.js compatibility; the returned promise resolves as well.',
    },
    'Deflate.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
    'Inflate.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
    'DeflateRaw.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
    'InflateRaw.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
    'Gzip.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
    'Gunzip.constructor': { opts: 'Options for the stream and the underlying zlib state.' },
  },
  throws: {
    'ZlibStream.reset': ['`STREAM_CLOSED` — the stream has already closed.'],
    'Zlib.deflateSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` identifies the failure.',
    ],
    'Zlib.inflateSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` (such as `DATA_ERROR`) identifies the failure.',
    ],
    'Zlib.deflateRawSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` identifies the failure.',
    ],
    'Zlib.inflateRawSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` (such as `DATA_ERROR`) identifies the failure.',
    ],
    'Zlib.gzipSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` identifies the failure.',
    ],
    'Zlib.gunzipSync': [
      '`LIMIT_EXCEEDED` — the output exceeded `maxOutputLength`.',
      '`ZlibError` — the underlying zlib operation failed; `code` (such as `DATA_ERROR`) identifies the failure.',
    ],
  },
};

export default layout;
