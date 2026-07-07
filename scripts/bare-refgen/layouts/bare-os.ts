// scripts/bare-refgen/layouts/bare-os.ts
//
// Editorial layout for bare-os: group titles and member order only. The factual
// content under each heading is regenerated from the .d.ts on every run. Add a
// member's key/name to a group to place it; anything left out renders under a
// trailing "Other" group (and is logged by the driver).

import type { Layout } from '../layout';

const layout: Layout = {
  intro:
    "[`bare-os`](https://github.com/holepunchto/bare-os) exposes operating-system information and process utilities for [Bare](/reference/bare/runtime), closely mirroring the Node.js `os` module so most Node code ports directly.",
  seeAlso: [
    '[`bare-process`](/reference/modules/bare-modules) — process-level control that complements these OS utilities.',
  ],
  params: {
    kill: { pid: 'Process id to signal.', signal: "Signal name or number to send (default `'SIGTERM'`)." },
    setPriority: { pid: 'Process id (defaults to the current process).', priority: 'Nice value to set.' },
  },
  groups: [
    {
      title: 'System and platform',
      members: ['platform', 'arch', 'type', 'version', 'release', 'machine', 'endianness', 'availableParallelism'],
    },
    {
      title: 'Process and scheduling',
      members: [
        'pid', 'ppid', 'cwd', 'chdir', 'execPath', 'kill',
        'getProcessTitle', 'setProcessTitle', 'getPriority', 'setPriority',
      ],
    },
    {
      title: 'Users and network',
      members: ['userInfo', 'groupInfo', 'hostname', 'networkInterfaces'],
    },
    {
      title: 'Memory and CPU',
      members: [
        'cpus', 'cpuUsage', 'threadCpuUsage', 'resourceUsage', 'memoryUsage',
        'freemem', 'totalmem', 'availableMemory', 'constrainedMemory', 'uptime', 'loadavg',
      ],
    },
    {
      title: 'Directories',
      members: ['tmpdir', 'homedir'],
    },
    {
      title: 'Environment variables',
      members: ['getEnvKeys', 'getEnv', 'hasEnv', 'setEnv', 'unsetEnv'],
    },
    {
      title: 'Constants',
      members: ['EOL', 'devNull', 'constants', 'errors'],
    },
    {
      title: 'Types',
      members: ['NetworkInterface', 'UserInfo', 'GroupInfo', 'CpuUsage'],
    },
  ],
  // Descriptions transcribed verbatim from the bare-os README (author-written,
  // not AI). Interim home until they land as TSDoc upstream — emit-jsdoc.ts
  // turns these into the chore/ts-doc PR.
  describe: {
    platform:
      "Returns the operating system platform as a string. Possible values include `'android'`, `'darwin'`, `'ios'`, `'linux'`, and `'win32'`.",
    arch: "Returns the CPU architecture as a string. Possible values include `'arm'`, `'arm64'`, `'ia32'`, and `'x64'`.",
    type: 'Returns the operating system name as returned by `uname(3)`.',
    version: 'Returns the operating system version.',
    release: 'Returns the operating system release.',
    machine: 'Returns the machine type as a string.',
    EOL: "The platform-specific end-of-line marker: `'\\r\\n'` on Windows, `'\\n'` everywhere else.",
    devNull: "The platform-specific path to the null device: `'\\\\.\\nul'` on Windows, `'/dev/null'` everywhere else.",
    constants: 'An object of signal, error-number, and process-priority constants.',
  },
};

export default layout;
