"use client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SearchItemType,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { create } from "@orama/orama";
import {
  InkeepModalChat,
  type AIChatFunctions,
  type InkeepModalChatProps,
} from "@inkeep/cxkit-react";
import { useTheme } from "next-themes";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// QVAC docs search service. Unset, failing or unauthorized -> Orama fallback.
// No token: the service opens /api/search to browsers with QVAC_SEARCH_PUBLIC=1,
// and anything bundled here would be public anyway.
const QVAC_API =
  process.env.NEXT_PUBLIC_QVAC_API_URL || "https://mcp.pears.com";
// Wait this long after the last keystroke, and for at least this many
// characters, before searching: each search is one embedding on a CPU box
// shared with the MCP server.
const DEBOUNCE_MS = 400;
const MIN_CHARS = 3;

function initOrama() {
  return create({ schema: { _: "string" }, language: "english" });
}

interface QvacHit {
  url: string;
  title: string;
  heading: string;
  snippet: string;
}

function hitsToItems(hits: QvacHit[]): SearchItemType[] {
  const items: SearchItemType[] = [];
  hits.forEach((h, i) => {
    items.push({
      id: `${i}:${h.url}`,
      url: h.url,
      type: "page",
      content: h.title,
    });
    if (h.heading && h.heading !== h.title)
      items.push({
        id: `${i}:${h.url}#h`,
        url: h.url,
        type: "heading",
        content: h.heading,
      });
    if (h.snippet)
      items.push({
        id: `${i}:${h.url}#t`,
        url: h.url,
        type: "text",
        content: h.snippet,
      });
  });
  return items;
}

function AskAI({
  open,
  onOpenChange,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
}) {
  const { resolvedTheme } = useTheme();
  const chatRef = useRef<AIChatFunctions>(null);
  const dark = resolvedTheme === "dark";

  // Send the typed query once the chat has mounted.
  useEffect(() => {
    if (!open || !question) return;
    const t = setTimeout(() => chatRef.current?.submitMessage(question), 300);
    return () => clearTimeout(t);
  }, [open, question]);

  if (!open) return null;

  const config: InkeepModalChatProps = {
    baseSettings: {
      apiKey: process.env.NEXT_PUBLIC_INKEEP_API_KEY!,
      organizationDisplayName: "Pear Docs",
      primaryBrandColor: dark ? "#bbde5c" : "#759300",
      colorMode: { forcedColorMode: dark ? "dark" : "light" },
    },
    aiChatSettings: { chatFunctionsRef: chatRef },
    modalSettings: { isOpen: open, onOpenChange },
  };

  return <InkeepModalChat {...config} />;
}

export default function CustomSearchDialog(props: SharedProps) {
  const { onOpenChange } = props;
  const { search, setSearch, query } = useDocsSearch({
    from: "/api/search.json",
    type: "static",
    initOrama,
  });

  // `null` = no results yet; 'fallback' = use Orama.
  const [qvac, setQvac] = useState<SearchItemType[] | null | "fallback">(null);
  const [settled, setSettled] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (search.trim().length < MIN_CHARS) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${QVAC_API}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: search, topK: 6 }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`search ${res.status}`);
        const data = (await res.json()) as { hits: QvacHit[] };
        setQvac(hitsToItems(data.hits));
        setSettled(search);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setQvac("fallback");
        setSettled(search);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [search]);

  // Below MIN_CHARS nothing is searched, so show no results and no spinner.
  const tooShort = search.trim().length < MIN_CHARS;
  const results: SearchItemType[] | null = tooShort
    ? null
    : qvac === "fallback"
      ? query.data && query.data !== "empty"
        ? query.data
        : null
      : qvac;

  function ask(q: string) {
    setQuestion(q);
    setAskOpen(true);
    onOpenChange(false);
  }

  const items: SearchItemType[] | null =
    search && results
      ? [
          ...results,
          {
            id: "ask-ai",
            type: "action",
            node: (
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-fd-primary" />
                <span>
                  Ask AI about “<span className="font-medium">{search}</span>”
                </span>
              </div>
            ),
            onSelect: () => ask(search),
          },
        ]
      : results;

  return (
    <>
      <SearchDialog
        search={search}
        onSearchChange={setSearch}
        isLoading={(!tooShort && settled !== search) || query.isLoading}
        {...props}
      >
        <SearchDialogOverlay />
        <SearchDialogContent>
          <SearchDialogHeader>
            <SearchDialogIcon />
            <SearchDialogInput />
            <button
              type="button"
              onClick={() => ask(search)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <Sparkles className="size-3.5" />
              Ask AI
            </button>
            <SearchDialogClose />
          </SearchDialogHeader>
          <SearchDialogList items={items} />
        </SearchDialogContent>
      </SearchDialog>
      <AskAI open={askOpen} onOpenChange={setAskOpen} question={question} />
    </>
  );
}
