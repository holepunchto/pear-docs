// scripts/bare-refgen/layouts/bare-module-lexer.ts
//
// Editorial layout for bare-module-lexer. Prose is transcribed/derived from
// the upstream README and index.js (holepunchto/bare-module-lexer), not
// invented. "Options are reserved" and the TypeError throw are verbatim from
// the README and the guard at the top of index.js respectively.
//
// NOTE: `lex.constants` (REQUIRE, IMPORT, DYNAMIC, ADDON, ASSET, RESOLVE,
// REEXPORT) is documented in the README and defined in index.js, but the
// upstream index.d.ts does not declare it, so it is absent from the model and
// cannot be documented through this layout.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    lex: {
      input: 'The source to lex, as a string or buffer.',
      encoding: 'The encoding of `input` when it is a string.',
      opts: 'Reserved; currently unused.',
    },
  },
  throws: {
    lex: ['`TypeError` — `input` is not a string or buffer.'],
  },
};

export default layout;
