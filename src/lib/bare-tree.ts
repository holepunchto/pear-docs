import type { Node } from 'fumadocs-core/page-tree';

/**
 * Bare's sidebar tree. Rendered by <DocsLayout> when the current page's
 * `product` frontmatter is 'bare' — see
 * `src/app/(docs)/[[...slug]]/layout.tsx`. Sibling of `pear-tree.ts`; both
 * split off the single `customTree` that used to live in `custom-tree.ts`.
 * See docs/plans/PEAR-BARE-SPLIT-PITCH.md for the split this backs.
 *
 * No file moves: every URL below already existed under `customTree` before
 * the split (reference/bare/**, building-blocks/helpers/tools, the pure-logic
 * how-to guides, run-on-native/**). Only which tree surfaces them changed.
 */
export const bareTree: Node[] = [
  { type: 'page', name: 'Bare', url: '/bare' },
  {
    type: 'folder',
    name: 'About Bare',
    index: { type: 'page', name: 'Using Bare on its own', url: '/explanation/use-bare-standalone' },
    children: [
      {
        type: 'page',
        name: 'Inside Bare',
        url: '/explanation/bare-runtime',
      },
      {
        type: 'folder',
        name: 'Start from a template',
        index: {
          type: 'page',
          name: 'Start from a template',
          url: '/getting-started/from-a-template',
        },
        children: [
          {
            type: 'page',
            name: 'Start from the hello-pear-electron template',
            url: '/getting-started/from-a-template/start-from-hello-pear-electron',
          },
          {
            type: 'page',
            name: 'Start from the hello-pear-bare template',
            url: '/getting-started/from-a-template/start-from-hello-pear-bare',
          },
        ],
      },
    ],
  },
  {
    type: 'folder',
    name: 'About Pear',
    index: { type: 'page', name: 'About Pear', url: '/explanation' },
    children: [
      {
        type: 'folder',
        name: 'Platform foundations',
        children: [
          {
            type: 'page',
            name: 'How Pear and Bare fit together',
            url: '/explanation/pear-and-bare',
          },
          {
            type: 'page',
            name: 'Peer-to-peer, demystified',
            url: '/explanation/peer-to-peer-demystified',
          },
          {
            type: 'page',
            name: 'Runtime and languages',
            url: '/explanation/runtime-and-languages',
          },
          {
            type: 'page',
            name: 'Using Bare on its own',
            url: '/explanation/use-bare-standalone',
          },
          {
            type: 'page',
            name: 'Inside Bare',
            url: '/explanation/bare-runtime',
          },
          {
            type: 'page',
            name: 'One core, many platforms',
            url: '/explanation/bare-on-native',
          },
          {
            type: 'page',
            name: 'Dependencies and network',
            url: '/explanation/dependencies-and-network',
          },
        ],
      },
      {
        type: 'page',
        name: 'From append-only logs to files',
        url: '/explanation/from-logs-to-files',
      },
    ],
  },
  {
    type: 'folder',
    name: 'How To',
    index: { type: 'page', name: 'How To', url: '/how-to' },
    children: [
      {
        type: 'page',
        name: 'Browse commands with the interactive menu',
        url: '/how-to/browse-commands-with-the-interactive-menu',
      },
      {
        type: 'folder',
        name: 'Connect to peers',
        index: { type: 'page', name: 'Connect to peers', url: '/how-to/connect-to-peers' },
        children: [
          {
            type: 'page',
            name: 'Connect two peers by key with HyperDHT',
            url: '/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht',
          },
          {
            type: 'page',
            name: 'Connect to many peers by topic with Hyperswarm',
            url: '/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Store and replicate',
        index: { type: 'page', name: 'Store and replicate', url: '/how-to/store-and-replicate' },
        children: [
          {
            type: 'page',
            name: 'Replicate and persist with Hypercore',
            url: '/how-to/store-and-replicate/replicate-and-persist-with-hypercore',
          },
          {
            type: 'page',
            name: 'Work with many Hypercores using Corestore',
            url: '/how-to/store-and-replicate/work-with-many-hypercores-using-corestore',
          },
          {
            type: 'page',
            name: 'Share append-only databases with Hyperbee',
            url: '/how-to/store-and-replicate/share-append-only-databases-with-hyperbee',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Blind peering',
        index: { type: 'page', name: 'Blind peering', url: '/how-to/blind-peering' },
        children: [
          {
            type: 'page',
            name: 'Keep data available with blind peering',
            url: '/how-to/blind-peering/keep-data-available-with-blind-peering',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Manage identity',
        index: { type: 'page', name: 'Manage identity', url: '/how-to/manage-identity' },
        children: [
          {
            type: 'page',
            name: 'Create a portable identity with Keet identity keys',
            url: '/how-to/manage-identity/create-a-portable-identity-with-keet-identity-key',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Stream and share media',
        index: { type: 'page', name: 'Stream and share media', url: '/how-to/stream-and-share-media' },
        children: [
          {
            type: 'page',
            name: 'Create a full peer-to-peer filesystem with Hyperdrive',
            url: '/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive',
          },
          {
            type: 'page',
            name: 'Store and serve large media with Hyperblobs',
            url: '/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Run on mobile & native',
        index: { type: 'page', name: 'Run on mobile & native', url: '/how-to/run-on-native' },
        children: [
          {
            type: 'page',
            name: 'Embed Bare in a React Native app',
            url: '/how-to/run-on-native/embed-bare-in-react-native',
          },
          {
            type: 'page',
            name: 'Type a native RPC bridge',
            url: '/how-to/run-on-native/type-a-native-rpc-bridge',
          },
          {
            type: 'page',
            name: 'Bundle a Bare app',
            url: '/how-to/run-on-native/bundle-a-bare-app',
          },
          {
            type: 'page',
            name: 'Handle app suspension',
            url: '/how-to/run-on-native/handle-app-suspension',
          },
        ],
      },
      {
        type: 'page',
        name: 'Troubleshoot common issues',
        url: '/how-to/troubleshooting',
      },
    ],
  },
  {
    type: 'folder',
    name: 'Reference',
    index: { type: 'page', name: 'Reference', url: '/reference' },
    children: [
      {
        type: 'folder',
        name: 'Bare',
        children: [
          {
            type: 'page',
            name: 'Bare runtime API',
            url: '/reference/bare/runtime',
          },
          { type: 'page', name: 'Bare CLI', url: '/reference/bare/cli' },
          {
            type: 'page',
            name: 'Bare Kit',
            url: '/reference/bare/bare-kit',
          },
          {
            type: 'folder',
            name: 'Modules',
            children: [
              { type: 'page', name: 'bare-fs', url: '/reference/bare/modules/bare-fs' },
              { type: 'page', name: 'bare-os', url: '/reference/bare/modules/bare-os' },
              { type: 'page', name: 'bare-stream', url: '/reference/bare/modules/bare-stream' },
              { type: 'page', name: 'bare-tcp', url: '/reference/bare/modules/bare-tcp' },
              { type: 'page', name: 'bare-http1', url: '/reference/bare/modules/bare-http1' },
              { type: 'page', name: 'bare-ws', url: '/reference/bare/modules/bare-ws' },
              { type: 'page', name: 'bare-fetch', url: '/reference/bare/modules/bare-fetch' },
              { type: 'page', name: 'bare-crypto', url: '/reference/bare/modules/bare-crypto' },
              { type: 'page', name: 'bare-subprocess', url: '/reference/bare/modules/bare-subprocess' },
              { type: 'page', name: 'bare-rpc', url: '/reference/bare/modules/bare-rpc' },
              { type: 'page', name: 'bare-sqlite', url: '/reference/bare/modules/bare-sqlite' },
              { type: 'page', name: 'bare-broadcast-channel', url: '/reference/bare/modules/bare-broadcast-channel' },
              { type: 'page', name: 'bare-sdl', url: '/reference/bare/modules/bare-sdl' },
              { type: 'page', name: 'bare-module-resolve', url: '/reference/bare/modules/bare-module-resolve' },
              { type: 'page', name: 'bare-module-traverse', url: '/reference/bare/modules/bare-module-traverse' },
              { type: 'page', name: 'bare-addon-resolve', url: '/reference/bare/modules/bare-addon-resolve' },
              { type: 'page', name: 'bare-bluetooth-android', url: '/reference/bare/modules/bare-bluetooth-android' },
              { type: 'page', name: 'bare-bluetooth-apple', url: '/reference/bare/modules/bare-bluetooth-apple' },
              { type: 'page', name: 'bare-module', url: '/reference/bare/modules/bare-module' },
              { type: 'page', name: 'bare-url', url: '/reference/bare/modules/bare-url' },
              { type: 'page', name: 'bare-path', url: '/reference/bare/modules/bare-path' },
              { type: 'page', name: 'bare-atomics', url: '/reference/bare/modules/bare-atomics' },
              { type: 'page', name: 'bare-timers', url: '/reference/bare/modules/bare-timers' },
              { type: 'page', name: 'bare-pipe', url: '/reference/bare/modules/bare-pipe' },
              { type: 'page', name: 'bare-semver', url: '/reference/bare/modules/bare-semver' },
              { type: 'page', name: 'bare-form-data', url: '/reference/bare/modules/bare-form-data' },
              { type: 'page', name: 'bare-channel', url: '/reference/bare/modules/bare-channel' },
              { type: 'page', name: 'bare-tls', url: '/reference/bare/modules/bare-tls' },
              { type: 'page', name: 'bare-console', url: '/reference/bare/modules/bare-console' },
              { type: 'page', name: 'bare-structured-clone', url: '/reference/bare/modules/bare-structured-clone' },
              { type: 'page', name: 'bare-ipc', url: '/reference/bare/modules/bare-ipc' },
              { type: 'page', name: 'bare-inspector', url: '/reference/bare/modules/bare-inspector' },
              { type: 'page', name: 'bare-make', url: '/reference/bare/modules/bare-make' },
              { type: 'page', name: 'bare-prom-client', url: '/reference/bare/modules/bare-prom-client' },
              { type: 'page', name: 'bare-posix', url: '/reference/bare/modules/bare-posix' },
              { type: 'page', name: 'bare-mdns-discovery', url: '/reference/bare/modules/bare-mdns-discovery' },
              { type: 'page', name: 'bare-sidecar', url: '/reference/bare/modules/bare-sidecar' },
              { type: 'page', name: 'bare-union-bundle', url: '/reference/bare/modules/bare-union-bundle' },
              { type: 'page', name: 'bare-mime', url: '/reference/bare/modules/bare-mime' },
              { type: 'page', name: 'bare-apk', url: '/reference/bare/modules/bare-apk' },
              { type: 'page', name: 'bare-abort', url: '/reference/bare/modules/bare-abort' },
              { type: 'page', name: 'bare-assert', url: '/reference/bare/modules/bare-assert' },
              { type: 'page', name: 'bare-buffer', url: '/reference/bare/modules/bare-buffer' },
              { type: 'page', name: 'bare-bundle', url: '/reference/bare/modules/bare-bundle' },
              { type: 'page', name: 'bare-bundle-id', url: '/reference/bare/modules/bare-bundle-id' },
              { type: 'page', name: 'bare-collabora', url: '/reference/bare/modules/bare-collabora' },
              { type: 'page', name: 'bare-dns', url: '/reference/bare/modules/bare-dns' },
              { type: 'page', name: 'bare-encoding', url: '/reference/bare/modules/bare-encoding' },
              { type: 'page', name: 'bare-env', url: '/reference/bare/modules/bare-env' },
              { type: 'page', name: 'bare-events', url: '/reference/bare/modules/bare-events' },
              { type: 'page', name: 'bare-format', url: '/reference/bare/modules/bare-format' },
              { type: 'page', name: 'bare-hrtime', url: '/reference/bare/modules/bare-hrtime' },
              { type: 'page', name: 'bare-https', url: '/reference/bare/modules/bare-https' },
              { type: 'page', name: 'bare-inspect', url: '/reference/bare/modules/bare-inspect' },
              { type: 'page', name: 'bare-logger', url: '/reference/bare/modules/bare-logger' },
              { type: 'page', name: 'bare-net', url: '/reference/bare/modules/bare-net' },
              { type: 'page', name: 'bare-pack', url: '/reference/bare/modules/bare-pack' },
              { type: 'page', name: 'bare-process', url: '/reference/bare/modules/bare-process' },
              { type: 'page', name: 'bare-readline', url: '/reference/bare/modules/bare-readline' },
              { type: 'page', name: 'bare-realm', url: '/reference/bare/modules/bare-realm' },
              { type: 'page', name: 'bare-signals', url: '/reference/bare/modules/bare-signals' },
              { type: 'page', name: 'bare-stdio', url: '/reference/bare/modules/bare-stdio' },
              { type: 'page', name: 'bare-stow', url: '/reference/bare/modules/bare-stow' },
              { type: 'page', name: 'bare-tty', url: '/reference/bare/modules/bare-tty' },
              { type: 'page', name: 'bare-type', url: '/reference/bare/modules/bare-type' },
              { type: 'page', name: 'bare-vm', url: '/reference/bare/modules/bare-vm' },
              { type: 'page', name: 'bare-zlib', url: '/reference/bare/modules/bare-zlib' },
            ],
          },
        ],
      },
      {
        type: 'folder',
        name: 'Building blocks',
        children: [
          {
            type: 'page',
            name: 'Hypercore',
            url: '/reference/building-blocks/hypercore',
          },
          {
            type: 'page',
            name: 'Hyperbee',
            url: '/reference/building-blocks/hyperbee',
          },
          {
            type: 'page',
            name: 'Hyperdrive',
            url: '/reference/building-blocks/hyperdrive',
          },
          {
            type: 'page',
            name: 'Autobase',
            url: '/reference/building-blocks/autobase',
          },
          {
            type: 'page',
            name: 'HyperDHT',
            url: '/reference/building-blocks/hyperdht',
          },
          {
            type: 'page',
            name: 'Hyperswarm',
            url: '/reference/building-blocks/hyperswarm',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Helpers',
        children: [
          {
            type: 'page',
            name: 'Corestore',
            url: '/reference/helpers/corestore',
          },
          {
            type: 'page',
            name: 'Localdrive',
            url: '/reference/helpers/localdrive',
          },
          {
            type: 'page',
            name: 'Mirrordrive',
            url: '/reference/helpers/mirrordrive',
          },
          {
            type: 'page',
            name: 'Secretstream',
            url: '/reference/helpers/secretstream',
          },
          {
            type: 'page',
            name: 'Compact encoding',
            url: '/reference/helpers/compact-encoding',
          },
          {
            type: 'page',
            name: 'Protomux',
            url: '/reference/helpers/protomux',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Tools',
        children: [
          {
            type: 'page',
            name: 'Hypershell',
            url: '/reference/tools/hypershell',
          },
          {
            type: 'page',
            name: 'Hypertele',
            url: '/reference/tools/hypertele',
          },
          {
            type: 'page',
            name: 'Hyperbeam',
            url: '/reference/tools/hyperbeam',
          },
          { type: 'page', name: 'Hyperssh', url: '/reference/tools/hyperssh' },
          { type: 'page', name: 'Drives', url: '/reference/tools/drives' },
        ],
      },
      {
        type: 'folder',
        name: 'Modules',
        children: [
          {
            type: 'page',
            name: 'Bare modules',
            url: '/reference/modules/bare-modules',
          },
        ],
      },
    ],
  },
];
