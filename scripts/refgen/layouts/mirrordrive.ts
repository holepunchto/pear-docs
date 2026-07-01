// scripts/refgen/layouts/mirrordrive.ts
//
// Editorial layout for the Mirrordrive reference page. As with the other manifests,
// the member entries (signatures, params, returns, source links, examples) come
// from the model; this manifest supplies only grouping + order, the intro and
// quickstart, the conceptual "Option patterns" prose, see-also links, and the
// handful of descriptions upstream doesn't provide in prose.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Diff and sync engine for copying between drive-like APIs.',
  status: 'stable',

  intro:
    '`Mirrordrive` computes diffs between two drive-like APIs and applies them efficiently. ' +
    'It is the helper that powers sync flows between [Hyperdrive](/reference/building-blocks/hyperdrive) ' +
    'and [Localdrive](/reference/helpers/localdrive), including the `drive.mirror(...)` shortcut on Hyperdrive. ' +
    'A `MirrorDrive` instance is itself an async iterator, so iterating it with `for await (const diff of mirror)` ' +
    'drives the diff/copy pass and yields one diff object per entry. ' +
    'For source and release notes, see the [mirror-drive repository](https://github.com/holepunchto/mirror-drive).',

  quickstart:
    '```js\n' +
    "import Corestore from 'corestore'\n" +
    "import Hyperdrive from 'hyperdrive'\n" +
    "import Localdrive from 'localdrive'\n" +
    "import MirrorDrive from 'mirror-drive'\n\n" +
    "const store = new Corestore('./storage')\n" +
    "const src = new Localdrive('./site')\n" +
    'const dst = new Hyperdrive(store)\n\n' +
    'await dst.ready()\n\n' +
    'const mirror = new MirrorDrive(src, dst, { prune: true })\n\n' +
    'for await (const diff of mirror) {\n' +
    '  console.log(diff)\n' +
    '}\n' +
    '```',

  groups: [
    { title: 'Constructor and lifecycle', members: ['constructor', 'done'] },
    {
      title: 'Mirror state',
      members: [
        'count', 'bytesAdded', 'bytesRemoved', 'finished', 'preloaded', 'peers',
        'downloadProgress', 'downloadedBlocks', 'downloadedBytes', 'uploadedBlocks', 'uploadedBytes',
      ],
    },
    {
      title: 'Monitoring progress',
      members: ['monitor', 'stats', 'Monitor.preloaded', 'destroyed', 'destroy', 'on:update', 'on:preloaded', 'on:destroy'],
    },
  ],

  // Conceptual section documenting constructor option shapes that are not standalone
  // API members. Transcribed verbatim from the curated page.
  sections: [
    {
      title: 'Async iteration',
      body:
        '#### `for await (const diff of mirror)`\n\n' +
        '`MirrorDrive` is itself an async iterable. Iterating it with `for await` drives the entire diff/copy pass; ' +
        "each yield produces one `{ op, key }` object where `op` is `'put'` or `'del'`.\n\n" +
        '```js\n' +
        'for await (const diff of mirror) {\n' +
        '  console.log(diff.op, diff.key)\n' +
        '}\n' +
        '```',
    },
    {
      title: 'Option patterns',
      body:
        '#### `transformers`\n\n' +
        '[API definition on GitHub](https://github.com/holepunchto/mirror-drive/blob/v1.14.2/index.js#L88)\n' +
        '- Returns: A copy pipeline hook. Each transformer is a function `(key) => stream | null`; returning `null` skips that transform for the current file.\n' +
        '- Example:\n\n' +
        '```js\n' +
        'const mirror = new MirrorDrive(src, dst, {\n' +
        '  transformers: [\n' +
        "    (key) => key.endsWith('.txt') ? myTransformStream() : null\n" +
        '  ]\n' +
        '})\n' +
        '```\n\n' +
        '#### `entries`\n\n' +
        '[API definition on GitHub](https://github.com/holepunchto/mirror-drive/blob/v1.14.2/index.js#L87)\n' +
        '- Returns: A fixed list of entries to mirror instead of reading them from `src.list(...)`. When this option is used, `prefix` is ignored.\n' +
        '- Example:\n\n' +
        '```js\n' +
        "const entries = [{ key: '/index.html' }, { key: '/styles.css' }]\n" +
        'const mirror = new MirrorDrive(src, dst, { entries })\n' +
        '```\n\n' +
        '#### `metadataEquals`\n\n' +
        '[API definition on GitHub](https://github.com/holepunchto/mirror-drive/blob/v1.14.2/index.js#L85)\n' +
        '- Returns: A predicate used to decide whether metadata changes should count as a diff when both drives support metadata.\n' +
        '- Example:\n\n' +
        '```js\n' +
        'const mirror = new MirrorDrive(src, dst, {\n' +
        '  metadataEquals(left, right) {\n' +
        '    return JSON.stringify(left) === JSON.stringify(right)\n' +
        '  }\n' +
        '})\n' +
        '```',
    },
  ],

  // AST-only members upstream doesn't document in prose, so the model has no
  // description — supply them here, transcribed from the curated page.
  descriptions: {
    bytesAdded: 'The total number of bytes copied into the destination so far.',
    bytesRemoved: 'The total number of bytes removed from the destination so far.',
    finished: '`true` once the mirror pass has completed.',
    preloaded:
      '`true` once any configured preload phase has finished fetching the blob ranges or block maps it needs.',
    peers: "The source drive's current peer list when `src.core` exists, otherwise an empty array.",
    downloadProgress: 'A `0..1` estimate of preload/download progress when progress tracking is enabled.',
    downloadedBlocks: 'The number of blob blocks downloaded from the source during the current run.',
    downloadedBytes: 'The number of blob bytes downloaded from the source during the current run.',
    uploadedBlocks: 'The number of destination blob blocks uploaded or written during the current run.',
    uploadedBytes: 'The number of destination blob bytes uploaded or written during the current run.',
    monitor: 'A monitor object that emits progress updates and exposes the latest `stats` snapshot.',
    stats:
      'The most recent immutable stats snapshot, shaped like:\n' +
      '  `{\n' +
      '    peers,\n' +
      '    download: { bytes, blocks, speed, progress },\n' +
      '    upload: { bytes, blocks, speed }\n' +
      '  }`',
    destroyed: '`true` after the monitor has been torn down.',
    destroy: 'Stops update polling and detaches the monitor from the mirror.',
    'on:update': 'Emitted every `interval` milliseconds with the latest `monitor.stats` snapshot.',
    'on:preloaded': 'Emitted once preload has completed.',
    'on:destroy':
      'Emitted when `monitor.destroy()` runs or when the parent mirror finishes and cleans up remaining monitors.',
  },

  seeAlso: [
    '[Create a full peer-to-peer filesystem with Hyperdrive](/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive)—end-to-end workflow that mirrors between Localdrive and Hyperdrive.',
    '[Hyperdrive](/reference/building-blocks/hyperdrive)—exposes `drive.mirror(...)` and is the canonical distributed destination/source for Mirrordrive.',
    '[Localdrive](/reference/helpers/localdrive)—the local filesystem companion API most often paired with Mirrordrive.',
    '[Drives](/reference/tools/drives)—CLI tool whose `drives mirror` command is powered by the same sync logic.',
    '[Upstream mirror-drive repository](https://github.com/holepunchto/mirror-drive)—source, releases, and implementation details.',
  ],
};

export default layout;
