import { getLLMText, getPageImage, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';
import { gitConfig } from '@/lib/layout.shared';

export const dynamic = 'force-static';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownForCopy = await getLLMText(page);
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{style: 'clerk'}}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdown={markdownForCopy} />
        <ViewOptions githubUrl={githubUrl} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
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

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
