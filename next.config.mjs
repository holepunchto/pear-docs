import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Sources of @tetherto/docs-seo-* are TypeScript and must be transpiled by Next.
  transpilePackages: [
    '@tetherto/docs-seo-schema',
    '@tetherto/docs-seo-core',
    '@tetherto/docs-seo-next',
    '@tetherto/docs-seo-og',
  ],
  // Fully static HTML + assets in `out/` (no Node server, no API at runtime).
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  distDir: 'out',
  poweredByHeader: false,
  // Diátaxis IA legacy paths -> new paths. NOTE: with `output: 'export'`
  // set above, Next.js ignores this list at build time (no runtime to
  // honor it on; you'll see a build-time warning to that effect, which
  // is the expected behavior). It still applies during `next dev`.
  // The PRODUCTION redirects come from:
  //   - out/<from>/index.html — meta-refresh + canonical stubs (zero-
  //     config; works on any static host).
  //   - out/_redirects        — Sevalla / Netlify / Cloudflare-Pages rules.
  //     Follows the qvac docs strategy: public/_redirects is the authored
  //     source (markdown negotiation, catch-all 404) and is copied into out/
  //     by `next build`; scripts/generate-redirect-stubs.ts prepends IA 308
  //     rules ahead of that file during postbuild.
  // scripts/redirects.ts is the single source of truth for IA redirects.
  // See decisions/0001-adopt-diataxis-ia.md §6.
  async redirects() {
    return [
      // /howto/<slug>/ -> /how-to/<topic>/<slug>/. The how-to quadrant is
      // nested by topic now; legacy URLs map directly to the deeply-nested
      // final destination (single hop). The :slug-style wildcards work for
      // helpers / tools / building-blocks because those weren't re-nested,
      // but how-to slugs need explicit per-slug rules — the destination's
      // topic prefix depends on which slug it is. scripts/redirects.ts is
      // the production source of truth (postbuild stubs + _redirects); this
      // list mirrors it for `next dev`.
      { source: '/howto/connect-two-peers-by-key-with-hyperdht', destination: '/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht', permanent: true },
      { source: '/howto/connect-to-many-peers-by-topic-with-hyperswarm', destination: '/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm', permanent: true },
      { source: '/howto/replicate-and-persist-with-hypercore', destination: '/how-to/store-and-replicate/replicate-and-persist-with-hypercore', permanent: true },
      { source: '/howto/work-with-many-hypercores-using-corestore', destination: '/how-to/store-and-replicate/work-with-many-hypercores-using-corestore', permanent: true },
      { source: '/howto/share-append-only-databases-with-hyperbee', destination: '/how-to/store-and-replicate/share-append-only-databases-with-hyperbee', permanent: true },
      { source: '/howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive', destination: '/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive', permanent: true },
      { source: '/howto/store-and-serve-large-media-with-hyperblobs', destination: '/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs', permanent: true },
      // Hyperdrive + Hyperblobs how-tos moved from store-and-replicate into the
      // stream-and-share-media topic; redirect their old canonical URLs.
      { source: '/how-to/store-and-replicate/create-a-full-peer-to-peer-filesystem-with-hyperdrive', destination: '/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive', permanent: true },
      { source: '/how-to/store-and-replicate/store-and-serve-large-media-with-hyperblobs', destination: '/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs', permanent: true },
      // Blind peering promoted to its own top-level how-to topic.
      { source: '/how-to/store-and-replicate/blind-peering/keep-data-available-with-blind-peering', destination: '/how-to/blind-peering/keep-data-available-with-blind-peering', permanent: true },
      { source: '/how-to/store-and-replicate/blind-peering/add-blind-peering-to-a-chat-app', destination: '/how-to/blind-peering/add-blind-peering-to-a-chat-app', permanent: true },
      // Misfiled how-tos that lived under /reference/ before subtask 2.
      { source: '/reference/deployment', destination: '/how-to/operate-an-app/manual-deployment/deployment', permanent: true },
      { source: '/reference/migration', destination: '/how-to/operate-an-app/migration', permanent: true },
      { source: '/reference/recommended-practices', destination: '/how-to', permanent: true },
      { source: '/reference/troubleshooting', destination: '/how-to/troubleshooting', permanent: true },
      // FAQ deconstructed in subtask 9; most entries became explanations,
      // so the page-level redirect lands on the explanation index where a
      // lookup table maps each old anchor to its new home.
      { source: '/reference/faq', destination: '/explanation', permanent: true },
      // Release pipeline glossary was folded into the release-pipeline
      // explanation as a "Glossary" section (subtask: glossary merge).
      { source: '/reference/release-pipeline-glossary', destination: '/explanation/release-pipeline#glossary', permanent: true },
      // Building-block reference docs live at /reference/building-blocks/*.
      // Keep /building-blocks/* as a legacy shortcut that redirects there.
      { source: '/building-blocks/:slug', destination: '/reference/building-blocks/:slug', permanent: true },
      { source: '/helpers/:slug', destination: '/reference/helpers/:slug', permanent: true },
      { source: '/tools/:slug', destination: '/reference/tools/:slug', permanent: true },
    ];
  },
};

export default withMDX(config);