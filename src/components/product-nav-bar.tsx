import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ProductKey = 'pear' | 'p2p' | 'bare';

interface Product {
  key: ProductKey;
  name: string;
  href: string;
  tagline: string;
}

/**
 * Name/tagline pairs mirror product-relationship.tsx's TIERS (minus the
 * blurb — these buttons are a header + subheader, not the full stack
 * signpost), same duplication pattern product-switcher.tsx already uses
 * rather than sharing state across unrelated components.
 */
const PRODUCTS: Product[] = [
  { key: 'pear', name: 'Pear', href: '/', tagline: 'The peer-to-peer platform' },
  { key: 'p2p', name: 'P2P', href: '/p2p', tagline: 'The peer-to-peer building blocks' },
  { key: 'bare', name: 'Bare', href: '/bare', tagline: 'The zero-core JavaScript runtime' },
];

/**
 * Prominent top-bar counterpart to the sidebar's <ProductSwitcher /> pill
 * group — same three destinations, but sized and labeled to be noticed:
 * each button carries the product name and its one-line tagline, styled
 * after product-relationship.tsx's ProductPanel (name + uppercase tagline)
 * without the blurb paragraph, which doesn't fit a nav bar.
 */
export function ProductNavBar({ active }: { active: ProductKey }) {
  return (
    <nav aria-label="Pear, P2P, and Bare" className="mx-auto grid w-full max-w-3xl grid-cols-3 gap-2">
      {PRODUCTS.map((product) => {
        const isActive = product.key === active;
        const body = (
          <>
            <span className="block text-sm font-semibold text-fd-foreground">{product.name}</span>
            <span className="mt-0.5 block text-[0.6875rem] font-medium tracking-wide text-fd-muted-foreground uppercase">
              {product.tagline}
            </span>
          </>
        );
        const shell = 'rounded-lg border px-3 py-2 text-center transition-colors';

        if (isActive) {
          return (
            <div key={product.key} aria-current="page" className={cn(shell, 'border-fd-primary/50 bg-fd-primary/5')}>
              {body}
            </div>
          );
        }

        return (
          <Link
            key={product.key}
            href={product.href}
            className={cn(
              shell,
              'hover:border-fd-primary/50 hover:bg-fd-accent/50',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary',
            )}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
