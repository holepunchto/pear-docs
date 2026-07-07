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
};

export default layout;
