# JSDoc gap report — hyperdht

`holepunchto/hyperdht` at **v6.32.0** · **100%** of published members fully documented (11/11) · 19 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 100%** · **typed returns 100%** · **examples 100%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

✅ Every graded member is fully documented.

## Suggested `@typedef`s (6)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await node.destroy([options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `await node.unannounce(topic, keyPair, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = node.announce(topic, keyPair, [relayAddresses], [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const stream = node.lookup(topic, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { hash, closestNodes } = await node.immutablePut(value, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const { value, from } = await node.immutableGet(hash, [options])` — define a `@typedef` for the options shape (becomes a linkable type + options table).

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
