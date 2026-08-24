/**
 * POST /api/search  →  { model, hits: [{ url, title, heading, score, snippet }] }
 *
 * The response shape is deliberately IDENTICAL to the full QVAC service's
 * /api/search, so pointing the docs site at this deployment is a URL change and
 * nothing else.
 */
import { getEngine, clampTopK } from '@/lib/engine';
import { errorResponse, gate, json, parseJsonBody, preflight, readBody, requireQuery } from '@/lib/http';

// Reads the request body, so it can never be prerendered. Node runtime because
// the ONNX session is a native addon — it cannot run on the edge runtime.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;
  try {
    const body = parseJsonBody(await readBody(req));
    const query = requireQuery(body.query);
    const engine = await getEngine();
    const hits = await engine.search(query, clampTopK(body.topK), req.signal);
    return json(req, 200, {
      model: engine.model,
      hits: hits.map((h) => ({
        url: h.deepUrl,
        title: h.title,
        heading: h.heading,
        score: Number(h.score.toFixed(4)),
        // Drop the first line: chunk `content` starts with the "title — heading"
        // label that was embedded with it, which is already in the fields above.
        snippet: h.content.split('\n').slice(1).join(' ').slice(0, 240),
      })),
    });
  } catch (e) {
    return errorResponse(req, e);
  }
}

/**
 * A known route reached with the wrong method is a 405, not a 404 — otherwise
 * `GET /api/search` is indistinguishable from a genuine typo, made worse by CORS
 * advertising GET/POST/DELETE/OPTIONS on it.
 */
export async function GET(req: Request) {
  return json(req, 405, { error: 'method not allowed', allow: 'POST, OPTIONS' }, { Allow: 'POST, OPTIONS' });
}
