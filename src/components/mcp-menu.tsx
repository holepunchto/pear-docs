'use client';
import { useEffect, useRef, useState } from 'react';

// QVAC docs service base (same env var the search dialog uses).
const QVAC_API = process.env.NEXT_PUBLIC_QVAC_API_URL || 'http://localhost:8787';
const QVAC_TOKEN = process.env.NEXT_PUBLIC_QVAC_API_TOKEN || '';
// Streamable-HTTP MCP endpoint exposed by the service (search_docs/ask_docs/fetch_doc).
const MCP_URL = `${QVAC_API}/mcp`;
const MCP_NAME = 'pear-docs';
const MCP_HEADERS = QVAC_TOKEN ? { Authorization: `Bearer ${QVAC_TOKEN}` } : undefined;

// One entry per supported client. `href` opens a deep link that installs on click;
// `copy` puts a ready-to-paste command/URL on the clipboard.
type McpAction = { label: string; href?: string; copy?: string };
function b64(s: string) {
  return typeof btoa === 'function' ? btoa(s) : Buffer.from(s).toString('base64');
}
const MCP_ACTIONS: McpAction[] = [
  {
    label: 'Cursor',
    href: `cursor://anysphere.cursor-deeplink/mcp/install?name=${MCP_NAME}&config=${b64(
      JSON.stringify({ url: MCP_URL, ...(MCP_HEADERS ? { headers: MCP_HEADERS } : {}) }),
    )}`,
  },
  {
    label: 'VS Code',
    href: `vscode:mcp/install?${encodeURIComponent(
      JSON.stringify({ name: MCP_NAME, type: 'http', url: MCP_URL, ...(MCP_HEADERS ? { headers: MCP_HEADERS } : {}) }),
    )}`,
  },
  {
    label: 'Claude Code',
    copy:
      `claude mcp add --transport http ${MCP_NAME} ${MCP_URL}` +
      (QVAC_TOKEN ? ` --header "Authorization: Bearer ${QVAC_TOKEN}"` : ''),
  },
  { label: 'Copy endpoint URL', copy: MCP_URL },
];

// Navbar dropdown: deep-link installs (Cursor/VS Code) + copy commands for the
// QVAC docs MCP server.
export function McpMenu() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the dropdown on any outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function run(a: McpAction) {
    if (a.href) {
      window.open(a.href, '_self');
      setOpen(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(a.copy!);
      setCopied(a.label);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard unavailable (insecure context / denied) — open the endpoint instead.
      window.open(MCP_URL, '_blank', 'noopener');
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md border border-fd-border px-2.5 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
      >
        {copied ? `✓ Copied for ${copied}` : '+ Add MCP server'}
        <span aria-hidden className="text-[0.65rem] opacity-70">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-md border border-fd-border bg-fd-popover py-1 shadow-md"
        >
          {MCP_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => run(a)}
              className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              <span>{a.label}</span>
              <span aria-hidden className="text-[0.6rem] uppercase tracking-wide text-fd-muted-foreground">
                {a.href ? 'install' : 'copy'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
