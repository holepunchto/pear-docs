// scripts/bare-refgen/layouts/bare-directory.ts
// Editorial layout for bare-directory (0.1.x). The rights table is read from
// the bare_directory__require() calls in binding.c at v0.1.0; the .d.ts names
// the rights but not which operation needs which.

import type { Layout } from '../layout';

const layout: Layout = {
  patch: [
    {
      in: 'usage',
      from: 'See [`index.d.ts`](index.d.ts) for the full API and the available rights.',
      to: 'See the [API](#api) below for the full API and [Rights](#rights) for the available rights.',
    },
  ],
  describe: {
    'Stat.size': 'The size of the entry in bytes.',
    'Stat.ino': 'The inode number of the entry.',
    'Stat.nlink': 'The number of hard links to the entry.',
    'Stat.atime': 'The time of last access in nanoseconds since the Unix epoch.',
    'Stat.mtime': 'The time of last modification in nanoseconds since the Unix epoch.',
    'Stat.ctime': 'The time of last status change in nanoseconds since the Unix epoch.',
    'Entry.name': 'The name of the entry, a single path component.',
    'Entry.type': 'The type of the entry, as in [`Stat`](#stat).',
  },
  seeAlso: [
    '[`bare-wasi`](/bare/reference/bare/modules/bare-wasi#host) — `HostDirectory` exposes a `DirectorySync` to a WebAssembly guest.',
    '[`bare-fs`](/bare/reference/bare/modules/bare-fs) — path-based file system access with the ambient authority of the process.',
  ],
  extraSections: [
    {
      heading: 'Rights',
      body: [
        'A handle carries a set of rights. `open()` takes them from `opts.rights` and defaults to all of them, `openDirectory()` passes on the rights of its parent, and `restrict()` returns a handle with fewer. An operation without the right it needs fails with `ENOTCAPABLE`.',
        '',
        '| Right | Needed by |',
        '| --- | --- |',
        '| `list` | `list()` |',
        '| `lookup` | `openDirectory()`, `openFile()`, `stat(name)`, and `readLink()` |',
        '| `create` | `createDirectory()`, and `openFile()` with `create` |',
        '| `remove` | `removeFile()` and `removeDirectory()`, and `rename()` onto an existing target, on the target directory |',
        '| `rename` | `rename()`, on both directories |',
        '| `read` | `openFile()` with `read`, then `read()` on the file |',
        '| `write` | `openFile()` with `write`, then `write()` anywhere in the file |',
        '| `append` | `openFile()` with `append`, then `write()` at the end of the file |',
        '| `truncate` | `openFile()` with `truncate`, and `truncate()` on a file opened with `write` |',
        '| `setTimes` | `setTimes()` |',
        '',
        'A file opened from a directory gets only the rights its open flags ask for, plus `setTimes`, and `truncate` when it is opened for writing, each only if the directory has it.',
      ].join('\n'),
    },
  ],
};

export default layout;
