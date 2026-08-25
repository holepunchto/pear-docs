'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import type { SortedResult } from 'fumadocs-core/search';
import { create } from '@orama/orama';
import { SEARCH_SERVICE_ORIGIN } from '@/lib/search-service';
import { useEffect, useRef, useState } from 'react';

function initOrama() {
  return create({
    schema: { _: 'string' },
    language: 'english',
  });
}

/**
 * Semantic search backed by the `service/` Application. Resolved in one place —
 * see src/lib/search-service.ts, which currently carries a temporary local pin.
 * Whenever it is unreachable, everything below falls through to the static Orama
 * index, which is what keeps this safe to ship ahead of the service.
 */
const SEARCH_API = SEARCH_SERVICE_ORIGIN;

const DEBOUNCE_MS = 150;
// Past this, fall back rather than leave the user watching a spinner. The
// service answers in ~10 ms warm; this only trips on a cold pod or a bad network.
const TIMEOUT_MS = 2500;

interface Hit {
  url: string;
  title: string;
  heading: string;
  snippet: string;
}

/**
 * Map service hits onto the shape the dialog renders.
 *
 * One `page` entry per document, with its matching sections nested underneath as
 * `text` entries — the same grouping fumadocs' own Orama path produces, so the
 * results list looks identical whichever backend answered.
 */
function toResults(hits: Hit[]): SortedResult[] {
  const out: SortedResult[] = [];
  const seenPage = new Set<string>();
  for (const h of hits) {
    const pageUrl = h.url.split('#')[0];
    if (!seenPage.has(pageUrl)) {
      seenPage.add(pageUrl);
      out.push({ id: `page:${pageUrl}`, url: pageUrl, type: 'page', content: h.title });
    }
    // Ids are namespaced by row kind because a hit on a page's LEAD section has
    // no anchor, so its url IS the page url — an unprefixed id would collide with
    // the page row above it and React would see two children with the same key.
    out.push({
      id: `text:${h.url}`,
      url: h.url,
      type: 'text',
      content: h.heading || h.snippet,
    });
  }
  return out;
}

export default function CustomSearchDialog(props: SharedProps) {
  // The static Orama index stays wired up unconditionally: it is the fallback,
  // so it has to be warm and ready at the moment the service fails.
  const fallback = useDocsSearch({
    from: '/api/search.json',
    type: 'static',
    initOrama,
  });

  // Results are stored WITH the query that produced them. Two reasons: an effect
  // must not call setState synchronously to clear them when the box is emptied,
  // and without the tag a failed lookup would fall back to Orama while the
  // previous query's semantic hits were still on screen.
  const [semantic, setSemantic] = useState<{ q: string; results: SortedResult[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const query = fallback.search;
  // Guards against an earlier, slower response overwriting a later one.
  const seq = useRef(0);

  useEffect(() => {
    if (!SEARCH_API) return;
    const q = query.trim();
    if (!q) return;
    const id = ++seq.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SEARCH_API}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, topK: 8 }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const { hits } = (await res.json()) as { hits: Hit[] };
        if (id === seq.current) setSemantic({ q, results: toResults(hits) });
      } catch {
        // Any failure — offline pod, CORS, timeout, abort — drops through to the
        // Orama results below. Search degrades to keyword matching; it never
        // breaks.
        if (id === seq.current) setSemantic(null);
      } finally {
        clearTimeout(timer);
        if (id === seq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const trimmed = query.trim();
  // Semantic results only count when they belong to the query on screen right
  // now; otherwise fall through to Orama.
  const fresh = semantic?.q === trimmed ? semantic.results : null;
  const orama = fallback.query.data !== 'empty' ? fallback.query.data : null;
  const items = trimmed ? (fresh ?? orama) : null;

  return (
    <SearchDialog
      search={fallback.search}
      onSearchChange={fallback.setSearch}
      isLoading={loading || fallback.query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={items} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
