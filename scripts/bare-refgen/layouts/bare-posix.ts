// scripts/bare-refgen/layouts/bare-posix.ts
// Editorial layout for bare-posix: param/returns/throws prose grounded in the
// upstream README, index.d.ts JSDoc, index.js, and unsupported.js. The set*
// functions accept a name or numeric ID (resolved via getgrnam/getpwnam in
// index.js); on platforms without POSIX support (android/win32 →
// unsupported.js) they throw a plain `Error` while the getters return sentinel
// values instead.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-os`](/reference/bare/modules/bare-os) — portable OS utilities, including `userInfo` / `groupInfo`.',
  ],
  params: {
    setgid: {
      id: 'The group to switch to: a numeric group ID, or a group name resolved via `getgrnam`.',
    },
    setegid: {
      id: 'The group to switch to: a numeric group ID, or a group name resolved via `getgrnam`.',
    },
    setuid: {
      id: 'The user to switch to: a numeric user ID, or a username resolved via `getpwnam`.',
    },
    seteuid: {
      id: 'The user to switch to: a numeric user ID, or a username resolved via `getpwnam`.',
    },
    getgrnam: {
      name: 'The group name to look up.',
    },
    getpwnam: {
      name: 'The user name to look up.',
    },
  },
  returns: {
    getgrnam: 'The matching `Group` record, or `null` if no such group exists.',
    getpwnam: 'The matching `Passwd` record, or `null` if no such user exists.',
  },
  throws: {
    setgid: ['On platforms without POSIX support (android, win32), throws `Error: Platform not supported`.'],
    setegid: ['On platforms without POSIX support (android, win32), throws `Error: Platform not supported`.'],
    setuid: ['On platforms without POSIX support (android, win32), throws `Error: Platform not supported`.'],
    seteuid: ['On platforms without POSIX support (android, win32), throws `Error: Platform not supported`.'],
  },
};

export default layout;
