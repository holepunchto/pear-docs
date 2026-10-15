// scripts/bare-refgen/layouts/bare-tty.ts
// Editorial layout for bare-tty: param prose grounded in index.js (the upstream
// README documents no API). Option defaults quoted from the ReadStream
// constructor destructuring; mode semantics from setMode/setRawMode and
// lib/constants.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    ReadStream: {
      fd: 'The file descriptor of the TTY.',
      opts: 'Options; `readBufferSize` defaults to `65536` and `allowHalfOpen` to `true`.',
    },
    WriteStream: {
      fd: 'The file descriptor of the TTY.',
    },
    setMode: {
      mode: 'The TTY mode to set, one of the `constants.mode` values.',
    },
    setRawMode: {
      mode: '`true` to enable raw mode, `false` to return to normal mode.',
    },
    isTTY: {
      fd: 'The file descriptor to check.',
    },
  },
};

export default layout;
