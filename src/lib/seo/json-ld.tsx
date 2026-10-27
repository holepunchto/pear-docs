// Vendored from @tetherto/docs-seo-next@1.0.1.
import type { JsonLdGraph } from './core';

export type DocsJsonLdProps = {
  data: JsonLdGraph;
};

export function DocsJsonLd({ data }: DocsJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
