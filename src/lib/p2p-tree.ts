import type { Node } from 'fumadocs-core/page-tree';

/**
 * P2P's sidebar tree. Rendered by <DocsLayout> when the current URL starts
 * with `/p2p` — see `src/app/(docs)/[[...slug]]/layout.tsx`. Third sibling
 * of `pear-tree.ts` and `bare-tree.ts`, all splitting off what used to be a
 * single `customTree` (`custom-tree.ts`, retired in the original 2-product
 * split). P2P was carved out of Bare in a follow-up split: the peer-to-peer
 * building blocks (Hypercore, Hyperswarm, Autobase, Hyperbee, Hyperdrive,
 * HyperDHT), their helpers/tools, their how-tos, and the whole Getting
 * Started tutorial moved here — they're independent `holepunchto` repos,
 * not part of Bare's own codebase, and most of their worked examples build
 * a Pear (Electron) app, not a Bare-standalone one.
 *
 * `external: true` marks the node that points at a page tagged
 * `product: shared` (troubleshooting) — that page physically lives under
 * content/pear/, same as it does for bare-tree.ts. The How To and Reference
 * quadrant landings are P2P's own; "About P2P" repurposes the relocated
 * Pear<->Bare bridge page as its index, same pattern bare-tree.ts uses for
 * `use-bare-standalone.mdx`.
 */
export const p2pTree: Node[] = [
  { type: 'page', name: 'P2P', url: '/p2p' },
  {
    type: 'folder',
    name: 'Getting Started',
    index: {
      type: 'page',
      name: 'Introduction',
      url: '/p2p/getting-started',
    },
    children: [
      {
        type: 'folder',
        name: 'Build a peer-to-peer chat',
        children: [
          { type: 'page', name: 'Introduction', url: '/p2p/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat' },
          { type: 'page', name: 'Reshape into a production app', url: '/p2p/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app' },
          { type: 'page', name: 'Ship your app', url: '/p2p/getting-started/build-a-peer-to-peer-chat/ship' },
          { type: 'page', name: 'Deploy over-the-air updates', url: '/p2p/getting-started/build-a-peer-to-peer-chat/update' },
        ],
      },
      {
        type: 'folder',
        name: 'Start from a template',
        index: {
          type: 'page',
          name: 'Start from a template',
          url: '/p2p/getting-started/from-a-template',
        },
        children: [
          {
            type: 'page',
            name: 'Start from the hello-pear-electron template',
            url: '/p2p/getting-started/from-a-template/start-from-hello-pear-electron',
          },
          {
            type: 'page',
            name: 'Start from the hello-pear-bare template',
            url: '/p2p/getting-started/from-a-template/start-from-hello-pear-bare',
          },
        ],
      },
    ],
  },
  {
    type: 'folder',
    name: 'About P2P',
    index: { type: 'page', name: 'How the stack fits together', url: '/p2p/explanation/how-the-stack-fits-together' },
    children: [
      {
        type: 'page',
        name: 'Peer-to-peer, demystified',
        url: '/p2p/explanation/peer-to-peer-demystified',
      },
      {
        type: 'page',
        name: 'A production Autobase-backed chat room',
        url: '/p2p/explanation/autobase-backed-chat-room',
      },
      {
        type: 'page',
        name: 'Blind peering',
        url: '/p2p/explanation/blind-peering',
      },
      {
        type: 'page',
        name: 'From append-only logs to files',
        url: '/p2p/explanation/from-logs-to-files',
      },
    ],
  },
  {
    type: 'folder',
    name: 'How To',
    index: { type: 'page', name: 'How To', url: '/p2p/how-to' },
    children: [
      {
        type: 'folder',
        name: 'Connect to peers',
        index: { type: 'page', name: 'Connect to peers', url: '/p2p/how-to/connect-to-peers' },
        children: [
          {
            type: 'page',
            name: 'Connect two peers by key with HyperDHT',
            url: '/p2p/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht',
          },
          {
            type: 'page',
            name: 'Connect to many peers by topic with Hyperswarm',
            url: '/p2p/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm',
          },
          {
            type: 'page',
            name: 'Host multiple rooms in one chat app',
            url: '/p2p/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Store and replicate',
        index: { type: 'page', name: 'Store and replicate', url: '/p2p/how-to/store-and-replicate' },
        children: [
          {
            type: 'page',
            name: 'Replicate and persist with Hypercore',
            url: '/p2p/how-to/store-and-replicate/replicate-and-persist-with-hypercore',
          },
          {
            type: 'page',
            name: 'Work with many Hypercores using Corestore',
            url: '/p2p/how-to/store-and-replicate/work-with-many-hypercores-using-corestore',
          },
          {
            type: 'page',
            name: 'Share append-only databases with Hyperbee',
            url: '/p2p/how-to/store-and-replicate/share-append-only-databases-with-hyperbee',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Blind peering',
        index: { type: 'page', name: 'Blind peering', url: '/p2p/how-to/blind-peering' },
        children: [
          {
            type: 'page',
            name: 'Keep data available with blind peering',
            url: '/p2p/how-to/blind-peering/keep-data-available-with-blind-peering',
          },
          {
            type: 'page',
            name: 'Add blind peering to a chat app',
            url: '/p2p/how-to/blind-peering/add-blind-peering-to-a-chat-app',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Manage identity',
        index: { type: 'page', name: 'Manage identity', url: '/p2p/how-to/manage-identity' },
        children: [
          {
            type: 'page',
            name: 'Create a portable identity with Keet identity keys',
            url: '/p2p/how-to/manage-identity/create-a-portable-identity-with-keet-identity-key',
          },
          {
            type: 'page',
            name: 'Add Keet identity to a chat app',
            url: '/p2p/how-to/manage-identity/add-keet-identity-to-a-chat-app',
          },
        ],
      },
      {
        type: 'folder',
        name: 'Stream and share media',
        index: { type: 'page', name: 'Stream and share media', url: '/p2p/how-to/stream-and-share-media' },
        children: [
          {
            type: 'page',
            name: 'Create a full peer-to-peer filesystem with Hyperdrive',
            url: '/p2p/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive',
          },
          {
            type: 'page',
            name: 'Store and serve large media with Hyperblobs',
            url: '/p2p/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs',
          },
          {
            type: 'page',
            name: 'Share files in a peer-to-peer app',
            url: '/p2p/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Back up photos in a peer-to-peer app',
            url: '/p2p/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream stored video in a peer-to-peer app',
            url: '/p2p/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app',
          },
          {
            type: 'page',
            name: 'Stream a live camera in a peer-to-peer app',
            url: '/p2p/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app',
          },
        ],
      },
      {
        type: 'page',
        name: 'Troubleshoot common issues',
        url: '/pear/how-to/troubleshooting',
        external: true,
      },
    ],
  },
  {
    type: 'folder',
    name: 'Reference',
    index: { type: 'page', name: 'Reference', url: '/p2p/reference' },
    children: [
      {
        type: 'folder',
        name: 'Building blocks',
        children: [
          {
            type: 'page',
            name: 'Hypercore',
            url: '/p2p/reference/building-blocks/hypercore',
          },
          {
            type: 'page',
            name: 'Hyperbee',
            url: '/p2p/reference/building-blocks/hyperbee',
          },
          {
            type: 'page',
            name: 'Hyperdrive',
            url: '/p2p/reference/building-blocks/hyperdrive',
          },
          {
            type: 'page',
            name: 'Autobase',
            url: '/p2p/reference/building-blocks/autobase',
          },
          {
            type: 'page',
            name: 'HyperDHT',
            url: '/p2p/reference/building-blocks/hyperdht',
          },
          {
            type: 'page',
            name: 'Hyperswarm',
            url: '/p2p/reference/building-blocks/hyperswarm',
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
            url: '/p2p/reference/helpers/corestore',
          },
          {
            type: 'page',
            name: 'Localdrive',
            url: '/p2p/reference/helpers/localdrive',
          },
          {
            type: 'page',
            name: 'Mirrordrive',
            url: '/p2p/reference/helpers/mirrordrive',
          },
          {
            type: 'page',
            name: 'Secretstream',
            url: '/p2p/reference/helpers/secretstream',
          },
          {
            type: 'page',
            name: 'Compact encoding',
            url: '/p2p/reference/helpers/compact-encoding',
          },
          {
            type: 'page',
            name: 'Protomux',
            url: '/p2p/reference/helpers/protomux',
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
            url: '/p2p/reference/tools/hypershell',
          },
          {
            type: 'page',
            name: 'Hypertele',
            url: '/p2p/reference/tools/hypertele',
          },
          {
            type: 'page',
            name: 'Hyperbeam',
            url: '/p2p/reference/tools/hyperbeam',
          },
          { type: 'page', name: 'Hyperssh', url: '/p2p/reference/tools/hyperssh' },
          { type: 'page', name: 'Drives', url: '/p2p/reference/tools/drives' },
        ],
      },
    ],
  },
];
