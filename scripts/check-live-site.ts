/**
 * Smoke check for the deployed site's agent-facing surfaces. Needs no build,
 * only network: it fetches the live site and asserts what an AI client would
 * rely on.
 *
 *   tsx scripts/check-live-site.ts [--wait <minutes>]
 *
 * With --wait it re-runs every minute until everything passes or the time is
 * up, because a push to `published` is deployed some minutes after CI starts.
 * Env: SMOKE_SITE (default https://docs.pears.com), SMOKE_MCP_URL (default
 * https://mcp.pears.com/mcp).
 */
const SITE = (process.env.SMOKE_SITE ?? 'https://docs.pears.com').replace(/\/+$/, '');
const MCP_URL = process.env.SMOKE_MCP_URL ?? 'https://mcp.pears.com/mcp';
const PRODUCTS = ['pear', 'p2p', 'bare'];
const SAMPLES = 12;

type Result = { failures: string[]; warnings: string[] };

const mdPath = (pageUrl: string) => (pageUrl === '/' ? '/index.md' : `${pageUrl.replace(/\/+$/, '')}.md`);

async function get(path: string, init?: RequestInit) {
  return fetch(path.startsWith('http') ? path : `${SITE}${path}`, init);
}

async function text(path: string, failures: string[]): Promise<string> {
  const res = await get(path);
  if (!res.ok) failures.push(`${path}: HTTP ${res.status}`);
  return res.ok ? res.text() : '';
}

// Lines outside code fences, which is where JSX and entities are leaks.
function proseLines(md: string): string[] {
  let fenced = false;
  return md.split('\n').filter((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return false;
    }
    return !fenced;
  });
}

function pickSamples(pages: string[]): string[] {
  const step = Math.max(1, Math.floor(pages.length / SAMPLES));
  const deepest = pages.reduce((a, b) => (b.split('/').length > a.split('/').length ? b : a), pages[0]);
  return [...new Set([...pages.filter((_, i) => i % step === 0), deepest])];
}

async function checkSite({ failures, warnings }: Result): Promise<void> {
  const sitemap = await text('/sitemap.xml', failures);
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).sort();
  if (pages.length === 0) {
    failures.push('sitemap.xml lists no pages');
    return;
  }

  const llms = await text('/llms.txt', failures);
  const listed = new Set([...llms.matchAll(/^- \[[^\]]*\]\(https?:\/\/[^)]*?(\/[^)/]*(?:\/[^)/]*)*\.md)\)/gm)].map((m) => m[1]));
  const expected = new Set(pages.map(mdPath));
  const missing = [...expected].filter((p) => !listed.has(p));
  const extra = [...listed].filter((p) => !expected.has(p));
  if (missing.length || extra.length) {
    failures.push(
      `llms.txt lists ${listed.size} pages, sitemap has ${expected.size} (missing ${missing.length}: ${missing.slice(0, 3)}; extra ${extra.length}: ${extra.slice(0, 3)})`,
    );
  }
  if (!/^MCP server: /m.test(llms)) failures.push('llms.txt has no MCP server line');

  for (const page of pickSamples(pages)) {
    const path = mdPath(page);
    const res = await get(path);
    if (!res.ok) {
      failures.push(`${path}: HTTP ${res.status}`);
      continue;
    }
    const lines = proseLines(await res.text());
    if (lines.length > 40 && !lines.some((l) => /^#{2,} /.test(l))) failures.push(`${path}: no headings`);
    if (lines.some((l) => /^import /.test(l))) failures.push(`${path}: has an import line`);
    if (lines.some((l) => /^\s*<\/?[A-Z]/.test(l))) failures.push(`${path}: has JSX outside code`);
    if (lines.some((l) => l.includes('&#x'))) failures.push(`${path}: has numeric entities`);

    const negotiated = await get(page, { redirect: 'manual', headers: { Accept: 'text/markdown' } });
    const target = negotiated.headers.get('location') ?? '';
    if (negotiated.status !== 303 || !target.endsWith(path)) {
      failures.push(`${page}: Accept: text/markdown gave ${negotiated.status} ${target}, want 303 to ${path}`);
    }
  }

  // Not fixed yet (needs a zone rule), so a warning rather than a failure.
  const weighted = await get(pages.at(-1)!, {
    redirect: 'manual',
    headers: { Accept: 'text/markdown, text/html;q=0.9' },
  });
  if (weighted.status !== 303) warnings.push(`weighted Accept header gave ${weighted.status}, want 303`);

  for (const [path, scope] of [['/llms-full.txt', ''], ...PRODUCTS.map((p) => [`/${p}/llms-full.txt`, `/${p}/`])]) {
    const body = await text(path, failures);
    const sources = body.split('\n').filter((l) => l.startsWith('Source: ')).length;
    const want = pages.filter((p) => p.startsWith(scope)).length;
    if (body && sources !== want) failures.push(`${path}: ${sources} Source lines, want ${want}`);
  }

  const home = await get('/', { method: 'HEAD' });
  const link = home.headers.get('link') ?? '';
  for (const rel of ['llms-txt', 'mcp-server-card']) {
    if (!link.includes(`rel="${rel}"`)) failures.push(`/: Link header lacks rel="${rel}"`);
  }

  const card = await get('/.well-known/mcp/server-card.json');
  if (!card.ok) failures.push(`server-card.json: HTTP ${card.status}`);
  else if ((await card.json()).transport?.endpoint !== MCP_URL) failures.push('server-card.json endpoint is not the MCP URL');
}

async function rpc(method: string, id: number, params: object = {}): Promise<any> {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  return JSON.parse(body.startsWith('{') ? body : body.match(/^data: (.*)$/m)![1]).result;
}

async function checkMcp({ failures }: Result): Promise<void> {
  try {
    const init = await rpc('initialize', 1, {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'pear-docs-smoke', version: '1' },
    });
    if (!init.serverInfo?.name) failures.push('MCP initialize returned no serverInfo');
    const names = (await rpc('tools/list', 2)).tools.map((t: { name: string }) => t.name);
    for (const tool of ['search_docs', 'fetch_doc']) {
      if (!names.includes(tool)) failures.push(`MCP tools/list lacks ${tool}`);
    }
  } catch (err) {
    failures.push(`MCP ${MCP_URL}: ${(err as Error).message}`);
  }
}

async function runOnce(): Promise<Result> {
  const result: Result = { failures: [], warnings: [] };
  await Promise.all([
    checkSite(result).catch((e) => result.failures.push(`site check crashed: ${e.message}`)),
    checkMcp(result),
  ]);
  return result;
}

async function main(): Promise<void> {
  const wait = process.argv.indexOf('--wait');
  const deadline = Date.now() + (wait > 0 ? Number(process.argv[wait + 1]) : 0) * 60_000;
  let result = await runOnce();
  while (result.failures.length && Date.now() < deadline) {
    console.log(`${result.failures.length} failure(s), retrying in 60s…`);
    await new Promise((r) => setTimeout(r, 60_000));
    result = await runOnce();
  }
  for (const w of result.warnings) console.warn(`warning: ${w}`);
  if (result.failures.length) {
    console.error(result.failures.map((f) => `✖ ${f}`).join('\n'));
    process.exit(1);
  }
  console.log(`live site OK (${SITE}, ${MCP_URL})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
