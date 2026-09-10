// scripts/bare-refgen/layouts/bare-format.ts
// Editorial layout for bare-format: param/returns prose grounded in the
// upstream README usage example and index.js (holepunchto/bare-format).
// NOTE: the .d.ts also declares `format.formatWithOptions(opts, ...args)`
// inside the namespace, but the extractor does not surface it, so it cannot
// be documented through this layout yet.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    format: {
      args: 'An optional printf-style format string followed by the values to format.',
    },
  },
  returns: {
    format: 'The formatted string.',
  },
};

export default layout;
