// scripts/bare-refgen/layouts/bare-sidecar.ts
// Editorial layout for bare-sidecar: constructor param prose grounded in the
// upstream README intro and index.js (constructor signature + arg handling).

import type { Layout } from '../layout';

const layout: Layout = {
  // `SidecarStdio` is declared in the `Sidecar` namespace; list it with the other types.
  groups: [
    { title: 'Sidecar', members: ['Sidecar.constructor', 'stderr', 'stdin', 'stdout'] },
    { title: 'Types', members: ['SidecarEvents', 'SidecarOptions', 'Sidecar.SidecarStdio'] },
  ],
  // `write`/`destroy` and the `'close'` event are inherited from `bare-stream`'s
  // Duplex (generic, not enumerated per module — same reason bare-tcp's page
  // just cross-references bare-stream rather than re-listing them). What the
  // old page added beyond that genericness is Sidecar-specific meaning tying
  // those generic operations to the IPC channel/process lifecycle, which has
  // no member of its own to attach to.
  seeAlso: [
    "The instance extends a duplex stream: writing to it sends data to the sidecar over its IPC channel, data received from the sidecar is emitted as `'data'` events, and destroying the stream kills the sidecar process.",
    "The `'close'` event is emitted after the sidecar process has exited and its underlying stream has been destroyed.",
    'The sidecar runs the Bare runtime that ships inside the package, which `Sidecar.versions.bare` reports: v1.37.1 as of v0.5.16, and v1.36.2 in v0.5.15.',
    '[`bare-subprocess`](/bare/reference/bare/modules/bare-subprocess) — the lower-level process API.',
    '[One core, many platforms](/bare/explanation/bare-on-native) — running a Bare core beside a host.',
  ],
  params: {
    'Sidecar.constructor': {
      entry:
        'Path to the module the sidecar process runs, typically resolved with `require.resolve()`.',
      args: 'Additional command-line arguments passed to the process (default `[]`).',
      opts: 'Spawn options: `detached`, and, added in v0.5.8, `stdio`.',
    },
  },
  describe: {
    'SidecarEvents.exit':
      "Emitted when the sidecar process exits. `code` is the exit code, or `null` if the process was terminated by a signal. `status` is the signal name that terminated the process, or `null` if it exited normally.",
  },
};

export default layout;
