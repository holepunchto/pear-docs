// scripts/refgen/layouts/hypercore.ts
//
// Editorial layout for the Hypercore reference page. As with autobase, the member
// entries (signatures, params, options, returns, source links, examples) come
// from the model; this manifest supplies only grouping + order, the intro and
// quickstart, see-also links, and the handful of descriptions/notes upstream
// doesn't provide in prose.

import type { Layout } from '../layout';

const layout: Layout = {
  description:
    'Secure distributed append-only log for large datasets and realtime streams.',
  status: 'stable',

  intro:
    'Hypercore is a secure, distributed append-only log for sharing large datasets and realtime streams. ' +
    'It supports sparse replication, verified reads, optional block encryption, and session-based workflows ' +
    'for building higher-level local-first and peer-to-peer data structures.\n\n' +
    '<Callout type="info">\n' +
    'For how Hypercore relates to Hyperblobs and Hyperdrive, see [From append-only logs to files](/explanation/from-logs-to-files).\n' +
    '</Callout>',

  quickstart:
    '```js\n' +
    "import Hypercore from 'hypercore'\n\n" +
    "const core = new Hypercore('./my-first-core', { valueEncoding: 'utf-8' })\n" +
    'await core.ready()\n\n' +
    "await core.append('hello')\n" +
    "await core.append('from hypercore')\n\n" +
    "console.log('length:', core.length)\n" +
    "console.log('first block:', await core.get(0))\n" +
    "console.log('second block:', await core.get(1))\n\n" +
    'for await (const block of core.createReadStream()) {\n' +
    "  console.log('streamed:', block)\n" +
    '}\n\n' +
    'await core.close()\n' +
    '```',

  groups: [
    { title: 'Constructors and sessions', members: ['constructor', 'session', 'commit', 'snapshot'] },
    { title: 'Writing and local mutation', members: ['append', 'createWriteStream', 'clear', 'truncate'] },
    {
      title: 'Reading, streams, and proofs',
      members: [
        'get', 'has', 'update', 'seek', 'createReadStream', 'createByteStream',
        'treeHash', 'proof', 'verifyFullyRemote', 'signable', 'download',
      ],
    },
    {
      title: 'Extensions and replication',
      members: ['registerExtension', 'send', 'broadcast', 'destroy', 'replicate', 'findingPeers'],
    },
    {
      title: 'Storage inspection and mark-and-sweep',
      members: ['info', 'startMarking', 'markBlock', 'clearMarkings', 'sweep'],
    },
    {
      title: 'Lifecycle and local configuration',
      members: ['close', 'ready', 'setEncryption', 'setEncryptionKey', 'setKeyPair', 'setActive', 'setGroup', 'setUserData', 'getUserData'],
    },
    {
      title: 'Properties',
      members: [
        'writable', 'readable', 'id', 'key', 'keyPair', 'discoveryKey', 'length',
        'signedLength', 'contiguousLength', 'remoteContiguousLength', 'fork', 'padding', 'peers',
      ],
    },
    {
      title: 'Events',
      members: [
        'on:close', 'on:ready', 'on:append', 'on:truncate', 'on:peer-add',
        'on:peer-remove', 'on:upload', 'on:download', 'on:remote-contiguous-length',
      ],
    },
    {
      title: 'Static helpers',
      members: [
        'static:MAX_SUGGESTED_BLOCK_SIZE', 'static:key', 'static:discoveryKey',
        'static:blockEncryptionKey', 'static:getProtocolMuxer', 'static:createCore',
        'static:createProtocolStream', 'static:defaultStorage',
      ],
    },
  ],

  // Errors thrown by public methods, transcribed from the upstream source guards
  // (hypercore-errors codes). Editorial until `@throws` is authored upstream; the
  // model still supplies each entry's signature, params, returns, and example.
  members: {
    session: { throws: ['`SESSION_CLOSED` if called on a core that is already closing.'] },
    get: {
      throws: [
        '`SESSION_CLOSED` if the core has been closed.',
        '`ASSERTION` if `index` is not a valid block index.',
      ],
    },
    seek: {
      throws: [
        '`SESSION_CLOSED` if the core has been closed.',
        '`ASSERTION` if `bytes` is not a valid byte offset.',
      ],
    },
    has: { throws: ['`ASSERTION` if the `start`/`end` range is invalid.'] },
    append: {
      throws: [
        '`SESSION_CLOSED` if the core has been closed.',
        '`SESSION_NOT_WRITABLE` if the core is not writable.',
        '`INVALID_OPERATION` if the append is inconsistent with the manifest prologue.',
        '`BAD_ARGUMENT` if an appended block exceeds the maximum suggested block size.',
      ],
    },
    truncate: {
      throws: [
        '`SESSION_CLOSED` if the core has been closed.',
        '`SESSION_NOT_WRITABLE` if the core is not writable.',
        '`INVALID_OPERATION` if the truncation would break the manifest prologue.',
      ],
    },
    clear: {
      throws: [
        '`SESSION_CLOSED` if the core has been closed.',
        '`ASSERTION` if the `start`/`end` range is invalid.',
      ],
    },
    commit: {
      throws: ['`INVALID_OPERATION` if no database batch was passed, or the tree changed during the batch.'],
    },
    setEncryption: {
      throws: ['`ASSERTION` if the provider does not satisfy the `HypercoreEncryption` interface.'],
    },
    startMarking: { throws: ['`ASSERTION` if the core is already in gc mode, or is a named or atomic session.'] },
    getUserData: {
      description:
        'Reads the local user-data value stored under `key`, resolving with its `Buffer`/string value or `null` if unset. User data is local-only and not replicated.',
    },
  },

  // Hand-authored conceptual prose upstream doesn't put in member docs; rendered
  // after the named member's entry.
  notes: {
    constructor:
      'User Data is a local-only key/value store with string keys and string or `Buffer` values. It is not replicated and is useful for peer-specific metadata such as encryption keys or app state.\n\n' +
      'The manifest controls how a core is authenticated, including `version`, `hash`, `quorum`, `signers`, `prologue`, `linked`, and manifest-level `userData`. Changing the manifest changes the resulting Hypercore key.',
    registerExtension:
      'This extension API is documented as legacy. For new protocol work, the upstream README recommends creating a `Protomux` protocol instead.',
    sweep:
      'The README describes the full mark-and-sweep flow as `startMarking()`, read or manually mark the blocks you want to keep, then `sweep()` to clear everything else.',
  },

  seeAlso: [
    '[Replicate and persist with Hypercore](/how-to/store-and-replicate/replicate-and-persist-with-hypercore)—pair a single core with peer discovery and replication.',
    '[Work with many Hypercores using Corestore](/how-to/store-and-replicate/work-with-many-hypercores-using-corestore)—recommended pattern when one process manages multiple cores.',
    '[Corestore](/reference/helpers/corestore)—helper reference for creating, naming, and co-replicating groups of Hypercores.',
    '[Hyperbee](/reference/building-blocks/hyperbee)—sorted key/value B-tree built directly on top of a Hypercore.',
    '[Hyperdrive](/reference/building-blocks/hyperdrive)—filesystem abstraction whose metadata and blob stores are Hypercore-backed.',
    '[Compact encoding](/reference/helpers/compact-encoding)—binary encoding toolkit used to structure Hypercore block payloads.',
  ],
};

export default layout;
