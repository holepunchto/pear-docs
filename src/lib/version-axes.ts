/**
 * The registry of version-dropdown axes across the whole site.
 *
 * `src/lib/docs-versions.ts` originally hard-coded a single axis (Pear's four
 * platform pages, one shared `DOCS_VERSIONS` list, `isPlatformPath`). This
 * file generalizes that into a registry so the same dropdown/gate machinery
 * can serve more axes without touching Pear's page or its hand-maintained
 * list at all.
 *
 * Bare adds THREE independent axes, one per page — not one shared "Bare"
 * selector — because `cli.mdx` and `runtime.mdx` (both from
 * `holepunchto/bare`) and `bare-kit.mdx` (from the separately-versioned
 * `holepunchto/react-native-bare-kit`) were decided to track their own
 * surfaces independently (see docs/plans/DOCS-VERSIONING-DESIGN.md and the
 * plan for this change). Each axis is scoped to an EXACT page path, not a
 * prefix — `/bare/reference/bare/` would otherwise also match all 76 generated
 * module pages, which must never show a platform-style dropdown (design
 * doc §1: modules version by their own npm package, not a shared axis).
 */

import { DOCS_VERSIONS, compareVersions, type DocsVersion } from './docs-versions';
import bareCliStates from './bare-cli-docs-states.json';
import bareRuntimeStates from './bare-runtime-docs-states.json';
import bareKitStates from './bare-kit-docs-states.json';

export interface VersionAxis {
  key: string;
  /** Dropdown label, e.g. "Bare CLI version". */
  label: string;
  /** Exact page.url(s) this axis applies to — never a prefix. */
  pagePaths: string[];
  versions: DocsVersion[];
}

/** One entry as scripts/gen-bare-docs-states.ts writes it — dropdown fields plus review aids. */
interface GeneratedDocState {
  label: string;
  value: string;
  stable?: boolean;
  prerelease?: boolean;
  releases: string[];
  delta: string[];
}

/** Strip the generator's `$generated`/`states` JSON wrapper down to `DocsVersion[]`. */
function toDocsVersions(json: { states: GeneratedDocState[] }): DocsVersion[] {
  return json.states.map((s) => ({
    label: s.label,
    value: s.value,
    ...('stable' in s && s.stable ? { stable: true as const } : {}),
    ...('prerelease' in s && s.prerelease ? { prerelease: true as const } : {}),
  }));
}

export const VERSION_AXES: VersionAxis[] = [
  {
    key: 'pear',
    label: 'Pear version',
    pagePaths: [
      '/pear/reference/pear/cli',
      '/pear/reference/pear/api',
      '/pear/reference/pear/configuration',
      '/pear/reference/pear/runtime',
    ],
    versions: DOCS_VERSIONS,
  },
  {
    key: 'bare-cli',
    label: 'Bare CLI version',
    pagePaths: ['/bare/reference/bare/cli'],
    versions: toDocsVersions(bareCliStates),
  },
  {
    key: 'bare-runtime',
    label: 'Bare runtime version',
    pagePaths: ['/bare/reference/bare/runtime'],
    versions: toDocsVersions(bareRuntimeStates),
  },
  {
    key: 'bare-kit',
    label: 'Bare Kit version',
    pagePaths: ['/bare/reference/bare/bare-kit'],
    versions: toDocsVersions(bareKitStates),
  },
];

/** Whether `pathname` belongs to a registered axis; `null` if it belongs to none. */
export function getVersionAxis(pathname: string | null | undefined): VersionAxis | null {
  if (!pathname) return null;
  // `trailingSlash: true`, but tolerate either shape — same normalization
  // `isPlatformPath` used, minus the trailing slash itself.
  const p = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return VERSION_AXES.find((axis) => axis.pagePaths.includes(p)) ?? null;
}

/** An axis's versions, newest first — same sort `DOCS_VERSIONS_NEWEST_FIRST` used. */
export function versionsNewestFirst(axis: VersionAxis): DocsVersion[] {
  return [...axis.versions].sort((a, b) => compareVersions(b.value, a.value));
}

/**
 * Map an arbitrary `?v=` value onto the doc-state that documents it, WITHIN
 * `axis`. Generalizes `resolveDocsVersion` (docs-versions.ts), which is
 * hard-wired to Pear's list, to any axis — a Bare page's `?v=1.28` must be
 * checked against that page's own axis, not Pear's "3.0"/"3.1" values.
 * Returns `null` for no selection, no axis, or a version older than every
 * entry in the axis.
 */
export function resolveVersion(selected: string | null, axis: VersionAxis | null): DocsVersion | null {
  if (!selected || !axis) return null;
  return versionsNewestFirst(axis).find((v) => compareVersions(selected, v.value) >= 0) ?? null;
}

/** The axis's current stable release — derived from the `stable` flag, never array position. */
export function stableVersion(axis: VersionAxis): DocsVersion {
  return axis.versions.find((v) => v.stable) ?? versionsNewestFirst(axis)[0];
}
