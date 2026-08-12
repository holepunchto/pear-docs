import type { Node } from 'fumadocs-core/page-tree';

/**
 * Pear's sidebar tree. Rendered by <DocsLayout> whenever the current URL
 * does NOT start with `/bare` (i.e. `/`, or anything under `/pear`) — see
 * `src/app/(docs)/[[...slug]]/layout.tsx`. Sibling of `bare-tree.ts`; both
 * split off the single `customTree` that used to live in `custom-tree.ts`.
 * See docs/plans/PEAR-BARE-SPLIT-PITCH.md for the split this backs, and its
 * Phase 6 section for the physical content/pear + content/bare reorg that
 * gave every URL below (except the site root, `/`) its real /pear prefix.
 * Pages tagged `product: shared` live here too — no separate shared
 * directory — with an `external: true` cross-link from bare-tree.ts where
 * Bare's own nav needs to reach them.
 *
 * Conventions (same as the pre-split tree):
 *   - Order goes simple → complex.
 *   - `name` should track the MDX frontmatter `title`; if you rename a page,
 *     update both.
 *   - URLs are written without trailing slashes; Fumadocs normalises against
 *     the site's `trailingSlash` mode.
 */
export const pearTree: Node[] = [
  { type: 'page', name: 'Pear', url: '/' },
  {
    type: 'folder',
    name: 'Getting Started',
    index: {
      type: 'page',
      name: 'Introduction',
      url: '/pear/getting-started',
    },
    children: [
      {
        type: 'folder',
        name: 'Build a peer-to-peer chat',
        children: [
          { type: 'page', name: 'Introduction', url: '/pear/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat' },
          { type: 'page', name: 'Reshape into a production app', url: '/pear/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app' },
          { type: 'page', name: 'Ship your app', url: '/pear/getting-started/build-a-peer-to-peer-chat/ship' },
          { type: 'page', name: 'Deploy over-the-air updates', url: '/pear/getting-started/build-a-peer-to-peer-chat/update' },
        ],
      },
      {
        type: 'folder',
        name: 'Start from a template',
        index: {
          type: 'page',
          name: 'Start from a template',
          url: '/pear/getting-started/from-a-template',
        },
        children: [
          {
            type: 'page',
            name: 'Start from the hello-pear-electron template',
            url: '/pear/getting-started/from-a-template/start-from-hello-pear-electron',
          },
          {
            type: 'page',
            name: 'Start from the hello-pear-bare template',
            url: '/pear/getting-started/from-a-template/start-from-hello-pear-bare',
          },
        ],
      },
    ],
  },
  {
    type: 'folder',
    name: 'About Pear',
    index: { type: 'page', name: 'About Pear', url: '/pear/explanation' },
    children: [
      {
        type: 'folder',
        name: 'Platform foundations',
        children: [
          {
            type: 'page',
            name: 'How Pear and Bare fit together',
            url: '/pear/explanation/pear-and-bare',
          },
          {
            type: 'page',
            name: 'Peer-to-peer, demystified',
            url: '/pear/explanation/peer-to-peer-demystified',
          },
          {
            type: 'page',
            name: 'Runtime and languages',
            url: '/pear/explanation/runtime-and-languages',
          },
          {
            type: 'page',
            name: 'Dependencies and network',
            url: '/pear/explanation/dependencies-and-network',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Storing & replicating data',
        children: [
          {
            type: 'page',
            name: 'Storage and distribution',
            url: '/pear/explanation/storage-and-distribution',
          },
          {
            type: 'page',
            name: 'Availability and blind peering',
            url: '/pear/explanation/availability-and-blind-peering',
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
            url: '/pear/explanation/pear-desktop-architecture',
          },
          {
            type: 'page',
            name: 'Workers',
            url: '/pear/explanation/workers',
          },
          {
            type: 'page',
            name: 'Deployment - Releasing Apps P2P',
            url: '/pear/explanation/deployment-releasing-apps-p2p',
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
    index: { type: 'page', name: 'How To', url: '/pear/how-to' },
    children: [
      {
        type: 'folder',
        name: 'Extend your chat app',
        children: [
          {
            type: 'page',
            name: 'Host multiple rooms in one chat app',
            url: '/pear/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app',
          },
          {
            type: 'page',
            name: 'Add blind peering to a chat app',
            url: '/pear/how-to/blind-peering/add-blind-peering-to-a-chat-app',
          },
          {
            type: 'page',
            name: 'Add Keet identity to a chat app',
            url: '/pear/how-to/manage-identity/add-keet-identity-to-a-chat-app',
          },
          {
            type: 'page',
            name: 'Share files in a peer-to-peer app',
            url: '/pear/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Back up photos in a peer-to-peer app',
            url: '/pear/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream stored video in a peer-to-peer app',
            url: '/pear/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream a live camera in a peer-to-peer app',
            url: '/pear/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Release & distribute your app',
        index: { type: 'page', name: 'Release & distribute your app', url: '/pear/how-to/operate-an-app' },
        children: [
          {
            type: 'folder',
            name: 'CI/CD with GitHub Actions',
            index: { type: 'page', name: 'CI/CD with GitHub Actions', url: '/pear/how-to/operate-an-app/github-actions' },
            children: [
              {
                type: 'page',
                name: 'Publish with GitHub Actions',
                url: '/pear/how-to/operate-an-app/github-actions/publish-with-github-actions',
              },
              {
                type: 'page',
                name: 'Build and sign desktop apps with GitHub Actions',
                url: '/pear/how-to/operate-an-app/github-actions/build-and-sign-in-ci',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Build & package',
            index: { type: 'page', name: 'Build & package', url: '/pear/how-to/operate-an-app/build-and-package' },
            children: [
              {
                type: 'page',
                name: 'Build desktop distributables',
                url: '/pear/how-to/operate-an-app/build-and-package/build-desktop-distributables',
              },
              {
                type: 'page',
                name: 'Distribute as a binary',
                url: '/pear/how-to/operate-an-app/build-and-package/distribute-as-binary',
              },
              {
                type: 'page',
                name: 'Submit to app stores',
                url: '/pear/how-to/operate-an-app/build-and-package/submit-to-app-stores',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Manual deployment',
            index: { type: 'page', name: 'Manual deployment', url: '/pear/how-to/operate-an-app/manual-deployment' },
            children: [
              {
                type: 'page',
                name: 'Deploy your application',
                url: '/pear/how-to/operate-an-app/manual-deployment/deployment',
              },
              {
                type: 'page',
                name: 'Troubleshoot desktop releases',
                url: '/pear/how-to/operate-an-app/manual-deployment/troubleshoot-desktop-releases',
              },
            ],
          },
          {
            type: 'folder',
            name: 'Multisig',
            index: { type: 'page', name: 'Multisig', url: '/pear/how-to/operate-an-app/multisig' },
            children: [
              {
                type: 'page',
                name: 'Set up multisig',
                url: '/pear/how-to/operate-an-app/multisig/set-up-multisig',
              },
              {
                type: 'page',
                name: 'Sign with multisig',
                url: '/pear/how-to/operate-an-app/multisig/sign-with-multisig',
              },
              {
                type: 'page',
                name: 'Troubleshoot multisig',
                url: '/pear/how-to/operate-an-app/multisig/troubleshoot-multisig',
              },
            ],
          },
          {
            type: 'page',
            name: 'Publish a changelog for your app',
            url: '/pear/how-to/operate-an-app/publish-a-changelog',
          },
          {
            type: 'page',
            name: 'Migrate from pear run to Pear OTA',
            url: '/pear/how-to/operate-an-app/migration',
          },
        ],
      },
      {
        type: 'page',
        name: 'Browse commands with the interactive menu',
        url: '/pear/how-to/browse-commands-with-the-interactive-menu',
      },
      {
        type: 'page',
        name: 'Manage installed applications',
        url: '/pear/how-to/manage-installed-applications',
      },
      {
        type: 'page',
        name: 'Troubleshoot common issues',
        url: '/pear/how-to/troubleshooting',
      },
    ],
  },
  {
    type: 'folder',
    name: 'Reference',
    index: { type: 'page', name: 'Reference', url: '/pear/reference' },
    children: [
      {
        type: 'folder',
        name: 'Pear',
        children: [
          {
            type: 'page',
            name: 'Command Line Interface (CLI)',
            url: '/pear/reference/pear/cli',
          },
          { type: 'page', name: 'Pear OTA', url: '/pear/reference/pear/runtime' },
          {
            type: 'page',
            name: 'Configuration',
            url: '/pear/reference/pear/configuration',
          },
          {
            type: 'page',
            name: 'Application Programming Interface (API)',
            url: '/pear/reference/pear/api',
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
            url: '/pear/reference/ci-and-release/desktop-release-npm-scripts',
          },
          {
            type: 'page',
            name: 'Holepunch GitHub Actions',
            url: '/pear/reference/ci-and-release/github-actions',
          },
          {
            type: 'page',
            name: 'pear-ci GitHub Action',
            url: '/pear/reference/ci-and-release/pear-ci-action',
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
            url: '/pear/reference/modules/pear-modules',
          },
          {
            type: 'page',
            name: 'Bare modules & building blocks →',
            url: '/bare',
          },
        ],
      },
    ],
  },
  { type: 'page', name: 'Release Overview', url: '/pear/release-overview' },
];
