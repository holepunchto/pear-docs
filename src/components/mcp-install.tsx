'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLinkIcon, Plug } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';

/**
 * Name the docs MCP server registers itself under in every client's config.
 * Kept short and hyphenated because Claude Code's `claude mcp add <name>` and
 * Cursor's deeplink both take it as a bare identifier.
 */
const SERVER_NAME = 'pear-docs';

const optionClassName =
  'text-sm p-2 rounded-lg inline-flex items-center gap-2 text-left hover:text-fd-accent-foreground hover:bg-fd-accent [&_svg]:size-4';

const COPY_RESET_MS = 2000;

function ClaudeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>Claude</title>
      <path d="M4.709 15.955l4.72-2.647.079-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.365.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.607.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.673 7.243-.316.37-.728.28-.608-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );
}

function CursorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>Cursor</title>
      <path d="M11.925 24l10.383-6-10.383-6L1.542 18zM22.308 6L11.925 0 1.542 6v12l10.383-6z" />
    </svg>
  );
}

function VSCodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>Visual Studio Code</title>
      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
    </svg>
  );
}

/**
 * The config object every client ultimately stores. `type: 'http'` is the
 * streamable-HTTP transport the docs MCP server speaks (a plain POST endpoint
 * that answers JSON-RPC over `text/event-stream`), as opposed to the `stdio`
 * shape used for locally-spawned servers.
 */
function serverConfig(url: string) {
  return { type: 'http' as const, url };
}

/** What a user pastes into `claude_desktop_config.json` or any mcpServers map. */
function configJson(url: string) {
  return JSON.stringify({ mcpServers: { [SERVER_NAME]: serverConfig(url) } }, null, 2);
}

/**
 * Cursor's install deeplink takes the *inner* server config (no `mcpServers`
 * wrapper) as base64. Encoded at click time rather than render time because
 * `btoa` doesn't exist during Next's server prerender of this client component.
 */
function cursorHref(url: string) {
  const config = btoa(JSON.stringify(serverConfig(url)));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(
    SERVER_NAME,
  )}&config=${encodeURIComponent(config)}`;
}

/** VS Code takes the config inline as a URL-encoded JSON object, with the name folded in. */
function vscodeHref(url: string) {
  const payload = JSON.stringify({ name: SERVER_NAME, ...serverConfig(url) });
  return `vscode:mcp/install?${encodeURIComponent(payload)}`;
}

function claudeCodeCommand(url: string) {
  return `claude mcp add --transport http ${SERVER_NAME} ${url}`;
}

/**
 * "Add to your AI tool" — installs the docs MCP server, which exposes semantic
 * search over these docs to an agent. Rendered as `sidebar.banner`, which
 * Fumadocs places directly beneath the sidebar's search box.
 *
 * Renders nothing when `NEXT_PUBLIC_MCP_URL` is unset, so a deploy that hasn't
 * been pointed at an endpoint yet ships no dead button.
 */
export function McpInstallButton({ url }: { url: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied(null);
      return;
    }
    if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = window.setTimeout(() => {
      setCopied(null);
      resetTimeoutRef.current = null;
    }, COPY_RESET_MS);
  }

  function open(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  /** Copy options swap their icon to a tick for COPY_RESET_MS after a successful write. */
  function icon(key: string, fallback: React.ReactNode) {
    return copied === key ? <Check className="text-fd-muted-foreground" /> : fallback;
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Add these docs to your AI tool over MCP"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'w-full justify-start gap-2 font-normal',
          }),
        )}
      >
        <Plug className="size-3.5 text-fd-muted-foreground" />
        Add to your AI tool
      </PopoverTrigger>

      <PopoverContent className="flex flex-col">
        <p className="p-2 pb-1 text-xs text-fd-muted-foreground">
          Give your agent semantic search over these docs.
        </p>

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => copy('claude-code', claudeCodeCommand(url))}
            className={cn(optionClassName)}
          >
            {icon('claude-code', <ClaudeIcon className="text-fd-muted-foreground" />)}
            Claude Code
            <span className="ms-auto text-xs text-fd-muted-foreground">copy command</span>
          </button>
        </PopoverClose>

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => copy('claude-desktop', configJson(url))}
            className={cn(optionClassName)}
          >
            {icon('claude-desktop', <ClaudeIcon className="text-fd-muted-foreground" />)}
            Claude Desktop
            <span className="ms-auto text-xs text-fd-muted-foreground">copy config</span>
          </button>
        </PopoverClose>

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => open(cursorHref(url))}
            className={cn(optionClassName)}
          >
            <CursorIcon className="text-fd-muted-foreground" />
            Cursor
            <ExternalLinkIcon className="ms-auto size-3.5 text-fd-muted-foreground" />
          </button>
        </PopoverClose>

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => open(vscodeHref(url))}
            className={cn(optionClassName)}
          >
            <VSCodeIcon className="text-fd-muted-foreground" />
            VS Code
            <ExternalLinkIcon className="ms-auto size-3.5 text-fd-muted-foreground" />
          </button>
        </PopoverClose>

        <div className="my-1 border-t" />

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => copy('url', url)}
            className={cn(optionClassName)}
          >
            {icon('url', <Copy className="text-fd-muted-foreground" />)}
            Copy server URL
          </button>
        </PopoverClose>

        <PopoverClose asChild>
          <button
            type="button"
            onClick={() => copy('json', configJson(url))}
            className={cn(optionClassName)}
          >
            {icon('json', <Copy className="text-fd-muted-foreground" />)}
            Copy JSON config
          </button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
