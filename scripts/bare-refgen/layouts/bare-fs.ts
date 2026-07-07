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
      members: [
        'open', 'openSync', 'close', 'closeSync',
        'read', 'readSync', 'readv', 'readvSync',
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
};

export default layout;
