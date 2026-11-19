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
 * Generic over `VersionAxis` (src/lib/version-axes.ts) — originally hard-coded
 * to Pear's four platform pages and its one `DOCS_VERSIONS` list, generalized
 * so the same component serves the three independent Bare axes (`bare-cli`,
 * `bare-runtime`, `bare-kit`) too, each with its own label and doc-state list.
 * Module and building-block reference pages register no axis at all, so this
 * renders nothing there — a version dropdown on `hypercore` or a `bare-*`
 * module page would assert exactly the false model the design forbids (design
 * doc §1: those track their own npm package version, not a shared axis).
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
import { getVersionAxis, resolveVersion, versionsNewestFirst } from '@/lib/version-axes';

/** Value of the "no selection" option; `?v=` is removed when it is picked. */
const ANNOTATE = '';

const SELECT_ID = 'docs-platform-version';
const HINT_ID = 'docs-platform-version-hint';

function optionLabel(label: string, stable?: boolean, prerelease?: boolean) {
  if (prerelease) return `${label} (prerelease)`;
  if (stable) return `${label} (latest)`;
  return label;
}

export function VersionDropdown() {
  const pathname = usePathname();
  const version = useDocsVersion();
  const setVersion = useSetDocsVersion();

  const axis = getVersionAxis(pathname);
  if (!axis) return null;

  // `?v=1.28.5` selects the "1.28" option: the dropdown is minor-granular.
  const current = resolveVersion(version, axis);

  return (
    <div className="flex shrink-0 flex-col gap-1 sm:items-end">
      <div className="flex items-center gap-2">
        <label
          htmlFor={SELECT_ID}
          className="text-xs font-medium whitespace-nowrap text-fd-muted-foreground"
        >
          {axis.label}
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
          {versionsNewestFirst(axis).map((v) => (
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
          ? `Showing only what ${axis.label.replace(/ version$/, '')} ${current.label} has.`
          : 'Showing every release, with badges on the differences.'}
      </p>
    </div>
  );
}
