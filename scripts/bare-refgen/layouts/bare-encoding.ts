// scripts/bare-refgen/layouts/bare-encoding.ts
// Editorial layout for bare-encoding: param/returns/throws prose grounded in
// the upstream index.js and lib/errors.js (holepunchto/bare-encoding, main
// branch). The default label and the INVALID_LABEL throw site are read from
// index.js's TextDecoder constructor and getEncoding().
// NOTE: index.d.ts also declares `TextEncoderStream` and `TextDecoderStream`,
// but the extractor does not surface them, so they cannot be documented
// through this layout yet.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'TextEncoder.encode': {
      input: 'The string to encode.',
    },
    'TextEncoder.encodeInto': {
      input: 'The string to encode.',
      destination: 'The buffer to write the UTF-8 bytes into.',
    },
    'TextDecoder.constructor': {
      label: "The encoding label; only `'utf-8'` and its aliases are accepted (default `'utf-8'`).",
    },
    'TextDecoder.decode': {
      input: 'The bytes to decode.',
      options: 'Options; set `stream: true` when `input` is a chunk of a larger stream.',
    },
    'EncodingError.INVALID_LABEL': {
      msg: 'The error message.',
    },
  },
  returns: {
    'EncodingError.INVALID_LABEL': "An `EncodingError` with `code` set to `'INVALID_LABEL'`, for the caller to throw.",
  },
  throws: {
    'TextDecoder.constructor': ["`INVALID_LABEL` — `label` is not `'utf-8'` or one of its aliases."],
  },
};

export default layout;
