'use client';

import { SidebarTrigger } from 'fumadocs-ui/components/sidebar/base';
import { Sidebar } from 'lucide-react';

/**
 * Replaces Fumadocs' default mobile subnav (`nav.component` on DocsLayout)
 * entirely — that default row repeats the wordmark (already in our own
 * top bar, see [[...slug]]/layout.tsx) and the search toggle (disabled,
 * see searchToggle={{enabled: false}}), leaving a mostly-empty bar with
 * just the sidebar-open button floating on the right. This is that one
 * button alone, sized to its content instead of a full empty-looking row.
 *
 * Passed as a prop value (`nav.component`), so it only mounts once
 * DocsLayout inserts it into its own tree — which is inside the
 * SidebarProvider that `useSidebar()`/`SidebarTrigger` need, regardless of
 * where this file is imported from.
 */
export function MobileSidebarTrigger() {
  return (
    // [grid-area:header] claims the same grid cell the default nd-subnav
    // header uses — without it, this lands wherever CSS grid auto-placement
    // decides (in practice a near-zero-width column), not the actual header row.
    <div
      id="nd-subnav"
      className="[grid-area:header] sticky top-(--fd-docs-row-1) z-30 flex h-(--fd-header-height) items-center justify-end border-b bg-fd-background/80 px-2.5 backdrop-blur-sm md:hidden max-md:layout:[--fd-header-height:--spacing(14)]"
    >
      <SidebarTrigger className="rounded-lg p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
        <Sidebar className="size-4.5" />
      </SidebarTrigger>
    </div>
  );
}
