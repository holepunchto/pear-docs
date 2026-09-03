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
import { MobileSidebarTrigger } from '@/components/mobile-sidebar-trigger';

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

        Two distinct layouts, on two different breakpoints:

        - `md` (768px) is Fumadocs' own hardcoded breakpoint for showing the
          real sidebar — the logo's own `md:w-[268px]` tracks that width so
          it stays aligned with the sidebar whenever it's visible.
        - The nav links + search bar sharing one inline row need
          comfortably more room than that (measured: overflows and shows a
          scrollbar anywhere under ~920px). A second, wider custom
          breakpoint (940px, picked with a bit of margin past that
          measurement) decides THAT layout independently — below it, nav
          and search fall back to the same compact/stacked treatment as
          true mobile even though the sidebar itself may already be
          visible (in the 768–940px gap).

        Rendered twice (nav links, search) and toggled with hidden/flex per
        breakpoint, rather than one flex row trying to reflow across every
        width. The one-row-that-reflows version this replaced looked fine
        at both endpoints individually but broke in between: items would
        shrink, wrap mid-word, or scroll off-screen with a visible
        scrollbar. Two intentional layouts are more code but each one is
        predictable — and neither ever needs to scroll.
      */}
      <header className="sticky top-0 z-40 border-b bg-fd-background">
        <div className="flex items-center gap-3 px-4 py-3 min-[940px]:gap-0 min-[940px]:py-0">
          {/*
            Not reactive to the sidebar's collapse state — that variable is
            scoped to #nd-docs-layout's descendants, and this header is a
            sibling of that grid, not one — an accepted gap rather than
            wiring a second SidebarProvider just for this.
          */}
          <Link
            href={homeUrl}
            className="flex shrink-0 items-center gap-2 font-semibold text-nowrap text-fd-foreground md:w-[268px] min-[940px]:py-4 min-[940px]:ps-4"
          >
            <Image src={markSrc} alt="" width={24} height={24} />
            {wordmark}
          </Link>
          {/* >= 940px: nav links + full search bar share the rest of the row. */}
          <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 overflow-x-auto py-3 pe-4 min-[940px]:flex">
            <ProductNavBar active={product} />
            <SearchBarButton className="w-56 shrink-0" />
          </div>
          {/* < 940px: just the icon-only search, next to the logo. */}
          <SearchBarButton className="ms-auto shrink-0 min-[940px]:hidden" />
        </div>
        {/* < 940px: nav links get their own scrollable row below. */}
        <div className="overflow-x-auto border-t px-4 py-2.5 min-[940px]:hidden">
          <ProductNavBar active={product} />
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
          // `$id` is fumadocs' own documented field for this: "ID for the
          // node, unique in all page trees." Without it, every product's
          // tree wrapper object gets same auto-assigned id ("0", from a
          // useRef counter that restarts at 0 per TreeContextProvider
          // instance — see fumadocs-ui/dist/contexts/tree.js). Fumadocs'
          // useFooterItems() caches its flattened prev/next list in a
          // module-level Map keyed by that id, which persists across the
          // whole `next build` process — so once any one product's page
          // populates the "0" cache entry, every other product's pages
          // rendered afterward in that same process read back the WRONG
          // (first product's) footer list on the server, while a client
          // hydration (fresh module state, empty cache) computes the
          // correct one — a real cross-request cache collision, and the
          // root cause of a site-wide hydration mismatch on the
          // Previous/Next page footer links. Setting our own stable,
          // per-product id here means fumadocs' `root.$id ??= ...` never
          // overwrites it, so each product gets its own cache entry.
          tree={{ name: 'docs', children: tree, $id: product }}
          links={linkItems}
          nav={{ component: <MobileSidebarTrigger /> }}
          searchToggle={{ enabled: false }}
          sidebar={{ collapsible: false }}
        >
          {children}
        </DocsLayout>
      </DocsVersionProvider>
      <KeetRoomModalMount />
    </>
  );
}
