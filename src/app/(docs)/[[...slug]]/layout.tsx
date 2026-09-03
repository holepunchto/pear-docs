import Link from 'next/link';
import Image from 'next/image';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { pearTree } from '@/lib/pear-tree';
import { bareTree } from '@/lib/bare-tree';
import { p2pTree } from '@/lib/p2p-tree';
import { KeetIcon } from '@/components/keet-icon';
import KeetRoomModalMount from '@/components/keet-modal';
import { DocsVersionProvider } from '@/components/version';
import { ProductNavBar } from '@/components/product-nav-bar';
import { SearchBarButton } from '@/components/search-bar-button';

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
  // Same markSrc/title/url logic as layout.shared.tsx's `baseOptions` nav —
  // duplicated rather than destructured from it because its `nav.title` is
  // typed as `ReactNode | ((props) => ReactNode)`, which doesn't type-check
  // as plain JSX children here.
  const markSrc = product === 'bare' ? '/bare-1.svg' : '/pear-1.svg';
  const wordmark = product === 'bare' ? 'Bare Docs' : product === 'p2p' ? 'P2P Docs' : 'Pear Docs';
  const homeUrl = product === 'bare' ? '/bare' : product === 'p2p' ? '/p2p' : '/';

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
      <header className="sticky top-0 z-40 flex items-center border-b bg-fd-background">
        {/*
          Fixed to the sidebar's own width (268px, matched by measuring the
          rendered sidebar — see --fd-sidebar-width) so the logo sits in the
          same column as the sidebar and the nav links below start exactly
          where the sidebar ends. Not reactive to the sidebar's collapse
          state — that variable is scoped to #nd-docs-layout's descendants,
          and this header is a sibling of that grid, not one — an accepted
          gap rather than wiring a second SidebarProvider just for this.
        */}
        <Link
          href={homeUrl}
          className="flex w-[268px] shrink-0 items-center gap-2 py-4 ps-4 font-semibold text-nowrap text-fd-foreground max-md:w-auto max-md:pe-4"
        >
          <Image src={markSrc} alt="" width={24} height={24} />
          {wordmark}
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 overflow-x-auto py-3 pe-4">
          <ProductNavBar active={product} />
          <SearchBarButton className="w-56 shrink-0" />
        </div>
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
          searchToggle={{ enabled: false }}
        >
          {children}
        </DocsLayout>
      </DocsVersionProvider>
      <KeetRoomModalMount />
    </>
  );
}
