# JSDoc gap report — compact-encoding

`holepunchto/compact-encoding` at **v3.5.2** · **0%** of published members fully documented (0/26) · 49 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 4%** · **param types 0%** · **typed returns 0%** · **examples 0%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (26)

### `index.js`

- [ ] L10 `cenc.state(start = 0, end = 0, buffer = null)` — add @param {Type} for `start`; @param {Type} for `end`; @param {Type} for `buffer`; @returns {Type}; @example
- [ ] L14 `cenc.raw` — add description; @returns {Type}
- [ ] L183 `cenc.uint64` — add description; @returns {Type}
- [ ] L223 `cenc.int64` — add description; @returns {Type}
- [ ] L288 `cenc.bigint` — add description; @returns {Type}
- [ ] L290 `cenc.lexint` — add description; @returns {Type}
- [ ] L308 `cenc.float64` — add description; @returns {Type}
- [ ] L355 `cenc.binary` — add description; @returns {Type}
- [ ] L367 `cenc.arraybuffer` — add description; @returns {Type}
- [ ] L466 `cenc.float64array` — add description; @returns {Type}
- [ ] L626 `cenc.ucs2` — add description; @returns {Type}
- [ ] L628 `cenc.bool` — add description; @returns {Type}
- [ ] L641 `cenc.fixed(n)` — add description; @param {Type} + description for `n`; @returns {Type}; @example
- [ ] L662 `cenc.fixed64` — add description; @returns {Type}
- [ ] L664 `cenc.array(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example
- [ ] L684 `cenc.frame(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example
- [ ] L712 `cenc.date` — add description; @returns {Type}
- [ ] L736 `cenc.ndjson` — add description; @returns {Type}
- [ ] L749 `cenc.none` — add description; @returns {Type}
- [ ] L827 `cenc.any` — add description; @returns {Type}
- [ ] L845 `cenc.port` — add description; @returns {Type}
- [ ] L967 `cenc.ip` — add description; @returns {Type}
- [ ] L987 `cenc.ipAddress` — add description; @returns {Type}
- [ ] L1006 `cenc.record(keyEncoding, valueEncoding)` — add description; @param {Type} + description for `keyEncoding`; @param {Type} + description for `valueEncoding`; @returns {Type}; @example
- [ ] L1035 `cenc.stringRecord` — add description; @returns {Type}
- [ ] L1053 `cenc.from(enc)` — add description; @param {Type} + description for `enc`; @returns {Type}; @example

## Documented but not reachable in source (3)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `enc.encode(state, val)`
- `enc.preencode(state, val)`
- `val = enc.decode(state)`
