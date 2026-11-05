import type { ReactNode } from 'react';

/**
 * A block whose visibility depends on the selected platform version.
 *
 * Deliberately NOT a client component and deliberately not conditional: it
 * always renders its children, carrying the decision as `data-version-*`
 * attributes for `<VersionFilter>` to act on after mount. That is the whole
 * point of the approach (design §11, option C):
 *
 *   - the SSR/exported HTML contains EVERY version's content, so the single
 *     canonical URL still indexes the full surface (requirement 4);
 *   - filtering is a class flip, so there is no re-render or hydration
 *     complexity, and no risk of the static export baking in a selection.
 *
 * `display: contents` (see global.css) keeps the wrapper out of layout, so
 * wrapping a heading plus its body changes nothing about prose spacing.
 *
 * Usually emitted by the `<VersionSection>` pragma via the remark plugin rather
 * than written by hand — reach for it directly only to gate a block that is not
 * a whole section, such as a single `<Callout>`.
 */
export function VersionGate({
  since,
  until,
  children,
}: {
  /** The release that ADDED this content; hidden for anything older. */
  since?: string;
  /** The release that REMOVED this content; hidden from that release on. */
  until?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-version-gate=""
      data-version-since={since}
      data-version-until={until}
    >
      {children}
    </div>
  );
}
