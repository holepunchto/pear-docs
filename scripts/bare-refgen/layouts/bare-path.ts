// scripts/bare-refgen/layouts/bare-path.ts
// Editorial grouping for bare-path (group titles + order only; facts come from
// the .d.ts). Members are the namespace's exports, referenced as `path.<name>`.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [
    {
      title: 'Joining and resolving',
      members: ['path.join', 'path.resolve', 'path.normalize', 'path.relative'],
    },
    {
      title: 'Inspecting paths',
      members: ['path.basename', 'path.dirname', 'path.extname', 'path.isAbsolute', 'path.toNamespacedPath'],
    },
    {
      title: 'Platform variants and separators',
      members: ['path.sep', 'path.delimiter', 'path.posix', 'path.win32'],
    },
  ],
  // Grounded in lib/posix.js and lib/win32.js of the bare-path source (both
  // variants implement identical validation/algorithms unless noted).
  params: {
    'path.join': { paths: 'The path segments to join together, in the order given.' },
    'path.resolve': {
      args: 'The path segments to resolve, processed from right to left until an absolute path is constructed.',
    },
    'path.normalize': { path: 'The path to normalize.' },
    'path.relative': {
      from: 'The path to resolve the relative path from.',
      to: 'The path to resolve the relative path to.',
    },
    'path.basename': {
      path: 'The path to extract the last portion from.',
      suffix: 'An optional suffix to remove from the end of the result, if it matches exactly.',
    },
    'path.dirname': { path: 'The path to extract the directory name from.' },
    'path.extname': { path: 'The path to extract the extension from.' },
    'path.isAbsolute': { path: 'The path to test.' },
    'path.toNamespacedPath': { path: 'The path to convert.' },
  },
  returns: {
    'path.resolve':
      'Falls back to the current working directory (or that of the resolved drive, on Windows) if none of the given segments is absolute.',
    'path.relative':
      'Both `from` and `to` are resolved to absolute paths before comparing, and an empty string is returned if they resolve to the same path.',
    'path.basename': 'An empty string if `suffix` equals `path` exactly.',
    'path.extname':
      "An empty string if `path` has no `.` in its last segment, or if that segment's only `.` is its first character (e.g. a dotfile).",
    'path.isAbsolute':
      'On Windows, a drive-qualified path such as `C:\\foo` is also absolute; on POSIX, only paths starting with `/` are absolute.',
    'path.toNamespacedPath':
      'On Windows, resolves `path` and prefixes UNC paths with `\\\\?\\UNC\\` and drive-letter paths with `\\\\?\\`; other paths (including non-string input) are returned unchanged.',
  },
  // No @throws tags exist upstream; these are grounded in validateString() in
  // lib/shared.js and its call sites in lib/posix.js / lib/win32.js.
  // toNamespacedPath is deliberately excluded: neither variant validates its
  // argument (posix returns it untouched; win32 only checks typeof/length and
  // returns the input unchanged rather than throwing).
  throws: {
    'path.join': ['`TypeError` — thrown if any path segment is not a string.'],
    'path.resolve': ['`TypeError` — thrown if any path segment is not a string.'],
    'path.normalize': ['`TypeError` — thrown if `path` is not a string.'],
    'path.relative': ['`TypeError` — thrown if `from` or `to` is not a string.'],
    'path.basename': ['`TypeError` — thrown if `path`, or a defined `suffix`, is not a string.'],
    'path.dirname': ['`TypeError` — thrown if `path` is not a string.'],
    'path.extname': ['`TypeError` — thrown if `path` is not a string.'],
    'path.isAbsolute': ['`TypeError` — thrown if `path` is not a string.'],
  },
};

export default layout;
