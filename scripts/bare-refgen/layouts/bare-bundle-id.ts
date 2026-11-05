// scripts/bare-refgen/layouts/bare-bundle-id.ts
// Editorial layout for bare-bundle-id: parameter prose grounded in index.js,
// which sorts the bundle's file entries by path before hashing so the ID is
// stable regardless of insertion order. Member description lives in
// bare-bundle-id.describe.json.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    id: {
      bundle:
        "The [`bare-bundle`](https://github.com/holepunchto/bare-bundle) instance to hash; its file entries are sorted by path before hashing, so the ID is stable regardless of the order they were written in.",
    },
  },
};

export default layout;
