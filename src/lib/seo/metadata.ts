// Vendored from @tetherto/docs-seo-next@1.0.1.
import type { PageSeoState } from './core';
import { warnMissingSeoFrontmatterFields } from './schema';
import type { Metadata } from 'next';

export type DocsMetadataOptions = {
  state: PageSeoState;
  /** Absolute or root-relative OG/Twitter image URL */
  ogImageUrl: string;
  siteName: string;
  /** Home page: use absolute title without template */
  isHomePage?: boolean;
  twitterSite?: string;
};

/**
 * Next.js Metadata from shared PageSeoState (canonical, robots, Open Graph, Twitter).
 */
export function buildDocsMetadata(options: DocsMetadataOptions): Metadata {
  const { state, ogImageUrl, siteName, isHomePage, twitterSite } = options;
  warnMissingSeoFrontmatterFields(state.seoAuditFields, state.slugs);
  const title = state.title;
  const description = state.description;
  const robots = state.indexable
    ? ({ index: true, follow: true } as const)
    : ({ index: false, follow: true } as const);

  const imageAlt = title;

  return {
    title: isHomePage ? { absolute: title } : title,
    description,
    alternates: {
      canonical: state.canonicalUrl,
    },
    robots,
    openGraph: {
      type: 'website',
      title,
      description,
      url: state.canonicalUrl,
      siteName,
      images: [{ url: ogImageUrl, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      ...(twitterSite ? { site: twitterSite } : {}),
    },
  };
}
