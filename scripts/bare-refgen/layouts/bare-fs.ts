// scripts/bare-refgen/layouts/bare-fs.ts
//
// Editorial grouping for bare-fs's ~85 functions (group titles + order only).
// Each family lists the promise/callback form and its `*Sync` sibling together.
// Only the functions are grouped here; the data classes (Stats, Dir, Dirent,
// Watcher, ReadStream, WriteStream), option interfaces, and type aliases fall
// through to their own by-kind groups after these. Facts come from the .d.ts.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [
    {
      title: 'Opening, reading, and writing',
      // NOTE: 'closeSync' and 'readSync' are deliberately NOT listed here (unlike
      // every other *Sync sibling in this group). The top-level closeSync/readSync
      // functions are folded into close/read automatically (see the "Synchronous
      // form:" line) and removed from the render pool, so a redundant explicit
      // reference to 'closeSync'/'readSync' matches the wrong entry by name:
      // Dir.closeSync/Dir.readSync (also plain 'closeSync'/'readSync' after
      // flattening), rendering the Dir class's methods under this group instead.
      // Re-add only if the renderer's groupByLayout key/name matching is changed
      // to stop falling back to ambiguous short names.
      members: [
        'open', 'openSync', 'close',
        'read', 'readv', 'readvSync',
        'write', 'writeSync', 'writev', 'writevSync',
        'fsync', 'fsyncSync', 'fdatasync', 'fdatasyncSync',
      ],
    },
    {
      title: 'Whole-file helpers',
      members: [
        'readFile', 'readFileSync', 'writeFile', 'writeFileSync',
        'appendFile', 'appendFileSync', 'access', 'accessSync', 'exists', 'existsSync',
      ],
    },
    {
      title: 'Metadata and size',
      members: [
        'stat', 'statSync', 'lstat', 'lstatSync', 'fstat', 'fstatSync',
        'statfs', 'statfsSync', 'truncate', 'truncateSync', 'ftruncate', 'ftruncateSync',
      ],
    },
    {
      title: 'Permissions, ownership, and times',
      members: [
        'chmod', 'chmodSync', 'fchmod', 'fchmodSync',
        'chown', 'chownSync', 'fchown', 'fchownSync', 'lchown', 'lchownSync',
        'utimes', 'utimesSync', 'lutimes', 'lutimesSync', 'futimes', 'futimesSync',
      ],
    },
    {
      title: 'Directories',
      members: [
        'mkdir', 'mkdirSync', 'mkdtemp', 'mkdtempSync', 'rmdir', 'rmdirSync',
        'readdir', 'readdirSync', 'opendir', 'opendirSync',
      ],
    },
    {
      title: 'Links, moving, copying, and removing',
      members: [
        'link', 'linkSync', 'symlink', 'symlinkSync', 'readlink', 'readlinkSync',
        'realpath', 'realpathSync', 'rename', 'renameSync', 'unlink', 'unlinkSync',
        'rm', 'rmSync', 'copyFile', 'copyFileSync', 'cp', 'cpSync',
      ],
    },
    {
      title: 'Streams and watching',
      members: ['createReadStream', 'createWriteStream', 'watch'],
    },
    {
      title: 'Modules',
      members: ['promises', 'constants'],
    },
  ],

  // Per-parameter prose, grounded in the bare-fs implementation (index.js) since
  // the .d.ts carries no defaults or semantics beyond types. Keyed by the
  // top-level function; nested option-object fields (e.g. `MkdirOptions.mode`)
  // have no render slot of their own, so their defaults are folded into the
  // `opts` param line instead (or into the option interface's `describe` entry).
  params: {
    open: {
      flags: "Defaults to `'r'`. Selects read/write mode and whether the file is created, truncated, or appended.",
      mode: 'Defaults to `0o666`. Applied only when `flags` creates a new file.',
    },
    close: { fd: 'The file descriptor to close, as returned by `fs.open()`.' },
    read: {
      fd: 'The file descriptor to read from, as returned by `fs.open()`.',
      offset: 'The offset within `buffer` to start writing to. Defaults to `0`.',
      len: 'The number of bytes to read. Defaults to `buffer.byteLength - offset`.',
      pos: 'The position in the file to read from. Defaults to `-1`, which reads from the current file position and advances it.',
    },
    write: {
      fd: 'The file descriptor to write to, as returned by `fs.open()`.',
      data: 'The bytes to write. May also be a string, in which case the signature becomes `fs.write(fd, data[, pos[, encoding]])`.',
      offset: 'The offset within `data` to start writing from. Defaults to `0`.',
      len: 'The number of bytes to write. Defaults to `data.byteLength - offset`.',
      pos: 'The position in the file to write to. Defaults to `-1`, which writes at the current file position and advances it.',
    },
    access: {
      mode: 'Defaults to `fs.constants.F_OK` (existence only); may also combine `R_OK`, `W_OK`, and/or `X_OK`.',
    },
    readFile: {
      opts: "`encoding` defaults to `'buffer'` (returning a `Buffer` rather than a string); `flag` defaults to `'r'`.",
    },
    writeFile: {
      opts: "`flag` defaults to `'w'` (truncating any existing file); `mode` defaults to `0o666`.",
    },
    mkdir: {
      opts: '`mode` defaults to `0o777`. `recursive`, if `true`, creates missing parent directories and does not error if `filepath` already exists as a directory.',
    },
    mkdtemp: {
      prefix: "The literal suffix `'XXXXXX'` is appended to `prefix` and replaced with random characters to form the directory name.",
    },
    readdir: {
      opts: '`withFileTypes`, if `true`, returns `Dirent` objects instead of plain filename strings.',
    },
    unlink: { filepath: 'The path of the file to remove.' },
    rm: {
      opts: '`recursive`, if `true`, removes directories and their contents; `force`, if `true`, suppresses the error when `filepath` does not exist.',
    },
    copyFile: {
      mode: 'Defaults to `0`. A bitmask of `fs.constants.COPYFILE_EXCL` (fail if `dst` exists), `COPYFILE_FICLONE`, or `COPYFILE_FICLONE_FORCE`.',
    },
    cp: {
      opts: '`recursive` must be `true` to copy a directory; copying a directory without it throws `EISDIR`.',
    },
    watch: {
      opts: "`persistent` defaults to `true`; `recursive` (default `false`) also watches subdirectories; `encoding` defaults to `'utf8'`.",
      cb: "Called with `(eventType, filename)` on each change; equivalent to listening for the `Watcher`'s `'change'` event.",
    },
    createReadStream: {
      path: 'May be `null` if `opts.fd` specifies an already-open file descriptor to read from instead of opening `path`.',
      opts: "`flags` defaults to `'r'`, `mode` to `0o666`, `start` (byte offset) to `0`; `end` (inclusive byte offset), if given, stops the stream early.",
    },
    createWriteStream: {
      path: 'May be `null` if `opts.fd` specifies an already-open file descriptor to write to instead of opening `path`.',
      opts: "`flags` defaults to `'w'`, `mode` to `0o666`.",
    },
  },

  // Return-value semantics beyond the bare `.d.ts` type, grounded in index.js.
  returns: {
    open: 'The file descriptor for the newly opened file.',
    read: 'The number of bytes actually read, which may be less than `len` (`0` at end of file).',
    write: "The number of bytes actually written, which may be less than `data`'s length.",
    readv: 'The number of bytes actually read across all buffers.',
    writev: 'The number of bytes actually written across all buffers.',
    mkdtemp: 'The path of the newly created directory, including its randomly generated suffix.',
    'Dir.read': 'The next `Dirent` for the directory, or `null` once every entry has been read.',
    'Dir.readSync': 'The next `Dirent` for the directory, or `null` once every entry has been read.',
  },

  // Throw/error conditions not carried by the .d.ts, grounded in index.js
  // (explicit `code:` values, or well-defined flag semantics for `open`/`toFlags`)
  // and, for copyFile, the package's own test.js.
  throws: {
    open: [
      "`ENOENT` — `filepath` does not exist and `flags` does not include a creating variant (e.g. the default `'r'`).",
      "`EEXIST` — `flags` is an exclusive variant (`'wx'`, `'ax'`, `'xw'`, `'xa'`, etc.) and `filepath` already exists.",
    ],
    mkdir: [
      '`ENOENT` — a parent directory in `filepath` does not exist and `opts.recursive` is not set.',
      '`EEXIST` — `filepath` already exists; when `opts.recursive` is set this is only thrown if the existing path is not itself a directory.',
    ],
    rmdir: ['`ENOTEMPTY` — the directory is not empty.'],
    rm: ['`EISDIR` — `filepath` is a directory and `opts.recursive` is not set.'],
    cp: ['`EISDIR` — `src` is a directory and `opts.recursive` is not set.'],
    copyFile: ['`EEXIST` — `dst` already exists and `mode` includes `fs.constants.COPYFILE_EXCL`.'],
  },
};

export default layout;
