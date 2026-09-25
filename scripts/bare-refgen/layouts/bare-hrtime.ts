// scripts/bare-refgen/layouts/bare-hrtime.ts
// Editorial layout for bare-hrtime: param prose grounded in the upstream README
// usage block and index.js (the elapsed-time computation over `past`).

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    hrtime: {
      prev: 'A previous `hrtime()` result to compute the elapsed time since.',
    },
  },
};

export default layout;
