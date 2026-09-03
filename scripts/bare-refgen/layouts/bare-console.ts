// scripts/bare-refgen/layouts/bare-console.ts
// Editorial layout for bare-console: param prose grounded in index.js. The
// constructor default logger is `defaultLog()` (a `bare-logger`, or
// `bare-system-logger` on Android); `label` defaults to `'default'` for the
// timer and counter methods. Method descriptions live in the describe.json.

import type { Layout } from '../layout';

const labelDefault = { label: 'The label identifying the timer or counter (default `\'default\'`).' };

const layout: Layout = {
  seeAlso: [
    "It's pure JavaScript.",
    '[`bare-inspector`](/reference/bare/modules/bare-inspector) — deeper debugging via the V8 inspector.',
  ],
  params: {
    'Console.constructor': {
      log: 'The logging backend to write through. Defaults to a `bare-logger` instance, or `bare-system-logger` on Android. The object must implement the methods used by console operations: `{ debug(...data), info(...data), warn(...data), error(...data), clear(), format(...data) }`.',
    },
    'Console.assert': {
      condition: 'The value tested for truthiness; when falsy, `data` is logged.',
      data: 'Values logged after the `\'Assertion failed\'` prefix when `condition` is falsy.',
    },
    'Console.count': labelDefault,
    'Console.countReset': labelDefault,
    'Console.time': labelDefault,
    'Console.timeEnd': labelDefault,
    'Console.timeLog': {
      label: 'The label identifying the timer (default `\'default\'`).',
      data: 'Additional values logged after the elapsed time.',
    },
    'Console.table': {
      tabularData: 'The data to render as a table.',
      properties: 'Object keys to include as columns; ignored for `Map` and `Set`.',
    },
    'Console.debug': { data: 'Values to log.' },
    'Console.info': { data: 'Values to log.' },
    'Console.log': { data: 'Values to log.' },
    'Console.warn': { data: 'Values to log.' },
    'Console.error': { data: 'Values to log.' },
    'Console.trace': { data: 'Values formatted and prefixed onto the stack trace.' },
  },
};

export default layout;
