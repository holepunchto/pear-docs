# JSDoc gap report — hyperswarm

`holepunchto/hyperswarm` at **v4.17.2** · **0%** of published members fully documented (0/14) · 13 source member(s) not in the manifest (internal or unfiled) — not graded.

Coverage by dimension: **descriptions 100%** · **param types 0%** · **typed returns 0%** · **examples 0%**. (Prose is usually present; the gap is mostly types.)

Work through the checklist below in the source repo. Each item adds the JSDoc needed for a top-quality generated entry (typed param table, return type, example). When a file is fully checked off, its members render complete.

See the [JSDoc convention](../../../scripts/refgen/JSDOC_CONVENTION.md) for the exact format each item expects.

## To do (14)

### `index.js`

- [ ] L24 `const swarm = new Hyperswarm(opts = {})` — add @param {Type} for `opts`; @example
- [ ] L38 `swarm.dht` — add @returns {Type}
- [ ] L64 `swarm.connecting` — add @returns {Type}
- [ ] L65 `swarm.connections` — add @returns {Type}
- [ ] L66 `swarm.peers` — add @returns {Type}
- [ ] L491 `const discovery = swarm.status(topic)` — add @param {Type} + description for `key`; @returns {Type}; @example
- [ ] L495 `await swarm.listen()` — add @returns {Type}; @example
- [ ] L505 `const discovery = swarm.join(topic, opts = {})` — add @param {Type} for `topic`; @param {Type} + description for `opts`; @returns {Type}; @example
- [ ] L529 `await swarm.leave(topic)` — add @param {Type} for `topic`; @returns {Type}; @example
- [ ] L547 `swarm.joinPeer(noisePublicKey)` — add @param {Type} for `publicKey`; @returns {Type}; @example
- [ ] L560 `swarm.leavePeer(noisePublicKey)` — add @param {Type} for `publicKey`; @returns {Type}; @example
- [ ] L571 `await swarm.flush()` — add @returns {Type}; @example
- [ ] L610 `await swarm.suspend({ log: () => {} })` — add @param {Type} + description for `options`; @returns {Type}; @example
- [ ] L646 `await swarm.resume({ log: () => {} })` — add @param {Type} + description for `options`; @returns {Type}; @example

## Suggested `@typedef`s (4)

_Define these once near the class; they become linkable types and drive options tables._

- `options` on `await swarm.resume({ log: () => {} })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `options` on `await swarm.suspend({ log: () => {} })` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const discovery = swarm.join(topic, opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).
- `opts` on `const swarm = new Hyperswarm(opts = {})` — define a `@typedef` for the options shape (becomes a linkable type + options table).

## Documented but not reachable in source (7)

_These appear in the README but the AST never found them, so they can't carry JSDoc until the symbol is exported/reachable (e.g. methods built inside a callback). Refactor to a named class/method, or keep them as manifest `members` overrides._

- `await discovery.destroy()`
- `await discovery.flushed()`
- `await discovery.refresh({ client, server })`
- `peerInfo.ban(banStatus = false)`
- `peerInfo.prioritized`
- `peerInfo.publicKey`
- `peerInfo.topics`
