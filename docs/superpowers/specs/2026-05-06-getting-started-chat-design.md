# Getting Started — peer-to-peer chat type-along

- **Status**: Proposed
- **Date**: 2026-05-06
- **Author**: Lucas Tortora
- **Tags**: docs, getting-started, hello-pear-electron
- **Tracking task**: Task 1 of three (getting-started, full tutorial, how-to set)

## Problem

`pear-docs` has no entry-point page for someone who wants to *type* a Pear desktop app, not clone one. The existing `feat/getting-started-guides` fork branch ships a `quick-start.mdx` that is a clone-the-boilerplate walkthrough — useful, but it doesn't teach the moving parts. Newcomers need a page that:

- Reads top-to-bottom in one sitting.
- Produces a working desktop app at the end (so the reader sees the payoff).
- Names each Pear concept exactly once and shows the smallest possible code for it.
- Does not require cloning, forking, or pulling boilerplate.

## Decision

Ship `content/getting-started/index.mdx` as a **type-along peer-to-peer chat tutorial** based on the architecture of [`hello-pear-electron`](https://github.com/holepunchto/hello-pear-electron), simplified to in-memory messaging (no Hypercore, no OTA updates, no electron-forge, no packaging).

The page is the single source of orientation in the docs. Task 2 (the full tutorial) and Task 3 (the how-to set) build on top of it.

### Goal of the page

After reading, a developer with Node ≥22 and 15 minutes can:

1. Run `npm init` and paste five files into a fresh folder.
2. Run two instances locally and chat between them.
3. Name the four pieces that made it work: **`pear-runtime`** (host), **Bare worker** (P2P backend), **Hyperswarm** (peer discovery), **Electron preload bridge** (renderer ↔ worker IPC).

## Architecture of the example app

```
chat-app/
├─ package.json
├─ electron/
│  ├─ main.js          # Electron main; instantiates pear-runtime; spawns the worker
│  └─ preload.js       # contextBridge exposing send/onMessage to renderer
├─ renderer/
│  ├─ index.html       # minimal chat UI (input + message list)
│  └─ app.js           # listens to bridge events, renders messages
└─ workers/
   └─ main.js          # Bare worker: Hyperswarm + topic + broadcast
```

**Data flow**

```
renderer.app.js        electron.main.js              workers/main.js          remote peers
   │  send(text)            │                              │                       │
   ├──────────────────────► │  ipcMain.handle              │                       │
   │                        │  worker.write(text) ───────► │  Bare.IPC.on('data')  │
   │                        │                              │  for (conn) conn.write│
   │                        │                              ├──────────────────────►│
   │                        │  worker.on('data') ◄─────────┤  conn.on('data')      │
   │  bridge.onMessage      │  send to renderer            │  Bare.IPC.write       │
   ◄────────────────────────┤                              │                       │
```

**Why a Bare worker instead of running Hyperswarm in the Electron main process?**
Matches the upstream pattern (`hello-pear-electron` README §Workers): "put application peer-to-peer code into a main worker that then acts as a local backend for the application view layer." Keeping the same shape makes Task 2's full tutorial a layer-on rather than a redo.

**What is deliberately omitted vs. `hello-pear-electron`?**

| Feature                  | Reason for omission                                                        |
|--------------------------|----------------------------------------------------------------------------|
| OTA updates              | Adds the Corestore/Hyperdrive/upgrade-link concept stack. Tutorial-2 turf. |
| Hypercore / Hyperbee     | "No memory" per the user's brief. Tutorial-2 turf.                         |
| `electron-forge`         | Adds `forge.config.js` + 6 devDeps. `npx electron .` is enough for dev.    |
| Multisig / `pear-build`  | Out of scope; `how-to/operate-an-app/deployment` covers it.                |
| `paparam` flags          | Single-instance lock and `--storage` are not needed without persistence.   |
| `which-runtime` paths    | No persistent storage means no per-OS path logic.                          |

## File-by-file content plan

Each snippet in the page is presented with: a one-paragraph "what this file does", the code, and a "what's new here" callout that names the Pear concept.

1. **`package.json`** (~15 lines).
   `dependencies`: `pear-runtime`, `hyperswarm`, `b4a`. `devDependencies`: `electron`. Scripts: `"start": "electron ."`. `"main": "electron/main.js"`. `"type": "commonjs"`.
   Concept introduced: **what `pear-runtime` is** — the host that lets Electron run Bare workers.

2. **`workers/main.js`** (~25 lines, written FIRST so the reader understands the P2P side before the wiring).
   Mirrors `content/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm.mdx` but adapted for Bare-IPC.
   Concept introduced: **Hyperswarm + topic discovery**.

3. **`electron/main.js`** (~30 lines, much simpler than upstream).
   Creates `BrowserWindow` and calls `PearRuntime.run('./workers/main.js')` — the **static** method, which is a thin wrapper over `bare-sidecar`. No `new PearRuntime()` instance, no Corestore, no updater. This is a deliberate pedagogical simplification: the static method is enough when you don't need OTA updates or storage. The full tutorial (Task 2) introduces the instance form.
   Concept introduced: **Pear runtime as the "embed-Bare-into-Electron" library, using `PearRuntime.run()` to spawn a worker.**

4. **`electron/preload.js`** (~20 lines).
   `contextBridge.exposeInMainWorld('chat', { send, onMessage })`.
   Concept introduced: **the preload bridge as the renderer's only door to the worker**.

5. **`renderer/index.html` + `renderer/app.js`** (~30 lines combined).
   `<input>` on Enter calls `chat.send(...)`; `chat.onMessage(...)` appends `<li>`.
   No Pear concept here — explicitly noted as "this is just a normal web page."

## Page outline (sections, in MDX order)

1. **What you'll build** — 3 bullets + 1 screenshot description (mocked, since we're not pulling images yet).
2. **What you need** — Node ≥22, npm, ~15 min. No global installs.
3. **Project layout** — file tree (the diagram above).
4. **Step 1 — `package.json` + install** — paste, `npm install`.
5. **Step 2 — Write the worker** — `workers/main.js`, annotated.
6. **Step 3 — Wire up the Electron main** — `electron/main.js`, annotated.
7. **Step 4 — The preload bridge** — `electron/preload.js`, annotated.
8. **Step 5 — Render the chat** — `renderer/index.html` + `renderer/app.js`, annotated.
9. **Run it** — `npm start` once; `npm start` again in a second terminal; type, see the message appear in both windows.
10. **What just happened** — recap mapping each file to a Pear concept.
11. **Where to go next** — links: full tutorial (Task 2, when it lands), `connect-to-many-peers-by-topic-with-hyperswarm` how-to, `hello-pear-electron` repo, OTA + storage tutorials.

Target length: **~300–400 lines of MDX**.

## Code-citation strategy

The user's note for Task 2 says "import code directly from github whenever possible." For Task 1 (this page), the constraint is *no cloning*, but we still want the code shown to be the code the reader would write — and to stay in sync with `hello-pear-electron`'s patterns. Strategy:

- For each snippet, include a footer link to the matching file in `hello-pear-electron@main` so the reader can compare.
- Snippets are inlined (Fumadocs doesn't have a "remote include" component out of the box, and even if it did, divergence from the upstream is the point — we're simplifying it).
- Tutorial-2 (Task 2) is where remote-import becomes useful, because the reader is reproducing the upstream verbatim. Defer that decision to Task 2's spec.

## Placement, frontmatter, IA implications

**Path**: `content/getting-started/index.mdx`

**Frontmatter**:

```yaml
---
title: Getting started
description: Build a peer-to-peer desktop chat with Pear in fifteen minutes — five files, no cloning, no servers.
docType: getting-started
lastModified: 2026-05-06
---
```

**ADR-0001 tension**: ADR-0001 lists four canonical top-level dirs (`tutorials/`, `how-to/`, `reference/`, `explanation/`). `content/getting-started/` would be a fifth. The Diataxis skill lists `getting-started/` as a valid template-specific directory and says it's "a tutorial in spirit." We use it because:

- The `getting-started` value is in `@tetherto/docs-seo-schema`'s `docType` enum.
- The existing fork branch `feat/getting-started-guides` already adopts the path; collision avoidance matters when those branches eventually meet.
- Calling it `tutorials/getting-started.mdx` would put two pages with very different audiences in the same quadrant landing page.

**Sidebar**: needs a `content/meta.json` entry adding "Getting Started" *before* "How To". (Today there is no `content/meta.json` — alphabetical order would put `getting-started` before `how-to` automatically. We can defer the explicit `meta.json` until ADR-0001's planned sidebar work lands.)

**`scripts/check-doctypes.ts` impact**: ADR-0001 describes a validator that enforces dir↔docType invariants. The validator (per commit `837a749`) doesn't exist yet on `preview` — wait, it does (see git log). Need to confirm the validator allows `content/getting-started/**` to map to `docType: getting-started`. **Action: read `scripts/check-doctypes.ts` before writing the page; fix the validator if it rejects the new directory.**

**Homepage update**: `content/index.mdx` currently has the four-quadrant launcher (no Getting Started card). Add a one-line "New here? Start with **[Getting Started](/getting-started)**." paragraph above the four cards. Keep the existing Boilerplates section.

## Branch and PR plan

- Branch name: `feat/getting-started-chat`
- Base: `origin/preview` (= `holepunchto/pear-docs preview`)
- Single PR opened against `holepunchto:preview`
- Commits (in order):
  1. `docs(spec): design for getting-started chat type-along`  ← this spec
  2. `fix(check-doctypes): allow content/getting-started/**` (only if the validator rejects it)
  3. `feat(getting-started): add chat type-along (closes #task-1)`  ← the MDX page
  4. `chore(index): link getting-started from homepage launcher`

## Verification

Before requesting review:

1. **Build clean**: `npm run build` passes; no `[@tetherto/docs-seo]` warnings on the new page.
2. **Doc-type validator**: `scripts/check-doctypes.ts` passes.
3. **Internal-link validator**: `scripts/check-internal-links.ts` passes (the new page links to four existing pages).
4. **Walkthrough**: I will *not* run the chat app end-to-end as part of this task (the user did not request it), but I will sanity-check that each snippet matches the same APIs the `connect-to-many-peers-by-topic-with-hyperswarm` how-to and `hello-pear-electron@main` actually use.
5. **Diataxis check**: page is a tutorial-shaped artifact-producing walkthrough; no how-to checklists, no reference dumps, no explanation digressions. (Run the `diataxis` skill's universal checklist.)

## Resolved questions

1. **Spec location**: kept local-only at `docs/superpowers/specs/2026-05-06-getting-started-chat-design.md`. Not committed to the feature branch. Add `docs/superpowers/` to `.gitignore` on the branch only if needed; otherwise just don't `git add` the file.
2. **Module systems (mixed)**: CommonJS for `electron/main.js`, `electron/preload.js`, and `package.json` (`"type": "commonjs"`). ESM for `workers/main.js` (Bare worker) and `renderer/app.js` (web module via `<script type="module">`). This matches Pear's newer convention of ESM-on-Bare while keeping Electron's main process boring.
3. **Topic derivation**: derive 32 bytes from `os.userInfo().username` so two readers on different machines don't collide by default and two instances on the *same* machine *do* meet each other immediately. Implementation: `crypto.createHash('sha256').update('pear-getting-started-chat:' + os.userInfo().username).digest()` inside the worker. Reader can change the prefix string to make a new "room."
4. **Screenshot**: skip a real image. Use a 6-line ASCII window mock under "What you'll build."
