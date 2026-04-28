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
  //   - out/_redirects        — Sevalla / Netlify / Cloudflare-Pages
  //     compatible 308 rules (true 308s once deployed).
  // Both are emitted by scripts/generate-redirect-stubs.ts during the
  // postbuild step. scripts/redirects.ts is the single source of truth.
  // See decisions/0001-adopt-diataxis-ia.md §6.
  async redirects() {
    return [
      { source: '/howto/:slug', destination: '/how-to/:slug', permanent: true },
      { source: '/building-blocks/:slug', destination: '/reference/building-blocks/:slug', permanent: true },
      { source: '/helpers/:slug', destination: '/reference/helpers/:slug', permanent: true },
      { source: '/tools/:slug', destination: '/reference/tools/:slug', permanent: true },
      { source: '/reference/deployment', destination: '/how-to/deployment', permanent: true },
      { source: '/reference/troubleshooting', destination: '/how-to/troubleshooting', permanent: true },
      { source: '/reference/recommended-practices', destination: '/how-to/recommended-practices', permanent: true },
      { source: '/reference/migration', destination: '/how-to/migration', permanent: true },
    ];
  },
};

export default withMDX(config);