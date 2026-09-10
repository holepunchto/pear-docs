# JSDoc gap report — hyperdht

`holepunchto/hyperdht` at **v6.33.0** · **0%** of published members fully documented (0/11) · 19 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 0%** · **typed returns 0%** · **examples 36%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (11)

### `index.js`

- [ ] L26 `const node = new DHT([options])` — add @param {Type} for `opts`
- [ ] L81 `const socket = node.connect(remotePublicKey, [options])` — add @param {Type} + description for `remotePublicKey`; @param {Type} for `opts`; @returns {Type}
- [ ] L85 `const server = node.createServer([options], [onconnection])` — add @param {Type} for `opts`; @param {Type} + description for `onconnection`; @returns {Type}
- [ ] L123 `await node.destroy([options])` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L194 `const stream = node.lookup(topic, [options])` — add @param {Type} for `target`; @param {Type} + description for `opts`; @returns {Type}
- [ ] L242 `await node.unannounce(topic, keyPair, [options])` — add @param {Type} + description for `target`; @param {Type} + description for `keyPair`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L246 `const stream = node.announce(topic, keyPair, [relayAddresses], [options])` — add @param {Type} + description for `target`; @param {Type} + description for `keyPair`; @param {Type} + description for `relayAddresses`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L268 `const { value, from } = await node.immutableGet(hash, [options])` — add @param {Type} + description for `target`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L283 `const { hash, closestNodes } = await node.immutablePut(value, [options])` — add @param {Type} + description for `value`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L304 `const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])` — add @param {Type} + description for `publicKey`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L357 `const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])` — add @param {Type} + description for `keyPair`; @param {Type} + description for `value`; @param {Type} + description for `opts`; @returns {Type}; @example

## Suggested `@typedef`s (11)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await node.destroy([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await node.unannounce(topic, keyPair, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const node = new DHT([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const server = node.createServer([options], [onconnection])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const socket = node.connect(remotePublicKey, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = node.announce(topic, keyPair, [relayAddresses], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = node.lookup(topic, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { hash, closestNodes } = await node.immutablePut(value, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { publicKey, closestNodes, seq, signature } = await node.mutablePut(keyPair, value, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { value, from } = await node.immutableGet(hash, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { value, from, seq, signature } = await node.mutableGet(publicKey, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (8)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await server.close()`
- `await server.listen(keyPair)`
- `keyPair = DHT.keyPair([seed])`
- `node = DHT.bootstrapper(port, host, [options])`
- `server.address()`
- `server.refresh()`
- `socket.publicKey`
- `socket.remotePublicKey`
