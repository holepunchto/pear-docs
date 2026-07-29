'use client';

/**
 * Platform version annotations for the Pear reference pages.
 *
 * The Pear platform pages are single-source: one page documents every 3.x
 * release, and content that only applies to some versions is marked with
 * `<Since>` / `<Until>` rather than duplicated into per-version copies. See
 * docs/plans/DOCS-VERSIONING-DESIGN.md §1.2 and §4.
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
 * Phase 1 ships both modes plus the `?v=` reader; Phase 2 adds the dropdown
 * that sets it. Selection is read on the client because the site is a static
 * export (`output: export`, `force-static`), so query strings are not
 * available at build time.
 *
 * NOTE these are deliberately INLINE (`<span>`): they are used inside
 * paragraphs and inside `<Callout>` bodies, where a block element would be
 * invalid nesting. Whole-block gating is a separate concern for Phase 2.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** Query-string key the dropdown will drive. */
export const VERSION_PARAM = 'v';

const DocsVersionContext = createContext<string | null>(null);

/** `null` means "no explicit selection" -> annotate mode. */
export function useDocsVersion(): string | null {
  return useContext(DocsVersionContext);
}

function readVersionFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(VERSION_PARAM);
  return value && /^\d+\.\d+(\.\d+)?/.test(value) ? value : null;
}

/**
 * Wraps the docs layout. Reads `?v=` after mount (never during render, so the
 * static HTML stays selection-free and cacheable) and tracks history
 * navigation.
 */
export function DocsVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setVersion(readVersionFromLocation());
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return (
    <DocsVersionContext.Provider value={version}>
      {children}
    </DocsVersionContext.Provider>
  );
}

/**
 * Compare two SemVer-ish strings. Returns <0, 0, >0.
 *
 * Tolerates partial versions ("3.1" from a minor-level dropdown, per design
 * decision 5) by treating missing segments as 0, and ignores prerelease
 * suffixes — "3.1.0-rc.1" sorts as "3.1.0". That is intentional: a reader on an
 * RC should see the features of the release it is a candidate for.
 */
export function compareVersions(a: string, b: string): number {
  const seg = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const x = seg(a);
  const y = seg(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
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
 * Only a marker with children can meaningfully gate anything. Section-level
 * gating — hiding a whole `##` block and its body — needs more than a wrapper
 * component and is deliberately out of scope here.
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
