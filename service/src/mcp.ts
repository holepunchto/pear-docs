/**
 * MCP server for the Pear docs, exposing the QVAC retrieval backend as tools any
 * MCP client (Claude, IDEs, agents) can call:
 *   - search_docs(query, topK?) → ranked page hits
 *   - ask_docs(query)           → grounded answer + citations
 *   - fetch_doc(url)            → full page markdown
 *
 * Served over Streamable HTTP in stateless mode (a fresh server+transport per
 * request), which is the simplest correct pattern for a read-only tool server.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Engine } from './engine.ts';

// Pear logo (public/pear-1.svg), embedded as a self-contained data: URI so the
// icon needs no external fetch. Advertised via serverInfo.icons — spec-compliant
// MCP clients (Cursor, VS Code, Claude, …) show it next to the server.
const PEAR_LOGO_SVG =
  '<svg width="265" height="358" viewBox="0 0 265 358" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M123.036 0H141.964V35.3525H123.036V0Z" fill="#B0D944"/>' +
  '<path d="M113.572 46.5399V53.6999H94.643V62.6499H170.357V53.6999H151.429V39.8274H132.5V46.5399H113.572Z" fill="#B0D944"/>' +
  '<path d="M189.286 67.1249H132.5V73.8374H75.7144V89.9474H189.286V67.1249Z" fill="#B0D944"/>' +
  '<path d="M208.214 94.4224H132.5V101.135H56.7858V117.245H208.214V94.4224Z" fill="#B0D944"/>' +
  '<path d="M208.214 121.72H132.5V128.433H56.7858V144.543H208.214V121.72Z" fill="#B0D944"/>' +
  '<path d="M227.143 149.018H132.5V155.73H37.8573V171.84H227.143V149.018Z" fill="#B0D944"/>' +
  '<path d="M227.143 176.315H132.5V183.028H37.8573V199.138H227.143V176.315Z" fill="#B0D944"/>' +
  '<path d="M246.071 203.613H132.5V210.325H18.9286V226.435H246.071V203.613Z" fill="#B0D944"/>' +
  '<path d="M265 230.91H132.5V237.623H0V253.733H265V230.91Z" fill="#B0D944"/>' +
  '<path d="M265 258.208H132.5V264.92H0V281.03H265V258.208Z" fill="#B0D944"/>' +
  '<path d="M265 285.505H132.5V292.218H0V308.328H265V285.505Z" fill="#B0D944"/>' +
  '<path d="M227.143 312.803H132.5V319.515H37.8573V335.625H227.143V312.803Z" fill="#B0D944"/>' +
  '<path d="M189.286 340.1H132.5V346.812H75.7144V358H189.286V340.1Z" fill="#B0D944"/>' +
  '</svg>';
const PEAR_LOGO_ICON = `data:image/svg+xml;base64,${Buffer.from(PEAR_LOGO_SVG).toString('base64')}`;

export function buildMcpServer(engine: Engine): McpServer {
  const server = new McpServer(
    {
      name: 'pear-docs',
      title: 'Pear Docs',
      version: '0.1.0',
      icons: [{ src: PEAR_LOGO_ICON, mimeType: 'image/svg+xml', sizes: ['any'] }],
    },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'search_docs',
    {
      title: 'Search Pear docs',
      description:
        'Semantic search over the Pear documentation. Returns the most relevant pages with a snippet and score.',
      inputSchema: { query: z.string().describe('Natural-language search query'), topK: z.number().int().min(1).max(20).optional() },
    },
    async ({ query, topK }) => {
      const hits = await engine.search(query, topK ?? 5);
      const text = hits
        .map((h, i) => `${i + 1}. ${h.title}${h.heading ? ` — ${h.heading}` : ''}\n   ${h.deepUrl}\n   ${h.content.split('\n').slice(1).join(' ').slice(0, 200)}`)
        .join('\n\n');
      return { content: [{ type: 'text', text: text || 'No results.' }] };
    },
  );

  server.registerTool(
    'ask_docs',
    {
      title: 'Ask the Pear docs',
      description:
        'Ask a question and get an answer grounded in the Pear documentation, with inline [n] citations to source pages.',
      inputSchema: { query: z.string().describe('Question about Pear / Bare / Holepunch') },
    },
    async ({ query }) => {
      let answer = '';
      let sources: { n: number; url: string; title: string }[] = [];
      for await (const ev of engine.ask(query)) {
        if (ev.type === 'sources') sources = ev.sources;
        else if (ev.type === 'token') answer += ev.text;
      }
      const cites = sources.map((s) => `[${s.n}] ${s.title} — ${s.url}`).join('\n');
      return { content: [{ type: 'text', text: `${answer.trim()}\n\nSources:\n${cites}` }] };
    },
  );

  server.registerTool(
    'fetch_doc',
    {
      title: 'Fetch a Pear docs page',
      description: 'Return the full Markdown of a documentation page by its URL path (e.g. /how-to/connect-to-peers/).',
      inputSchema: { url: z.string().describe('Page URL path, e.g. /reference/building-blocks/hypercore/') },
    },
    async ({ url }) => {
      const page = engine.getPage(url);
      if (!page) return { content: [{ type: 'text', text: `No page found at ${url}` }], isError: true };
      return { content: [{ type: 'text', text: page.markdown }] };
    },
  );

  return server;
}

/** Handle one MCP HTTP request in stateless mode. */
export async function handleMcpRequest(
  engine: Engine,
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
): Promise<void> {
  const server = buildMcpServer(engine);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}
