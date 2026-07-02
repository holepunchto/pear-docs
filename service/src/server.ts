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

// Optional bearer-token gate. When QVAC_API_TOKEN is set, /api/* and /mcp require
// `Authorization: Bearer <token>`; /health stays open for monitoring. Unset = open
// (local dev). NOTE: a token shipped to a public static site via NEXT_PUBLIC_* is
// visible in the browser bundle — this deters casual/bot hits on the raw URL and
// lets you rotate access; it is not a true secret. Pair with a named tunnel +
// Cloudflare Access for real protection.
const API_TOKEN = process.env.QVAC_API_TOKEN || '';

// Optional IP allowlist. All tunnel traffic passes Cloudflare's edge, which sets
// `CF-Connecting-IP` to the real client IP (a client can't forge it — CF overwrites
// it at the edge, and the origin is only reachable through the tunnel). When
// QVAC_ALLOWED_IPS is set (comma-separated), only those IPs may hit /api/* and /mcp.
const ALLOWED_IPS = (process.env.QVAC_ALLOWED_IPS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function clientIp(req: http.IncomingMessage): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf;
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}

function authorized(req: http.IncomingMessage): boolean {
  if (!API_TOKEN) return true;
  return req.headers['authorization'] === `Bearer ${API_TOKEN}`;
}

function ipAllowed(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) return true;
  // Exact match, or a trailing-`*` prefix (e.g. `2802:8011:3070:6300:*` for a
  // whole IPv6 /64 — handy since privacy-extension addresses rotate the suffix).
  return ALLOWED_IPS.some((e) => (e.endsWith('*') ? ip.startsWith(e.slice(0, -1)) : ip === e));
}

// Per-IP sliding-window rate limit (protects the GPU from floods on /api/* and
// /mcp). QVAC_RATE_MAX requests per QVAC_RATE_WINDOW_S seconds; set MAX=0 to disable.
const RATE_MAX = Number(process.env.QVAC_RATE_MAX ?? 60);
const RATE_WINDOW_MS = Number(process.env.QVAC_RATE_WINDOW_S ?? 60) * 1000;
const rateHits = new Map<string, number[]>();

function rateLimited(ip: string): number {
  if (RATE_MAX <= 0) return 0;
  const now = Date.now();
  const recent = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateHits.set(ip, recent);
    return Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000)); // Retry-After secs
  }
  recent.push(now);
  rateHits.set(ip, recent);
  return 0;
}

// Prune idle IPs so the map doesn't grow unbounded; unref() so it never blocks exit.
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of rateHits) {
    const keep = arr.filter((t) => now - t < RATE_WINDOW_MS);
    if (keep.length) rateHits.set(ip, keep);
    else rateHits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

function cors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, mcp-session-id, mcp-protocol-version');
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

    const ip = clientIp(req);

    // Gate everything except /health: IP allowlist → bearer token → rate limit.
    if (url.pathname !== '/health') {
      if (!ipAllowed(ip)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'forbidden' }));
        return;
      }
      if (!authorized(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
      const retryAfter = rateLimited(ip);
      if (retryAfter > 0) {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) });
        res.end(JSON.stringify({ error: 'rate limited', retryAfter }));
        return;
      }
    }

    try {
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        // `ip` echoes the caller's IP as the service sees it (via CF-Connecting-IP),
        // so you can copy it into QVAC_ALLOWED_IPS.
        res.end(JSON.stringify({ ok: true, chunks: engine.size, model: engine.model, llm: engine.llmEnabled, llmModel: engine.llmModel || null, ip }));
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
