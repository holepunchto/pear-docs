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
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

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

// Inline markdown: render [links](url), `code` spans and **bold**; rest as text.
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) {
      out.push(
        <code key={k++} className="rounded bg-fd-muted px-1 py-0.5 text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith('[')) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm)
        out.push(
          <a key={k++} href={lm[2]} className="text-fd-primary hover:underline">
            {lm[1]}
          </a>,
        );
      else out.push(tok);
    } else {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Lightweight, synchronous syntax highlighting (streaming-safe — no Shiki/async).
// One ordered scan classifies comments, strings, keywords, literals and numbers;
// matching whole strings/comments first means keywords inside them aren't recolored.
const CODE_TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|import|from|export|default|async|await|new|class|extends|if|else|for|while|do|switch|case|break|continue|of|in|typeof|instanceof|try|catch|finally|throw|yield|void|delete|require)\b|\b(true|false|null|undefined|this)\b|\b(\d+(?:\.\d+)?)\b/g;
const TOKEN_COLOR = ['#8b949e', '#a5d6ff', '#ff7b72', '#79c0ff', '#79c0ff']; // comment, string, keyword, literal, number

function highlightCode(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  CODE_TOKEN.lastIndex = 0;
  while ((m = CODE_TOKEN.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const groupIdx = [1, 2, 3, 4, 5].find((g) => m![g] !== undefined)!;
    out.push(
      <span key={k++} style={{ color: TOKEN_COLOR[groupIdx - 1] }}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative mb-2">
      {lang && (
        <span className="absolute right-2 top-1.5 text-[0.65rem] uppercase tracking-wide text-zinc-500">
          {lang}
        </span>
      )}
      <pre className="overflow-x-auto rounded-md border border-zinc-800 bg-[#0d1117] p-3 text-xs leading-relaxed text-[#e6edf3]">
        <code className="font-mono">{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

// Minimal, streaming-safe markdown: splits fenced ``` code blocks from prose.
// An unclosed fence (still streaming) renders as a code block immediately.
function renderMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let inCode = false;
  let lang = '';
  let code: string[] = [];
  let prose: string[] = [];
  let key = 0;
  const flushProse = () => {
    const joined = prose.join('\n').replace(/\n{3,}/g, '\n\n');
    if (joined.trim())
      nodes.push(
        <p key={`p${key++}`} className="mb-2 whitespace-pre-wrap">
          {renderInline(joined)}
        </p>,
      );
    prose = [];
  };
  const flushCode = () => {
    nodes.push(<CodeBlock key={`c${key++}`} code={code.join('\n')} lang={lang} />);
    code = [];
    lang = '';
  };
  for (const line of text.split('\n')) {
    const fence = line.match(/^\s*```(\w*)/);
    if (fence) {
      if (inCode) flushCode();
      else {
        flushProse();
        lang = fence[1] || '';
      }
      inCode = !inCode;
      continue;
    }
    (inCode ? code : prose).push(line);
  }
  if (inCode) flushCode();
  else flushProse();
  return nodes;
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
                <div className="text-fd-foreground">
                  {answer ? (
                    renderMarkdown(answer)
                  ) : asking ? (
                    <p className="text-fd-muted-foreground">Thinking…</p>
                  ) : null}
                </div>
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
