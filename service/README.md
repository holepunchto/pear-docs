# Search + MCP service

Gives the docs site **semantic search**, and gives AI agents **MCP tools** over
the same corpus. A small Next.js app that runs on an ordinary Sevalla
Application pod beside the docs — CPU-only, ~180 MB resident, no GPU, no LLM.

It lives in this repo so that a docs change and the search index it produces
travel in one commit, and so that indexed URLs come from the docs tooling's own
`scripts/helpers.ts` rather than a copy of it.

## Two Sevalla resources, one repo

The docs site is a **Static Site**: `output: 'export'`, no server-side runtime.
This is an **Application**: a Node process. They cannot be one resource, and no
amount of configuration changes that — Next's static export prerenders route
handlers, supports GET only, and gives them no access to the incoming request,
while MCP's Streamable HTTP is POST with a JSON-RPC body. Sevalla static sites
have no backend at all.

So: one repository, one branch, two Sevalla resources pointed at it.

| | Docs site | This service |
| --- | --- | --- |
| Sevalla resource | Static Site | Application |
| Build path | `.` | `service` |
| Output | `out/` static HTML | Node server |

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/search` | `{ query, topK? }` → ranked, anchor-deep-linked sections |
| `GET` | `/api/health` | liveness; index stats and `sourceRef` when authenticated |
| `ALL` | `/mcp` | Streamable-HTTP MCP: `search_docs`, `fetch_doc` |
| `GET` | `/` | static status page |

```json
{
  "model": "Xenova/bge-small-en-v1.5",
  "hits": [
    {
      "url": "/how-to/store-and-replicate/replicate-and-persist-with-hypercore/#create-the-writer-app",
      "title": "Replicate and persist with Hypercore",
      "heading": "Create the writer app",
      "score": 0.7531,
      "snippet": "The writer-app stores command-line input to a Hypercore instance and…"
    }
  ]
}
```

There is deliberately no "ask the docs" endpoint and no `ask_docs` tool. An MCP
client **is** a language model, so it synthesizes better answers from
`search_docs` + `fetch_doc` output than a quantized 8B model in the container
would write for it — and skipping generation is most of what keeps this small.

## Local run

```bash
npm --prefix service install
```

```bash
npm --prefix service run fetch:model
```

```bash
npm --prefix service run build:index
```

```bash
npm --prefix service run dev
```

```bash
curl -s -X POST localhost:8787/api/search -H 'Content-Type: application/json' -d '{"query":"how do peers find each other","topK":3}'
```

Connect an MCP client:

```bash
claude mcp add --transport http pear-docs http://localhost:8787/mcp
```

## The index

`data/index.json` and `data/pages.json` are committed build artifacts: chunk
metadata plus int8-quantized 384-dim vectors, and per-page markdown backing
`fetch_doc`. ~5 MB for ~3.3k chunks over ~180 pages.

They are committed because the Sevalla Application builds from `service/` and
has no reason to re-derive them — and because committing the index is what makes
a push a deployment.

`scripts/corpus.ts` does the extraction. It reads `content/**` from the repo root
and takes its file walk and slug mapping from **`scripts/helpers.ts`** — the same
functions the internal-link checker uses. That is the point of living in this
repo: `fileToSlug` decides the URLs the index cites and deep-links to, so a copy
of it that drifted would make every citation point at a URL that no longer
exists. There is now no copy.

`scripts/corpus.ts` sits under `scripts/` rather than `lib/` for a concrete
reason: it reaches out of `service/` into the repo root, and `next build`
type-checks everything `tsconfig.json` includes. A Sevalla build whose Build path
is `service` cannot see the repo root, so a `lib/` placement would fail the
deploy on a module that never ships. `tsconfig.scripts.json` type-checks it
instead; `npm run typecheck` runs both.

### Why startup is strict

`index.json` records the encoder's `model`, `dim`, `pooling` and `queryPrefix`,
and the server refuses to start if the running model disagrees with any of them.

All three presets in `lib/models.ts` are 384-dimensional, so a dimension check
alone would pass while the vectors lived in a completely different space — and
BGE's CLS pooling and asymmetric query prefix shift scores without changing
shape. Every one of those mismatches degrades ranking *silently*. Failing at boot
is the only place the error is cheap.

## Deploying

`.github/workflows/build-search-index.yml` rebuilds the index when anything it
derives from changes (`content/**`, `examples/**`, `scripts/helpers.ts`, the
service's own build scripts and model registry) and pushes it. Sevalla redeploys
the Application on push, so **committing a changed index is the deployment**.

The run is a no-op when nothing indexable changed — `scripts/build-index.ts`
compares content with the volatile `builtAt`/`sourceRef` fields masked out and
leaves the files alone if the substance matches. A docs commit that touches only
a component produces no diff, no push and no redeploy.

On a real change it typechecks, builds, and **smoke-tests the new index** —
health reports chunks, a real query returns hits, both MCP tools list — before
committing. The push deploys immediately, so a corrupt or dimension-mismatched
index has to be caught here rather than in production.

It needs **no secrets**. Only `service/`'s own dependencies are installed, so it
never touches the token-gated `@tetherto/*` packages the docs build needs.

### Sevalla setup

Create a second resource — an **Application** — alongside the existing Static
Site, pointed at this repo and branch.

**Required**: Build path `service`. Leave the build strategy on Nixpacks; a
`Procfile` names the web process and `next start` reads the `PORT` Sevalla
injects. No Dockerfile, no environment variable.

**Strongly recommended**:

- **Health check path `/api/health`** on the web process — this is what buys
  zero-downtime deploys, since old pods keep serving until new ones are ready.
  Sevalla probes every 10 s and restarts after 3 consecutive failures. Measured
  cold start: listening in 466 ms, first request 182 ms (it triggers the index
  and ONNX load), then ~1.5 ms.
- **≥1 GB RAM.** 182 MB resident measured; the rest is headroom for the ONNX
  arena.
- **Leave horizontal auto-scaling off.** The rate limiter is in-memory, so N
  replicas means N× the effective limit. Scaling out needs a shared store first.

**Environment** — all optional, but three earn their keep:

| Variable | Cost of leaving it unset |
| --- | --- |
| `TRUST_PROXY_HOPS=1` | No client identity, so **every caller shares one rate-limit bucket** — one noisy client 429s everyone. Logged at startup. |
| `ALLOWED_ORIGINS` | CORS falls back to `*`, so any origin can drive the API from a visitor's browser. |
| `DOCS_SITE_URL` | MCP tools cite relative paths that an agent cannot open. |

Everything else in `.env.example` is tuning.

One build-time dependency worth knowing: `prebuild` fetches the 34 MB encoder
from huggingface.co during the Sevalla build. If you would rather builds be
hermetic, drop `service/models/` from the repo `.gitignore` and commit the
weights.

### Wiring up the search dialog

`src/components/search.tsx` currently runs Fumadocs' static Orama index
(`useDocsSearch({ from: '/api/search.json', type: 'static' })`). Keep it as the
offline fallback and try this service first, so search degrades to keyword
matching rather than breaking if the Application is down:

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_SEARCH_API_URL}/api/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, topK: 8 }),
  signal,
});
const { hits } = await res.json();
// hits[].url already carries the #heading anchor — link straight to it.
```

The site stays a static export: this is a client-side `fetch` to another origin,
not a server route. Set `ALLOWED_ORIGINS` on the service to the docs origin and
`NEXT_PUBLIC_SEARCH_API_URL` on the site to the Application's domain.

## How it works

Query embedding runs in-process on a 34 MB ONNX BGE-small-en-v1.5 encoder
(384-dim, int8) through transformers.js, from weights vendored under `models/` at
build time — remote loading is switched off, so a mis-vendored image fails loudly
at startup instead of quietly reaching out to huggingface.co on first request.

Ranking is cosine over int8-quantized normalized vectors plus a bounded lexical
boost for query terms appearing in a heading (strong) or body (weak), deduped to
one hit per section with a per-page diversity cap.

ONNX intra-op threads default to 1. Left unset, onnxruntime sizes its pool from
the *host's* core count, which on a fractional-vCPU pod means a dozen threads
fighting over half a core; a query is one short sequence through a 12-layer
encoder, where the spread between 1 and 4 threads is under a millisecond.

To trade size for quality, switch `EMBED_MODEL` (see `lib/models.ts`) or set
`EMBED_DTYPE=fp32`, and rebuild the index — the two must always match.

## Provenance

This is a stripped build of the QVAC docs service, which embeds with QVAC +
GTE-large and generates answers with a local Qwen3-8B, needs a GPU and ~6–7 GB of
RAM, and runs on a dedicated host. Retrieval behaviour here is unchanged from it;
generation is gone. A `Dockerfile` is kept as a tested alternative to Nixpacks,
though it is not the deployed path — it sets `BUILD_STANDALONE=1`, which is what
switches on Next's standalone output.
