import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    cursorUp: { n: 'Number of lines to move up; defaults to `1`.' },
    cursorDown: { n: 'Number of lines to move down; defaults to `1`.' },
    cursorForward: { n: 'Number of columns to move forward; defaults to `1`.' },
    cursorBack: { n: 'Number of columns to move back; defaults to `1`.' },
    cursorNextLine: { n: 'Number of lines down to move; defaults to `1`.' },
    cursorPreviousLine: { n: 'Number of lines up to move; defaults to `1`.' },
    cursorPosition: {
      column: 'Zero-based column to move the cursor to.',
      row: 'Zero-based row to move the cursor to; defaults to `0` (the current row).',
    },
    scrollUp: { n: 'Number of lines to scroll the display up; defaults to `1`.' },
    scrollDown: { n: 'Number of lines to scroll the display down; defaults to `1`.' },
    'KeyDecoder.constructor': {
      opts: 'Options controlling the `encoding` and `escapeCodeTimeout` used to decode input; see `KeyDecoderOptions`.',
    },
    'Key.constructor': {
      name: "The decoded key name, for example `'up'`, `'return'`, or a single character.",
      sequence: 'The raw input sequence the key was decoded from.',
      ctrl: 'Whether the Ctrl modifier was held.',
      meta: 'Whether the Meta (Alt) modifier was held.',
      shift: 'Whether the Shift modifier was held.',
    },
  },
};

export default layout;
