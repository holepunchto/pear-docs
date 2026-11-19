import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    assert: {
      value: 'The value to assert is truthy.',
      message:
        'Custom message for the thrown error; if an `Error` instance, it is thrown directly instead of an `AssertionError`.',
    },
    'AssertionError.constructor': {
      opts: 'Fields to set on the new error: `message` (defaults to a generated `"<actual> <operator> <expected>"` string), `actual`, `expected`, and `operator`.',
    },
  },
  throws: {
    assert: [
      '`AssertionError` — thrown if `value` is falsy (unless `message` is an `Error` instance, which is thrown instead).',
    ],
  },
};

export default layout;
