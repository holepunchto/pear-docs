'use client';

/**
 * Platform version selector, rendered in the docs sidebar banner.
 *
 * Scoped to `/reference/pear/*` — the four Pear platform pages. Module and bare
 * reference pages track their own npm versions, so a platform dropdown on
 * `hypercore` would assert exactly the false model the design forbids (§1).
 *
 * A native `<select>` rather than Fumadocs' `SidebarTabsDropdown`: that
 * primitive is URL-based (`isTabActive` compares pathname), and our versions are
 * query-param variants of ONE url, so its active-state would be wrong on every
 * page. A `<select>` also gets keyboard support, mobile pickers, and
 * `output: export` compatibility for free.
 *
 * Three states, not two — "All versions" is the default and is distinct from
 * picking the latest release. It renders every version's content with badges,
 * which is what the canonical URL indexes (requirement 3).
 */

import { usePathname } from 'next/navigation';
import { useDocsVersion, useSetDocsVersion } from '@/components/version';
import {
  DOCS_VERSIONS,
  isPlatformPath,
  resolveDocsVersion,
} from '@/lib/docs-versions';

/** Value of the "no selection" option; `?v=` is removed when it is picked. */
const ANNOTATE = '';

function optionLabel(label: string, stable?: boolean, prerelease?: boolean) {
  if (prerelease) return `${label} (prerelease)`;
  if (stable) return `${label} (latest)`;
  return label;
}

export function VersionDropdown() {
  const pathname = usePathname();
  const version = useDocsVersion();
  const setVersion = useSetDocsVersion();

  if (!isPlatformPath(pathname)) return null;

  // `?v=3.0.1` selects the "3.0" option: the dropdown is minor-granular.
  const current = resolveDocsVersion(version);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-fd-border bg-fd-card p-3">
      <label
        htmlFor="pear-platform-version"
        className="text-xs font-medium text-fd-muted-foreground"
      >
        Pear version
      </label>
      <select
        id="pear-platform-version"
        value={current?.label ?? ANNOTATE}
        onChange={(e) =>
          setVersion(e.target.value === ANNOTATE ? null : e.target.value)
        }
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
      >
        <option value={ANNOTATE}>All versions</option>
        {DOCS_VERSIONS.map((v) => (
          <option key={v.value} value={v.label}>
            {optionLabel(v.label, v.stable, v.prerelease)}
          </option>
        ))}
      </select>
      <p className="text-xs text-fd-muted-foreground">
        {current
          ? `Showing only what Pear ${current.label} has.`
          : 'Showing every release, with badges on the differences.'}
      </p>
    </div>
  );
}
