'use client';

import { Search } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { cn } from '@/lib/cn';

/**
 * Same look and behavior as Fumadocs' own `LargeSearchToggle`, rebuilt here
 * because that component lives at `fumadocs-ui/layouts/shared/search-toggle`,
 * a path the package's `exports` map doesn't expose publicly — only
 * `fumadocs-ui/contexts/search`'s `useSearchContext` is. Used in the top
 * bar (`[[...slug]]/layout.tsx`) instead of the sidebar's own search entry,
 * which is disabled there via `searchToggle={{ enabled: false }}`.
 */
export function SearchBarButton({ className }: { className?: string }) {
  const { setOpenSearch, hotKey } = useSearchContext();

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-fd-secondary/50 p-1.5 ps-2 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
        className,
      )}
    >
      <Search className="size-4" />
      Search
      <div className="ms-auto inline-flex gap-0.5">
        {hotKey.map((k, i) => (
          <kbd key={i} className="rounded-md border bg-fd-background px-1.5">
            {k.display}
          </kbd>
        ))}
      </div>
    </button>
  );
}
