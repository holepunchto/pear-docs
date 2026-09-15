// scripts/refgen/layouts/corestore.ts
//
// Editorial layout for the Corestore reference page. As with the other manifests,
// the member entries (signatures, params, options, returns, source links,
// examples) come from the model; this manifest supplies only grouping + order, the
// intro and quickstart, see-also links, and the descriptions/notes upstream
// doesn't provide in prose (most Corestore getters/properties are AST-only).

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Factory and replication manager for groups of named Hypercores.',
  status: 'stable',

  intro:
    '`Corestore` manages many related [Hypercores](/reference/building-blocks/hypercore) behind one storage root and ' +
    'one replication surface. It is the helper you usually share across [Hyperbee](/reference/building-blocks/hyperbee), ' +
    '[Hyperdrive](/reference/building-blocks/hyperdrive), and [Autobase](/reference/building-blocks/autobase) instances. ' +
    'For upstream source and changelog context, see the [Corestore repository](https://github.com/holepunchto/corestore).',

  quickstart:
    '```js\n' +
    "import Corestore from 'corestore'\n\n" +
    "const store = new Corestore('./app-storage')\n" +
    'await store.ready()\n\n' +
    'const messages = store.get({\n' +
    "  name: 'messages',\n" +
    "  valueEncoding: 'json'\n" +
    '})\n\n' +
    'await messages.ready()\n' +
    "await messages.append({ text: 'hello from corestore' })\n\n" +
    'console.log(await messages.get(0))\n\n' +
    'await store.close()\n' +
    '```',

  groups: [
    { title: "Constructor and lifecycle", members: ["constructor","ready","close","suspend","resume"] },
    { title: "Store properties", members: ["storage","primaryKey","readOnly","manifestVersion","active"] },
    { title: "Loading cores and scoping sessions", members: ["get","session","namespace"] },
    { title: "Replication and discovery", members: ["replicate","findingPeers","list","getAuth"] },
    { title: "Key derivation and maintenance", members: ["createKeyPair","audit","staticify"] },
    { title: "Watchers", members: ["watch","unwatch"] },
    { title: "Group notifications (experimental)", members: ["notifyGroup","update","destroy","on:update","on:group-active"] },
  ],

  // AST-only members upstream doesn't document in prose, so the model has no
  // description — transcribed here from the curated page.
  descriptions: {
    ready: 'A promise that resolves once the storage seed is loaded and properties such as `store.primaryKey` are available.',
    storage: 'The backing storage adapter used for aliases, seeds, and Hypercore data files.',
    primaryKey: 'The 32-byte primary key used to deterministically derive writable named cores and namespaced key pairs.',
    readOnly: '`true` when the store was opened without write access.',
    manifestVersion: 'The Hypercore manifest version used when Corestore creates new writable cores.',
    active: '`true` when the store should automatically attach loaded cores to active replication streams.',
    findingPeers:
      'A completion callback. Call it after the current peer-discovery pass finishes so pending update waits on loaded cores can unblock.',
    getAuth: 'The storage-layer auth metadata for that core, including manifest details when available.',
    audit: 'An audit report describing the state of the backing store and any detected inconsistencies.',
    staticify:
      'A reopened Hypercore whose manifest is converted into a static prologue-based manifest for the current data snapshot.',
  },

  // Errors thrown by public methods, transcribed from the upstream source guards.
  members: {
    constructor: { throws: ["`ASSERTION` if `primaryKey` is set on a root store without `unsafe: true`."] },
    staticify: { throws: ["if the core has no data to staticify."] },
  },

  notes: {
    // The group-level experimental warning has no group-intro slot in the layout
    // type, so it rides along as a note on the first member of the group.
    notifyGroup:
      '<Callout type="warn">\n' +
      'Group notifications are experimental. The API is subject to change and may break in any release.\n' +
      '</Callout>',
  },

  seeAlso: [
    '[Work with many Hypercores using Corestore](/how-to/store-and-replicate/work-with-many-hypercores-using-corestore)—the task-oriented guide that shows how to share one store across your app.',
    '[Hypercore](/reference/building-blocks/hypercore)—the append-only log type Corestore opens and co-replicates.',
    '[Hyperbee](/reference/building-blocks/hyperbee)—commonly layered on top of named Hypercores from one store.',
    '[Hyperdrive](/reference/building-blocks/hyperdrive)—usually keeps filesystem metadata and content stores inside one shared Corestore.',
    '[Autobase](/reference/building-blocks/autobase)—multi-writer views often coordinate their input cores through one Corestore.',
    '[Hyperswarm](/reference/building-blocks/hyperswarm)—pass swarm connections to `store.replicate()` to co-replicate all managed cores over one stream.',
    '[Upstream Corestore repository](https://github.com/holepunchto/corestore)—source, releases, and implementation details.',
  ],
};

export default layout;
