## Title
feat(docs): finalize IA reorg + cross-linking quality gates

## Base / Head
- Base: `holepunchto/pear-docs:preview`
- Head: `lucas-tortora/pear-docs:feat/diataxis-reorg`

## Body
## Summary
This PR completes the IA and cross-linking work tracked in Asana by:
- shipping the Diataxis-oriented docs structure and URL migration (with static redirect stubs + verification),
- adding broad cross-linking improvements across how-to/reference/explanation pages,
- hardening docs quality checks (doctype invariant check, fragment-aware internal-link check, cross-link coverage/orphan audit),
- and final QA fixes (ESLint 9 flat config + broken external boilerplate URL fix).

## Asana tasks addressed
- Milestone: [Information Architecture](https://app.asana.com/1/1204330682799323/project/1214301477999232/task/1214369619309430)
- Subtask: [Reorganize information architecture (Diátaxis)](https://app.asana.com/1/1204330682799323/task/1214311360861492)
- Subtask: [Cross-link audit & uplift across pear-docs](https://app.asana.com/1/1204330682799323/task/1214315506938233)

### Task-to-commit mapping
#### Reorganize information architecture (Diátaxis) — `1214311360861492`
Primary commits:
- `e199d70` — ADR for IA + FAQ resolution decisions
- `3b68974` — rename `howto` → `how-to`, move misfiled how-to pages
- `26f4765` — nest building-blocks/helpers/tools under `reference/`
- `b4f85be` — add quadrant landing pages (`how-to`, `reference`, `explanation`)
- `d580556` — rewrite homepage as quadrant launcher; move module catalog to reference
- `c34c6ae` — 308 redirect strategy + static redirect stubs
- `96bf4d9`, `014921f`, `87da38d` — IA labeling/order refinements and regrouping
- `837a749` — `check-doctypes` invariant checker (directory ↔ `docType`)
- `70f7d65` — remove legacy summary/tree artifacts; README refresh
- `fdfb3ec` — FAQ deconstruction per ADR
- `4b68a88` — unified sidebar tree (`src/lib/custom-tree.ts`)

#### Cross-link audit & uplift — `1214315506938233`
Primary commits:
- `4cb4c39` — broad crosslink pass + internal-link checker now validates `#fragment`s
- `64879be` — add missing `## See also` blocks + `scripts/check-cross-links.ts` (coverage + orphan audit)
- `2b4b3ab` — README docs for `check:cross-links`

Related cleanup in same scope:
- `3720d82` — user-facing alignment for `pear run` deprecation from PR #273
- `ef96676` — final QA fixes: ESLint flat config + boilerplate link correction

## Notes on scope
- Content-heavy additions tracked in [separate task](https://app.asana.com/1/1204330682799323/project/1214301477999232/task/1214369619309432) are intentionally out of scope for this PR.

## Validation run
- `npm run build`
- `npm run check:redirects`
- `npm run check:doctypes`
- `npm run check:internal-links`
- `npm run check:external-links`
- `npm run check:cross-links`
- `npm run lint`

All pass locally on this branch.
