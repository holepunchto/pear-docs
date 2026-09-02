import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const gitConfig = {
  user: 'holepunchto',
  repo: 'pear-docs',
  branch: 'published',
};

export function baseOptions(product: 'pear' | 'bare' = 'pear'): BaseLayoutProps {
  const isBare = product === 'bare';
  return {
    nav: {
      title: (
        <>
          <Image src={isBare ? '/bare-1.svg' : '/pear-1.svg'} alt="" width={24} height={24} />
          {isBare ? 'Bare Docs' : 'Pear Docs'}
        </>
      ),
      // Clicking the wordmark returns you to the tab you're in.
      url: isBare ? '/bare' : '/',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}