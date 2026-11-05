// scripts/bare-refgen/layouts/bare-string-decoder.ts
// Editorial layout for bare-string-decoder: a `string_decoder` shim (backed by
// the `text-decoder` package). Param/returns prose grounded in the .d.ts types
// (`encoding: BufferEncoding`, `write`/`end` returning the decoded string) and
// the incremental-decoding contract described in the existing describe prose.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'StringDecoder.constructor': {
      encoding:
        "The character encoding the bytes are decoded from (a `BufferEncoding` such as `'utf8'` or `'utf16le'`).",
    },
    'StringDecoder.write': {
      buffer: 'The bytes to decode.',
    },
    'StringDecoder.end': {
      buffer:
        'A final chunk of bytes to decode together with any bytes buffered from previous calls.',
    },
  },
  returns: {
    'StringDecoder.write':
      'The decoded string, excluding any trailing incomplete multi-byte sequence, which is buffered for the next call.',
    'StringDecoder.end':
      'The decoded string, including any bytes buffered from previous calls.',
  },
};

export default layout;
