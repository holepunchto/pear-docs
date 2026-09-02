import Link from 'next/link';
import { cn } from '@/lib/cn';

export type SectionProduct = 'pear' | 'p2p' | 'bare';

interface Section {
  name: string;
  href: string;
  /** Pathname prefix that counts as "on this section", for the active-tab underline. */
  matchPrefix: string;
}

/**
 * Top-level sections per product, in tree order. Mirrors the top-level
 * nodes of `pear-tree.ts`/`p2p-tree.ts`/`bare-tree.ts` (minus the product
 * root page itself, which isn't a "section"). `href` is where the tab
 * navigates to; `matchPrefix` is what decides whether it's the active tab,
 * since a section's own href (e.g. Bare's "About" landing on
 * `use-bare-standalone`) doesn't always equal the URL prefix its pages
 * share (`/bare/explanation/**`).
 */
const SECTIONS: Record<SectionProduct, Section[]> = {
  pear: [
    { name: 'Getting Started', href: '/pear/getting-started', matchPrefix: '/pear/getting-started' },
    { name: 'About', href: '/pear/explanation', matchPrefix: '/pear/explanation' },
    { name: 'How To', href: '/pear/how-to', matchPrefix: '/pear/how-to' },
    { name: 'Reference', href: '/pear/reference', matchPrefix: '/pear/reference' },
    { name: 'Release Overview', href: '/pear/release-overview', matchPrefix: '/pear/release-overview' },
  ],
  p2p: [
    { name: 'Getting Started', href: '/p2p/getting-started', matchPrefix: '/p2p/getting-started' },
    { name: 'About', href: '/p2p/explanation/how-the-stack-fits-together', matchPrefix: '/p2p/explanation' },
    { name: 'How To', href: '/p2p/how-to', matchPrefix: '/p2p/how-to' },
    { name: 'Reference', href: '/p2p/reference', matchPrefix: '/p2p/reference' },
  ],
  bare: [
    { name: 'About', href: '/bare/explanation/use-bare-standalone', matchPrefix: '/bare/explanation' },
    { name: 'How To', href: '/bare/how-to', matchPrefix: '/bare/how-to' },
    { name: 'Reference', href: '/bare/reference', matchPrefix: '/bare/reference' },
    { name: 'Release Overview', href: '/bare/release-overview', matchPrefix: '/bare/release-overview' },
  ],
};

/**
 * Horizontal tab strip for a product's main sections, rendered at the top
 * of every page's article. Hand-rolled rather than Fumadocs' built-in
 * `tabMode: 'top'`/root-folder tabs: those render as a sibling grid item
 * sharing the same single-row `grid-area: main` cell as the page content
 * (see `fumadocs-ui/dist/layouts/docs/client.js`'s `gridTemplate`), so with
 * no space reserved for them they render full-height and cover the entire
 * page. Living inside the article's normal flow (a `page.tsx` child, not a
 * `DocsLayout` child) sidesteps that entirely.
 */
export function SectionNav({ product, pathname }: { product: SectionProduct; pathname: string }) {
  return (
    <nav aria-label="Sections" className="not-prose mb-6 flex flex-row items-end gap-6 overflow-x-auto border-b">
      {SECTIONS[product].map((section) => {
        const active = pathname === section.matchPrefix || pathname.startsWith(`${section.matchPrefix}/`);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              'inline-flex items-center gap-2 text-nowrap border-b-2 border-transparent pb-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
              active && 'border-fd-primary text-fd-primary',
            )}
          >
            {section.name}
          </Link>
        );
      })}
    </nav>
  );
}
