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
        type: 'page',
        name: 'Start from the hello-pear-electron template',
        url: '/getting-started/start-from-hello-pear-electron',
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
        name: 'Release & distribute your app',
        children: [
          {
            type: 'folder',
            name: 'CI/CD with GitHub Actions',
            children: [
              {
                type: 'page',
                name: 'Build and sign desktop apps',
                url: '/how-to/operate-an-app/github-actions/build-and-sign-in-ci',
              },
              {
                type: 'page',
                name: 'Publish your app',
                url: '/how-to/operate-an-app/github-actions/publish-with-github-actions',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Build & package',
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
            ],
          },
          {
            type: 'folder',
            name: 'Manual deployment',
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
            name: 'Migrate from pear run to pear-runtime',
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
        type: 'page',
        name: 'Command Line Interface (CLI)',
        url: '/reference/cli',
      },
      { type: 'page', name: 'Runtime', url: '/reference/runtime' },
      { type: 'page', name: 'Configuration', url: '/reference/configuration' },
      {
        type: 'page',
        name: 'Desktop release npm scripts',
        url: '/reference/desktop-release-npm-scripts',
      },
      {
        type: 'page',
        name: 'pear-ci GitHub Action',
        url: '/reference/pear-ci-action',
      },
      {
        type: 'page',
        name: 'Holepunch GitHub Actions',
        url: '/reference/github-actions',
      },
      {
        type: 'page',
        name: 'Application Programming Interface (API)',
        url: '/reference/api',
      },
      { type: 'page', name: 'Modules', url: '/reference/modules' },
      { type: 'page', name: 'Bare modules', url: '/reference/bare-modules' },
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
];
