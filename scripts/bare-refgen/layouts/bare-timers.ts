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
  // Every one of these has a real .d.ts-sourced description already (the
  // upstream chore/ts-doc branch spliced in real TSDoc for this module — see
  // §9 of the branch handover), so describe()/params overrides for the same
  // member are silently ignored (fallback-only semantics). seeAlso is the
  // only free-text slot left for facts that don't already fit somewhere.
  seeAlso: [
    'Inside Bare these functions are installed as globals, so most code calls them directly without importing anything.',
    "`delay` is floored to an integer. A `delay` that is less than `1`, `NaN`, non-numeric, or greater than `Number.MAX_SAFE_INTEGER` is clamped to `1` ms. (Node caps the maximum at `2147483647`; Bare's ceiling is `Number.MAX_SAFE_INTEGER`.)",
    "Passing `null`, `undefined`, or a non-object to `clearTimeout`/`clearInterval`/`clearImmediate` is a no-op, as is clearing a handle that has already fired or been cleared. All three delegate to the same routine, so any one can cancel any handle—but use the matching name for clarity.",
    "Every handle also implements `[Symbol.dispose]()`, so a `using timer = setTimeout(…)` declaration cancels the timer when the scope exits.",
    "The usual suspension pattern is to clear timers outright on `suspend`; `unref()` is the alternative for a timer that must keep running across the cycle—the same pattern [`bare-ipc`](/reference/bare/modules/bare-ipc#unref-this) uses for its channel.",
    "Hooks into the [Bare runtime](/reference/bare/runtime)'s lifecycle events (`idle`, `resume`, `wakeup`) to pause and restart the underlying native timer. The promise-based API integrates with `bare-abort-controller`—an optional peer dependency—for `signal`-based cancellation.",
    "`require('bare-timers').promises` is also reachable as the standalone `require('bare-timers/promises')`.",
  ],
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
