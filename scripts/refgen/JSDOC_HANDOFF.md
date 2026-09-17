# JSDoc migration — handoff (carry-on brief)

Goal: enrich each Holepunch module's **source JSDoc** so the generated reference
docs become top-quality (typed param tables, return types, examples, typedefs).
The per-module procedure is [AGENT_JSDOC_TASK.md](./AGENT_JSDOC_TASK.md); the
authoring contract is [JSDOC_CONVENTION.md](./JSDOC_CONVENTION.md). Read both first.

All commands run from the docs repo root: `/Users/lucas/Documents/tether/openApi/pear-docs`.
The live dashboard is `npm run refs:jsdoc -- --summary` — **run it first** to see
current numbers (the table below is a point-in-time snapshot and will drift).

---

## ⚠️ The one rule that matters most

**The model (`generated/refs/<slug>/api-model.json`) is the source of truth — NOT
the upstream checkout.** Checkouts in `/tmp/pear-upstream/<slug>` get reset between
runs, so a finished module often has a *clean checkout but a complete model*.

- **NEVER run `regen-local <slug>` on a slug whose checkout is clean** — it
  re-extracts from the empty checkout and **overwrites the good model with 0%**.
  (This is exactly how `corestore` was destroyed.)
- Before touching a module, check its checkout:
  `grep -c "@\(type\|param\|returns\)" /tmp/pear-upstream/<slug>/index.js`
  - **0** → checkout is clean. Do NOT `regen-local`. Either leave the model alone,
    or RE-RUN the whole runbook (which clones a fresh checkout) to redo it.
  - **>0** → checkout has JSDoc. Safe to edit it and `regen-local`.

## Tooling fixes already applied (the first batch's walls are gone)

You will NOT hit these — they're fixed in `scripts/refgen/`:
- Destructured params (`{ force = false }`) now extract as a clean `options` param.
- Constructor instance fields (`this.x =`) are documentable via `@type {T}`.
- Module-of-functions packages (compact-encoding) now read JSDoc on exports.
- `void` returns don't require a prose `@returns`.
- `@typedef {Object}` renders a linkable Types section; param/return types link to it.
- The gap report grades only the **published surface** (manifest members), so
  internal fields don't show as work.

---

## State snapshot (verify with `refs:jsdoc --summary`)

**Done — 100%, DO NOT TOUCH:** `autobase`, `hyperbee`, `secretstream`,
`localdrive`, `mirrordrive`.

**Remaining work:**

| module | model | checkout | action |
| --- | --- | --- | --- |
| `corestore` | **0%** (lost) | clean | **RE-RUN from scratch** via the runbook (clones fresh → seed → fill). |
| `hypercore` | 80% | clean | **RE-RUN from scratch** to finish (~11 members short; largest module). |
| `hyperdrive` | 91% | clean | **RE-RUN from scratch** to finish (~4 short). |
| `hyperswarm` | 81% | intact | Finish remaining types **in the checkout**, then `regen-local`. |
| `protomux` | 60% | intact | Finish remaining types **in the checkout** (most params still untyped), then `regen-local`. |
| `hyperdht` | 91% | intact | One fix: `destroy()`'s `@param` still uses the old pattern form — change it to `@param {object} [options] - …`, then `regen-local`. |
| `compact-encoding` | 71% | intact | Finish the ~8 remaining exported functions (sparse README — read source for types), then `regen-local`. 71% may be the honest ceiling. |

Rule of thumb from the table: **clean checkout → re-run the runbook; intact
checkout → finish in place + `regen-local`.**

---

## Procedure (per module)

1. `npm run refs:jsdoc -- --summary | grep <slug>` — see where it stands.
2. Check the checkout state (the grep above). Pick re-run vs finish-in-place.
3. Follow [AGENT_JSDOC_TASK.md](./AGENT_JSDOC_TASK.md) with `SLUG=<slug>`:
   read the convention → ensure/clean checkout → `regen-local` → `seed-jsdoc` →
   **fill every `{}` type by reading the source** → fix mis-seeded prose → add
   `@typedef`s → `regen-local` again → verify.
4. **Done when** the module's coverage line is 100% across desc/types/returns/
   examples (or, for sparse-README modules, every reachable member is typed and
   the only gaps are genuinely-unreachable members).

## Guardrails
- **No git** anywhere (no commit/branch/push/add). Leave edits in the working tree.
- Edit only `/tmp/pear-upstream/<slug>` source; never the docs repo's
  `content/reference/` pages or the `scripts/refgen/` tooling.
- Types must be justified by code you read; use `*`/`object` only when genuinely
  dynamic, and list those guesses in your report.
- One agent per module; each works in its own checkout (no cross-contention).

## Report back (per agent)
slug · before→after coverage (desc/types/returns/examples) · members documented ·
typedefs added · ambiguous types guessed (for human confirmation) · anything
skipped · diff path `git -C /tmp/pear-upstream/<slug> diff`.
