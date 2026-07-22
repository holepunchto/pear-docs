// scripts/bare-refgen/layouts/bare-logger.ts
// Editorial layout for bare-logger: parameter prose grounded in the README and
// index.js. The log methods format their arguments through bare-format's
// `formatWithOptions`, so the rest arg is `printf`-style (README usage:
// `log.info('Hello %s', 'world!')`). Member descriptions live in
// bare-logger.describe.json.

import type { Layout } from '../layout';

const paramData = {
  data: 'Values to format and log; the first may be a `printf`-style format string (e.g. `%s`, `%d`, `%o`) with the remaining values as substitutions.',
};

const layout: Layout = {
  params: {
    'Log.constructor': {
      options:
        'Logger options; `colors` forces ANSI color styling on or off, defaulting to whether the output stream is a TTY.',
    },
    'Log.format': paramData,
    'Log.debug': paramData,
    'Log.info': paramData,
    'Log.warn': paramData,
    'Log.error': paramData,
    'Log.fatal': paramData,
    'CompositeLog.constructor': {
      logs: 'The loggers to forward every call to, in order.',
    },
  },
};

export default layout;
