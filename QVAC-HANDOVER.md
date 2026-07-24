# QVAC Docs Search — Session Handover

> Handover for a fresh agent picking up this work. **Do not commit this file** — it
> describes infra and is scoped to holepunchto/pear-docs, an org repo. It contains
> no secret *values* (tokens/passwords are referenced by name only).

Date of handover: 2026-07-24. Written after a long multi-part session.

---

## 1. What the thing is

`service/` in pear-docs (and now a standalone copy — see §2) is a **QVAC-backed
semantic search + RAG "ask the docs" + MCP server** for the Pear docs site.
Node + `tsx`, `@qvac/sdk` (llama.cpp bindings) running models **locally**
(GTE-large embeddings + Qwen3-14B answer model on the live box). Not the
`@qvac/rag` package — it's the **primitives path** (`embed()` + a hand-rolled
int8 vector store + `completion()`).

8 source files (~1,177 lines): `server.ts` (HTTP: /health, /api/search,
/api/ask SSE, /mcp), `engine.ts` (shared retrieval/answer engine), `store.ts`
(int8 vector store), `embedder.ts`, `llm.ts`, `mcp.ts` (stateless MCP tools:
search_docs/ask_docs/fetch_doc), `corpus.ts` + `index-build.ts` (build-time
index). `corpus.ts` also reaches into the parent repo's `content/`,
`scripts/helpers.ts`, and referenced `examples/**`.

---

## 2. Repos & branches — current state

- **holepunchto/pear-docs**, branch **`test/qvac-search-and-mcp`** — the working
  branch. Tip pushed to origin. Contains `service/` + website integration
  (`src/components/search.tsx`, `mcp-menu.tsx`). This session merged `published`
  into it (10 commits / 54 content files) — clean, no conflicts.
- **lucas-tortora/qvac-docs-search** (PRIVATE) — standalone copy of `service/`,
  flattened to repo root (`src/*.ts` at top level, not `service/src/`). Single
  fresh commit. This was "move the search service to a personal repo." **No
  source-of-truth decision made yet** — see §6.
- The user's **local `published` working tree has 29 uncommitted docs edits**
  (16 modified content .mdx + `src/lib/custom-tree.ts` + 12 new files). These are
  the user's in-progress work — **do not touch / commit them.** They were stashed
  and restored once already this session; verified byte-identical.

---

## 3. Deployed service — box, access, redeploy

- **Box:** Hetzner Cloud, `ubuntu-8gb-nbg1-2`, **CPU-only** (QVAC_DEVICE=cpu),
  public IP **167.233.160.167**, reachable at `https://167-233-160-167.sslip.io`
  (Caddy `reverse_proxy localhost:8787`). **No Cloudflare in front** despite older
  comments — the sslip.io host resolves straight to the origin IP.
- **Access:** SSH key **`~/.ssh/qvac-deploy`** (ed25519, created this session,
  installed into `/root/.ssh/authorized_keys`). `ssh -i ~/.ssh/qvac-deploy root@167.233.160.167`.
- **Layout: it is a BARE rsync/scp deploy, NOT a git checkout.** Lives at
  `/opt/qvac/{service,content,scripts,examples,models}`. Runs as systemd unit
  **`qvac.service`** (User=qvac, WorkingDirectory=/opt/qvac/service). Env (incl.
  `QVAC_API_TOKEN`, model paths, rate-limit) is in the unit file
  `/etc/systemd/system/qvac.service`.
- **Redeploy = rsync files + run the box's own script.** `/opt/qvac/reindex.sh`
  does `npm run build:index` (as qvac user, ~700s CPU embed) then
  `systemctl restart qvac` then health-checks. To update: rsync `content/` (with
  `--delete`), `service/src/`, and any newly-referenced `examples/**`, `chown -R
  qvac:qvac`, then `bash /opt/qvac/reindex.sh`. Pre-sync backups go to
  `/root/qvac-backups/`.
- **Live state after this session's redeploy:** 126 pages / **1,705 chunks**,
  llm=qwen3-14b, healthy. Verified: 401 without token / 200 with; body cap fires
  (413 server-side, surfaces as 502 through Caddy).

---

## 4. Work completed this session

1. Answered: RAG uses QVAC primitives, not `@qvac/rag`. Corrected `service/OVERVIEW.md`
   accordingly (committed + pushed on the branch).
2. Ran a `/code-review` on the branch diff; **applied + deployed 7 fixes** to
   `service/src`: request body-size cap, `crypto.timingSafeEqual` token compare,
   `QVAC_TRUST_XFF` gate on X-Forwarded-For, corpus asterisk-only emphasis strip
   (was mangling snake_case), embedding model-name mismatch warning, and
   `QVAC_LLM_NOTHINK`-aware reasoning-trace detection. (search.tsx also got:
   Ask-panel `res.ok` check, token-throttle + memoized markdown.)
3. Merged latest `published` docs into the branch; redeployed the box (see §3).
4. Created the standalone private repo (§2).
5. Cost analysis: self-hosted → flat server cost, ~$0 marginal per response.
   CPU box is the "slow" tier; GPU (Hetzner GEX44 ~€184/mo) is the "enterprise,
   not slow" answer and fits Qwen3-14B Q4 in 20GB.
6. Vercel feasibility (no Ask AI): `fetch_doc` trivially portable; `search`'s
   embedder is the blocker (639MB model load per cold start; needs Fluid Compute;
   native-binary-in-Lambda-sandbox unverified).
7. Started an **in-depth review workflow** — see §5.

---

## 5. ⏳ IN PROGRESS — deep code review (the main open item)

A 9-finder → dedup → 2-vote adversarial verify → synthesize workflow ran.
**The 9 finders completed (49 findings). The 65 verify agents + synthesis all
FAILED on the account session limit** (resets ~14:20 America/Buenos_Aires).
So the reported `uniqueVerified:0 / refuted:32` is a MISREAD — nothing was truly
refuted; verification simply didn't run.

### How to resume (cheapest, do this first after the limit resets)
```
Workflow({ scriptPath: "/Users/lucas/.claude/projects/-Users-lucas-Documents-tether-pear-docs/5e47950d-b4c0-483e-b1a3-6481a8f87674/workflows/scripts/qvac-service-deep-review-wf_fa54e16d-82f.js",
           resumeFromRunId: "wf_fa54e16d-82f" })
```
The 9 finders replay from cache (free); only verify + synthesize re-run. If the
scratchpad/journal is gone, the full raw findings are also saved at
`…/scratchpad/qvac-raw-findings.json` (49 objects, ranked).
Review source is staged at **`/tmp/qvac-review/service/src`** (worktree of the
branch) — recreate with `git worktree add /tmp/qvac-review test/qvac-search-and-mcp`
if cleaned.

### High-signal clusters (UNVERIFIED, but corroborated by multiple independent finders)
These recurred across finders — treat as likely-real, but still run the adversarial
verify before acting. Several are **gaps in this session's own fixes.**

- **[HIGH] server.ts:47-48 — `CF-Connecting-IP` trusted unconditionally.** The XFF
  fix I added gated `X-Forwarded-For` behind `QVAC_TRUST_XFF`, but `CF-Connecting-IP`
  is still trusted with no gate. Since the box is **directly reachable (no
  Cloudflare)** and Caddy forwards inbound headers, an attacker sends
  `CF-Connecting-IP: <allowlisted>` to bypass `QVAC_ALLOWED_IPS` and spoof the
  rate-limit key. **Most important finding; my earlier fix left this half-open.**
- **[HIGH] llm.ts / engine.ts — one shared llama.cpp context, no serialization
  across concurrent requests.** Engine is a single long-lived instance; concurrent
  /api/ask + /api/search hit the same model context → corruption/crash. Needs a
  mutex/queue around inference.
- **[HIGH] server.ts:118 (+75/76) — non-numeric/empty env → NaN silently disables
  guards.** `Number(QVAC_MAX_BODY_BYTES)`=NaN → `size > NaN` always false → body
  cap OFF. Same class disables the rate limiter (+ hot interval). Gap in my body-cap fix.
- **[HIGH] corpus.ts:77 — code-import `#Lx-Ly` line ranges ignored**, whole file
  inlined into RAG context.
- **[HIGH/MED] corpus.ts:104-105 — JSX/tag stripper deletes `<Type>` angle-bracket
  notation and `<include>` partials**, corrupting reference-doc prose + anchors.
- **[HIGH] server.ts:260 — shutdown unloads models while requests are in-flight.**
- **[MED] server.ts:184/237 — malformed JSON body → 500 instead of 400.**
- **[MED] server.ts:248 — error after SSE headers sent corrupts the /api/ask stream.**
- **[MED] mcp.ts:77 — ask_docs never cancels generation on client disconnect.**
- **[MED] store.ts:149 — searchSections backfill breaks score ordering / per-page cap.**
- **[MED] store.ts:108 — uncapped query → O(terms×chunks) scan; substring match
  hits inside unrelated words.**
- **[MED] corpus.ts:152 — slug via `file.indexOf('content')` matches first
  'content' anywhere in the path.**
- **[LOW] llm.ts:65 — `QVAC_LLM_NOTHINK` override ignored for named presets** (my
  fix only wired it into the explicit-path branch).
- **[LOW] index-build.ts:64 — sibling `x.mdx` + `x/index.mdx` collapse to one URL.**

Full ranked list of all 49: `…/scratchpad/qvac-raw-findings.json`.

---

## 6. Open decisions / TODOs

- **Source of truth** between `pear-docs/service/` and `lucas-tortora/qvac-docs-search`
  — not decided. Box syncs from pear-docs today. Pick one; if switching to the
  personal repo, repoint the redeploy source.
- **Deep-review verification** — resume per §5, then apply the confirmed fixes
  (prioritize the CF-Connecting-IP bypass + NaN-disables-guards + concurrency).
- **GPU migration** — if "enterprise/not slow" is wanted, move off the CPU box to
  a GPU box (GEX44). Not started.

---

## 7. ⚠️ Security — rotate these (exposed this session)

- **Root password** `qdmqwRAX9WUA` was pasted into chat → treat as compromised.
  User chose "leave as-is" but it should be rotated / password-auth disabled
  (`PasswordAuthentication no`) now that the `qvac-deploy` key works.
- **`QVAC_API_TOKEN`** value is visible in `/etc/systemd/system/qvac.service` on
  the box (and was read during recon). It's a `NEXT_PUBLIC_*` deterrent token, not
  a true secret, but rotate if concerned.

---

## 8. Key paths & commands

- SSH: `ssh -i ~/.ssh/qvac-deploy root@167.233.160.167`
- Health: `curl -s https://167-233-160-167.sslip.io/health`
- Redeploy: rsync content/ + service/src/ → `/opt/qvac/…`, then `bash /opt/qvac/reindex.sh`
- Review source worktree: `/tmp/qvac-review` (branch `test/qvac-search-and-mcp`)
- Workflow script: `…/workflows/scripts/qvac-service-deep-review-wf_fa54e16d-82f.js`
- Raw findings: `…/scratchpad/qvac-raw-findings.json`

## 9. Gotchas

- Box deploy is **bare, not git** — never `git pull` there; rsync + reindex.sh.
- `build:index` is **~700s on CPU** and needs `content/` + `scripts/helpers.ts`
  (+ a `scripts/node_modules` symlink for github-slugger) + referenced `examples/**`.
- Account **session limit** is real (~80-agent workflows blow it). Batch smaller
  or verify in the main loop.
- The user's `published` working tree edits (§2) are sacred — stash-safe, restore exactly.
