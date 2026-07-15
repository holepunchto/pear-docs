// scripts/bare-refgen/layouts/bare-pack.ts
// Editorial layout for bare-pack: parameter/return prose grounded in the README
// and index.d.ts. `pack` traverses a module graph via caller-supplied read and
// list callbacks and resolves to a `bare-bundle` bundle; `writeFile` offloads
// addons/assets to disk instead of embedding them (README "Offloading"). The
// `pack` member description lives in bare-pack.describe.json.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    pack: {
      entry: 'The root of the module graph to bundle; must be a WHATWG `URL` instance (typically a `file:` URL).',
      opts: 'Packing options, extending [`TraverseOptions`](/reference/bare/modules/bare-module-traverse) from `bare-module-traverse`. Adds `concurrency`, `base` (the URL that offloaded file paths are made relative to), and `offload` (whether to write addons and/or assets to disk instead of embedding them).',
      readModule:
        'Called with a `URL` for every module in the graph; returns the module source as a `Buffer` or string, or `null` if it does not exist.',
      listPrefix:
        'Called with a `URL` for every prefix to list; yields the `URL`s that have it as a prefix. Pass `null` (or omit) to skip prefix bundling.',
      writeFile:
        'Called for each addon or asset to offload rather than embed, receiving the file `URL` and its source. See the [Offloading section of the README](https://github.com/holepunchto/bare-pack#offloading).',
    },
  },
  returns: {
    pack: 'a promise that resolves to the packed [`bare-bundle`](https://github.com/holepunchto/bare-bundle) `Bundle`, with all statically resolvable imports preresolved.',
  },
};

export default layout;
