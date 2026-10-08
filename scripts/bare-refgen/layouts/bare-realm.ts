// scripts/bare-refgen/layouts/bare-realm.ts
// Editorial layout for bare-realm: param/returns prose grounded in index.js
// (`evaluate(code, opts)` with `filename = '<anonymous>'`, `offset = 0`
// defaults) and the README example (realm globals do not leak into the caller).

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Realm.evaluate': {
      code: 'The JavaScript source to evaluate.',
      options:
        "Options. `filename` is the script name used in stack traces (default `'<anonymous>'`); `offset` shifts the reported line numbers (default `0`).",
    },
  },
  returns: {
    'Realm.evaluate': 'The completion value of `code`.',
  },
};

export default layout;
