import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { PearIcon } from '@/components/PearIcon';
import { createElement } from 'react';
import { icons } from 'lucide-react';

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

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
