// scripts/bare-refgen/layouts/bare-ipc.ts
// Editorial layout for bare-ipc: param/returns/throws prose grounded in the
// upstream README and index.js/lib/errors.js. The ALREADY_CONNECTED error is
// raised from the port's transfer (detach) hook in index.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
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
