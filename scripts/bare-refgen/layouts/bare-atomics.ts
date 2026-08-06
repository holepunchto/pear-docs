// scripts/bare-refgen/layouts/bare-atomics.ts
// Editorial layout for bare-atomics: param/returns/throws prose grounded in the
// upstream README and index.js. Constructor option defaults and the guard
// clauses that throw are read straight from index.js; the throwing paths use
// plain `Error` (no error code), so the bullets are prose-only.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-channel`](/reference/bare/modules/bare-channel) and [`bare-broadcast-channel`](/reference/bare/modules/bare-broadcast-channel)—higher-level message passing between threads.',
  ],
  params: {
    'Mutex.constructor': {
      opts: 'Options; set `recursive: true` to let the owning thread lock the mutex more than once (default `false`). May also carry an existing `handle` to wrap.',
    },
    'Mutex.from': {
      handle: 'A `SharedArrayBuffer` holding an existing mutex, as exposed by `Mutex.handle`.',
      opts: 'Options, the same as `new Mutex()`.',
    },
    'Semaphore.constructor': {
      value: 'The initial value (permit count) of the semaphore.',
    },
    'Semaphore.from': {
      handle: 'A `SharedArrayBuffer` holding an existing semaphore, as exposed by `Semaphore.handle`.',
    },
    'Condition.from': {
      handle: 'A `SharedArrayBuffer` holding an existing condition variable, as exposed by `Condition.handle`.',
    },
    'Barrier.constructor': {
      count: 'The number of threads that must reach the barrier (call `wait()`) before they are all released together.',
    },
    'Barrier.from': {
      handle: 'A `SharedArrayBuffer` holding an existing barrier, as exposed by `Barrier.handle`.',
    },
  },
  returns: {
    'Mutex.from': 'A `Mutex` sharing the underlying `handle`.',
    'Semaphore.from': 'A `Semaphore` sharing the underlying `handle`.',
    'Condition.from': 'A `Condition` sharing the underlying `handle`.',
    'Barrier.from': 'A `Barrier` sharing the underlying `handle`.',
  },
  throws: {
    'Mutex.lock': ['The mutex is already held and was not created with `recursive: true`.'],
    'Mutex.tryLock': ['The mutex is already held and was not created with `recursive: true`.'],
    'Mutex.unlock': ['The mutex is not currently held.'],
    'Mutex.destroy': ['The mutex is still held.'],
    'Condition.wait': ['The associated mutex is not held by the current thread.'],
  },
};

export default layout;
