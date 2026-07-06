# QVAC Docs Search — High-Level Overview

A small local-first service that powers the Pear documentation site's **search**,
a **RAG "ask the docs"** panel, and an **MCP server** for AI agents — all running
on [QVAC](https://github.com/tetherto/qvac) (Tether's on-device AI stack) over the
Bare/Holepunch ecosystem. The docs website itself stays a plain static export; it
just calls this service for the smart bits.

---

## What it does

| Capability | Endpoint | Used by |
| --- | --- | --- |
| **Semantic search** — find pages by meaning, not keywords | `POST /api/search` | the docs site search box |
| **RAG answers** — a written answer with `[n]` citations, streamed | `POST /api/ask` (SSE) | the docs site "Ask the docs" panel |
| **Docs-as-tools** — let any AI agent search/read the docs | `/mcp` → `search_docs`, `ask_docs`, `fetch_doc` | Claude, IDEs, other MCP clients |
| **Health** | `GET /health` | monitoring |

One QVAC-backed retrieval engine serves all of the above, so the website and AI
agents always get identical results. When the service is offline, the website
automatically falls back to its existing static keyword (Orama) index.

### How it works (in one picture)

```
content/*.mdx ──build:index──▶ data/index.json   (text chunks + int8 vectors)
                               data/pages.json   (per-page markdown)
                                       │
                       server loads the index + QVAC models once
                                       │
   search box ─▶ /api/search   QVAC embeds the query, ranks chunks (hybrid)
   ask panel  ─▶ /api/ask      retrieve top chunks → QVAC LLM writes the answer
   AI agents  ─▶ /mcp          same engine exposed as MCP tools
```

- **Embeddings:** QVAC `embed()` with GTE-large — the query is embedded
  server-side at request time (no model in the browser).
- **Retrieval:** hybrid (semantic cosine + a light lexical boost on heading terms)
  over a prebuilt, int8-quantized index in `src/store.ts`. Results are **section-level**
  and deep-link to the heading anchor (e.g. `…/set-up-multisig/#create-signing-keys`).
  This is QVAC's **primitives** RAG path — `embed()` + our own vector store +
  `completion()` — not the managed workspace helpers (`ragIngest()` / `ragSearch()`)
  that own persistence for you. The store is hand-rolled on purpose, to get the hybrid
  ranking and section-level deep-linking; the same `Engine.search` surface could later
  move onto the managed `ragIngest`/`ragSearch` path.
- **Answers:** QVAC `completion()` with a selectable model — `quality` (Qwen3-8B,
  the default — smaller models fabricate code APIs), `balanced` (Qwen3-4B), or `fast`
  (Llama-3.2-1B), via `QVAC_LLM`. With no LLM available it streams an *extractive*
  answer instead, so the endpoint always responds.
- **Corpus:** built straight from the `.mdx` files, reusing the docs repo's own
  `scripts/helpers.ts` so indexed/cited URLs match the rest of the tooling.

---

## What it needs

- **Node 18+** (developed on Node 25) — or **Bare 1.24+**. QVAC is cross-platform
  (macOS/Linux/Windows, Node or Bare).
- **`@qvac/sdk`** (npm, ships native prebuilds) + **`@modelcontextprotocol/sdk`**.
  Installed via `npm install` in `service/`.
- **GGUF model files** loaded **by file path** from the local `~/.qvac/models`
  cache: GTE-large (fp16) for embeddings, plus a selectable answer model — the default
  `quality` preset is Qwen3-8B (~4.7 GB), with `balanced` (Qwen3-4B) and `fast`
  (Llama-3.2-1B) as lighter options via `QVAC_LLM`. Override paths with
  `QVAC_EMBED_GGUF` / `QVAC_LLM_GGUF`.
- **GPU by default** — Metal on Apple Silicon / CUDA; set `QVAC_DEVICE=cpu` to opt out.
- **RAM:** the embedding model plus the selected answer model, both held in memory —
  roughly ~6–7 GB with the Qwen3-8B default, ~2–3 GB with the `fast` model.
- **Disk:** ~4 MB for the generated index (`data/`).

> **Environment note:** models are loaded **by file path**, not via the QVAC
> registry. On a machine where the **Keet** app is running, Keet holds an
> exclusive lock on the shared `~/.qvac` registry, so registry-based loads fail.
> Path-based loading avoids that and reuses cached weights. See `README.md`.

---

## How to install and run

```bash
cd pear-docs/service
npm install                # QVAC SDK (+ native prebuilds), MCP SDK

npm run build:index        # one-time: embed the docs corpus → data/*.json (~100s)
npm run start              # serve on http://localhost:8787
```

Connect the website (default already points at localhost):

```bash
# pear-docs/.env.local
NEXT_PUBLIC_QVAC_API_URL=http://localhost:8787
```

…then run the site normally (`npm run dev` from the repo root). Search now uses
QVAC semantic ranking, with the "Ask the docs" button for RAG answers.

Connect an MCP client:

```bash
claude mcp add --transport http pear-docs http://localhost:8787/mcp
```

### Quick smoke test

```bash
curl localhost:8787/health
curl -s -X POST localhost:8787/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"how do peers find each other","topK":3}'
```

---

## Status

Proof of concept. Working: semantic search, streaming RAG answers with citations,
and all three MCP tools, with a graceful keyword fallback in the website. Not yet
done (intentionally): auth/rate-limiting on the public endpoints, moving retrieval
onto QVAC's managed `ragIngest`/`ragSearch` workspace path, and a deployment target
for the service. See `README.md` for configuration and the known-constraints detail.
