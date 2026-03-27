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
    
    // Check custom icons first
    if (icon in customIcons) {
      return createElement(customIcons[icon]);
    }
    
    // Fall back to Lucide icons
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
  },
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
