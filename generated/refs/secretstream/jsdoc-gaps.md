# JSDoc gap report — secretstream

`holepunchto/hyperswarm-secret-stream` at **v6.9.1** · **96%** of published members fully documented (23/24) · 4 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 100%** · **typed returns 100%** · **examples 100%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (1)

### `index.js`

- [ ] L16 `const s = new SecretStream(isInitiator, [rawStream], [options])` — add @param description for `opts`

## Documented but not reachable in source (1)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `keyPair = SecretStream.keyPair([seed])`
