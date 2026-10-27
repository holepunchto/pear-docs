import type { MetadataRoute } from 'next';
import { buildDocsRobots } from '@/lib/seo';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const { metadataBase } = getDocsSeoConfig();
  return buildDocsRobots({
    sitemapUrl: new URL('/sitemap.xml', metadataBase).toString(),
  });
}
