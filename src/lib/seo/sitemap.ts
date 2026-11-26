// Vendored from @tetherto/docs-seo-next@1.0.1.
import { type DocsSeoConfig, getPageSeoState, type TetherPage } from './core';
import type { MetadataRoute } from 'next';

export type DocsSitemapSource = {
  getPages: (language?: string) => TetherPage[];
};

export function buildDocsSitemap(
  source: DocsSitemapSource,
  config: DocsSeoConfig,
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of source.getPages()) {
    const state = getPageSeoState(page, config);
    if (!state.indexable) continue;
    entries.push({
      url: state.canonicalUrl,
      lastModified: state.lastModified,
      changeFrequency: 'weekly',
      priority: page.slugs.length === 0 ? 1 : 0.7,
    });
  }

  // `getPages()` order varies between builds.
  return entries.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}
