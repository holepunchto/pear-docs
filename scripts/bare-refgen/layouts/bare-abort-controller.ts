// scripts/bare-refgen/layouts/bare-abort-controller.ts
// Editorial layout for bare-abort-controller: parameter prose grounded in the
// WHATWG DOM/AbortSignal spec semantics implemented in index.js (the `_abort`
// default reason, `AbortSignal.any`/`timeout`/`abort` statics). Member
// descriptions live in bare-abort-controller.describe.json.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'AbortController.abort': {
      reason:
        "The reason to abort with; passed to every `'abort'` listener and exposed as the signal's `reason`. Defaults to an `AbortError` when omitted.",
    },
    'AbortSignal.abort': {
      reason:
        'The reason the returned signal is aborted with. Defaults to an `AbortError` when omitted.',
    },
    'AbortSignal.any': {
      signals:
        'The signals to observe; the returned signal aborts with the reason of whichever aborts first, or immediately if one is already aborted.',
    },
    'AbortSignal.timeout': {
      ms: 'The number of milliseconds to wait before the returned signal aborts with a `TimeoutError`.',
    },
  },
};

export default layout;
