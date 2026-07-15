// scripts/bare-refgen/layouts/bare-sidecar.ts
// Editorial layout for bare-sidecar: constructor param prose grounded in the
// upstream README intro and index.js (constructor signature + arg handling).

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Sidecar.constructor': {
      entry:
        'Path to the module the sidecar process runs, typically resolved with `require.resolve()`.',
      args: 'Additional command-line arguments passed to the process (default `[]`).',
      opts: 'Reserved for future use.',
    },
  },
};

export default layout;
