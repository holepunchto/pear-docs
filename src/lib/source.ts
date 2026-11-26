import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { PearIcon } from '@/components/PearIcon';
import { createElement } from 'react';
import { icons } from 'lucide-react';
import { cleanProcessedMarkdown } from '@/lib/clean-markdown';

// See https://fumadocs.dev/docs/headless/source-api for more info
const customIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Pear: PearIcon,
};

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
  icon(icon) {
    if (!icon) return undefined;

    if (icon in customIcons) {
      return createElement(customIcons[icon]);
    }

    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
  },
});

export const compareUrls = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Pages ordered by URL, since `getPages()` order varies between builds. */
export function getSortedPages() {
  return [...source.getPages()].sort((a, b) => compareUrls(a.url, b.url));
}

export async function getLLMText(page: InferPageType<typeof source>, sourceUrl?: string) {
  const processed = cleanProcessedMarkdown(await page.data.getText('processed'));

  return `# ${page.data.title}

${sourceUrl ? `Source: ${sourceUrl}\n\n` : ''}${processed}`;
}
