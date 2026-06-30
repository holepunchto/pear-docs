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
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

// QVAC docs service (semantic search + RAG "ask"). Defaults to the local PoC
// service; failed/unset → the build-time Orama index is used as a fallback.
const QVAC_API = process.env.NEXT_PUBLIC_QVAC_API_URL || 'http://localhost:8787';

type Mode = 'search' | 'ask';

function initOrama() {
  return create({
    schema: { _: 'string' },
    language: 'english',
  });
}

interface AskSource {
  n: number;
  url: string;
  title: string;
  heading: string;
}

export default function CustomSearchDialog(props: SharedProps) {
  // Orama client-side search — kept as the offline/fallback engine.
  const { search, setSearch, query } = useDocsSearch({
    from: '/api/search.json',
    type: 'static',
    initOrama,
  });

  const [mode, setMode] = useState<Mode>('search');

  // QVAC semantic results. `null` = not yet / empty; 'fallback' = use Orama.
  const [qvacResults, setQvacResults] = useState<SortedResult[] | null | 'fallback'>(null);
  const [qvacLoading, setQvacLoading] = useState(false);

  // "Ask the docs" RAG panel state.
  const [answer, setAnswer] = useState('');
  const [askSources, setAskSources] = useState<AskSource[]>([]);
  const [asking, setAsking] = useState(false);
  const [extractive, setExtractive] = useState(false);
  const askAbort = useRef<AbortController | null>(null);

  // Debounced semantic search against the QVAC service (search mode only).
  useEffect(() => {
    if (mode !== 'search' || !search) {
      setQvacResults(null);
      return;
    }
    const ctrl = new AbortController();
    setQvacLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${QVAC_API}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: search, topK: 6 }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`search ${res.status}`);
        const data = (await res.json()) as {
          hits: { url: string; title: string; heading: string; snippet: string }[];
        };
        const items: SortedResult[] = [];
        for (const h of data.hits) {
          items.push({ id: h.url, url: h.url, type: 'page', content: h.title });
          if (h.heading && h.heading !== h.title)
            items.push({ id: `${h.url}#h`, url: h.url, type: 'heading', content: h.heading });
          if (h.snippet) items.push({ id: `${h.url}#t`, url: h.url, type: 'text', content: h.snippet });
        }
        setQvacResults(items);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setQvacResults('fallback');
      } finally {
        setQvacLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [search, mode]);

  // Prefer QVAC semantic results; degrade to Orama when unavailable.
  const useFallback = qvacResults === 'fallback';
  const items: SortedResult[] | null = useFallback
    ? query.data && query.data !== 'empty'
      ? query.data
      : null
    : Array.isArray(qvacResults)
      ? qvacResults
      : null;

  async function ask() {
    if (!search || asking) return;
    askAbort.current?.abort();
    const ctrl = new AbortController();
    askAbort.current = ctrl;
    setAsking(true);
    setAnswer('');
    setAskSources([]);
    setExtractive(false);
    try {
      const res = await fetch(`${QVAC_API}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error('no stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === 'sources') setAskSources(ev.sources);
          else if (ev.type === 'token') setAnswer((a) => a + ev.text);
          else if (ev.type === 'done') setExtractive(Boolean(ev.extractive));
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setAnswer('Could not reach the QVAC answer service.');
    } finally {
      setAsking(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    if (next === 'search') {
      askAbort.current?.abort();
      setAnswer('');
      setAskSources([]);
      setAsking(false);
    }
  }

  // In ask mode, intercept Enter (capture phase) so it submits the question
  // instead of opening the highlighted search result.
  function onKeyDownCapture(e: ReactKeyboardEvent) {
    if (mode === 'ask' && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      ask();
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      data-active={mode === m}
      className="rounded-md px-3 py-1 text-sm font-medium text-fd-muted-foreground transition-colors data-[active=true]:bg-fd-background data-[active=true]:text-fd-foreground data-[active=true]:shadow-sm"
    >
      {label}
    </button>
  );

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={qvacLoading || query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent onKeyDownCapture={onKeyDownCapture}>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput placeholder={mode === 'ask' ? 'Ask a question about Pear…' : undefined} />
          <SearchDialogClose />
        </SearchDialogHeader>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <div className="inline-flex rounded-lg bg-fd-muted p-0.5">
            {tab('search', 'Search')}
            {tab('ask', 'Ask AI')}
          </div>
          {mode === 'ask' && (
            <button
              type="button"
              onClick={ask}
              disabled={!search || asking}
              className="rounded-md bg-fd-primary px-2.5 py-1 text-sm font-medium text-fd-primary-foreground disabled:opacity-50"
            >
              {asking ? 'Asking…' : 'Ask'}
            </button>
          )}
          <span className="ml-auto text-xs text-fd-muted-foreground">
            powered by <span className="font-medium text-fd-foreground">QVAC</span>
          </span>
        </div>

        {mode === 'ask' ? (
          <div className="max-h-80 overflow-y-auto px-3 py-3 text-sm">
            {!answer && !asking && askSources.length === 0 ? (
              <p className="text-fd-muted-foreground">
                Type a question and press <kbd className="rounded border px-1">Enter</kbd> (or hit
                Ask) to get an answer grounded in the docs, with citations.
              </p>
            ) : (
              <>
                <p className="mb-1 whitespace-pre-wrap text-fd-foreground">
                  {answer || (asking ? 'Thinking…' : '')}
                </p>
                {askSources.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <p className="mb-1 text-xs font-medium text-fd-muted-foreground">Sources</p>
                    <div className="flex flex-col gap-0.5">
                      {askSources.map((s) => (
                        <a key={`${s.url}-${s.n}`} href={s.url} className="text-xs text-fd-primary hover:underline">
                          [{s.n}] {s.title}
                          {s.heading ? ` — ${s.heading}` : ''}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {extractive && (
                  <p className="mt-2 text-xs text-fd-muted-foreground">
                    Extractive answer (no QVAC language model configured).
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <SearchDialogList items={items} />
        )}
      </SearchDialogContent>
    </SearchDialog>
  );
}
