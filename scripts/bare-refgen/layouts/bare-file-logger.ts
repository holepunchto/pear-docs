// scripts/bare-refgen/layouts/bare-file-logger.ts
// Editorial layout for bare-file-logger: param prose grounded in the upstream
// README and index.js. Option defaults (`maxSize` 0, `rotate` null,
// `rotateInterval` 2000) are read from the constructor's destructuring in
// index.js; the line format (padded label + ISO timestamp + formatted data)
// is read from `append()`. No documented throws or return semantics.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'FileLog.constructor': {
      path: 'Path to the log file; opened for appending, and created if it does not exist.',
      options: 'Options controlling log rotation; see [`FileLogOptions`](#filelogoptions).',
    },
    'FileLog.append': {
      label: 'A short severity label, right-padded to five characters (for example `info`, `error`), prefixed to the line ahead of an ISO-8601 timestamp.',
      data: 'Values to format into the log message, using the same formatting as `console.log`.',
    },
  },
};

export default layout;
