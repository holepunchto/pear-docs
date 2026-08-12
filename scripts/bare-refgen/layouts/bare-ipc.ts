// scripts/bare-refgen/layouts/bare-ipc.ts
// Editorial layout for bare-ipc: param/returns/throws prose grounded in the
// upstream README and index.js/lib/errors.js. The ALREADY_CONNECTED error is
// raised from the port's transfer (detach) hook in index.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  // Module-level facts from the old hand-written page with no single member
  // to attach to (describe() only falls back to layout prose when the .d.ts
  // has no description of its own, and IPC.ref/unref already have one) —
  // seeAlso is the only free-text slot left for this kind of framing note.
  seeAlso: [
    "It's pure JavaScript.",
    'For the host↔worklet channel in native apps, see [`bare-kit`](/reference/bare/bare-kit) instead.',
    '[`bare-channel`](/reference/bare/modules/bare-channel) — inter-*thread* messaging (same idea, within a process).',
    "A common pattern is to call `ipc.ref()` on resume and `ipc.unref()` on suspend, e.g. `Bare.on('suspend', () => ipc.unref()).on('resume', () => ipc.ref())`.",
    "Errors emitted by the underlying incoming or outgoing pipes are propagated to the stream as `error` events, after which the stream is destroyed.",
  ],
  params: {
    IPC: {
      port: 'The port to open the stream over, as returned by `IPC.open()`.',
    },
    IPCPort: {
      incoming: 'The file handle used for reading.',
      outgoing: 'The file handle used for writing.',
    },
    'IPCError.ALREADY_CONNECTED': {
      msg: 'The error message.',
    },
  },
  returns: {
    'IPC.open': 'A pair of connected ports, one for each end of the IPC channel.',
    'IPCPort.connect': 'An `IPC` duplex stream connected to the port.',
    'IPCError.ALREADY_CONNECTED': 'An error with code `ALREADY_CONNECTED`.',
  },
  describe: {
    'IPCError.ALREADY_CONNECTED': 'Create the error thrown when transferring a port that has already been connected or transferred.',
  },
};

export default layout;
