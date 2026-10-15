// scripts/bare-readline.ts
// Editorial layout for bare-readline: param/returns prose grounded in index.js.
// Constructor defaults: `prompt` is `opts.prompt || '> '` and `crlfDelay` is
// `opts.crlfDelay ? Math.max(100, opts.crlfDelay) : 100`. `clearLine()` returns
// the pre-reset line; `getPrompt()` returns `this._prompt`.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Readline.constructor': {
      opts: 'Options; `input` and `output` are the streams to read from and render to, `prompt` defaults to `\'> \'`, and `crlfDelay` defaults to `100`.',
    },
    'Readline.createInterface': {
      opts: 'Options; `input` and `output` are the streams to read from and render to, `prompt` defaults to `\'> \'`, and `crlfDelay` defaults to `100`.',
    },
    'Readline.setPrompt': {
      prompt: 'The prompt string written before the input line.',
    },
    'Readline.write': {
      data: 'The data to write to the output stream.',
    },
  },
  returns: {
    'Readline.clearLine': 'the input line that was cleared, before the buffer and cursor were reset.',
    'Readline.getPrompt': 'the current prompt string.',
  },
};

export default layout;
