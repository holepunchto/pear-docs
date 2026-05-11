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
        type: 'page',
        name: 'Peer-to-peer chat',
        url: '/getting-started/chat',
      },
      {
        type: 'page',
        name: 'Add persistence',
        url: '/getting-started/persist',
      },
      {
        type: 'page',
        name: 'Ship and update',
        url: '/getting-started/ship-and-update',
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
        name: 'Connecting peers',
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
        name: 'Storage and replication',
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
          {
            type: 'page',
            name: 'Create a full peer-to-peer filesystem with Hyperdrive',
            url: '/how-to/store-and-replicate/create-a-full-peer-to-peer-filesystem-with-hyperdrive',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Operating an app',
        children: [
          {
            type: 'page',
            name: 'Deploy your application',
            url: '/how-to/operate-an-app/deployment',
          },
          {
            type: 'page',
            name: 'Build desktop distributables',
            url: '/how-to/operate-an-app/build-desktop-distributables',
          },
          {
            type: 'page',
            name: 'Desktop release npm scripts',
            url: '/how-to/operate-an-app/desktop-release-npm-scripts',
          },
          {
            type: 'page',
            name: 'Distribute as a binary',
            url: '/how-to/operate-an-app/distribute-as-binary',
          },
          {
            type: 'page',
            name: 'Manage installed applications',
            url: '/how-to/operate-an-app/manage-installed-applications',
          },
          {
            type: 'page',
            name: 'Migrate to a new release',
            url: '/how-to/operate-an-app/migration',
          },
          {
            type: 'page',
            name: 'Apply recommended practices',
            url: '/how-to/operate-an-app/recommended-practices',
          },
          {
            type: 'page',
            name: 'Troubleshoot desktop releases',
            url: '/how-to/operate-an-app/troubleshoot-desktop-releases',
          },
          {
            type: 'page',
            name: 'Troubleshoot common issues',
            url: '/how-to/operate-an-app/troubleshooting',
          },
        ],
      },
    ],
  },

  {
    type: 'folder',
    name: 'Reference',
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
        name: 'Release pipeline glossary',
        url: '/reference/release-pipeline-glossary',
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

  {
    type: 'folder',
    name: 'Explanations',
    index: { type: 'page', name: 'Explanations', url: '/explanation' },
    children: [
      {
        type: 'page',
        name: 'Runtime and languages',
        url: '/explanation/runtime-and-languages',
      },
      {
        type: 'page',
        name: 'Pear desktop architecture',
        url: '/explanation/pear-desktop-architecture',
      },
      {
        type: 'page',
        name: 'Storage and distribution',
        url: '/explanation/storage-and-distribution',
      },
      {
        type: 'page',
        name: 'Release pipeline',
        url: '/explanation/release-pipeline',
      },
      {
        type: 'page',
        name: 'Dependencies and network',
        url: '/explanation/dependencies-and-network',
      },
    ],
  },
];
