# JSDoc gap report — hyperswarm

`holepunchto/hyperswarm` at **v4.17.0** · **100%** of published members fully documented (16/16) · 13 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 100%** · **typed returns 100%** · **examples 100%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

✅ Every graded member is fully documented.

## Documented but not reachable in source (5)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await discovery.flushed()`
- `await discovery.refresh({ client, server })`
- `peerInfo.ban(banStatus = false)`
- `peerInfo.prioritized`
- `peerInfo.publicKey`
