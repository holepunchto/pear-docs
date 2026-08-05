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
    '[`bare-process`](/reference/bare/modules/bare-process) — process-level control that complements these OS utilities.',
  ],
  params: {
    kill: {
      pid: 'Process id to signal.',
      signal:
        "Signal name or number to send (default `'SIGTERM'`); `0` probes for the process's existence without sending a signal.",
    },
    setPriority: { pid: 'Process id (defaults to the current process).', priority: 'Nice value to set.' },
    chdir: { dir: 'Path of the directory to make the new working directory.' },
    getEnv: { name: 'Name of the environment variable to read.' },
    hasEnv: { name: 'Name of the environment variable to check.' },
    setEnv: {
      name: 'Name of the environment variable to set.',
      value: 'Value to assign to the environment variable.',
    },
    unsetEnv: { name: 'Name of the environment variable to remove.' },
    setProcessTitle: { title: 'New process title; coerced to a string if not already one.' },
    userInfo: { uid: 'User ID to look up; defaults to the current effective uid.' },
    groupInfo: { gid: 'Group ID to look up; defaults to the effective group ID of the calling process.' },
    cpuUsage: { previous: 'A previous `CpuUsage` snapshot to compute a relative diff against.' },
    threadCpuUsage: {
      previous: 'A previous `CpuUsage` snapshot (from `threadCpuUsage()`) to compute a relative diff against.',
    },
    getPriority: { pid: 'Process id to query; defaults to `0` (the current process).' },
  },
  // Return-value semantics not obvious from the bare .d.ts type alone.
  returns: {
    groupInfo: '`null` on platforms that do not support group lookups (for example, Windows).',
  },
  // Error conditions confirmed in the bare-os source (index.js/binding.c) and
  // exercised by its test suite; not yet annotated in the .d.ts.
  throws: {
    kill: [
      '`UNKNOWN_SIGNAL` — Thrown as an `OSError` when `signal` is a string that is not a recognized signal name.',
      'Thrown with the underlying system error code (for example `ESRCH`) when `pid` does not identify a running process.',
    ],
    chdir: [
      'Thrown with the underlying system error code (for example `ENOENT`) when `dir` does not exist or cannot be entered.',
    ],
    setProcessTitle: [
      '`TITLE_OVERFLOW` — Thrown as an `OSError` when the process title is 256 characters or longer.',
    ],
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
  // not AI).
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
