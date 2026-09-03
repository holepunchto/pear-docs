import { getLLMText, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { CopyPageButton, ViewOptions } from '@/components/ai/page-actions';
import { UpstreamVersion } from '@/components/UpstreamVersion';
import { VersionFilter } from '@/components/version/filter';
import { VersionDropdown } from '@/components/version/dropdown';
import { getVersionAxis } from '@/lib/version-axes';
import { pageMarkdownUrl } from '@/lib/page-markdown-url';
import { gitConfig } from '@/lib/layout.shared';
import {
  buildDocsMetadata,
  buildJsonLdGraph,
  DocsJsonLd,
  getPageSeoState,
} from '@tetherto/docs-seo-next';
import { getPageImage } from '@tetherto/docs-seo-og';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const dynamic = 'force-static';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownForCopy = await getLLMText(page);
  const markdownUrl = pageMarkdownUrl(page.url);
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`;

  const seoConfig = getDocsSeoConfig();
  const seoState = getPageSeoState(page, seoConfig);
  const jsonLd = buildJsonLdGraph(page, seoState, seoConfig);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{style: 'clerk'}}>
      {jsonLd ? <DocsJsonLd data={jsonLd} /> : null}
      {/*
        The platform version dropdown sits beside the <h1> rather than in the
        sidebar, so it survives the sub-768px drawer. Gated here as well as
        inside the component so it is not shipped to the other pages at all —
        `getVersionAxis` covers Pear's four platform pages plus the three
        independent Bare axes (cli/runtime/bare-kit), and nothing else.
      */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <DocsTitle>{page.data.title}</DocsTitle>
        {getVersionAxis(page.url) ? <VersionDropdown /> : null}
      </div>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <CopyPageButton
          markdownUrl={markdownUrl}
          fallbackMarkdown={markdownForCopy}
        />
        <ViewOptions githubUrl={githubUrl} />
        {/* Reference pages declare `upstreamVersion`; renders nothing elsewhere. */}
        <UpstreamVersion version={page.data.upstreamVersion} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      {/*
        Applies the `?v=` selection to gated blocks, gated code-fence rows, and
        the TOC. A no-op on pages with nothing gated, which is most of them.
      */}
      <VersionFilter />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const params = source.generateParams() as { slug: string[] }[];
  // `output: 'export'` requires an explicit combination for `/`. Optional catch-all
  // `[[...slug]]` must include `slug: []` (root index), not only nested paths.
  const hasRoot = params.some((p) => Array.isArray(p.slug) && p.slug.length === 0);
  if (!hasRoot && source.getPage([])) {
    return [{ slug: [] }, ...params];
  }
  return params;
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const isHomePage = !params.slug || params.slug.length === 0;
  const seoConfig = getDocsSeoConfig();
  const state = getPageSeoState(page, seoConfig);
  const ogImageUrl =
    state.ogImageOverride ??
    (process.env.SKIP_OG_BUILD === '1'
      ? (seoConfig.staticOgImagePath ?? '/og-default.png')
      : getPageImage(page).url);

  const metadata = buildDocsMetadata({
    state,
    ogImageUrl,
    siteName: seoConfig.siteName,
    isHomePage,
  });

  // The home title is `{ absolute }` (no template), so it would otherwise equal
  // the on-page <h1>. Give it a distinct, keyword-rich title instead.
  if (isHomePage) {
    metadata.title = { absolute: `${page.data.title} — Peer-to-Peer Application Runtime` };
  } else if (page.data.seoTitle) {
    // Plain string → root layout's title template appends " | Pear Docs".
    // The on-page <h1> keeps `page.data.title`.
    metadata.title = page.data.seoTitle;
  }

  return metadata;
}
