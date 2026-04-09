import type { Node } from 'fumadocs-core/page-tree';
import { createElement, type ComponentType } from 'react';
import {
  Blocks,
  BookMarked,
  BookOpen,
  Box,
  Boxes,
  CircleDot,
  Code2,
  FileCode2,
  FolderGit2,
  Hammer,
  House,
  Layers,
  Library,
  Puzzle,
  Terminal,
  Wrench,
} from 'lucide-react';

function ic(
  Icon: ComponentType<{ className?: string }>,
): ReturnType<typeof createElement> {
  return createElement(Icon, { className: 'size-4' });
}

/**
 * Sidebar tree mirroring GitBook SUMMARY.md (Pear docs).
 */
export const tree: Node[] = [
  {
    name: 'Pear by Holepunch',
    url: '/',
    type: 'page',
    icon: ic(House),
  },

      {
        name: 'Creating a `pear init` Template',
        url: '/guide/creating-a-pear-init-template',
        type: 'page',
      },
  {
    name: 'Reference',
    type: 'folder',
    defaultOpen: true,
    icon: ic(BookOpen),
    children: [
      { name: 'Pear CLI', url: '/reference/cli', type: 'page', icon: ic(Terminal) },
      {
        name: 'Pear Application Configuration',
        url: '/reference/configuration',
        type: 'page',
        icon: ic(FileCode2),
      },
      { name: 'Bare Overview', url: '/reference/bare-overview', type: 'page', icon: ic(Layers) },
      { name: 'API', url: '/reference/api', type: 'page', icon: ic(Code2) },
      { name: 'Templates', url: '/reference/templates', type: 'page', icon: ic(FileCode2) },
      { name: 'Node.js Compatibility', url: '/reference/node-compat', type: 'page', icon: ic(Box) },
      {
        name: 'Recommended Practices',
        url: '/reference/recommended-practices',
        type: 'page',
        icon: ic(BookMarked),
      },
      {
        name: 'Troubleshooting',
        url: '/reference/troubleshooting',
        type: 'page',
        icon: ic(Hammer),
      },
      { name: 'Frequently Asked Questions', url: '/reference/faq', type: 'page', icon: ic(CircleDot) },
      { name: 'Migration', url: '/reference/migration', type: 'page', icon: ic(Library) },
    ],
  },
  {
    name: 'Guides',
    type: 'folder',
    defaultOpen: true,
    icon: ic(BookMarked),
    children: [
      { name: 'Getting Started', url: '/guide/getting-started', type: 'page' },
      {
        name: 'Starting a Pear Desktop Project',
        url: '/guide/starting-a-pear-desktop-project',
        type: 'page',
      },
      {
        name: 'Making a Pear Desktop Application',
        url: '/guide/making-a-pear-desktop-app',
        type: 'page',
      },
      {
        name: 'Starting a Pear Terminal Project',
        url: '/guide/starting-a-pear-terminal-project',
        type: 'page',
      },
      {
        name: 'Making a Pear Terminal Application',
        url: '/guide/making-a-pear-terminal-app',
        type: 'page',
      },
      { name: 'Sharing a Pear Application', url: '/guide/sharing-a-pear-app', type: 'page' },
      { name: 'Releasing a Pear Application', url: '/guide/releasing-a-pear-app', type: 'page' },
      { name: 'Making a Bare Mobile Application', url: '/guide/making-a-bare-mobile-app', type: 'page' },
      {
        name: 'Debugging a Pear Terminal Application',
        url: '/guide/debugging-a-pear-terminal-app',
        type: 'page',
      },
      {
        name: 'Creating a `pear init` Template',
        url: '/guide/creating-a-pear-init-template',
        type: 'page',
      },
    ],
  },
  {
    name: 'How-tos',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Hammer),
    children: [
      {
        name: 'Connect two peers',
        url: '/howto/connect-two-peers-by-key-with-hyperdht',
        type: 'page',
      },
      {
        name: 'Connect many peers',
        url: '/howto/connect-to-many-peers-by-topic-with-hyperswarm',
        type: 'page',
      },
      {
        name: 'Replicate & persist',
        url: '/howto/replicate-and-persist-with-hypercore',
        type: 'page',
      },
      {
        name: 'Manage multiple Hypercores',
        url: '/howto/work-with-many-hypercores-using-corestore',
        type: 'page',
      },
      {
        name: 'Share append-only databases',
        url: '/howto/share-append-only-databases-with-hyperbee',
        type: 'page',
      },
      {
        name: 'Create a p2p filesystem',
        url: '/howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive',
        type: 'page',
      },
    ],
  },
  {
    name: 'Pear Modules',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Puzzle),
    children: [
      { name: 'Application Libraries', url: '/#application-libraries', type: 'page' },
      { name: 'User Interface Libraries', url: '/#user-interface-libraries', type: 'page' },
      { name: 'Common Libraries', url: '/#common-libraries', type: 'page' },
      { name: 'Developer Libraries', url: '/#developer-libraries', type: 'page' },
      { name: 'Integration Libraries', url: '/#integration-libraries', type: 'page' },
    ],
  },
  {
    name: 'P2P Modules',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Boxes),
    children: [
      { name: 'Building-Block Libraries', url: '/#building-blocks', type: 'page' },
      { name: 'Helper Libraries', url: '/#helpers', type: 'page' },
    ],
  },
  {
    name: 'Building blocks',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Blocks),
    children: [
      { name: 'Hypercore', url: '/building-blocks/hypercore', type: 'page' },
      { name: 'Hyperbee', url: '/building-blocks/hyperbee', type: 'page' },
      { name: 'Hyperdrive', url: '/building-blocks/hyperdrive', type: 'page' },
      { name: 'Autobase', url: '/building-blocks/autobase', type: 'page' },
      { name: 'HyperDHT', url: '/building-blocks/hyperdht', type: 'page' },
      { name: 'Hyperswarm', url: '/building-blocks/hyperswarm', type: 'page' },
    ],
  },
  {
    name: 'Helpers',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Library),
    children: [
      { name: 'Corestore', url: '/helpers/corestore', type: 'page' },
      { name: 'Localdrive', url: '/helpers/localdrive', type: 'page' },
      { name: 'Mirrordrive', url: '/helpers/mirrordrive', type: 'page' },
      { name: 'Secretstream', url: '/helpers/secretstream', type: 'page' },
      { name: 'Compact encoding', url: '/helpers/compact-encoding', type: 'page' },
      { name: 'Protomux', url: '/helpers/protomux', type: 'page' },
    ],
  },
  {
    name: 'Bare Modules',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Layers),
    children: [{ name: 'Standard Libraries', url: '/#bare-modules', type: 'page' }],
  },
  {
    name: 'Tools',
    type: 'folder',
    defaultOpen: true,
    icon: ic(Wrench),
    children: [
      { name: 'Tool List', url: '/#tools', type: 'page' },
      { name: 'Hypershell', url: '/tools/hypershell', type: 'page' },
      { name: 'Hypertele', url: '/tools/hypertele', type: 'page' },
      { name: 'Hyperbeam', url: '/tools/hyperbeam', type: 'page' },
      { name: 'Hyperssh', url: '/tools/hyperssh', type: 'page' },
      { name: 'Drives', url: '/tools/drives', type: 'page' },
    ],
  },
  {
    name: 'Examples',
    type: 'folder',
    defaultOpen: true,
    icon: ic(FolderGit2),
    children: [
      {
        name: 'Pear Terminal',
        url: 'https://github.com/holepunchto/pear/tree/main/examples/terminal',
        type: 'page',
        external: true,
      },
      {
        name: 'Pear Desktop (Electron)',
        url: 'https://github.com/holepunchto/pear/tree/main/examples/desktop',
        type: 'page',
        external: true,
      },
      {
        name: 'Bare Android',
        url: 'https://github.com/holepunchto/bare-android',
        type: 'page',
        external: true,
      },
      {
        name: 'Bare iOS',
        url: 'https://github.com/holepunchto/bare-ios',
        type: 'page',
        external: true,
      },
    ],
  },
];
