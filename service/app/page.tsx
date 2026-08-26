import { DOCS_LABEL, SERVER_NAME } from '@/lib/branding';

/**
 * Static landing page. Not a product surface — it exists so that a human who
 * lands on the bare origin (or an operator checking a fresh deploy) sees what
 * this service is and how to connect, instead of a 404.
 *
 * It never touches the engine, so it stays useful even when the index fails to
 * load — but it is force-dynamic rather than prerendered, because MCP_SERVER_NAME
 * and DOCS_LABEL are deployment env. Prerendered, it would bake in whatever those
 * were at image-build time and ignore the values actually set on the pod.
 */
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <main>
      <h1>{DOCS_LABEL} docs — search + MCP</h1>
      <p>Semantic search over the documentation corpus, and the same retrieval exposed as MCP tools.</p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/search</code> — <code>{'{ query, topK? }'}</code> → ranked, deep-linked sections
        </li>
        <li>
          <code>GET /api/health</code> — readiness and index stats
        </li>
        <li>
          <code>ALL /mcp</code> — Streamable-HTTP MCP: <code>search_docs</code>, <code>fetch_doc</code>
        </li>
      </ul>
      <h2>Connect an MCP client</h2>
      <pre>
        <code>claude mcp add --transport http {SERVER_NAME} &lt;this-origin&gt;/mcp</code>
      </pre>
    </main>
  );
}
