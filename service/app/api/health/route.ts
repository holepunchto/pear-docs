/**
 * GET /api/health → readiness + index stats.
 *
 * Open to unauthenticated callers so platform health checks work, but the OPEN
 * payload is deliberately just liveness. The detail below is operator
 * reconnaissance — the model id and index build time disclose what the container
 * holds — so it is shown only to callers that already hold the token.
 */
import { getEngine } from '@/lib/engine';
import { isAuthorized, json, preflight } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function GET(req: Request) {
  try {
    const engine = await getEngine();
    if (!isAuthorized(req)) return json(req, 200, { ok: true });
    return json(req, 200, {
      ok: true,
      chunks: engine.size,
      pages: engine.pageCount,
      model: engine.model,
      builtAt: engine.builtAt,
      // Which docs revision is live. CI stamps this, so "is the deployed index
      // current?" is one curl against a known commit.
      sourceRef: engine.sourceRef || null,
    });
  } catch (e) {
    // A failed init (missing index, model/index mismatch) must read as unhealthy
    // so the platform restarts or holds traffic off the instance.
    console.error('health: engine init failed:', e);
    return json(req, 503, { ok: false, error: 'engine unavailable' });
  }
}
