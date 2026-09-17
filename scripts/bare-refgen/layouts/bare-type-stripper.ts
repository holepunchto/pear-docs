// scripts/bare-refgen/layouts/bare-type-stripper.ts
// Editorial layout for bare-type-stripper: param/throws prose grounded in
// index.js (the `strip` argument handling and the `check()` SyntaxError) and
// the README's "What throws" section. `encoding` defaults to UTF-8 via
// `Buffer.from(input, encoding)`; `opts` is accepted but currently unused.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    strip: {
      input: 'The TypeScript source to strip, as a string or a `Buffer`.',
      encoding: 'Encoding used to decode `input` when it is a string (default `\'utf8\'`); ignored when `input` is already a `Buffer`.',
      opts: 'An options object; currently unused.',
    },
  },
  throws: {
    strip: [
      '`TypeError` — `input` is neither a string nor a buffer.',
      '`SyntaxError` — the source contains non-erasable TypeScript syntax (`enum`/`const enum`, `namespace`/`module` with a body, parameter properties, or angle-bracket type assertions).',
    ],
  },
};

export default layout;
