# JSDoc gap report — hyperbee

`holepunchto/hyperbee` at **v2.27.3** · **100%** of published members fully documented (30/30) · 71 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 100%** · **typed returns 100%** · **examples 100%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

✅ Every graded member is fully documented.

## Suggested `@typedef`s (1)

_Define these once near the class; they become linkable types and drive options tables._

- `opts` on `const stream = db.replicate(isInitiatorOrStream)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
