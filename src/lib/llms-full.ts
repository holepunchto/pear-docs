import { getLLMText, getSortedPages } from '@/lib/source';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const LLMS_FULL_PRODUCTS = ['pear', 'p2p', 'bare'] as const;

/** Every page (or one product's pages) as Markdown, each headed by its canonical URL. */
export async function buildLlmsFull(product?: (typeof LLMS_FULL_PRODUCTS)[number]) {
  const { metadataBase } = getDocsSeoConfig();
  const pages = getSortedPages().filter((p) => !product || p.url.startsWith(`/${product}/`));
  const texts = await Promise.all(
    pages.map((page) => getLLMText(page, new URL(page.url, metadataBase).toString())),
  );
  return new Response(texts.join('\n\n'));
}
