import type { Node } from 'fumadocs-core/page-tree';

/**
 * Bare's sidebar tree. Rendered by <DocsLayout> when the current URL starts
 * with `/bare` — see `src/app/(docs)/[[...slug]]/layout.tsx`. Sibling of
 * `pear-tree.ts` and `p2p-tree.ts`; all three split off the single
 * `customTree` that used to live in `custom-tree.ts`. See
 * docs/plans/PEAR-BARE-SPLIT-PITCH.md for the original 2-product split this
 * backs. The peer-to-peer building blocks (Hypercore, Hyperswarm, Autobase,
 * Hyperbee, Hyperdrive, HyperDHT), their helpers/tools, most of Bare's old
 * how-to topic folders, and 4 explanation pages moved out to `p2p-tree.ts`
 * in a follow-up split — they're independent repos with their own worked
 * examples (mostly `pear-chat`/Electron, not Bare-standalone), not part of
 * the Bare runtime itself.
 *
 * `external: true` marks nodes that point at pages tagged `product: shared`
 * (troubleshooting) or that live in another product's tree entirely (P2P).
 * Per-page decision: no shared content directory — troubleshooting
 * physically lives under content/pear/ — so from Bare's tree it renders as
 * a plain, non-prefetched link rather than pretending to be a Bare-native
 * page. The How To and Reference quadrant landings are Bare's own
 * (content/bare/how-to/index.mdx, content/bare/reference/index.mdx), not
 * external.
 */
export const bareTree: Node[] = [
  { type: 'page', name: 'Bare', url: '/bare' },
  {
    type: 'folder',
    name: 'About Bare',
    index: { type: 'page', name: 'Using Bare on its own', url: '/bare/explanation/use-bare-standalone' },
    children: [
      {
        type: 'page',
        name: 'Inside Bare',
        url: '/bare/explanation/bare-runtime',
      },
      {
        type: 'page',
        name: 'Migrating from Node.js',
        url: '/bare/explanation/migrating-from-nodejs',
      },
      {
        type: 'page',
        name: 'One core, many platforms',
        url: '/bare/explanation/bare-on-native',
      },
      {
        type: 'page',
        name: 'Native addons',
        url: '/bare/explanation/native-addons',
      },
      {
        type: 'page',
        name: 'Structured RPC and schema-first design',
        url: '/bare/explanation/rpc-and-schemas',
      },
      {
        type: 'page',
        name: 'How the stack fits together →',
        url: '/p2p/explanation/how-the-stack-fits-together',
        external: true,
      },
    ],
  },
  {
    type: 'folder',
    name: 'How To',
    index: { type: 'page', name: 'How To', url: '/bare/how-to' },
    children: [
      {
        type: 'page',
        name: 'Connect peers, replicate data, share media →',
        url: '/p2p/how-to',
        external: true,
      },
      {
        type: 'folder',
        name: 'Run on mobile & native',
        index: { type: 'page', name: 'Run on mobile & native', url: '/bare/how-to/run-on-native' },
        children: [
          {
            type: 'page',
            name: 'Embed Bare in a React Native app',
            url: '/bare/how-to/run-on-native/embed-bare-in-react-native',
          },
          {
            type: 'page',
            name: 'Type a native RPC bridge',
            url: '/bare/how-to/run-on-native/type-a-native-rpc-bridge',
          },
          {
            type: 'page',
            name: 'Bundle a Bare app',
            url: '/bare/how-to/run-on-native/bundle-a-bare-app',
          },
          {
            type: 'page',
            name: 'Handle app suspension',
            url: '/bare/how-to/run-on-native/handle-app-suspension',
          },
        ],
      },
      {
        type: 'page',
        name: 'Migrate a Node.js app to Bare',
        url: '/bare/how-to/migrate-a-nodejs-app-to-bare',
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
    index: { type: 'page', name: 'Reference', url: '/bare/reference' },
    children: [
      {
        type: 'folder',
        name: 'Bare',
        children: [
          {
            type: 'page',
            name: 'Bare runtime API',
            url: '/bare/reference/bare/runtime',
          },
          { type: 'page', name: 'Bare CLI', url: '/bare/reference/bare/cli' },
          {
            type: 'page',
            name: 'Bare Kit',
            url: '/bare/reference/bare/bare-kit',
          },
          {
            type: 'page',
            name: 'Native-addon CI prebuilds',
            url: '/bare/reference/native-addon-prebuilds',
          },
          {
            type: 'folder',
            name: 'Modules',
            children: [
              { type: 'page', name: 'bare-fs', url: '/bare/reference/bare/modules/bare-fs' },
              { type: 'page', name: 'bare-os', url: '/bare/reference/bare/modules/bare-os' },
              { type: 'page', name: 'bare-stream', url: '/bare/reference/bare/modules/bare-stream' },
              { type: 'page', name: 'bare-tcp', url: '/bare/reference/bare/modules/bare-tcp' },
              { type: 'page', name: 'bare-http1', url: '/bare/reference/bare/modules/bare-http1' },
              { type: 'page', name: 'bare-ws', url: '/bare/reference/bare/modules/bare-ws' },
              { type: 'page', name: 'bare-fetch', url: '/bare/reference/bare/modules/bare-fetch' },
              { type: 'page', name: 'bare-crypto', url: '/bare/reference/bare/modules/bare-crypto' },
              { type: 'page', name: 'bare-subprocess', url: '/bare/reference/bare/modules/bare-subprocess' },
              { type: 'page', name: 'bare-rpc', url: '/bare/reference/bare/modules/bare-rpc' },
              { type: 'page', name: 'bare-sqlite', url: '/bare/reference/bare/modules/bare-sqlite' },
              { type: 'page', name: 'bare-broadcast-channel', url: '/bare/reference/bare/modules/bare-broadcast-channel' },
              { type: 'page', name: 'bare-sdl', url: '/bare/reference/bare/modules/bare-sdl' },
              { type: 'page', name: 'bare-module-resolve', url: '/bare/reference/bare/modules/bare-module-resolve' },
              { type: 'page', name: 'bare-module-traverse', url: '/bare/reference/bare/modules/bare-module-traverse' },
              { type: 'page', name: 'bare-addon-resolve', url: '/bare/reference/bare/modules/bare-addon-resolve' },
              { type: 'page', name: 'bare-bluetooth-android', url: '/bare/reference/bare/modules/bare-bluetooth-android' },
              { type: 'page', name: 'bare-bluetooth-apple', url: '/bare/reference/bare/modules/bare-bluetooth-apple' },
              { type: 'page', name: 'bare-module', url: '/bare/reference/bare/modules/bare-module' },
              { type: 'page', name: 'bare-url', url: '/bare/reference/bare/modules/bare-url' },
              { type: 'page', name: 'bare-path', url: '/bare/reference/bare/modules/bare-path' },
              { type: 'page', name: 'bare-atomics', url: '/bare/reference/bare/modules/bare-atomics' },
              { type: 'page', name: 'bare-timers', url: '/bare/reference/bare/modules/bare-timers' },
              { type: 'page', name: 'bare-pipe', url: '/bare/reference/bare/modules/bare-pipe' },
              { type: 'page', name: 'bare-semver', url: '/bare/reference/bare/modules/bare-semver' },
              { type: 'page', name: 'bare-form-data', url: '/bare/reference/bare/modules/bare-form-data' },
              { type: 'page', name: 'bare-channel', url: '/bare/reference/bare/modules/bare-channel' },
              { type: 'page', name: 'bare-tls', url: '/bare/reference/bare/modules/bare-tls' },
              { type: 'page', name: 'bare-console', url: '/bare/reference/bare/modules/bare-console' },
              { type: 'page', name: 'bare-structured-clone', url: '/bare/reference/bare/modules/bare-structured-clone' },
              { type: 'page', name: 'bare-ipc', url: '/bare/reference/bare/modules/bare-ipc' },
              { type: 'page', name: 'bare-inspector', url: '/bare/reference/bare/modules/bare-inspector' },
              { type: 'page', name: 'bare-make', url: '/bare/reference/bare/modules/bare-make' },
              { type: 'page', name: 'bare-prom-client', url: '/bare/reference/bare/modules/bare-prom-client' },
              { type: 'page', name: 'bare-posix', url: '/bare/reference/bare/modules/bare-posix' },
              { type: 'page', name: 'bare-mdns-discovery', url: '/bare/reference/bare/modules/bare-mdns-discovery' },
              { type: 'page', name: 'bare-sidecar', url: '/bare/reference/bare/modules/bare-sidecar' },
              { type: 'page', name: 'bare-union-bundle', url: '/bare/reference/bare/modules/bare-union-bundle' },
              { type: 'page', name: 'bare-mime', url: '/bare/reference/bare/modules/bare-mime' },
              { type: 'page', name: 'bare-apk', url: '/bare/reference/bare/modules/bare-apk' },
              { type: 'page', name: 'bare-abort', url: '/bare/reference/bare/modules/bare-abort' },
              { type: 'page', name: 'bare-abort-controller', url: '/bare/reference/bare/modules/bare-abort-controller' },
              { type: 'page', name: 'bare-ansi-escapes', url: '/bare/reference/bare/modules/bare-ansi-escapes' },
              { type: 'page', name: 'bare-assert', url: '/bare/reference/bare/modules/bare-assert' },
              { type: 'page', name: 'bare-buffer', url: '/bare/reference/bare/modules/bare-buffer' },
              { type: 'page', name: 'bare-bundle', url: '/bare/reference/bare/modules/bare-bundle' },
              { type: 'page', name: 'bare-bundle-id', url: '/bare/reference/bare/modules/bare-bundle-id' },
              { type: 'page', name: 'bare-collabora', url: '/bare/reference/bare/modules/bare-collabora' },
              { type: 'page', name: 'bare-dns', url: '/bare/reference/bare/modules/bare-dns' },
              { type: 'page', name: 'bare-encoding', url: '/bare/reference/bare/modules/bare-encoding' },
              { type: 'page', name: 'bare-env', url: '/bare/reference/bare/modules/bare-env' },
              { type: 'page', name: 'bare-events', url: '/bare/reference/bare/modules/bare-events' },
              { type: 'page', name: 'bare-file-logger', url: '/bare/reference/bare/modules/bare-file-logger' },
              { type: 'page', name: 'bare-format', url: '/bare/reference/bare/modules/bare-format' },
              { type: 'page', name: 'bare-hrtime', url: '/bare/reference/bare/modules/bare-hrtime' },
              { type: 'page', name: 'bare-https', url: '/bare/reference/bare/modules/bare-https' },
              { type: 'page', name: 'bare-inspect', url: '/bare/reference/bare/modules/bare-inspect' },
              { type: 'page', name: 'bare-logger', url: '/bare/reference/bare/modules/bare-logger' },
              { type: 'page', name: 'bare-module-lexer', url: '/bare/reference/bare/modules/bare-module-lexer' },
              { type: 'page', name: 'bare-net', url: '/bare/reference/bare/modules/bare-net' },
              { type: 'page', name: 'bare-pack', url: '/bare/reference/bare/modules/bare-pack' },
              { type: 'page', name: 'bare-process', url: '/bare/reference/bare/modules/bare-process' },
              { type: 'page', name: 'bare-querystring', url: '/bare/reference/bare/modules/bare-querystring' },
              { type: 'page', name: 'bare-readline', url: '/bare/reference/bare/modules/bare-readline' },
              { type: 'page', name: 'bare-realm', url: '/bare/reference/bare/modules/bare-realm' },
              { type: 'page', name: 'bare-signals', url: '/bare/reference/bare/modules/bare-signals' },
              { type: 'page', name: 'bare-sqlite-vector', url: '/bare/reference/bare/modules/bare-sqlite-vector' },
              { type: 'page', name: 'bare-stdio', url: '/bare/reference/bare/modules/bare-stdio' },
              { type: 'page', name: 'bare-stow', url: '/bare/reference/bare/modules/bare-stow' },
              { type: 'page', name: 'bare-string-decoder', url: '/bare/reference/bare/modules/bare-string-decoder' },
              { type: 'page', name: 'bare-system-logger', url: '/bare/reference/bare/modules/bare-system-logger' },
              { type: 'page', name: 'bare-tty', url: '/bare/reference/bare/modules/bare-tty' },
              { type: 'page', name: 'bare-type', url: '/bare/reference/bare/modules/bare-type' },
              { type: 'page', name: 'bare-type-stripper', url: '/bare/reference/bare/modules/bare-type-stripper' },
              { type: 'page', name: 'bare-vm', url: '/bare/reference/bare/modules/bare-vm' },
              { type: 'page', name: 'bare-zlib', url: '/bare/reference/bare/modules/bare-zlib' },
            ],
          },
        ],
      },
      {
        type: 'folder',
        name: 'Modules',
        children: [
          {
            type: 'page',
            name: 'Bare modules',
            url: '/bare/reference/modules/bare-modules',
          },
        ],
      },
      {
        type: 'page',
        name: 'Building blocks, helpers & tools →',
        url: '/p2p/reference',
        external: true,
      },
    ],
  },
  { type: 'page', name: 'Release Overview', url: '/bare/release-overview' },
];
