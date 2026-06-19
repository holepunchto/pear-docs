// scripts/refgen/layouts/hyperdrive.ts
//
// Editorial layout for the Hyperdrive reference page. The factual member entries
// (signatures, params, options, returns, source links, examples) come from the
// model; this manifest supplies only grouping + order, the intro and quickstart,
// and the see-also links.

import type { Layout } from '../layout';

const layout: Layout = {
  description:
    'Secure real-time distributed filesystem built on Hypercore-based storage.',
  status: 'stable',

  intro:
    '`Hyperdrive` stores filesystem metadata in a [Hyperbee](/reference/building-blocks/hyperbee) and file contents in a blob store, ' +
    'typically backed by one [Corestore](/reference/helpers/corestore). Use this page for the instance surface; use the linked how-to ' +
    'guides for end-to-end replication flows.\n\n' +
    '<Callout type="info">\n' +
    'For when to choose Hyperdrive over Hyperblobs or raw Hypercore, see [From append-only logs to files](/explanation/from-logs-to-files).\n' +
    '</Callout>',

  quickstart:
    '```js\n' +
    "import Corestore from 'corestore'\n" +
    "import Hyperdrive from 'hyperdrive'\n\n" +
    "const store = new Corestore('./storage')\n" +
    'const drive = new Hyperdrive(store)\n\n' +
    'await drive.ready()\n\n' +
    "await drive.put('/hello.txt', Buffer.from('hello world'), {\n" +
    "  metadata: { type: 'text/plain' }\n" +
    '})\n\n' +
    "const buffer = await drive.get('/hello.txt')\n" +
    "const entry = await drive.entry('/hello.txt')\n\n" +
    'console.log(buffer.toString())\n' +
    'console.log(entry?.value.metadata)\n\n' +
    'await drive.close()\n' +
    '```',

  groups: [
    { title: 'Constructor and lifecycle', members: ['constructor', 'ready', 'close', 'purge'] },
    {
      title: 'Drive properties',
      members: [
        'corestore', 'db', 'core', 'id', 'key', 'discoveryKey', 'contentKey',
        'writable', 'readable', 'version', 'supportsMetadata',
      ],
    },
    {
      title: 'Files',
      members: [
        'put', 'get', 'entry', 'exists', 'has', 'del', 'clear', 'clearAll',
        'symlink', 'createReadStream', 'createWriteStream',
      ],
    },
    { title: 'Directories and listings', members: ['list', 'readdir', 'entries', 'compare', 'watch'] },
    { title: 'Versions and batched mutations', members: ['batch', 'flush', 'checkout', 'diff', 'truncate'] },
    {
      title: 'Replication, downloads, and blob access',
      members: [
        'mirror', 'download', 'downloadDiff', 'downloadRange', 'findingPeers',
        'replicate', 'update', 'getBlobs', 'getBlobsLength',
      ],
    },
  ],

  seeAlso: [
    '[Create a full peer-to-peer filesystem with Hyperdrive](/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive)—end-to-end filesystem replication walkthrough.',
    '[Work with many Hypercores using Corestore](/how-to/store-and-replicate/work-with-many-hypercores-using-corestore)—recommended pattern when one app manages multiple drives or related cores.',
    '[Localdrive](/reference/helpers/localdrive)—map a Hyperdrive-like API onto the local filesystem.',
    '[Mirrordrive](/reference/helpers/mirrordrive)—sync between Hyperdrive and other drive-like destinations.',
    '[Corestore](/reference/helpers/corestore)—shared storage and replication manager for drive metadata and content.',
    '[Hyperbee](/reference/building-blocks/hyperbee)—Hyperdrive uses a Hyperbee internally for metadata indexing.',
    '[Drives](/reference/tools/drives)—CLI tool for creating, mirroring, and seeding Hyperdrives.',
  ],
};

export default layout;
