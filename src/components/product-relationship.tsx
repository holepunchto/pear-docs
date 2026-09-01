import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ProductKey = 'pear' | 'bare';

interface Product { name: string; href: string; tagline: string; blurb: string }

/**
 * Hrefs live here, matching product-switcher.tsx. Note: check-internal-links
 * only walks content/, so these are NOT link-checked — every page rendering
 * this also carries the same destinations as checked prose links.
 */
const PRODUCTS: Record<ProductKey, Product> = {
  pear: {
    name: 'Pear',
    href: '/',
    tagline: 'The peer-to-peer platform',
    blurb:
      'Runtime, CLI, and over-the-air updates for building, sharing, and updating peer-to-peer apps on desktop, mobile, and terminal.',
  },
  bare: {
    name: 'Bare',
    href: '/bare',
    tagline: 'The zero-core JavaScript runtime',
    blurb:
      'A module system, native addons, and threads — everything else is opt-in. Embed it in a native app, or compile a script into one standalone binary.',
  },
};

const EXPLAINER_HREF = '/pear/explanation/pear-and-bare';

/**
 * Above-the-fold signpost, rendered from content/index.mdx and
 * content/bare/index.mdx; registered in src/mdx-components.tsx.
 *
 * The connector always points Pear -> Bare so the relationship, not the
 * current tab, is the message.
 *
 * Mermaid cannot do this job: mermaid.tsx renders an SVG string that
 * mermaid-zoom.tsx injects into a zoom handler, so clicks zoom and nodes
 * can never be links.
 *
 * NOTE: JSX serializes verbatim into the generated .md, so agents reading
 * /index.md see an empty tag. Both landing pages repeat this pointer as
 * prose on purpose — do not delete those sentences as duplicates.
 */
export function ProductRelationship({ active }: { active: ProductKey }) {
  // MDX props aren't type-checked; a typo'd active="Bare" degrades to Pear.
  const current: ProductKey = active === 'bare' ? 'bare' : 'pear';

  return (
    <nav aria-label="Pear and Bare" className="not-prose my-6 rounded-xl border bg-fd-card/50 p-3 sm:p-4">
      <p className="sr-only">
        Pear, the peer-to-peer platform, is built on Bare, the zero-core
        JavaScript runtime. You are reading the {PRODUCTS[current].name} docs.
      </p>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:gap-3">
        <ProductPanel product={PRODUCTS.pear} isActive={current === 'pear'} />
        <RelationshipConnector />
        <ProductPanel product={PRODUCTS.bare} isActive={current === 'bare'} />
      </div>

      <p className="mt-3 text-center text-sm text-fd-muted-foreground">
        <Link href={EXPLAINER_HREF} className="font-medium underline underline-offset-2 hover:no-underline">
          How Pear and Bare fit together
        </Link>{' '}
        walks every layer, from the native C foundations up to the apps you run.
      </p>
    </nav>
  );
}

function ProductPanel({ product, isActive }: { product: Product; isActive: boolean }) {
  // All <span> so the panel is legal inside an <a>.
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className="text-base font-semibold text-fd-foreground">{product.name}</span>
        {isActive ? (
          <span className="rounded-full border border-fd-primary/50 bg-fd-primary/10 px-2 py-0.5 text-[0.6875rem] font-medium text-fd-foreground">
            You are here
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
        {product.tagline}
      </span>
      <span className="mt-2 block text-sm text-fd-muted-foreground">{product.blurb}</span>
      {isActive ? null : (
        <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-fd-foreground">
          Go to the {product.name} docs
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  const shell = 'flex-1 rounded-lg border p-4';

  if (isActive) {
    return <div aria-current="page" className={cn(shell, 'border-fd-primary/50 bg-fd-primary/5')}>{body}</div>;
  }

  return (
    <Link
      href={product.href}
      className={cn(
        shell,
        'group block transition-colors hover:border-fd-primary/50 hover:bg-fd-accent/50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary',
      )}
    >
      {body}
    </Link>
  );
}

/** Direction is fixed Pear -> Bare and never flips with `active`. */
function RelationshipConnector() {
  return (
    <div aria-hidden className="flex shrink-0 items-center justify-center gap-1.5 sm:w-16 sm:flex-col sm:gap-1">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fd-muted-foreground">
        builds on
      </span>
      <ArrowDown className="size-4 shrink-0 text-fd-muted-foreground sm:hidden" />
      <ArrowRight className="hidden size-4 shrink-0 text-fd-muted-foreground sm:block" />
    </div>
  );
}
