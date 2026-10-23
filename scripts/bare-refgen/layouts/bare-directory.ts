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
        '`Directory` and `File` run their operations on the thread pool and return promises, and `DirectorySync` and `FileSync` are their synchronous counterparts. Names are single path components, and names and rights are checked before an operation starts.',
        '',
        'A handle carries a set of rights. `open()` takes them from `opts.rights` and defaults to all of them, `openDirectory()` passes on the rights of its parent, and `restrict()` returns a handle with fewer. An operation without the right it needs fails with `ENOTCAPABLE`.',
        '',
        '| Right | Needed by |',
        '| --- | --- |',
        '| `list` | `list()` |',
        '| `lookup` | `openDirectory()`, `openFile()`, `stat(name)`, and `readLink()` |',
        '| `create` | `createDirectory()`, and `openFile()` with `create` |',
        '| `remove` | `removeFile()` and `removeDirectory()`, and `rename()` on the target directory unless `opts.replace` is `false`, even when no entry is replaced |',
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
    {
      heading: 'Options',
      body: [
        'The `.d.ts` declares these option types without exporting them.',
        '',
        '### `OpenOptions`',
        '',
        'Options for `Directory.open()` and `DirectorySync.open()`.',
        '',
        '| Option | Default | Description |',
        '| --- | --- | --- |',
        '| `rights` | All rights | The rights of the directory. See [Rights](#rights). |',
        '',
        '### `OpenFileOptions`',
        '',
        'Options for `openFile()`.',
        '',
        '| Option | Default | Description |',
        '| --- | --- | --- |',
        '| `read` | `true` unless `write` or `append` is set | Open the file for reading. |',
        '| `write` | `false` | Open the file for writing anywhere. |',
        '| `append` | `false` | Open the file for writing only at its end. |',
        '| `create` | `false` | Create the file if it doesn\'t exist. |',
        '| `exclusive` | `false` | Fail with `EEXIST` if the file exists. Without `create`, fails with `EINVAL`. |',
        '| `truncate` | `false` | Truncate the file to empty. Without `write`, fails with `EINVAL`. |',
        '',
        '### `RenameOptions`',
        '',
        'Options for `rename()`.',
        '',
        '| Option | Default | Description |',
        '| --- | --- | --- |',
        '| `replace` | `true` | Replace an existing target. With `false`, an existing target fails with `EEXIST`. While it is `true`, `rename()` needs `remove` on the target directory, even when no entry is replaced. |',
      ].join('\n'),
    },
  ],
};

export default layout;
