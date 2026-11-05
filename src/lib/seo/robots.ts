// Vendored from @tetherto/docs-seo-next@1.0.1.
import type { MetadataRoute } from 'next';

export type DocsRobotsOptions = {
  /** Absolute sitemap URL, e.g. `https://docs.example.com/sitemap.xml` */
  sitemapUrl: string;
  /** If true, disallow common training crawlers on `/` */
  disallowTrainingBots?: boolean;
};

/**
 * robots.txt aligned with proposals/improve-seo-technical-spec-v2/robots-txt.md
 */
export function buildDocsRobots(
  options: DocsRobotsOptions,
): MetadataRoute.Robots {
  const { sitemapUrl, disallowTrainingBots = true } = options;

  const rules: MetadataRoute.Robots['rules'] = [
    { userAgent: 'Googlebot', allow: '/' },
    { userAgent: 'PerplexityBot', allow: '/' },
    { userAgent: 'OAI-SearchBot', allow: '/' },
    { userAgent: '*', allow: '/' },
  ];

  if (disallowTrainingBots) {
    rules.push(
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
    );
  }

  return {
    rules,
    sitemap: sitemapUrl,
  };
}
