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

export function buildMcpServer(engine: Engine): McpServer {
  const server = new McpServer(
    { name: 'pear-docs', version: '0.1.0' },
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
