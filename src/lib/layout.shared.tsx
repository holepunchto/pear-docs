import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const gitConfig = {
  user: 'holepunchto',
  repo: 'pear-docs',
  branch: 'published',
};

export function baseOptions(product: 'pear' | 'bare' | 'p2p' = 'pear'): BaseLayoutProps {
  const isBare = product === 'bare';
  const isP2p = product === 'p2p';
  // No P2P wordmark asset yet — same gap the Bare mark had before
  // /bare-1.svg landed. Falls back to the Pear mark rather than leaving the
  // navbar iconless; swap this to '/p2p-1.svg' when the asset arrives, same
  // shape as Bare's mark (horizontal-<rect> silhouette, single flat
  // #B0D944 fill, transparent background) — nothing else here changes.
  const markSrc = isBare ? '/bare-1.svg' : '/pear-1.svg';
  return {
    nav: {
      title: (
        <>
          <Image src={markSrc} alt="" width={24} height={24} />
          {isBare ? 'Bare Docs' : isP2p ? 'P2P Docs' : 'Pear Docs'}
        </>
      ),
      // Clicking the wordmark returns you to the tab you're in.
      url: isBare ? '/bare' : isP2p ? '/p2p' : '/',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}