import type { Node } from 'fumadocs-core/page-tree';

/**
 * Single source of truth for the docs sidebar order, structure, and labels.
 *
 * Wired into <DocsLayout> in `src/app/(docs)/[[...slug]]/layout.tsx` via
 * `tree={{ name: 'docs', children: customTree }}`. This bypasses the
 * `meta.json` page-tree builder Fumadocs would otherwise auto-generate.
 *
 * Conventions:
 *   - Order goes simple → complex (e.g. two peers before many peers; Hypercore
 *     before Hyperdrive). Match the prose ordering each section's index page
 *     uses.
 *   - `name` should track the MDX frontmatter `title`; if you rename a page,
 *     update both.
 *   - URLs are written without trailing slashes; Fumadocs normalises against
 *     the site's `trailingSlash` mode.
 */
export const customTree: Node[] = [
  { type: 'page', name: 'Pear by Holepunch', url: '/' },
  {
    type: 'folder',
    name: 'Getting Started',
    index: {
      type: 'page',
      name: 'Introduction',
      url: '/getting-started',
    },
    children: [
      {
        type: 'folder',
        name: 'Build a peer-to-peer chat',
        children: [
          { type: 'page', name: 'Introduction', url: '/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat' },
          { type: 'page', name: 'Reshape into a production app', url: '/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app' },
          { type: 'page', name: 'Ship your app', url: '/getting-started/build-a-peer-to-peer-chat/ship' },
          { type: 'page', name: 'Deploy over-the-air updates', url: '/getting-started/build-a-peer-to-peer-chat/update' },
        ],
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
            name: 'The Pear stack',
            url: '/explanation/the-pear-stack',
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
        type: 'folder',
        name: 'Storing & replicating data',
        children: [
          {
            type: 'page',
            name: 'From append-only logs to files',
            url: '/explanation/from-logs-to-files',
          },
          {
            type: 'page',
            name: 'Storage and distribution',
            url: '/explanation/storage-and-distribution',
          },
          {
            type: 'page',
            name: 'Availability and blind peering',
            url: '/explanation/availability-and-blind-peering',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Building & shipping apps',
        children: [
          {
            type: 'page',
            name: 'Pear desktop architecture',
            url: '/explanation/pear-desktop-architecture',
          },
          {
            type: 'page',
            name: 'Workers',
            url: '/explanation/workers',
          },
          {
            type: 'page',
            name: 'Release pipeline',
            url: '/explanation/release-pipeline',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Built with Pear',
        children: [
          { type: 'page', name: 'Keet', url: 'https://keet.io', external: true },
          { type: 'page', name: 'PearPass', url: 'https://pass.pears.com', external: true },
        ],
      },
    ],
  },
  {
    type: 'folder',
    name: 'How To',
    index: { type: 'page', name: 'How To', url: '/how-to' },
    children: [
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
          {
            type: 'page',
            name: 'Host multiple rooms in one chat app',
            url: '/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app',
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
          {
            type: 'page',
            name: 'Add blind peering to a chat app',
            url: '/how-to/blind-peering/add-blind-peering-to-a-chat-app',
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
          {
            type: 'page',
            name: 'Add Keet identity to a chat app',
            url: '/how-to/manage-identity/add-keet-identity-to-a-chat-app',
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
          {
            type: 'page',
            name: 'Share files in a peer-to-peer app',
            url: '/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Back up photos in a peer-to-peer app',
            url: '/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream stored video in a peer-to-peer app',
            url: '/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream a live camera in a peer-to-peer app',
            url: '/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app',
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
        type: 'folder',
        name: 'Release & distribute your app',
        index: { type: 'page', name: 'Release & distribute your app', url: '/how-to/operate-an-app' },
        children: [
          {
            type: 'folder',
            name: 'CI/CD with GitHub Actions',
            index: { type: 'page', name: 'CI/CD with GitHub Actions', url: '/how-to/operate-an-app/github-actions' },
            children: [
              {
                type: 'page',
                name: 'Publish with GitHub Actions',
                url: '/how-to/operate-an-app/github-actions/publish-with-github-actions',
              },
              {
                type: 'page',
                name: 'Build and sign desktop apps with GitHub Actions',
                url: '/how-to/operate-an-app/github-actions/build-and-sign-in-ci',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Build & package',
            index: { type: 'page', name: 'Build & package', url: '/how-to/operate-an-app/build-and-package' },
            children: [
              {
                type: 'page',
                name: 'Build desktop distributables',
                url: '/how-to/operate-an-app/build-and-package/build-desktop-distributables',
              },
              {
                type: 'page',
                name: 'Distribute as a binary',
                url: '/how-to/operate-an-app/build-and-package/distribute-as-binary',
              },
              {
                type: 'page',
                name: 'Submit to app stores',
                url: '/how-to/operate-an-app/build-and-package/submit-to-app-stores',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Manual deployment',
            index: { type: 'page', name: 'Manual deployment', url: '/how-to/operate-an-app/manual-deployment' },
            children: [
              {
                type: 'page',
                name: 'Deploy your application',
                url: '/how-to/operate-an-app/manual-deployment/deployment',
              },
              {
                type: 'page',
                name: 'Troubleshoot desktop releases',
                url: '/how-to/operate-an-app/manual-deployment/troubleshoot-desktop-releases',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Multisig',
            index: { type: 'page', name: 'Multisig', url: '/how-to/operate-an-app/multisig' },
            children: [
              {
                type: 'page',
                name: 'Set up multisig',
                url: '/how-to/operate-an-app/multisig/set-up-multisig',
              },
              {
                type: 'page',
                name: 'Sign with multisig',
                url: '/how-to/operate-an-app/multisig/sign-with-multisig',
              },
              {
                type: 'page',
                name: 'Troubleshoot multisig',
                url: '/how-to/operate-an-app/multisig/troubleshoot-multisig',
              },
            ],
          },
          {
            type: 'page',
            name: 'Publish a changelog for your app',
            url: '/how-to/operate-an-app/publish-a-changelog',
          },
          {
            type: 'page',
            name: 'Migrate from pear run to Pear OTA',
            url: '/how-to/operate-an-app/migration',
          },
        ],
      },
      {
        type: 'page',
        name: 'Manage installed applications',
        url: '/how-to/manage-installed-applications',
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
    name: 'References',
    index: { type: 'page', name: 'Reference', url: '/reference' },
    children: [
      {
        type: 'folder',
        name: 'Pear',
        children: [
          {
            type: 'page',
            name: 'Command Line Interface (CLI)',
            url: '/reference/pear/cli',
          },
          { type: 'page', name: 'Pear OTA', url: '/reference/pear/runtime' },
          {
            type: 'page',
            name: 'Configuration',
            url: '/reference/pear/configuration',
          },
          {
            type: 'page',
            name: 'Application Programming Interface (API)',
            url: '/reference/pear/api',
          },
        ],
      },
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
            ],
          },
        ],
      },
      {
        type: 'folder',
        name: 'CI & release',
        children: [
          {
            type: 'page',
            name: 'Desktop release npm scripts',
            url: '/reference/ci-and-release/desktop-release-npm-scripts',
          },
          {
            type: 'page',
            name: 'Holepunch GitHub Actions',
            url: '/reference/ci-and-release/github-actions',
          },
          {
            type: 'page',
            name: 'pear-ci GitHub Action',
            url: '/reference/ci-and-release/pear-ci-action',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Modules',
        children: [
          {
            type: 'page',
            name: 'Pear modules',
            url: '/reference/modules/pear-modules',
          },
          {
            type: 'page',
            name: 'Bare modules',
            url: '/reference/modules/bare-modules',
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
    ],
  },
  { type: 'page', name: 'Release Overview', url: '/release-overview' },
];
