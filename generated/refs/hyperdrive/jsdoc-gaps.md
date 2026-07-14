# JSDoc gap report — hyperdrive

`holepunchto/hyperdrive` at **v13.3.2** · **100%** of published members fully documented (43/43) · 11 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 100%** · **typed returns 100%** · **examples 100%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

✅ Every graded member is fully documented.

## Suggested `@typedef`s (9)

_Define these once near the class; they become linkable types and drive options tables._

- `opts` on `await drive.downloadDiff(version, folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const download = drive.download(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const mirror = drive.mirror(out, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const rs = drive.createReadStream(path, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = await drive.entries([range], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.diff(version, folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.list(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.readdir(folder, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = drive.replicate(isInitiatorOrStream)` — define a `@typedef` for the options shape (becomes a linkable type + options table).
