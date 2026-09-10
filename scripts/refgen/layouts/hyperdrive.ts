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

  // Descriptions for members whose model entry is an extraction artifact (a lead-in
  // fragment like "`options` include:" or "Usage example:"), authored from the
  // upstream README so both the docs and the emitted JSDoc read as real summaries.
  // Errors thrown by public methods are transcribed from the upstream source guards.
  members: {
    truncate: { throws: ['`BAD_ARGUMENT` if the truncation length is invalid.'] },
    get: {
      description:
        'Reads the blob stored at `path` and resolves with its contents as a `Buffer`. ' +
        'Resolves with `null` when no blob exists at `path`, and also returns `null` for symbolic links.',
      throws: ['`BLOCK_NOT_AVAILABLE` if a required block is not available.'],
    },
    purge: { throws: ['if called on a non-main session — only the main session can be purged.'] },
    entry: {
      description: 'Resolves with the entry stored at `path`, or `null` if no entry exists.',
      throws: ['if a symlink chain is recursive or exceeds 16 hops when `follow` is enabled.'],
    },
    replicate: {
      description:
        'Creates a replication stream for the drive. Pass `true`/`false` to create a new stream as ' +
        'initiator/responder, or pass an existing stream or socket to replicate over it. See ' +
        '[`corestore.replicate`](https://github.com/holepunchto/corestore#const-stream--storereplicateoptsorstream) ' +
        'for how replication works.',
    },
    watch: {
      description:
        'Returns an async iterator that watches `folder` (defaults to `/`) and yields `[current, previous]` ' +
        'snapshot pairs whenever the drive changes. The snapshots are auto-closed before the next value, so ' +
        'do not close them yourself.',
    },
    list: {
      description: 'Returns a stream of all entries in the drive at paths prefixed with `folder`.',
    },
    readdir: {
      description: 'Returns a stream of the immediate subpaths of entries stored at paths prefixed by `folder`.',
    },
    createReadStream: {
      description: 'Returns a readable stream of the blob stored in the drive at `path`.',
    },
    entries: {
      description: 'Returns a read stream of the drive entries within the given Hyperbee `range`.',
    },
  },

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
