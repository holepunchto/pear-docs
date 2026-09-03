/**
 * The Pear platform doc-states the version dropdown offers.
 *
 * A "doc-state" is not a release. Pear ships roughly every two weeks, but the
 * documented surface only changes on some of those releases, so the dropdown is
 * at MINOR granularity ("3.1", not "3.1.0", "3.1.1", …) — design decision 5.
 * Readers on 3.1.4 pick "3.1" and see the surface their build has.
 *
 * Phase 3 replaces this hand-maintained literal with a generator that diffs
 * `cmd/index.js` between tags (recipe in the cli.mdx maintainer note and design
 * §1.1). Until then, add an entry here when a release changes the documented
 * surface.
 *
 * Scope: the four `content/pear/reference/pear/*` platform pages ONLY. Module and
 * bare reference pages are versioned by their own npm versions and must never
 * appear behind this dropdown (design §1) — see `isPlatformPath`.
 */

export interface DocsVersion {
  /** Dropdown text, minor granularity: "3.1". Also what lands in `?v=`. */
  label: string;
  /** Compared by `compareVersions`: "3.1.0". */
  value: string;
  /** Exactly one entry is the default / canonical release. */
  stable?: boolean;
  /**
   * Badge it in the dropdown. Doc-states are query params (`?v=`) on the one
   * canonical page, not routes, so there is nothing extra to `noIndex` — if a
   * per-version route is ever added, that route has to opt out of indexing.
   */
  prerelease?: boolean;
}

/**
 * The supported doc-states. Order here is for humans; consumers read
 * `DOCS_VERSIONS_NEWEST_FIRST`, so appending an entry cannot break anything.
 *
 * `npm run check:docs-versions` enforces the invariants this list has to hold:
 * exactly one `stable`, unique labels and values, and every version referenced
 * by a gate in `content/` present here.
 */
export const DOCS_VERSIONS: DocsVersion[] = [
  { label: '3.3', value: '3.3.0', stable: true },
  { label: '3.2', value: '3.2.0' },
  { label: '3.1', value: '3.1.0' },
  { label: '3.0', value: '3.0.0' },
];

/**
 * Sorted, so `resolveDocsVersion` and the dropdown do not depend on the literal
 * above being hand-ordered. It used to: `resolveDocsVersion` takes the FIRST
 * entry at or below the selection, so an entry appended out of order resolved to
 * an older doc-state than the reader picked, silently.
 */
export const DOCS_VERSIONS_NEWEST_FIRST: DocsVersion[] = [...DOCS_VERSIONS].sort(
  (a, b) => compareVersions(b.value, a.value),
);

/**
 * The current stable release — derived from the `stable` flag, never from array
 * position (`check:docs-versions` asserts exactly one entry carries it).
 *
 * This is NOT the default *view*: absent `?v=` the page renders annotate mode,
 * showing every release. It is the default *audience*: what a reader following
 * an unversioned link is assumed to be running, which is how
 * `check:internal-links` decides whether a bare `#anchor` link actually resolves
 * for the majority of readers.
 */
export const STABLE_DOCS_VERSION: DocsVersion =
  DOCS_VERSIONS.find((v) => v.stable) ?? DOCS_VERSIONS_NEWEST_FIRST[0];

/**
 * Compare two SemVer-ish strings. Returns <0, 0, >0.
 *
 * Tolerates partial versions ("3.1" from the minor-level dropdown, per design
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
 * Map an arbitrary `?v=` value onto the doc-state that documents it.
 *
 * `?v=3.0.1` resolves to the "3.0" entry: the dropdown is minor-granular, so a
 * patch release belongs to the newest doc-state that is not newer than it.
 * Returns `null` for no selection, and for versions older than every entry.
 */
export function resolveDocsVersion(selected: string | null): DocsVersion | null {
  if (!selected) return null;
  // Newest-first, so the first entry at or below `selected` describes it.
  return (
    DOCS_VERSIONS_NEWEST_FIRST.find(
      (v) => compareVersions(selected, v.value) >= 0,
    ) ?? null
  );
}

/**
 * Whether a gated block does not apply to `selected`, and so should be hidden.
 *
 * `since` = the content was ADDED in that release, so it is absent below it.
 * `until` = the content was REMOVED in that release, so it is absent from it on.
 * No selection means annotate mode: nothing is hidden.
 *
 * Shared by the `<Since>` / `<Until>` components and by the client filter that
 * toggles `data-version-*` blocks and code lines, so all three agree.
 */
export function isGateHidden(
  selected: string | null,
  since?: string | null,
  until?: string | null,
): boolean {
  if (!selected) return false;
  if (since && compareVersions(selected, since) < 0) return true;
  if (until && compareVersions(selected, until) >= 0) return true;
  return false;
}

/**
 * Pathname prefix the dropdown is scoped to.
 *
 * The docs layout is shared by every page, so the dropdown has to be gated on
 * this. Showing it on `hypercore` would assert exactly the false model the
 * design forbids: that module APIs move with the platform version.
 */
const PLATFORM_PREFIX = '/pear/reference/pear/';

/** Whether `pathname` is one of the Pear platform reference pages. */
export function isPlatformPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // `trailingSlash: true`, but tolerate either shape.
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  // A trailing-slash-only match would be the (nonexistent) `/pear/reference/pear`
  // index; require something after the prefix.
  return p.startsWith(PLATFORM_PREFIX) && p.length > PLATFORM_PREFIX.length;
}
