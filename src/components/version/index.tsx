'use client';

/**
 * Platform version annotations for the Pear reference pages.
 *
 * The Pear platform pages are single-source: one page documents every 3.x
 * release, and content that only applies to some releases is marked rather than
 * duplicated into per-version copies. See docs/plans/DOCS-VERSIONING-DESIGN.md
 * §1.2, §4 and §11.
 *
 *   <Since v="3.1.0" />   the thing described was ADDED in 3.1.0
 *   <Until v="3.1.0" />   the thing described was REMOVED in 3.1.0
 *
 * Two render modes, chosen by whether a version is explicitly selected:
 *
 *   no selection (default)  annotate — render everything, badge the deltas.
 *                           This is what search engines and first-time readers
 *                           get, so the canonical page contains the full
 *                           surface (per requirement 4: one indexed URL for
 *                           the platform).
 *   version selected        filter — hide content that does not apply to it.
 *
 * Selection is read on the client because the site is a static export
 * (`output: export`, `force-static`), so query strings are not available at
 * build time.
 *
 * NOTE the markers here are deliberately INLINE (`<span>`): they are used inside
 * paragraphs and inside `<Callout>` bodies, where a block element would be
 * invalid nesting. WHOLE-BLOCK gating is a separate mechanism — `<VersionGate>`
 * plus the `<VersionSection>` pragma, filtered by `<VersionFilter>`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { compareVersions } from '@/lib/docs-versions';
import { getVersionAxis, resolveVersion } from '@/lib/version-axes';

// Re-exported: `compareVersions` has always been part of this module's surface,
// but it lives in `@/lib/docs-versions` now so the remark/Shiki side and the
// client side share one implementation.
export { compareVersions };

/** Query-string key the dropdown drives. */
export const VERSION_PARAM = 'v';

interface DocsVersionState {
  /** `null` means "no explicit selection" -> annotate mode. */
  version: string | null;
  /** Select a version, or `null` to return to annotate mode. */
  setVersion: (next: string | null) => void;
}

const DocsVersionContext = createContext<DocsVersionState>({
  version: null,
  setVersion: () => {},
});

/** `null` means "no explicit selection" -> annotate mode. */
export function useDocsVersion(): string | null {
  return useContext(DocsVersionContext).version;
}

/** Setter for the dropdown. Updates React state and the URL together. */
export function useSetDocsVersion(): (next: string | null) => void {
  return useContext(DocsVersionContext).setVersion;
}

/**
 * `axis` is the CURRENT PAGE's axis (derived from pathname by the caller) —
 * a Bare page's `?v=1.28` has to be validated against that page's own
 * doc-states, not Pear's "3.0"/"3.1" values, so this can no longer resolve
 * against one hard-coded list (see src/lib/version-axes.ts).
 */
function readVersionFromLocation(axis: ReturnType<typeof getVersionAxis>): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(VERSION_PARAM);
  if (!value || !/^\d+\.\d+(\.\d+)?/.test(value)) return null;

  // Honour the value only if it maps onto a real doc-state. Otherwise `?v=2.9`
  // — well-formed but older than every entry — would hide every `since` gate
  // while the dropdown, which renders `resolveVersion(...)`, showed "All
  // versions" and claimed nothing was filtered. Worse, the reader could not
  // undo it: the `<select>` already sits on that option, so choosing it fires
  // no change event. Degrading to annotate mode keeps the three in agreement.
  return resolveVersion(value, axis) ? value : null;
}

/**
 * Wraps the docs layout — and must wrap `DocsLayout` itself, not just its
 * children, because the dropdown is passed to `DocsLayout` via `sidebar.banner`
 * and is therefore rendered BY `DocsLayout`, outside of `children`.
 *
 * Reads `?v=` after mount (never during render, so the static HTML stays
 * selection-free and cacheable).
 */
/**
 * How close together two selections have to be to count as one traversal rather
 * than two decisions. Comfortably above key-repeat, far below deliberate reading.
 */
const TRAVERSAL_WINDOW_MS = 400;

export function DocsVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<string | null>(null);
  const pathname = usePathname();
  /** When the URL was last written, to tell a keyboard run from real choices. */
  const lastCommitAt = useRef(0);

  // Re-sync on mount, on history navigation, and on client-side route changes.
  //
  // `popstate` covers back/forward — including back/forward across the entries
  // `setVersion` pushes — but it does NOT fire for `pushState` itself, which is
  // why `setVersion` sets React state directly. The `pathname` dependency
  // matters for two reasons: in-site links carry no `?v=`, so navigating to a
  // sibling page must drop a stale selection rather than keep filtering the
  // new page — and the axis itself is derived from `pathname`, so a
  // navigation from a Bare page to a Pear page must re-validate `?v=` against
  // the new page's doc-states, not the old one's.
  useEffect(() => {
    const axis = getVersionAxis(pathname);
    const sync = () => setVersionState(readVersionFromLocation(axis));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [pathname]);

  const setVersion = useCallback((next: string | null) => {
    setVersionState(next);
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (next === null) url.searchParams.delete(VERSION_PARAM);
    else url.searchParams.set(VERSION_PARAM, next);

    // `pushState` (not `replace`): each selection gets its own history entry, so
    // back/forward steps through selections. Next's App Router treats a bare
    // `history.pushState` as a URL-only update — no navigation, no scroll reset.
    //
    // Except for a run of changes in quick succession, which is not a reader
    // making several decisions: on Windows and Linux, arrow keys on a CLOSED
    // `<select>` move the selection and fire `change` on every keypress, so a
    // keyboard user passing over options would mint a history entry each and then
    // need that many Backs to leave the page. (macOS opens the native popup
    // instead and fires nothing until commit — verified: four ArrowDowns produced
    // zero `change` events — which is why this is guarded rather than reworked.)
    // Collapsing a rapid run keeps one entry per intended selection on both.
    const now = Date.now();
    const isRapidRun = now - lastCommitAt.current < TRAVERSAL_WINDOW_MS;
    lastCommitAt.current = now;

    if (isRapidRun) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, []);

  const value = useMemo(() => ({ version, setVersion }), [version, setVersion]);

  return (
    <DocsVersionContext.Provider value={value}>
      {children}
    </DocsVersionContext.Provider>
  );
}

/**
 * Since = added (green). Until = a specific flag/behavior dropped from a
 * command that still exists (yellow, cautionary) — distinct from
 * `<Status level="removed">`, which marks a whole command as gone (red).
 */
const BADGE_COLORS = {
  since: '#7dde9a',
  until: '#f0e57a',
} as const;

function VersionBadge({
  variant,
  children,
}: {
  variant: keyof typeof BADGE_COLORS;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-xs font-medium align-baseline"
      style={{ backgroundColor: BADGE_COLORS[variant], color: '#1a1a1a' }}
    >
      {children}
    </span>
  );
}

interface MarkerProps {
  /** The release that added (Since) or removed (Until) the content. */
  v: string;
  /** Override the badge text, e.g. label="Fixed in 3.1.0". */
  label?: string;
  /**
   * Optional. When present the marker acts as a GATE: children are hidden for
   * versions the content does not apply to. When absent it is a pure
   * ANNOTATION and is never hidden — see the note below.
   */
  children?: ReactNode;
}

/**
 * Whether a marker should hide itself.
 *
 * ⚠️ Childless markers are NEVER hidden, and that is deliberate. A self-closing
 * `<Since v="3.1.0" />` sits *next to* the content it describes, not around it,
 * so hiding it would remove the warning while leaving the feature documented —
 * strictly worse than showing it. (Caught by testing `?v=3.0.1`: the `pear
 * cores` section stayed visible while its "New in 3.1.0" badge vanished.)
 *
 * Only a marker with children can meaningfully gate anything. Hiding a whole
 * `##` block and its body is what `<VersionSection>` / `<VersionGate>` are for.
 */
function hidden(
  selected: string | null,
  v: string,
  children: ReactNode,
  direction: 'since' | 'until',
): boolean {
  if (!selected || children === undefined) return false;
  const cmp = compareVersions(selected, v);
  return direction === 'since' ? cmp < 0 : cmp >= 0;
}

/** Content that exists from `v` onward. */
export function Since({ v, label, children }: MarkerProps) {
  const selected = useDocsVersion();
  if (hidden(selected, v, children, 'since')) return null;

  return (
    <>
      <VersionBadge variant="since">{label ?? `New in ${v}`}</VersionBadge>
      {children}
    </>
  );
}

/** Content that existed up to — but not including — `v`. */
export function Until({ v, label, children }: MarkerProps) {
  const selected = useDocsVersion();
  if (hidden(selected, v, children, 'until')) return null;

  return (
    <>
      <VersionBadge variant="until">{label ?? `Removed in ${v}`}</VersionBadge>
      {children}
    </>
  );
}
