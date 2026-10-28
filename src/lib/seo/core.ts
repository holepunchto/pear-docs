// Vendored from @tetherto/docs-seo-core@1.0.1, with structural page types.
import type { DocType, JsonLdSchemaType, TetherSeoFrontmatter } from './schema';
import { warnMissingSeoFrontmatterFields } from './schema';

export type TetherPageData = { title?: string } & Pick<
  TetherSeoFrontmatter,
  'description' | 'noIndex' | 'ogImage' | 'schemaType' | 'docType' | 'lastModified'
>;
// Any fumadocs page satisfies this, whatever its Page generics.
export type TetherPage = { url: string; slugs: string[]; data: TetherPageData };

export type DocsSeoConfig = {
  /** Production origin, e.g. `https://docs.tether.io` */
  metadataBase: URL;
  /** `og:site_name` and related branding */
  siteName: string;
  /**
   * Label on generated OG images (Takumi `site` prop). Defaults to `siteName` when omitted.
     */
  imageSiteLabel?: string;
  /** Publisher name for JSON-LD (e.g. `Tether`) */
  publisherName: string;
  /** Optional absolute HTTPS logo URL for JSON-LD publisher */
  publisherLogoUrl?: string;
  /** Match Next.js `trailingSlash` so canonicals align with deployed URLs */
  trailingSlash?: boolean;
  /**
   * Root-relative default social image when not using `ogImage` and not using a dynamic OG route
   * (required for `output: 'export'` / pure static hosting).
   */
  staticOgImagePath?: string;
};

export type PageSeoState = {
  title: string;
  description: string;
  pathname: string;
  canonicalUrl: string;
  indexable: boolean;
  ogImageOverride: string | null;
  jsonLdType: JsonLdSchemaType;
  lastModified: Date | undefined;
  /** Slug segments (empty = home); used for deduped SEO frontmatter warnings. */
  slugs: string[];
  /** Subset of frontmatter for `warnMissingSeoFrontmatterFields` in other packages. */
  seoAuditFields: Record<string, unknown>;
};

function normalizePathname(path: string, trailingSlash: boolean): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  if (trailingSlash && p !== '/') {
    p = `${p}/`;
  }
  return p;
}

/** Root-relative URL for assets (e.g. og:image); never applies doc trailingSlash. */
function normalizeRootRelativeAssetPath(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function toAbsoluteUrl(metadataBase: URL, pathname: string): string {
  const base = metadataBase.href.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

function parseLastModified(
  value: TetherSeoFrontmatter['lastModified'],
): Date | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * JSON-LD @type: `schemaType` wins, the root and `docType: page` are WebPage, the rest TechArticle.
 */
export function inferJsonLdType(
  slugs: string[],
  docType: DocType | undefined,
  schemaType: JsonLdSchemaType | undefined,
): JsonLdSchemaType {
  if (schemaType) return schemaType;

  if (docType === 'page' || slugs.length === 0) {
    return 'WebPage';
  }

  return 'TechArticle';
}

function pickSeoAuditFields(data: TetherPageData): Record<string, unknown> {
  return {
    description: data.description,
    noIndex: data.noIndex,
    ogImage: data.ogImage,
    schemaType: data.schemaType,
    docType: data.docType,
    lastModified: data.lastModified,
  };
}

export function getPageSeoState(
  page: TetherPage,
  config: DocsSeoConfig,
): PageSeoState {
  const trailingSlash = config.trailingSlash ?? false;
  const pathname = normalizePathname(page.url, trailingSlash);
  const canonicalUrl = toAbsoluteUrl(config.metadataBase, pathname);
  const noIndex = page.data.noIndex === true;
  const indexable = !noIndex;
  const ogImageOverride =
    typeof page.data.ogImage === 'string' && page.data.ogImage.length > 0
      ? page.data.ogImage.startsWith('http://') ||
          page.data.ogImage.startsWith('https://')
        ? page.data.ogImage
        : toAbsoluteUrl(
            config.metadataBase,
            normalizeRootRelativeAssetPath(page.data.ogImage),
          )
      : null;

  const title = page.data.title ?? '';
  const description = page.data.description ?? '';
  const slugs = [...page.slugs];
  const seoAuditFields = pickSeoAuditFields(page.data);

  warnMissingSeoFrontmatterFields(seoAuditFields, slugs);

  return {
    title,
    description,
    pathname,
    canonicalUrl,
    indexable,
    ogImageOverride,
    jsonLdType: inferJsonLdType(
      page.slugs,
      page.data.docType,
      page.data.schemaType,
    ),
    lastModified: parseLastModified(page.data.lastModified),
    slugs,
    seoAuditFields,
  };
}

export type JsonLdGraph = Record<string, unknown>;

export function buildJsonLdGraph(
  page: TetherPage,
  state: PageSeoState,
  config: DocsSeoConfig,
): JsonLdGraph | null {
  if (!state.indexable) return null;

  const publisher: Record<string, unknown> = {
    '@type': 'Organization',
    name: config.publisherName,
  };
  if (config.publisherLogoUrl) {
    publisher.logo = config.publisherLogoUrl;
  }

  const dates =
    state.lastModified !== undefined
      ? {
          dateModified: state.lastModified.toISOString(),
          datePublished: state.lastModified.toISOString(),
        }
      : {};

  if (state.jsonLdType === 'WebPage') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: state.title,
      description: state.description,
      url: state.canonicalUrl,
      ...dates,
    };
  }

  if (state.jsonLdType === 'APIReference') {
    return {
      '@context': 'https://schema.org',
      '@type': 'APIReference',
      name: state.title,
      description: state.description,
      url: state.canonicalUrl,
      publisher,
      ...dates,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: state.title,
    description: state.description,
    url: state.canonicalUrl,
    publisher,
    ...dates,
  };
}
