import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'holepunchto',
  repo: 'pear-docs',
  branch: 'published',
};

export function baseOptions(product: 'pear' | 'bare' | 'p2p' = 'pear'): BaseLayoutProps {
  const isBare = product === 'bare';
  const isP2p = product === 'p2p';
  return {
    nav: {
      // No title/logo here — [[...slug]]/layout.tsx renders the wordmark
      // once, in its own persistent top bar. This `nav` object still feeds
      // DocsLayout's sidebar-top title row and its mobile-only subnav
      // header; leaving `title` unset empties both rather than duplicating
      // the same logo a second (and third) time.
      url: isBare ? '/bare' : isP2p ? '/p2p' : '/',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}