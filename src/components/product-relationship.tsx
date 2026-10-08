import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ProductKey = 'pear' | 'p2p' | 'bare';

interface Product { key: ProductKey; name: string; href: string; tagline: string; blurb: string }

/**
 * Hrefs live here, matching product-nav-bar.tsx. Note: check-internal-links
 * only walks content/, so these are NOT link-checked — every page rendering
 * this also carries the same destinations as checked prose links.
 *
 * Order is the dependency chain, top to bottom: Pear depends on both P2P
 * and Bare; P2P depends on Bare. Bare depends on nothing here.
 */
const TIERS: Product[] = [
  {
    key: 'pear',
    name: 'Pear',
    href: '/',
    tagline: 'The peer-to-peer platform',
    blurb:
      'Runtime, CLI, and over-the-air updates for building, sharing, and updating peer-to-peer apps on desktop, mobile, and terminal.',
  },
  {
    key: 'p2p',
    name: 'P2P',
    href: '/p2p',
    tagline: 'The peer-to-peer building blocks',
    blurb:
      'Hypercore, Hyperswarm, Autobase, and the rest — independent modules for storage, discovery, and replication. Not tied to Pear; usable from any Bare or Node.js app.',
  },
  {
    key: 'bare',
    name: 'Bare',
    href: '/bare',
    tagline: 'The zero-core JavaScript runtime',
    blurb:
      'A module system, native addons, and threads — everything else is opt-in. Embed it in a native app, or compile a script into one standalone binary.',
  },
];

const EXPLAINER_HREF = '/p2p/explanation/how-the-stack-fits-together';

/**
 * Above-the-fold signpost, rendered from content/index.mdx,
 * content/p2p/index.mdx, and content/bare/index.mdx; registered in
 * src/mdx-components.tsx.
 *
 * Always a vertical 3-tier stack — Pear on top, P2P in the middle, Bare at
 * the base — reflecting the real dependency chain, not just three peers.
 * The stack order never changes with `active`; only the "You are here"
 * highlight and which tiers are clickable do. This also means there's no
 * responsive branching to maintain: a stack is inherently vertical at every
 * viewport width, unlike the old 2-node pairwise version this replaced.
 *
 * Mermaid cannot do this job: mermaid.tsx renders an SVG string that
 * mermaid-zoom.tsx injects into a zoom handler, so clicks zoom and nodes
 * can never be links.
 *
 * NOTE: JSX serializes verbatim into the generated .md, so agents reading
 * /index.md see an empty tag. Every landing page repeats this pointer as
 * prose on purpose — do not delete those sentences as duplicates.
 *
 * The strict linear stack slightly understates the real graph — Pear also
 * depends on Bare directly, not only transitively through P2P — but the
 * sr-only summary below states that explicitly, so the simplified visual
 * doesn't misinform, it just doesn't draw every edge.
 */
export function ProductRelationship({ active }: { active: ProductKey }) {
  // MDX props aren't type-checked; an unrecognized value degrades to Pear.
  const current: ProductKey = active === 'p2p' || active === 'bare' ? active : 'pear';
  const currentName = TIERS.find((t) => t.key === current)!.name;

  return (
    <nav aria-label="Pear, P2P, and Bare" className="not-prose my-6 rounded-xl border bg-fd-card/50 p-3 sm:p-4">
      <p className="sr-only">
        Pear, the peer-to-peer platform, is built on both P2P, the
        peer-to-peer building blocks, and Bare, the zero-core JavaScript
        runtime underneath everything. P2P is itself built on Bare. You are
        reading the {currentName} docs.
      </p>

      <div className="flex flex-col items-stretch gap-2">
        {TIERS.map((tier, i) => (
          <div key={tier.key} className="flex flex-col items-stretch gap-2">
            <ProductPanel product={tier} isActive={tier.key === current} />
            {i < TIERS.length - 1 ? <TierConnector /> : null}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-sm text-fd-muted-foreground">
        <Link href={EXPLAINER_HREF} className="font-medium underline underline-offset-2 hover:no-underline">
          How the stack fits together
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

  const shell = 'rounded-lg border p-4';

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

/** Points down the stack — Pear builds on the tier below it, and so on. */
function TierConnector() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-1.5 self-center">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fd-muted-foreground">
        builds on
      </span>
      <ArrowDown className="size-4 shrink-0 text-fd-muted-foreground" />
    </div>
  );
}
