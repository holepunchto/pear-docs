import type { DocsSeoConfig } from '@tetherto/docs-seo-next';

/**
 * Production SEO base URL. Set in CI/deploy (e.g. `https://docs.pears.com`).
 * Falls back to `http://localhost:8080` to match the `serve` script
 * (`serve out -p 8080`), which is what previews the static export locally.
 * Override with `NEXT_PUBLIC_DOCS_ORIGIN` if you serve on a different port
 * (e.g. set it to `http://localhost:3000` when running `npm run dev`).
 *
 * `trailingSlash: true` matches `next.config.mjs` so canonicals align with
 * the deployed static URLs.
 */
export function getDocsSeoConfig(): DocsSeoConfig {
  const origin =
    process.env.NEXT_PUBLIC_DOCS_ORIGIN ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:8080';

  return {
    metadataBase: new URL(origin),
    siteName: 'Pear Docs',
    imageSiteLabel: 'Pear',
    publisherName: 'Tether',
    publisherLogoUrl: process.env.NEXT_PUBLIC_DOCS_PUBLISHER_LOGO_URL,
    trailingSlash: true,
    // Committed root-level OG image; used as fallback when SKIP_OG_BUILD=1.
    staticOgImagePath: '/og/docs/image.webp',
  };
}
