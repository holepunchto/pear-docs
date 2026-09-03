import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ProductKey = 'pear' | 'p2p' | 'bare';

interface Product {
  key: ProductKey;
  name: string;
  href: string;
}

const PRODUCTS: Product[] = [
  { key: 'pear', name: 'P2P Deployments', href: '/' },
  { key: 'p2p', name: 'P2P Building Blocks', href: '/p2p' },
  { key: 'bare', name: 'Bare', href: '/bare' },
];

/**
 * Flat text nav links for the top bar. Labels describe what each product
 * tree covers rather than the bare product name — Pear is "P2P
 * Deployments" (staging/seeding/provisioning P2P apps), P2P is "P2P
 * Building Blocks" (Hypercore/Hyperswarm/etc), Bare stays "Bare" (the
 * runtime, not itself P2P-specific). `key`/`href` are unchanged — this only
 * relabels the link text. No cards or taglines, styled after pears.com's
 * own top nav (plain label, active one picks up the brand accent color).
 * Rendered inside the header's own flex row in `[[...slug]]/layout.tsx`,
 * alongside the wordmark.
 */
export function ProductNavBar({ active }: { active: ProductKey }) {
  return (
    <nav aria-label="P2P Deployments, P2P Building Blocks, and Bare" className="flex items-center gap-6 text-sm font-medium">
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
