import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { MermaidZoom } from './mermaid-zoom';

/**
 * Drop the SVG's fixed pixel `width`/`height` attributes so it scales with
 * its container (the `viewBox` keeps the aspect ratio). CSS in
 * `MermaidZoom` then constrains it to `max-width: 100%`.
 */
function makeResponsive(svg: string): string {
  return svg.replace(
    /<svg\b([^>]*)>/,
    (_match, attrs: string) =>
      `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/g, '')}>`,
  );
}

export async function Mermaid({ chart }: { chart: string }) {
  // Only the rendering is guarded. Returning JSX from inside the `try` would
  // put the returned component's own render errors under this `catch`, which
  // React does not actually route here — see react-hooks/error-boundaries.
  let svg: string | null = null;
  try {
    svg = makeResponsive(
      renderMermaidSVG(chart, {
        bg: 'var(--color-fd-background)',
        fg: 'var(--color-fd-foreground)',
        interactive: true,
        transparent: true,
      }),
    );
  } catch {
    svg = null;
  }

  if (svg === null) {
    return (
      <CodeBlock title="Mermaid">
        <Pre>{chart}</Pre>
      </CodeBlock>
    );
  }

  return <MermaidZoom svg={svg} />;
}
