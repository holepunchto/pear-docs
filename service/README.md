# Pear docs — QVAC search + RAG + MCP service (PoC)

A small Bare/Node service that powers the docs site's **semantic search** and a
**RAG "ask the docs"** panel, and exposes the docs to AI agents over **MCP** — all
backed by [QVAC](https://github.com/tetherto/qvac) running locally.

The docs site stays a static export; only search/ask/MCP calls hit this service.
One retrieval backend, two consumers (website + MCP).

## How it works

```
content/*.mdx ──(build:index)──▶ data/index.json   (chunks: prose vectors + raw code)
                                  data/pages.json   (per-page markdown, code preserved)
                                        │
                          server.ts loads index + QVAC models
                                        │
  website search box ──▶ POST /api/search   (semantic, query embedded by QVAC)
  website ask panel  ──▶ POST /api/ask      (SSE: sources → tokens → done)
  AI agents (MCP)    ──▶ /mcp               (search_docs · ask_docs · fetch_doc)
  monitoring         ──▶ GET  /health       (chunk count, models, llm status)
```

- **Embeddings:** QVAC `embed()` with GTE-large (GGUF). Query embedded server-side
  at request time — no in-browser model.
- **Retrieval:** hybrid over a prebuilt int8 index (`src/store.ts`) — cosine plus a
  light lexical boost on heading/title term matches, returned as **section-level**
  hits that deep-link to the heading anchor (`…/page/#section`), capped per page for
  diversity. The same `Engine.search` surface can later be swapped to `@qvac/rag` + HyperDB.
- **Answers:** QVAC `completion()` with a selectable model (`QVAC_LLM=fast|quality`).
  Grounded in retrieved passages **including real code** — the corpus resolves the
  docs' `file=<rootDir>/…` code transclusions (like `remark-code-import`) and keeps
  fenced code, so answers reproduce actual example code instead of inventing APIs.
  Without an LLM it streams an **extractive** answer instead, so `/api/ask` always works.
- **Corpus:** reuses the docs repo's own `scripts/helpers.ts` (`getFiles`,
  `fileToSlug`) so indexed/cited URLs match the link checker exactly. Each chunk gets
  two text forms: **prose** (embedded, within the 512-token budget) and
  **code-preserving markdown** (RAG context + the MCP `fetch_doc` body).

## Run

```bash
cd service
npm install
npm run build:index   # embeds the corpus → data/*.json  (~100s, one-time)
npm run start         # serves on http://localhost:8787
```

The default answer model is **Qwen3-8B** (~4.7 GB). If it isn't cached yet, fetch it
once (or run with `QVAC_LLM=balanced`/`fast` to use a smaller cached model):

```bash
curl -L -o ~/.qvac/models/qwen3-8b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf
```

Point the website at it (default already targets localhost):

```bash
# pear-docs/.env.local
NEXT_PUBLIC_QVAC_API_URL=http://localhost:8787
```

Then `npm run dev` in the repo root. If the service is down or unset, the search
box automatically falls back to the static Orama keyword index.

### Connect an MCP client

```bash
claude mcp add --transport http pear-docs http://localhost:8787/mcp
```

Tools: `search_docs(query, topK?)`, `ask_docs(query)`, `fetch_doc(url)`.

## Configuration

| Env | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP port |
| `QVAC_EMBED_GGUF` | cached GTE-large | embedding model path |
| `QVAC_LLM` | `quality` | answer-model preset: `quality` (Qwen3-8B), `balanced` (Qwen3-4B), or `fast` (Llama-3.2-1B) |
| `QVAC_LLM_GGUF` | — | explicit GGUF path; overrides `QVAC_LLM` |
| `QVAC_DISABLE_LLM` | unset | set `1` to force extractive answers |

The answer model is a toggle. **`quality` (Qwen3-8B) is the default** — the small
`fast` model fabricates APIs in code examples, which is unacceptable for a docs
assistant. `balanced` (Qwen3-4B) is a lighter middle ground; `fast` (Llama-3.2-1B)
is quickest but least reliable on code — use it only where latency matters more than
fidelity. Qwen's reasoning trace is suppressed automatically. `GET /health` reports
the active model. (Qwen3-8B GGUF lives at `~/.qvac/models/qwen3-8b-instruct-q4_k_m.gguf`;
override any model with `QVAC_LLM_GGUF`.)

## Notes / known constraints (PoC)

- **Registry bypass:** models are loaded by **file path** (`modelType:
  llamacpp-embedding` / `llamacpp-completion`), not via the QVAC model registry.
  On a machine where the Keet app is running, Keet holds an exclusive lock on the
  shared `~/.qvac/registry-corestore`, so registry-based loads fail with *"File
  descriptor could not be locked."* Filesystem loads sidestep that and reuse the
  already-cached weights. A production deploy on a dedicated host can use the
  registry normally (or keep pinning explicit model files).
- **Vectors are int8-quantized** and L2-normalized; cosine = dot product.
- This is a proof of concept: no auth/rate-limiting on `/mcp` or the APIs yet —
  add those before any non-local deployment.
