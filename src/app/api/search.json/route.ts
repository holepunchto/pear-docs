import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Pre-render full Orama export at `/api/search` for static hosting (+ default UI `type: 'static'`).
export const dynamic = 'force-static';
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
});