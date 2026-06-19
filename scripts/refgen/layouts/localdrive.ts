// scripts/refgen/layouts/localdrive.ts
//
// Editorial layout for the Localdrive reference page. As with the other manifests,
// the member entries (signatures, params, returns, source links, examples) come
// from the model; this manifest supplies only grouping + order, the intro and
// quickstart, and the see-also links.

import type { Layout } from '../layout';

const layout: Layout = {
  description: 'Local filesystem adapter with a Hyperdrive-like API.',
  status: 'stable',

  intro:
    '`Localdrive` exposes a local directory through an API that closely matches ' +
    '[Hyperdrive](/reference/building-blocks/hyperdrive). It is the simplest way to mirror between ' +
    'on-disk files and distributed drives with [Mirrordrive](/reference/helpers/mirrordrive). ' +
    'For upstream implementation details, see the ' +
    '[Localdrive repository](https://github.com/holepunchto/localdrive).',

  quickstart:
    '```js\n' +
    "import Localdrive from 'localdrive'\n\n" +
    "const drive = new Localdrive('./site')\n\n" +
    "await drive.put('/index.html', Buffer.from('<h1>Hello</h1>'))\n" +
    "const html = await drive.get('/index.html')\n\n" +
    'console.log(html?.toString())\n' +
    "console.log(await drive.entry('/index.html'))\n" +
    '```',

  // AST-only members upstream doesn't document in prose, so the model has no
  // description — supply them here, transcribed from the curated page.
  descriptions: {
    ready:
      'Resolves immediately. It exists for compatibility with drive-like APIs such as Hyperdrive.',
    close:
      'Resolves immediately. Localdrive does not keep a background storage process open.',
    flush:
      'Resolves immediately. It exists so code written for batched drive APIs can treat Localdrive as a drop-in target.',
    batch:
      'Returns the same `Localdrive` instance. This lets batch-oriented code reuse a Localdrive target without branching.',
    checkout:
      'Returns the same `Localdrive` instance. Unlike Hyperdrive, Localdrive does not expose historical versions.',
    toPath:
      "Resolves a drive path such as `'/images/logo.png'` to its local filesystem path under `drive.root`.",
    exists:
      'Resolves to `true` when `drive.entry(key)` resolves to a non-null entry, otherwise `false`.',
  },

  groups: [
    { title: 'Constructor and lifecycle', members: ['constructor', 'ready', 'close', 'flush'] },
    { title: 'Drive properties', members: ['root', 'supportsMetadata'] },
    { title: 'Compatibility helpers', members: ['batch', 'checkout', 'toPath'] },
    {
      title: 'Reading and writing entries',
      members: ['entry', 'get', 'put', 'del', 'symlink', 'exists', 'compare'],
    },
    { title: 'Listing and mirroring', members: ['list', 'readdir', 'mirror'] },
    { title: 'Stream APIs', members: ['createReadStream', 'createWriteStream'] },
  ],

  seeAlso: [
    '[Create a full peer-to-peer filesystem with Hyperdrive](/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive)—shows Localdrive mirroring in a full writer/reader flow.',
    '[Hyperdrive](/reference/building-blocks/hyperdrive)—the distributed filesystem API Localdrive is designed to interoperate with.',
    '[Mirrordrive](/reference/helpers/mirrordrive)—the sync engine that copies between Localdrive and Hyperdrive.',
    '[Drives](/reference/tools/drives)—CLI tool that mirrors between local directories and Hyperdrives using the same drive-like interface.',
    '[Upstream Localdrive repository](https://github.com/holepunchto/localdrive)—source, releases, and implementation details.',
  ],
};

export default layout;
