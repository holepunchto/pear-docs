// scripts/refgen/layouts/autobase.ts
//
// Editorial layout for the Autobase reference page. The factual member entries
// (signatures, params, options, source links, examples) come from the model;
// this manifest supplies only what upstream can't: grouping + order, conceptual
// prose, the quickstart, per-member notes, and the one model description gap.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Multi-writer linearization layer for building deterministic views from many Hypercores.',
  status: 'stable',

  intro:
    'Autobase is a higher-level composition over underlying [Hypercores](/reference/building-blocks/hypercore). ' +
    'Writers append causal nodes to local cores, Autobase linearizes that graph into an eventually consistent order, ' +
    'and your `apply` handler materializes a deterministic view, often into a [Hyperbee](/reference/building-blocks/hyperbee).',

  sections: [
    {
      title: 'The apply handler',
      body:
        'Treat `apply` like a **pure reducer**: given an ordered batch of nodes and a view handle, derive the next view ' +
        'state deterministically. Mutate only the `view` passed into `apply`. Do not:\n' +
        '* read or write external globals,\n' +
        '* open network connections, or\n' +
        '* assume ordering that Autobase has not yet committed.\n' +
        '**Side effects belong outside the linearization path.**\n\n' +
        'Autobase can reorder previously seen nodes when new causal information arrives. If `apply` is non-deterministic, ' +
        'different peers will diverge. Writer management (`host.addWriter`, indexer flags) and migration between `apply` ' +
        'versions are advanced topics—keep them inside `apply` only when they operate on the provided `view` and `host` handles.',
    },
  ],

  quickstart:
    'This minimal flow opens a view, appends one record, updates the linearizer, and reads the materialized value back from `base.view`.\n\n' +
    '```js\n' +
    "import Corestore from 'corestore'\n" +
    "import Autobase from 'autobase'\n\n" +
    "const store = new Corestore('./autobase-demo')\n" +
    'const base = new Autobase(store, null, {\n' +
    "  open: (viewStore) => viewStore.get({ name: 'messages', valueEncoding: 'json' }),\n" +
    '  apply: async (nodes, view) => {\n' +
    '    for (const { value } of nodes) await view.append(value)\n' +
    '  }\n' +
    '})\n\n' +
    'await base.ready()\n' +
    "await base.append({ type: 'message', text: 'hello from Autobase' })\n" +
    'await base.update()\n\n' +
    'console.log(await base.view.get(0))\n' +
    "// { type: 'message', text: 'hello from Autobase' }\n" +
    '```\n\n' +
    'Autobase can reorder previously seen nodes as new causal information arrives. Keep `open` and `apply` deterministic, ' +
    'derive state from the provided `store`, and mutate only the provided `view` inside `apply`.',

  groups: [
    { title: 'Constructor and lifecycle', members: ['constructor', 'ready'] },
    {
      title: 'State and derived view',
      members: ['view', 'key', 'discoveryKey', 'isIndexer', 'writable', 'length', 'signedLength', 'paused'],
    },
    {
      title: 'Writes and linearization',
      members: ['append', 'update', 'ack', 'heads', 'pause', 'resume', 'setBigBatches'],
    },
    { title: 'Replication and metadata', members: ['hash', 'replicate', 'setUserData', 'getUserData'] },
    { title: 'Static helpers', members: ['static:getLocalCore', 'static:getUserData', 'static:isAutobase'] },
    { title: 'View store helper', members: ['get'] },
    { title: 'Apply host calls', members: ['addWriter', 'removeWriter', 'ackWriter', 'interrupt', 'removeable'] },
    {
      title: 'Events',
      members: [
        'on:update',
        'on:interrupt',
        'on:fast-forward',
        'on:is-indexer',
        'on:is-non-indexer',
        'on:writable',
        'on:unwritable',
        'on:warning',
        'on:error',
      ],
    },
  ],

  // AST-only members upstream doesn't document in prose, so the model has no
  // description — supply them here.
  descriptions: {
    ready: 'Resolves once the base and its view are open and ready to use.',
    paused: 'Whether the base is currently paused.',
  },

  notes: {
    constructor:
      'When `optimistic` is enabled, validate optimistic blocks inside `apply` before calling `host.ackWriter(key)`. ' +
      'Otherwise any peer that can write to the underlying network path could attempt to inject values.',
    ack:
      'Only indexers can acknowledge. An ack appends a `null` node that references the known heads so peers can ' +
      'converge faster without changing the view.',
    setBigBatches:
      'Big batches let Autobase call `apply` with more nodes at once, trading responsiveness for larger deterministic batches.',
    get:
      'This `store` instance is the `AutoStore` passed into `open`, and it is the intended place to create the cores ' +
      'that make up your deterministic view.',
    removeWriter:
      'This throws when the writer cannot be removed, such as when it would leave the system without a removable indexer set.',
    interrupt:
      'Interrupting closes the Autobase and emits the `interrupt` event so the application can upgrade its `apply` logic or recover intentionally.',
    removeable: 'The last indexer cannot be removed.',
  },

  seeAlso: [
    '[Work with many Hypercores using Corestore](/how-to/store-and-replicate/work-with-many-hypercores-using-corestore)—manage the groups of cores that Autobase coordinates.',
    '[Corestore](/reference/helpers/corestore)—storage and replication manager typically used for Autobase system, writer, and view cores.',
    '[Hypercore](/reference/building-blocks/hypercore)—append-only log primitive that Autobase writers build on.',
    '[Hyperbee](/reference/building-blocks/hyperbee)—common materialized-view target for deterministic indexed state.',
  ],
};

export default layout;
