'use client';

// Side-effect import: load Fumadocs' theme-aware `[data-rmiz-*]` styles
// (its CSS file isn't separately exported in v16.x). We use `Zoom` directly
// rather than `ImageZoom` because Fumadocs' wrapper is built around `<img>`:
// it defaults `wrapElement: 'span'` (would yield invalid `<span><div>` HTML
// around our SVG container), computes a defunct `zoomImg.src = ""` for us,
// and types `rmiz` as the full `UncontrolledProps` (requires `children`),
// so overriding `wrapElement` would need a type cast.
import 'fumadocs-ui/components/image-zoom';
import Zoom from 'react-medium-image-zoom';
import { cn } from '@/lib/cn';

/**
 * Client-side zoom wrapper for an inline Mermaid SVG string.
 *
 * `react-medium-image-zoom` finds the `<svg>` inside its children and clones
 * it into a portal on click. The outer `overflow-x-auto` covers the rare
 * diagram whose intrinsic min-width can't shrink to fit the column.
 */
export function MermaidZoom({
  svg,
  className,
}: {
  svg: string;
  className?: string;
}) {
  return (
    <div className={cn('not-prose my-6 overflow-x-auto', className)}>
      <Zoom zoomMargin={20}>
        <div
          className="[&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </Zoom>
    </div>
  );
}
