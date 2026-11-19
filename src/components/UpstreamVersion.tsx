/**
 * "Documented against vX.Y.Z" marker for reference pages.
 *
 * Reference pages are written and verified against one specific upstream
 * release, declared as `upstreamVersion` in frontmatter. Surfacing it lets a
 * reader tell at a glance whether the page matches the version they have
 * installed — previously that fact was buried in `[src]` link URLs, or absent
 * entirely (every page under content/reference/bare/ had no pin at all).
 *
 * Rendered by the page template from frontmatter, so pages don't embed it
 * themselves. Pages with no `upstreamVersion` render nothing.
 *
 * The companion `npm run check:upstream-pins` grades the same field against
 * npm latest. See docs/plans/DOCS-VERSIONING-DESIGN.md §5.
 */
export function UpstreamVersion({ version }: { version?: string }) {
  if (!version) return null;

  return (
    <span
      className="text-xs text-fd-muted-foreground whitespace-nowrap"
      title={`This page documents version ${version}. Newer releases may add or change API surface.`}
    >
      Documented against{' '}
      <code className="text-xs font-mono">v{version}</code>
    </span>
  );
}
