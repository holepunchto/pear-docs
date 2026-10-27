import type { MetadataRoute } from 'next';
import { buildDocsSitemap } from '@/lib/seo';
import { source } from '@/lib/source';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return buildDocsSitemap(source, getDocsSeoConfig());
}
