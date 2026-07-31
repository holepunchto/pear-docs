'use client';

/**
 * Platform version selector, rendered in the article beside the page title.
 *
 * It used to live in `sidebar.banner`, which hid it exactly when it mattered
 * most: fumadocs renders that banner inside `SidebarContent`, and below 768px
 * the sidebar becomes a drawer — so on a phone the control AND the only "you are
 * being shown a filtered page" signal both disappeared while `?v=` kept
 * filtering. In the article it is present at every width, next to the heading the
 * reader is already looking at.
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
  DOCS_VERSIONS_NEWEST_FIRST,
  isPlatformPath,
  resolveDocsVersion,
} from '@/lib/docs-versions';

/** Value of the "no selection" option; `?v=` is removed when it is picked. */
const ANNOTATE = '';

const SELECT_ID = 'pear-platform-version';
const HINT_ID = 'pear-platform-version-hint';

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
    <div className="flex shrink-0 flex-col gap-1 sm:items-end">
      <div className="flex items-center gap-2">
        <label
          htmlFor={SELECT_ID}
          className="text-xs font-medium whitespace-nowrap text-fd-muted-foreground"
        >
          Pear version
        </label>
        <select
          id={SELECT_ID}
          // Ties the "what am I looking at" sentence to the control for screen
          // readers, instead of leaving it as unassociated nearby text.
          aria-describedby={HINT_ID}
          value={current?.label ?? ANNOTATE}
          onChange={(e) =>
            setVersion(e.target.value === ANNOTATE ? null : e.target.value)
          }
          className="rounded-md border border-fd-border bg-fd-background px-2 py-1 text-sm text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
        >
          <option value={ANNOTATE}>All versions</option>
          {DOCS_VERSIONS_NEWEST_FIRST.map((v) => (
            <option key={v.value} value={v.label}>
              {optionLabel(v.label, v.stable, v.prerelease)}
            </option>
          ))}
        </select>
      </div>
      {/*
        `role="status"` (implicitly aria-live="polite") so that selecting a
        version announces what changed. Without it the page silently loses
        sections for a screen-reader user — WCAG 2.1 SC 4.1.3.
      */}
      <p
        id={HINT_ID}
        role="status"
        className="text-xs text-fd-muted-foreground sm:text-right"
      >
        {current
          ? `Showing only what Pear ${current.label} has.`
          : 'Showing every release, with badges on the differences.'}
      </p>
    </div>
  );
}
