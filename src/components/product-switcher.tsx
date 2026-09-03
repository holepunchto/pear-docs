import Link from 'next/link';
import { cn } from '@/lib/cn';

const PRODUCTS = [
  { key: 'pear', label: 'Pear', href: '/' },
  { key: 'p2p', label: 'P2P', href: '/p2p' },
  { key: 'bare', label: 'Bare', href: '/bare' },
] as const;

/**
 * Switches between Pear's, P2P's, and Bare's sidebar trees. A real
 * navigation to each product's landing page, not a client-side tree swap —
 * this is a fully static export (see docs/plans/PEAR-BARE-SPLIT-PITCH.md,
 * "Phase 1 spike: findings"), so the target page's own `product` frontmatter
 * is what actually decides which tree renders once you land there.
 */
export function ProductSwitcher({ active }: { active: 'pear' | 'p2p' | 'bare' }) {
  return (
    <div className="flex gap-1 rounded-lg border p-1 text-sm">
      {PRODUCTS.map((product) => (
        <Link
          key={product.key}
          href={product.href}
          className={cn(
            'flex-1 rounded-md px-2 py-1 text-center transition-colors',
            active === product.key
              ? 'bg-fd-primary/10 text-fd-primary font-medium'
              : 'text-fd-muted-foreground hover:bg-fd-accent/50',
          )}
        >
          {product.label}
        </Link>
      ))}
    </div>
  );
}
