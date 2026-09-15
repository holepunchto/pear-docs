import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ProductKey = 'pear' | 'p2p' | 'bare';

interface Product {
  key: ProductKey;
  name: string;
  href: string;
}

const PRODUCTS: Product[] = [
  { key: 'pear', name: 'Pear', href: '/' },
  { key: 'p2p', name: 'P2P', href: '/p2p' },
  { key: 'bare', name: 'Bare', href: '/bare' },
];

/**
 * Flat text nav links for the top bar — plain product names, matching the
 * sidebar, logo, and URL prefixes exactly. No cards or taglines, styled
 * after pears.com's own top nav (plain label, active one picks up the
 * brand accent color). Rendered inside the header's own flex row in
 * `[[...slug]]/layout.tsx`, alongside the wordmark.
 */
export function ProductNavBar({ active }: { active: ProductKey }) {
  return (
    <nav aria-label="Pear, P2P, and Bare" className="flex items-center gap-6 text-sm font-medium">
      {PRODUCTS.map((product) => {
        const isActive = product.key === active;
        return (
          <Link
            key={product.key}
            href={product.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'shrink-0 text-nowrap transition-colors',
              isActive ? 'text-fd-primary' : 'text-fd-muted-foreground hover:text-fd-foreground',
            )}
          >
            {product.name}
          </Link>
        );
      })}
    </nav>
  );
}
