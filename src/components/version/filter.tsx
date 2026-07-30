'use client';

/**
 * Applies the selected platform version to the rendered page.
 *
 * Everything gated ships in the HTML carrying `data-version-since` /
 * `data-version-until`; this effect decides what to hide. Two producers of those
 * attributes, one consumer:
 *
 *   - `<VersionGate>` (whole blocks: a section, a callout) — a wrapper element;
 *   - the Shiki `version-lines` transformer (single rows inside a code fence) —
 *     a `<span class="line">`.
 *
 * It also hides TOC entries that point at hidden headings. That cannot be done
 * server-side: `page.data.toc` is extracted by remark, which walks INTO JSX, so
 * every heading lands in the TOC whether or not it is wrapped in a gate
 * (verified empirically — it is why option C was chosen over A and B).
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDocsVersion } from '@/components/version';
import { isGateHidden } from '@/lib/docs-versions';

/** Flipped by this effect; `global.css` turns it into `display: none`. */
const HIDDEN_ATTR = 'data-version-hidden';

/** Desktop TOC, and the mobile popover TOC when it is mounted. */
const TOC_CONTAINERS = ['#nd-toc', '#nd-tocnav'];

export function VersionFilter() {
  const version = useDocsVersion();
  // Client-side navigation swaps the article DOM without remounting this
  // component, so re-run per route as well as per selection.
  const pathname = usePathname();

  useEffect(() => {
    const gates = document.querySelectorAll<HTMLElement>(
      '[data-version-since], [data-version-until]',
    );

    const hiddenIds = new Set<string>();
    for (const el of gates) {
      const hide = isGateHidden(
        version,
        el.dataset.versionSince,
        el.dataset.versionUntil,
      );
      el.toggleAttribute(HIDDEN_ATTR, hide);
      if (!hide) continue;
      if (el.id) hiddenIds.add(el.id);
      for (const withId of el.querySelectorAll<HTMLElement>('[id]')) {
        hiddenIds.add(withId.id);
      }
    }

    for (const container of TOC_CONTAINERS) {
      const root = document.querySelector(container);
      if (!root) continue;
      for (const link of root.querySelectorAll<HTMLElement>('a[href*="#"]')) {
        const href = link.getAttribute('href') ?? '';
        const id = decodeURIComponent(href.slice(href.indexOf('#') + 1));
        // Hide the list item where there is one, so no empty row or bullet is
        // left behind in the TOC rail.
        const target = link.closest('li') ?? link;
        target.toggleAttribute(HIDDEN_ATTR, id !== '' && hiddenIds.has(id));
      }
    }
  }, [version, pathname]);

  return null;
}
