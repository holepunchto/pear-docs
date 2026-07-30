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

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDocsVersion } from '@/components/version';
import { isGateHidden } from '@/lib/docs-versions';

/** Flipped by this effect; `global.css` turns it into `display: none`. */
const HIDDEN_ATTR = 'data-version-hidden';

/**
 * Where a hidden element's `id` is parked while it is hidden.
 *
 * Removing the id is not cosmetic. `useAnchorObserver`
 * (fumadocs-core/dist/toc.js) decides the active TOC entry, and whenever no
 * heading is intersecting it falls back to whichever WATCHED id is closest to
 * the viewport top — resolved with `document.getElementById`, which happily
 * returns `display: none` elements. A hidden element reports an all-zero
 * `getBoundingClientRect()`, so it scores ~0 distance, beats every real
 * heading, and locks the TOC highlight onto a section the reader cannot see.
 * Taking the id away makes that `getElementById` return null, which the
 * observer already skips.
 */
const STASHED_ID_ATTR = 'data-version-id';

/**
 * Desktop TOC, plus the mobile popover.
 *
 * `#nd-toc` carries `max-xl:hidden`, so below 1280px it is display:none and the
 * ONLY TOC on screen is `[data-toc-popover-content]`. Filtering just `#nd-toc`
 * silently did nothing on every narrow viewport.
 */
const TOC_SCOPE = ':is(#nd-toc, [data-toc-popover-content])';

/** Holds the generated TOC rules; one per document, reused across renders. */
const STYLE_ID = 'version-toc-filter';

export function VersionFilter() {
  const version = useDocsVersion();
  // Client-side navigation swaps the article DOM without remounting this
  // component, so re-run per route as well as per selection.
  const pathname = usePathname();

  const apply = useCallback(() => {
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

      // Both selectors, because a previous pass may already have parked the id.
      const withIds = [
        el,
        ...el.querySelectorAll<HTMLElement>(`[id], [${STASHED_ID_ATTR}]`),
      ];
      for (const node of withIds) {
        const stashed = node.getAttribute(STASHED_ID_ATTR);
        if (hide) {
          const id = node.id || stashed;
          if (!id) continue;
          hiddenIds.add(id);
          if (node.id) {
            node.setAttribute(STASHED_ID_ATTR, node.id);
            node.removeAttribute('id');
          }
        } else if (stashed) {
          node.id = stashed;
          node.removeAttribute(STASHED_ID_ATTR);
        }
      }
    }

    // TOC entries are hidden with GENERATED CSS keyed on the anchor's href,
    // rather than by walking the TOC and toggling attributes.
    //
    // The walking version could only ever mark links that existed when it ran,
    // and the mobile popover renders its links on first open — so on every
    // viewport below 1280px, where the popover is the only TOC, filtering
    // silently did nothing. A stylesheet needs no mount timing: whichever TOC
    // appears, whenever it appears, the rule is already waiting for it.
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.append(style);
    }
    const selectors = [...hiddenIds].map((id) => {
      // Escaped for a QUOTED attribute value, not with `CSS.escape` — that
      // escapes identifiers, so an id starting with a digit ("31-release")
      // would come back as `\31 -release` and match nothing in this position.
      const href = `a[href="#${id.replace(/["\\]/g, '\\$&')}"]`;
      // Hide the list item where there is one, so no empty row or bullet is
      // left behind in the TOC rail.
      return `${TOC_SCOPE} :is(${href}, li:has(> ${href}))`;
    });
    style.textContent = selectors.length
      ? `${selectors.join(',\n')} { display: none !important; }`
      : '';
  }, [version]);

  useEffect(() => {
    apply();
  }, [apply, pathname]);

  return null;
}
