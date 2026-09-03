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

import { useCallback, useEffect, useRef } from 'react';
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

/**
 * Set on a gate that the selection would hide but the reader deep-linked into.
 * `global.css` renders its value as an explanatory note above the section.
 */
const REVEALED_ATTR = 'data-version-revealed';

/** Escape for a QUOTED attribute-selector value (not `CSS.escape`, see below). */
const quoteEscape = (v: string) => v.replace(/["\\]/g, '\\$&');

/** Why a section the selected version does not have is on screen anyway. */
function revealNote(el: HTMLElement, selected: string): string {
  const since = el.dataset.versionSince;
  const until = el.dataset.versionUntil;
  const what = since
    ? `Added in ${since}`
    : until
      ? `Removed in ${until}`
      : 'Not in this release';
  return `${what} — not part of Pear ${selected}. Shown because you followed a link to it.`;
}

export function VersionFilter() {
  const version = useDocsVersion();
  // Client-side navigation swaps the article DOM without remounting this
  // component, so re-run per route as well as per selection.
  const pathname = usePathname();
  /** Last `location.hash` scrolled to, so a version switch does not re-scroll. */
  const scrolledFor = useRef<string | null>(null);

  const apply = useCallback((): HTMLElement | null => {
    // A deep link wins over the selection. `?v=3.0#pear-cores` used to drop the
    // reader at the top of the page with no explanation, because the target was
    // hidden and the browser had nothing to scroll to — the link silently did
    // nothing. Revealing the section and saying why beats both alternatives:
    // filtering it away (a broken-feeling link) and quietly dropping the whole
    // selection (the rest of the page changes for no visible reason).
    const hashId = decodeURIComponent(window.location.hash.slice(1));
    const holdsTarget = (el: HTMLElement) =>
      hashId !== '' &&
      (el.id === hashId ||
        el.getAttribute(STASHED_ID_ATTR) === hashId ||
        el.querySelector(
          `[id="${quoteEscape(hashId)}"], [${STASHED_ID_ATTR}="${quoteEscape(hashId)}"]`,
        ) !== null);

    // Pass 1 — decide visibility for every gate.
    let revealed: HTMLElement | null = null;
    for (const el of document.querySelectorAll<HTMLElement>(
      '[data-version-since], [data-version-until]',
    )) {
      const hide = isGateHidden(
        version,
        el.dataset.versionSince,
        el.dataset.versionUntil,
      );
      const reveal = hide && holdsTarget(el);

      el.toggleAttribute(HIDDEN_ATTR, hide && !reveal);
      if (reveal) {
        el.setAttribute(REVEALED_ATTR, revealNote(el, version ?? ''));
        revealed = el;
      } else {
        el.removeAttribute(REVEALED_ATTR);
      }
    }

    // Pass 2 — park the ids of everything inside a hidden gate, restore the
    // rest. Deliberately a SECOND pass rather than work done inside pass 1,
    // because gates nest: a `<VersionGate>` that applies to the selected version
    // can sit inside a `<VersionSection>` that does not. Deciding ids while
    // walking gate-by-gate restored the inner gate's ids even though the outer
    // one keeps the whole subtree `display: none` — which is exactly the
    // invisible-but-addressable heading this parking exists to prevent.
    // Asking `closest()` after all gates are marked is order-independent.
    const hiddenIds = new Set<string>();
    const scope = document.querySelector('article') ?? document.body;
    for (const node of scope.querySelectorAll<HTMLElement>(
      `[id], [${STASHED_ID_ATTR}]`,
    )) {
      const parked = node.getAttribute(STASHED_ID_ATTR);
      const id = node.id || parked;
      if (!id) continue;

      if (node.closest(`[${HIDDEN_ATTR}]`)) {
        hiddenIds.add(id);
        if (node.id) {
          node.setAttribute(STASHED_ID_ATTR, node.id);
          node.removeAttribute('id');
        }
      } else if (parked) {
        node.id = parked;
        node.removeAttribute(STASHED_ID_ATTR);
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
      // `quoteEscape`, not `CSS.escape` — the latter escapes identifiers, so an
      // id starting with a digit ("31-release") would come back as
      // `\31 -release` and match nothing inside a quoted attribute value.
      const href = `a[href="#${quoteEscape(id)}"]`;
      // Hide the list item where there is one, so no empty row or bullet is
      // left behind in the TOC rail.
      return `${TOC_SCOPE} :is(${href}, li:has(> ${href}))`;
    });
    style.textContent = selectors.length
      ? `${selectors.join(',\n')} { display: none !important; }`
      : '';

    return revealed;
  }, [version]);

  useEffect(() => {
    const revealed = apply();

    // The browser tried to scroll to the hash while the target was still hidden
    // and gave up, so it has to be done again now the section is on screen.
    //
    // Guarded by which hash was last scrolled to, NOT just by `revealed` being
    // set: this effect also re-runs whenever the selection changes, so an
    // unguarded call would yank the page back to the anchor every time the reader
    // touched the dropdown.
    const scrollOnce = (el: HTMLElement | null) => {
      const hash = window.location.hash;
      if (!el || scrolledFor.current === hash) return;
      scrolledFor.current = hash;
      el.scrollIntoView();
    };

    scrollOnce(revealed);

    const onHashChange = () => scrollOnce(apply());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [apply, pathname]);

  return null;
}
