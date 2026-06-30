/**
 * QVAC docs service HTTP server.
 *
 *   GET  /health        → readiness + index stats
 *   POST /api/search    → { query, topK? } → { model, hits: [...] }
 *   POST /api/ask       → { query } → Server-Sent Events (sources, tokens, done)
 *   ALL  /mcp           → Streamable-HTTP MCP endpoint (search_docs/ask_docs/fetch_doc)
 *
 * Run from repo root (sandbox disabled — QVAC locks files under ~/.qvac):
 *   node --import tsx service/src/server.ts
 */
import http from 'node:http';
import { Engine } from './engine.ts';
import { handleMcpRequest } from './mcp.ts';

const PORT = Number(process.env.PORT || 8787);

function cors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
}

/** Coerce a request-supplied topK to an integer in [1, max], else the default. */
function clampTopK(v: unknown, def = 5, max = 20): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function main() {
  console.log('▸ Initializing engine (loading index + models)…');
  const engine = await new Engine().init();
  console.log(`✓ Engine ready: ${engine.size} chunks, model=${engine.model}, llm=${engine.llmEnabled ? engine.llmModel : 'extractive-fallback'}`);

  const server = http.createServer(async (req, res) => {
    cors(res);
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }

    try {
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, chunks: engine.size, model: engine.model, llm: engine.llmEnabled, llmModel: engine.llmModel || null }));
        return;
      }

      if (url.pathname === '/api/search' && req.method === 'POST') {
        const { query, topK } = JSON.parse((await readBody(req)) || '{}');
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'query (string) required' }));
          return;
        }
        const hits = await engine.search(query, clampTopK(topK));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            model: engine.model,
            hits: hits.map((h) => ({
              url: h.deepUrl,
              title: h.title,
              heading: h.heading,
              score: Number(h.score.toFixed(4)),
              snippet: h.content.split('\n').slice(1).join(' ').slice(0, 240),
            })),
          }),
        );
        return;
      }

      if (url.pathname === '/api/ask' && req.method === 'POST') {
        const { query } = JSON.parse((await readBody(req)) || '{}');
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'query (string) required' }));
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });
        // Abort retrieval/generation if the client disconnects mid-stream, and
        // stop writing to a closed socket.
        const ac = new AbortController();
        let closed = false;
        req.on('close', () => {
          closed = true;
          ac.abort();
        });
        for await (const ev of engine.ask(query, { signal: ac.signal })) {
          if (closed) break;
          res.write(`data: ${JSON.stringify(ev)}\n\n`);
        }
        if (!res.writableEnded) res.end();
        return;
      }

      if (url.pathname === '/mcp') {
        const raw = req.method === 'POST' ? await readBody(req) : '';
        const body = raw ? JSON.parse(raw) : undefined;
        await handleMcpRequest(engine, req, res, body);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    } catch (e) {
      console.error('request error:', e);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
  });

  server.listen(PORT, () => {
    console.log(`✓ QVAC docs service listening on http://localhost:${PORT}`);
    console.log(`  POST /api/search · POST /api/ask · MCP /mcp · GET /health`);
  });

  const shutdown = async () => {
    console.log('\n▸ Shutting down…');
    server.close();
    await engine.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('✖ server failed to start:', e);
  process.exit(1);
});
