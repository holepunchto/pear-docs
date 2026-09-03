# JSDoc gap report — compact-encoding

`holepunchto/compact-encoding` at **v3.3.0** · **0%** of published members fully documented (0/26) · 45 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 4%** · **param types 0%** · **typed returns 0%** · **examples 0%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (26)

### `index.js`

- [ ] L5 `cenc.state(start = 0, end = 0, buffer = null)` — add @param {Type} for `start`; @param {Type} for `end`; @param {Type} for `buffer`; @returns {Type}; @example
- [ ] L9 `cenc.raw` — add description; @returns {Type}
- [ ] L180 `cenc.uint64` — add description; @returns {Type}
- [ ] L224 `cenc.int64` — add description; @returns {Type}
- [ ] L291 `cenc.bigint` — add description; @returns {Type}
- [ ] L293 `cenc.lexint` — add description; @returns {Type}
- [ ] L321 `cenc.float64` — add description; @returns {Type}
- [ ] L378 `cenc.binary` — add description; @returns {Type}
- [ ] L390 `cenc.arraybuffer` — add description; @returns {Type}
- [ ] L459 `cenc.float64array` — add description; @returns {Type}
- [ ] L511 `cenc.ucs2` — add description; @returns {Type}
- [ ] L513 `cenc.bool` — add description; @returns {Type}
- [ ] L526 `cenc.fixed(n)` — add description; @param {Type} + description for `n`; @returns {Type}; @example
- [ ] L544 `cenc.fixed64` — add description; @returns {Type}
- [ ] L546 `cenc.array(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example
- [ ] L566 `cenc.frame(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example
- [ ] L593 `cenc.date` — add description; @returns {Type}
- [ ] L617 `cenc.ndjson` — add description; @returns {Type}
- [ ] L630 `cenc.none` — add description; @returns {Type}
- [ ] L708 `cenc.any` — add description; @returns {Type}
- [ ] L726 `cenc.port` — add description; @returns {Type}
- [ ] L880 `cenc.ip` — add description; @returns {Type}
- [ ] L900 `cenc.ipAddress` — add description; @returns {Type}
- [ ] L919 `cenc.record(keyEncoding, valueEncoding)` — add description; @param {Type} + description for `keyEncoding`; @param {Type} + description for `valueEncoding`; @returns {Type}; @example
- [ ] L948 `cenc.stringRecord` — add description; @returns {Type}
- [ ] L966 `cenc.from(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example

## Documented but not reachable in source (3)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `enc.encode(state, val)`
- `enc.preencode(state, val)`
- `val = enc.decode(state)`
