// scripts/bare-refgen/layouts/bare-inspector.ts
// Editorial layout for bare-inspector: param/returns prose grounded in the
// upstream README (main branch) and lib/{session,server,heap-snapshot}.js.
// Console methods are native (binding.console) and mirror their `console`
// counterparts, so their param prose states only the standard contract.
//
// Method params are keyed by bare member name (for example `post`, `close`) so the
// same prose applies to both the re-exported classes (`Session`, `Server`,
// `Console`) and the duplicated `bare-inspector/*` submodule sections
// (`InspectorSession`, `InspectorServer`, `InspectorConsole`) — the member
// names are identical and collide with nothing else in this module.
// Constructors are keyed explicitly because their model names differ.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'Session.constructor': {
      onpaused: 'Called whenever the debugger pauses; return `true` to keep the pause, or a falsy value to resume immediately (the default resumes).',
    },
    'InspectorSession.constructor': {
      onpaused: 'Called whenever the debugger pauses; return `true` to keep the pause, or a falsy value to resume immediately (the default resumes).',
    },
    post: {
      method: "The inspector protocol method name (for example `'Runtime.evaluate'`).",
      cb: 'Called with the error or result; when given, no promise is returned.',
    },
    'Server.constructor': {
      opts: 'Options; `path` is the script URL reported to DevTools and defaults to `require.main.path`.',
    },
    'InspectorServer.constructor': {
      opts: 'Options; `path` is the script URL reported to DevTools and defaults to `require.main.path`.',
    },
    close: {
      cb: 'Called once the underlying server has closed.',
    },
    'HeapSnapshot.constructor': {
      session: 'The connected `Session` to take the snapshot over.',
    },
    'InspectorHeapSnapshot.constructor': {
      session: 'The connected `Session` to take the snapshot over.',
    },
    assert: {
      condition: 'The value to test; the assertion logs only when it is falsy.',
      data: 'The values to log when `condition` is falsy.',
    },
    count: { label: 'The label of the counter.' },
    countReset: { label: 'The label of the counter to reset.' },
    debug: { data: 'The values to log.' },
    dir: {
      object: 'The object to inspect.',
      opts: 'Inspection options: `colors`, `depth`, and `showHidden`.',
    },
    dirxml: { data: 'The values to log.' },
    error: { data: 'The values to log.' },
    group: { data: 'The values to log as the group heading.' },
    groupCollapsed: { data: 'The values to log as the group heading.' },
    info: { data: 'The values to log.' },
    log: { data: 'The values to log.' },
    profile: { label: 'The label of the profile.' },
    profileEnd: { label: 'The label of the profile to stop.' },
    table: {
      data: 'The tabular data to display.',
      props: 'The property names to include as columns.',
    },
    time: { label: 'The label of the timer.' },
    timeEnd: { label: 'The label of the timer to stop.' },
    timeLog: {
      label: 'The label of the timer.',
      data: 'Additional values to log alongside the elapsed time.',
    },
    timeStamp: { label: 'The label of the timestamp marker.' },
    trace: { data: 'The values to log with the stack trace.' },
    warn: { data: 'The values to log.' },
  },
  returns: {
    post: "A promise settling with the inspector's response, or `undefined` when `cb` is given.",
  },
};

export default layout;
