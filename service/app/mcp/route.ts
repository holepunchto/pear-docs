/**
 * MCP server for the docs, exposing the retrieval backend as tools any MCP
 * client (Claude, IDEs, agents) can call:
 *   - search_docs(query, topK?) → ranked, deep-linked section hits
 *   - fetch_doc(url)            → full page markdown
 *
 * The full QVAC service also exposes `ask_docs`, which runs a local LLM to write
 * the answer. That is gone here on purpose: an MCP client IS a language model, so
 * having it synthesize from `search_docs` + `fetch_doc` output beats a 4.7 GB
 * Qwen3 in the container writing a worse answer for it.
 *
 * Served stateless over Streamable HTTP via mcp-handler, which is the simplest
 * correct pattern for a read-only tool server: no sessions, no Redis, so the
 * service stays a single stateless pod.
 */
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { clampTopK, getEngine } from '@/lib/engine';
import { absolute, DOCS_LABEL, LOGO_ICON, SERVER_NAME } from '@/lib/branding';
import { corsHeaders, gate, preflight } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// The ONNX session load plus a cold index parse can outrun a short default on a
// small pod; only the FIRST request pays it.
export const maxDuration = 60;

const mcp = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_docs',
      {
        title: `Search ${DOCS_LABEL} docs`,
        description:
          `Semantic search over the ${DOCS_LABEL} documentation. Returns the most relevant sections, ` +
          'each deep-linked to its heading anchor, with a snippet and a relevance score.',
        // Accept any number and clamp it, matching /api/search. A strict
        // .int().min(1).max(20) here would make the two front-ends disagree:
        // topK=50 comes back clamped for the website and as a hard validation
        // failure for agents.
        // `.trim().min(1)` because a bare z.string() accepts "   ", which then
        // pays for a full query embedding to rank nothing meaningful.
        inputSchema: z.object({
          query: z.string().trim().min(1).describe('Natural-language search query'),
          topK: z.number().optional().describe('Results to return (1-20, clamped)'),
        }),
        icons: [LOGO_ICON],
      },
      async ({ query, topK }, ctx) => {
        const engine = await getEngine();
        // Forward the request's cancellation signal: without it a client that
        // gave up (or timed out) leaves us embedding and ranking for nobody.
        // SDK v2 moved this from `extra.signal` to `ctx.mcpReq.signal`.
        const hits = await engine.search(query, clampTopK(topK), ctx?.mcpReq?.signal);
        const text = hits
          .map(
            (h, i) =>
              `${i + 1}. ${h.title}${h.heading ? ` — ${h.heading}` : ''}\n   ${absolute(h.deepUrl)}\n   ` +
              h.content.split('\n').slice(1).join(' ').slice(0, 200),
          )
          .join('\n\n');
        return { content: [{ type: 'text', text: text || 'No results.' }] };
      },
    );

    server.registerTool(
      'fetch_doc',
      {
        title: `Fetch a ${DOCS_LABEL} docs page`,
        description:
          'Return the full Markdown of a documentation page by its URL path ' +
          '(e.g. /how-to/connect-to-peers/). Accepts the deep-linked form from search_docs too.',
        inputSchema: z.object({
          url: z.string().trim().min(1).describe('Page URL path, e.g. /reference/building-blocks/hypercore/'),
        }),
        icons: [LOGO_ICON],
      },
      async ({ url }) => {
        const engine = await getEngine();
        const page = engine.getPage(url);
        if (!page) {
          return {
            content: [{ type: 'text', text: `No page found at ${url}. Use search_docs to find valid paths.` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: page.markdown }] };
      },
    );
  },
  {
    serverInfo: { name: SERVER_NAME, version: '0.1.0' },
    capabilities: { tools: {} },
    instructions:
      `Read-only access to the ${DOCS_LABEL} documentation. Call search_docs to find relevant sections, ` +
      'then fetch_doc on a result URL when you need the full page including code examples. ' +
      'Answer from what these tools return rather than from memory, and cite the returned URLs.',
  },
);

/**
 * Apply the same gate as /api/search before the MCP handler sees the request,
 * and add CORS to its response.
 *
 * mcp-handler owns the JSON-RPC body, so the body cap in lib/http.ts cannot be
 * applied here without consuming the stream out from under it; MAX_BODY_BYTES
 * therefore covers /api/search only. Keep a body limit at the platform edge for
 * /mcp.
 */
async function guarded(req: Request): Promise<Response> {
  const blocked = gate(req);
  if (blocked) return blocked;
  const res = await mcp(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(req))) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export { guarded as GET, guarded as POST, guarded as DELETE };
export function OPTIONS(req: Request) {
  return preflight(req);
}
