import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Pre-render the full search index export at `/api/search.json` for static hosting (+ default UI `type: 'static'`).
export const dynamic = 'force-static';
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
});