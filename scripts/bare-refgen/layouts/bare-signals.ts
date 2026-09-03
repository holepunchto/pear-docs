// scripts/bare-refgen/layouts/bare-signals.ts
// Editorial layout for bare-signals: param and throws prose grounded in
// index.js and lib/errors.js (the upstream README documents no API). Error
// codes read from their throw sites in the Signal constructor and start().

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    Signal: {
      signum: "The signal to handle, given as a signal number or a name such as `'SIGINT'`.",
    },
  },
  throws: {
    Signal: ['`UNKNOWN_SIGNAL` — `signum` is a string that does not name a known signal.'],
    start: ['`SIGNAL_CLOSED` — the signal has been closed.'],
  },
};

export default layout;
