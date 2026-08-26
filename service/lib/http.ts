/**
 * Request gating shared by /api/search and /mcp: CORS, IP allowlist, bearer
 * token, per-IP rate limit, request-body cap.
 *
 * Ported from the full service's node:http server (`src/server.ts`) onto Web
 * `Request`/`Response`, which is what Next route handlers speak. The security
 * reasoning in the comments below is carried over verbatim where it still holds;
 * the one place the platform forced a real change is client-IP resolution — see
 * `clientIp`.
 */
import { timingSafeEqual } from 'node:crypto';

/**
 * Read a numeric env var, falling back to `def` when unset, blank or non-numeric.
 *
 * `Number('')` is 0 and `Number('sixty')` is NaN, and EVERY comparison against
 * NaN is false — so a typo'd value silently switches OFF the guard it configures:
 * `size > NaN` never trips the body cap and `recent.length >= NaN` never rate
 * limits.
 */
export function numEnv(name: string, def: number, { min = 1 }: { min?: number } = {}): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    console.warn(`⚠ ${name}="${raw}" is not a number — falling back to ${def}`);
    return def;
  }
  if (n < min) {
    console.warn(`⚠ ${name}=${n} is below the minimum ${min} — falling back to ${def}`);
    return def;
  }
  return n;
}

function listEnv(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Optional bearer-token gate. When API_TOKEN is set, /api/* and /mcp require
// `Authorization: Bearer <token>`; /api/health stays open for monitoring. Unset =
// open (local dev). NOTE: a token shipped to a public static site via NEXT_PUBLIC_*
// is visible in the browser bundle — this deters casual/bot hits on the raw URL
// and lets you rotate access; it is not a true secret.
const API_TOKEN = process.env.API_TOKEN || '';

const ALLOWED_IPS = listEnv('ALLOWED_IPS');

// Optional CORS origin allowlist. Unset keeps `*`, which is what makes the docs
// site's browser-side search work at all.
//
// Worth understanding before tightening it: the bearer token ships in a public
// NEXT_PUBLIC_* bundle, so `*` lets ANY origin lift the token and drive
// authenticated cross-origin calls from a visitor's browser. That is a
// resource-abuse vector, not a credential leak — `Access-Control-Allow-Credentials`
// is deliberately never set, so no cookie or session rides along. Set
// ALLOWED_ORIGINS to the docs origin(s) to close it.
const ALLOWED_ORIGINS = listEnv('ALLOWED_ORIGINS').map((s) => s.replace(/\/$/, ''));

// Forwarded-IP headers are just client-supplied strings; they only mean anything
// when a proxy we control overwrites them on the way in. Both are therefore opt-in.
//
// This is the one place the platform changed the design. The node:http original
// could always fall back to `req.socket.remoteAddress`; a Web `Request` exposes no
// socket at all, so when nothing here is configured there is NO client identity
// available and every caller shares one rate-limit bucket (see `rateLimited`).
//
//   TRUST_CF=1          — a Cloudflare edge is genuinely in front (CF rewrites
//                         `CF-Connecting-IP` there, so a client can't forge it).
//   TRUST_PROXY_HOPS=n  — n trusted reverse proxies append to X-Forwarded-For.
//                         On Sevalla that is 1. Leave at 0 to distrust XFF.
const TRUST_CF = process.env.TRUST_CF === '1';
const TRUST_PROXY_HOPS = numEnv('TRUST_PROXY_HOPS', 0, { min: 0 });

/**
 * Best-effort client identity, or '' when none is trustworthy.
 *
 * X-Forwarded-For is a list any client may pre-populate, and each reverse proxy
 * APPENDS the peer it actually saw. Trusting the leftmost value therefore hands
 * the caller the exact IP spoof that TRUST_PROXY_HOPS exists to prevent —
 * allowlist bypass plus a rate-limit key they can rotate at will. Count in from
 * the RIGHT by the number of proxies we actually run.
 */
export function clientIp(req: Request): string {
  if (TRUST_CF) {
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf.trim();
  }
  if (TRUST_PROXY_HOPS > 0) {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const hops = xff
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const i = hops.length - TRUST_PROXY_HOPS;
      // Fewer hops than configured means the request did NOT come through the
      // full proxy chain. Treat it as unidentified rather than reading whatever
      // the client happened to put in position 0.
      if (i >= 0 && hops[i]) return hops[i].replace(/^::ffff:/, '');
    }
  }
  return '';
}

/** Constant-time compare so response latency can't leak the token prefix. */
function tokenOk(header: string | null): boolean {
  if (!API_TOKEN) return true;
  if (!header) return false;
  const got = Buffer.from(header);
  const want = Buffer.from(`Bearer ${API_TOKEN}`);
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}

function ipAllowed(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) return true;
  // An allowlist we cannot evaluate must DENY, not pass. Reaching here with no
  // identity means TRUST_CF/TRUST_PROXY_HOPS are unset while ALLOWED_IPS is set
  // — a misconfiguration that would otherwise silently disable the allowlist.
  if (!ip) return false;
  // Exact match, or a trailing-`*` prefix (e.g. `2802:8011:3070:6300:*` for a
  // whole IPv6 /64 — handy since privacy-extension addresses rotate the suffix).
  return ALLOWED_IPS.some((e) => (e.endsWith('*') ? ip.startsWith(e.slice(0, -1)) : ip === e));
}

// Per-IP sliding-window rate limit. RATE_MAX requests per RATE_WINDOW_S seconds;
// set RATE_MAX=0 to disable.
//
// In-memory, therefore PER INSTANCE: scale the app past one replica and the
// effective limit multiplies by the replica count. That is acceptable for a
// read-only docs backend sized to a single pod; a horizontally scaled deployment
// wants a shared store instead.
const RATE_MAX = numEnv('RATE_MAX', 60, { min: 0 });
const RATE_WINDOW_MS = numEnv('RATE_WINDOW_S', 60) * 1000;
const rateHits = new Map<string, number[]>();
let warnedNoIp = false;

function rateLimited(ip: string): number {
  if (RATE_MAX <= 0) return 0;
  if (!ip && !warnedNoIp) {
    warnedNoIp = true;
    console.warn(
      '⚠ Rate limiting is on but no trusted client-IP source is configured ' +
        '(TRUST_CF / TRUST_PROXY_HOPS) — all callers share one bucket. ' +
        'Set TRUST_PROXY_HOPS=1 behind Sevalla.',
    );
  }
  const key = ip || '@shared';
  const now = Date.now();
  const recent = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateHits.set(key, recent);
    return Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000)); // Retry-After secs
  }
  recent.push(now);
  rateHits.set(key, recent);
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

export function corsHeaders(req: Request): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, mcp-session-id, mcp-protocol-version',
    'Access-Control-Expose-Headers': 'mcp-session-id',
  };
  if (ALLOWED_ORIGINS.length === 0) {
    h['Access-Control-Allow-Origin'] = '*';
    return h;
  }
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  if (origin && ALLOWED_ORIGINS.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  // Same URL yields different CORS headers per Origin, so caches must not reuse
  // one origin's response for another.
  h['Vary'] = 'Origin';
  return h;
}

export function json(req: Request, status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...corsHeaders(req), ...extra } });
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * Run the gate chain. Returns a Response to send instead of handling the
 * request, or null to proceed. Order matches the full service: IP allowlist →
 * bearer token → rate limit.
 */
export function gate(req: Request): Response | null {
  const ip = clientIp(req);
  if (!ipAllowed(ip)) return json(req, 403, { error: 'forbidden' });
  if (!tokenOk(req.headers.get('authorization'))) return json(req, 401, { error: 'unauthorized' });
  const retryAfter = rateLimited(ip);
  if (retryAfter > 0) {
    return json(req, 429, { error: 'rate limited', retryAfter }, { 'Retry-After': String(retryAfter) });
  }
  return null;
}

/** True when the caller holds the token (or no token is configured). */
export function isAuthorized(req: Request): boolean {
  return tokenOk(req.headers.get('authorization'));
}

// Cap request bodies so a single huge POST can't exhaust memory (search queries
// and MCP JSON-RPC are all tiny).
export const MAX_BODY_BYTES = numEnv('MAX_BODY_BYTES', 262_144);

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/**
 * Read a request body, refusing anything over the cap.
 *
 * Checks Content-Length first as a cheap reject, then counts bytes while
 * streaming — because Content-Length is caller-supplied and absent entirely on a
 * chunked upload, so trusting it alone leaves the cap trivially bypassable.
 */
export async function readBody(req: Request): Promise<string> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new HttpError(413, 'request body too large');
  }
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new HttpError(413, 'request body too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Parse a JSON request body. A client's malformed JSON is a 400, not a 500 — a
 * bare `JSON.parse` throws a SyntaxError that falls through to the catch-all and
 * gets reported as an internal server error, with the parser's message as the
 * body. Also rejects non-objects, which would reach destructuring below and throw
 * (`null` → TypeError → another spurious 500).
 */
export function parseJsonBody(raw: string): Record<string, unknown> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

/**
 * Validate and normalize a caller-supplied query.
 *
 * A plain `!query` test only catches the empty string, so a whitespace-only body
 * ("   ") passes validation and buys a full query embedding to rank nothing.
 */
export function requireQuery(v: unknown): string {
  if (typeof v !== 'string' || v.trim() === '') {
    throw new HttpError(400, 'query (non-empty string) required');
  }
  return v.trim();
}

/**
 * Map a thrown error onto a response.
 *
 * Only messages this codebase authored (the 4xx HttpErrors above) are echoed.
 * Anything else is an internal failure whose text routinely carries local
 * filesystem detail — an ENOENT from the ONNX runtime names the model path, which
 * hands a caller the container layout and model inventory.
 */
export function errorResponse(req: Request, e: unknown): Response {
  if (e instanceof HttpError) return json(req, e.status, { error: e.message });
  console.error('request error:', e);
  return json(req, 500, { error: 'internal error' });
}
