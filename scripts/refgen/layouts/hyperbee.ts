// scripts/refgen/layouts/hyperbee.ts
//
// Editorial layout for the Hyperbee reference page. As with the other manifests,
// the member entries (signatures, params, options, returns, source links,
// examples) come from the model; this manifest supplies only grouping + order,
// the intro and quickstart, see-also links, and the per-member notes upstream
// doesn't provide in prose.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Append-only B-tree on Hypercore for sorted key/value data.',
  status: 'stable',

  intro:
    '`Hyperbee` stores sorted key/value entries in an append-only B-tree backed by ' +
    '[`Hypercore`](/reference/building-blocks/hypercore). Use it when you need ordered lookups, ' +
    'range scans, atomic batches, namespaces, and point-in-time snapshots over one replicated log.',

  quickstart:
    '```js\n' +
    "import Hypercore from 'hypercore'\n" +
    "import Hyperbee from 'hyperbee'\n\n" +
    "const core = new Hypercore('./bee-storage')\n" +
    'const db = new Hyperbee(core, {\n' +
    "  keyEncoding: 'utf-8',\n" +
    "  valueEncoding: 'json'\n" +
    '})\n\n' +
    'await db.ready()\n' +
    "await db.put('config', { theme: 'dark', retries: 3 })\n\n" +
    "const entry = await db.get('config')\n" +
    'console.log(entry.value.theme)\n\n' +
    'await db.close()\n' +
    '```',

  groups: [
    { title: 'Constructor and readiness', members: ['constructor', 'ready'] },
    { title: 'Properties and identity', members: ['core', 'version', 'id', 'key', 'discoveryKey', 'writable', 'readable'] },
    {
      title: 'Writes and batches',
      // Sub-object batch.* members use qualified `Batch.*` keys: their names
      // collide with the main db.* API, so a bare key would resolve to Hyperbee.
      members: ['put', 'del', 'batch', 'Batch.put', 'Batch.get', 'Batch.del', 'Batch.flush', 'Batch.close'],
    },
    { title: 'Reads and iteration', members: ['get', 'getBySeq', 'createReadStream', 'peek'] },
    {
      title: 'History and change tracking',
      members: ['createHistoryStream', 'createDiffStream', 'getAndWatch', 'EntryWatcher.close', 'watch', 'Watcher.ready', 'Watcher.close'],
    },
    { title: 'Snapshots and sub-bees', members: ['checkout', 'snapshot', 'sub', 'getHeader'] },
    { title: 'Replication and lifecycle', members: ['replicate', 'close'] },
    { title: 'Static helpers', members: ['static:isHyperbee'] },
  ],

  // Editorial overrides for sub-object members. batch.* carry upstream
  // descriptions (from the README), so we only add return/example; the
  // watcher.* / entryWatcher.* members are AST-only, so they need full prose.
  members: {
    // Errors thrown by public methods, transcribed from the upstream source guards.
    watch: { throws: ['if called on a non-main Hyperbee (a sub, checkout, or snapshot).'] },
    getAndWatch: { throws: ['if called on a non-main Hyperbee, or if the Hyperbee is closed.'] },
    getHeader: { throws: ['`DECODING_ERROR` if the stored header cannot be decoded.'] },
    'Batch.put': { returns: 'Resolves after queuing the write inside the batch.', example: "await batch.put('settings', { retries: 3 })" },
    'Batch.get': { returns: 'The pending or committed entry visible within the batch, or `null` when missing.', example: "const entry = await batch.get('settings')" },
    'Batch.del': { returns: 'Resolves after queuing the delete inside the batch.', example: "await batch.del('settings')" },
    'Batch.flush': { returns: 'Resolves after committing the queued operations and releasing the batch lock.', example: 'await batch.flush()' },
    'Batch.close': { returns: 'Resolves after discarding the batch and releasing any lock it holds.', example: 'await batch.close()' },
    'Watcher.ready': {
      description: 'Wait for a range watcher to be tracking changes.',
      returns: 'Resolves when a range watcher has loaded and is actively tracking changes.',
      example: 'await watcher.ready()',
    },
    'Watcher.close': {
      description: 'Stop a range watcher.',
      returns: 'Resolves after stopping the range watcher. Breaking out of the async iterator also stops it.',
      example: 'await watcher.close()',
    },
    'EntryWatcher.close': {
      description: 'Stop a single-key watcher.',
      returns: 'Resolves after stopping the watcher created by `db.getAndWatch(...)`.',
      example: 'await entryWatcher.close()',
    },
  },

  notes: {
    constructor:
      'Read and diff streams sort keys by their encoded byte values, so choose `keyEncoding` deliberately if lexicographic order matters.',
    'Batch.close': 'Call `batch.close()` when you want to abort a batch without writing it.',
    put:
      'The `cas` comparator receives the current node as `prev` and the potential new node as `next`. It runs only when the key already exists.',
    del:
      'The delete comparator runs only when the key exists. Deleting a missing key succeeds without calling `cas`.',
    batch:
      'Use batches when you need grouped writes or lower overhead for many updates.',
    createDiffStream:
      'Causally equal entries are omitted from the diff, so the stream only yields actual changes between versions.',
    getAndWatch:
      "Listen to `entryWatcher.on('update')` when you need push-style notifications for a single key.",
    watch:
      'Watchers are not supported on subs or checkouts. Use `range` to narrow the scope on the root bee instead.',
    sub:
      'Sub-bees are useful when one Hyperbee needs multiple logical keyspaces without creating extra cores.',
    replicate:
      'In larger apps, replication is often handled through a shared [`Corestore`](/reference/helpers/corestore) rather than per-bee streams.',
  },

  seeAlso: [
    '[Share append-only databases with Hyperbee](/how-to/store-and-replicate/share-append-only-databases-with-hyperbee)—replication walkthrough with reader and writer peers.',
    '[Work with many Hypercores using Corestore](/how-to/store-and-replicate/work-with-many-hypercores-using-corestore)—recommended multi-core replication pattern.',
    '[Corestore](/reference/helpers/corestore)—manage many Hypercores and Hyperbees from one store.',
    '[Hypercore](/reference/building-blocks/hypercore)—append-only log that stores Hyperbee nodes.',
    '[Hyperdrive](/reference/building-blocks/hyperdrive)—filesystem abstraction that builds on Hyperbee-style metadata indexing.',
  ],
};

export default layout;
