import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { pearTree } from '@/lib/pear-tree';
import { bareTree } from '@/lib/bare-tree';
import { p2pTree } from '@/lib/p2p-tree';
import { KeetIcon } from '@/components/keet-icon';
import KeetRoomModalMount from '@/components/keet-modal';
import { DocsVersionProvider } from '@/components/version';
import { ProductSwitcher } from '@/components/product-switcher';

export const dynamic = 'force-static';

export default async function Layout({ children, params }: LayoutProps<'/[[...slug]]'>) {
  const { slug } = await params;
  // Since Phase 6 (docs/plans/PEAR-BARE-SPLIT-PITCH.md) every URL under Bare
  // (and, since the follow-up 3-product split, P2P) carries a real product
  // prefix, so the tree can be picked from the URL itself — no frontmatter
  // lookup needed. This replaced an earlier version that read the current
  // page's `product` field via `source.getPage()`; that mechanism is still
  // how each *page* renders correctly (frontmatter still drives OG/schema/
  // SEO), but routing the sidebar off the URL is simpler and can't drift
  // from where a page actually lives on disk.
  const product = slug?.[0] === 'bare' ? 'bare' : slug?.[0] === 'p2p' ? 'p2p' : 'pear';
  const tree = product === 'bare' ? bareTree : product === 'p2p' ? p2pTree : pearTree;

  // Keet renders as an icon link in the navbar. Its href is a placeholder hash —
  // `KeetRoomModalMount` intercepts clicks on `a[aria-label="Keet"]` and opens
  // the Pear Development Group modal instead of navigating.
  const linkItems: LinkItemType[] = [
    {
      type: 'icon',
      url: '#keet-room',
      label: 'Keet',
      text: 'Keet',
      icon: <KeetIcon />,
    },
  ];

  return (
    <>
      {/*
        A plain block-level sibling above DocsLayout's own grid (#nd-docs-layout),
        not a DocsLayout prop — Fumadocs' own `nav`/tab mechanisms render as grid
        items sharing a single-row `grid-area: main` cell with the page content
        (see fumadocs-ui/dist/layouts/docs/client.js's `gridTemplate`), so
        anything placed there without dedicated row space gets stretched to the
        cell's full height and covers the content. Living outside the grid
        entirely avoids that.
      */}
      <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-fd-background px-4 py-2">
        <ProductSwitcher active={product} />
      </header>
      {/*
        The provider stays OUTSIDE DocsLayout. The dropdown has since moved into
        the article (see version/dropdown.tsx), so `children` alone would now be
        enough — but keeping it here costs nothing and means anything Fumadocs
        renders itself, such as a sidebar banner or tab, can still reach the
        context without this trap resurfacing. Wrapping a server-rendered subtree
        in a client provider is fine in this direction.
      */}
      <DocsVersionProvider>
        <DocsLayout
          {...baseOptions(product)}
          tree={{ name: 'docs', children: tree }}
          links={linkItems}
        >
          {children}
        </DocsLayout>
      </DocsVersionProvider>
      <KeetRoomModalMount />
    </>
  );
}
