// scripts/bare-refgen/layouts/bare-vm.ts
// Editorial layout for bare-vm: param/returns prose grounded in index.js. The
// `opts` defaults come from index.js (`offset = opts.lineOffset` Node-compat
// alias) and the underlying bare-realm `evaluate` defaults (`filename`
// `'<anonymous>'`, `offset` `0`). Functions return the completion value of the
// evaluated code (realm.evaluate → binding.evaluate).

import type { Layout } from '../layout';

const OPTS =
  "Options. `filename` is the script name used in stack traces (default `'<anonymous>'`); `offset` shifts the reported line numbers (default `0`, also accepted as `lineOffset` for Node.js compatibility).";

const layout: Layout = {
  params: {
    runInContext: {
      code: 'The JavaScript source to run.',
      context: 'A context previously created with `createContext()`.',
      opts: OPTS,
    },
    runInNewContext: {
      code: 'The JavaScript source to run.',
      opts: OPTS,
    },
  },
  returns: {
    createContext:
      'A new isolated global context that code can be run in with `runInContext()`.',
    runInContext: 'The completion value of `code`.',
    runInNewContext: 'The completion value of `code`.',
  },
};

export default layout;
