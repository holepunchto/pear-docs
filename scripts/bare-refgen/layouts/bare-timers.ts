// scripts/bare-refgen/layouts/bare-timers.ts
// Editorial layout for bare-timers: param prose grounded in index.js and
// promises.js. The main and `bare-timers/promises` scheduling functions share
// model keys (`setTimeout`, `setInterval`, `setImmediate`), so each params
// entry merges the names from both signatures; each rendered symbol picks the
// names it actually declares. `delay` is clamped to a minimum of 1ms
// (`_timeout`). Returns are intentionally omitted for the schedulers: the
// shared key can't carry different prose for the callback form (returns a
// handle) and the promises form (returns a promise/async generator). Task/
// Timeout handle semantics stay in the describe.json (interface members).

import type { Layout } from '../layout';

const timerOpts = 'Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an `AbortSignal` that cancels the timer.';

const layout: Layout = {
  params: {
    setTimeout: {
      callback: 'The function to run after the delay.',
      delay: 'Milliseconds to wait before running; clamped to a minimum of `1`.',
      args: 'Additional arguments passed to `callback`.',
      value: 'The value the returned promise resolves with.',
      options: timerOpts,
    },
    setInterval: {
      callback: 'The function to run on each interval.',
      delay: 'Milliseconds between runs; clamped to a minimum of `1`.',
      args: 'Additional arguments passed to `callback`.',
      value: 'The value yielded on each iteration.',
      options: timerOpts,
    },
    setImmediate: {
      callback: 'The function to run at the end of the current event loop iteration.',
      args: 'Additional arguments passed to `callback`.',
      value: 'The value the returned promise resolves with.',
      options: timerOpts,
    },
    clearTimeout: { timer: 'The timeout handle to cancel.' },
    clearInterval: { timer: 'The interval handle to cancel.' },
    clearImmediate: { immediate: 'The immediate handle to cancel.' },
  },
};

export default layout;
