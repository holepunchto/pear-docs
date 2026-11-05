# JSDoc gap report — secretstream

`holepunchto/hyperswarm-secret-stream` at **v6.9.2** · **0%** of published members fully documented (0/12) · 4 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 8%** · **param types 0%** · **typed returns 0%** · **examples 20%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (12)

### `index.js`

- [ ] L16 `const s = new SecretStream(isInitiator, [rawStream], [options])` — add @param {Type} for `isInitiator`; @param {Type} for `rawStream`; @param {Type} for `opts`
- [ ] L24 `stream.isInitiator` — add description; @returns {Type}
- [ ] L25 `stream.rawStream` — add description; @returns {Type}
- [ ] L30 `stream.connected` — add description; @returns {Type}
- [ ] L32 `stream.timeout` — add description; @returns {Type}
- [ ] L33 `stream.enableSend` — add description; @returns {Type}
- [ ] L36 `stream.userData` — add description; @returns {Type}
- [ ] L39 `stream.opened` — add description; @returns {Type}
- [ ] L91 `NoiseSecretStream.id(handshakeHash, isInitiator, id)` — add description; @param {Type} + description for `handshakeHash`; @param {Type} + description for `isInitiator`; @param {Type} + description for `id`; @returns {Type}; @example
- [ ] L158 `await stream.flush()` — add description; @returns {Type}; @example
- [ ] L607 `stream.alloc(len)` — add description; @param {Type} + description for `len`; @returns {Type}; @example
- [ ] L614 `stream.toJSON()` — add description; @returns {Type}; @example

## Suggested `@typedef`s (1)

_Define these once near the class; they become linkable types and drive options tables._

- `opts` on `const s = new SecretStream(isInitiator, [rawStream], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (13)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await s.send(buffer)`
- `keyPair = SecretStream.keyPair([seed])`
- `s.handshakeHash`
- `s.keepAlive`
- `s.publicKey`
- `s.rawBytesRead`
- `s.rawBytesWritten`
- `s.remotePublicKey`
- `s.sendKeepAlive()`
- `s.setKeepAlive(ms)`
- `s.setTimeout(ms)`
- `s.start(rawStream, [options])`
- `s.trySend(buffer)`
