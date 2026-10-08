# System

You write concise, accurate API reference content for JavaScript libraries in the Holepunch/Pear ecosystem. You are given a library's full public API surface (member keys, signatures, one-line descriptions) and a list of members that are missing a usage example. For each listed member produce:
- "example": a short, idiomatic JavaScript snippet (1–5 lines) showing realistic usage, consistent with the signature and with the rest of the surface. Reuse the receiver/variable names from the signatures (e.g. `base`, `core`, `host`). Use `await` for async members. Make it copy-pasteable.
- "returns": one concise sentence describing the return value — ONLY when asked for that member; otherwise "".
Hard rules: only reference members that appear in the provided surface; never invent APIs; output nothing except the requested structured data; keep examples minimal.

# User

Library: Autobase (npm: autobase).

Full API surface:
# class Autobase
- constructor: `const base = new Autobase(store, bootstrap, opts)` — Instantiate an Autobase.
- bootstrap: `base.bootstrap`
- bootstraps: `base.bootstraps`
- appending: `base.appending`
- writable: `base.writable` — Whether the instance is a writer for the autobase.
- ackable: `base.ackable`
- signedLength: `base.signedLength` — The index of the system core that has been signed by a quorum of indexers.
- indexedLength: `base.indexedLength`
- length: `base.length` — The length of the system core.
- flushing: `base.flushing`
- hash: `const hash = await base.hash()`
- getSystemKey: `base.getSystemKey()`
- system: `base.system`
- getIndexedInfo: `await base.getIndexedInfo()`
- replicate: `const stream = base.replicate(isInitiator || stream, opts)` — Creates a replication stream for replicating the autobase.
- heads: `const heads = base.heads()` — Gets the current writer heads.
- export: `await base.export()`
- hintWakeup: `base.hintWakeup(hints)`
- setBigBatches: `base.setBigBatches(enable = true)` — Set the autobase to enable or disable big batches.
- setLocal: `await base.setLocal(key, { keyPair } = {})`
- setWakeup: `base.setWakeup(cap, discoveryKey)`
- static:getBootRecord: `await Autobase.getBootRecord(store, key)`
- flush: `await base.flush()`
- advance: `await base.advance()`
- recouple: `base.recouple()`
- getLastError: `base.getLastError()`
- update: `await base.update()` — Fetch all available data and update the linearizer.
- isFastForwarding: `base.isFastForwarding()`
- ack: `await base.ack(bg = false)` — Manually acknowledge the current state by appending a null node that references known head nodes.
- views: `base.views()`
- batch: `base.batch()`
- append: `await base.append(value, opts)` — Append a new entry to the autobase.
- static:decodeValue: `Autobase.decodeValue(value, opts)`
- static:encodeValue: `Autobase.encodeValue(value, opts)`
- static:getLocalKey: `await Autobase.getLocalKey(store, opts = {})`
- static:getLocalCore: `const core = Autobase.getLocalCore(store, handlers, encryptionKey)` — Generate a local core to be used for an Autobase.
- static:getUserData: `const { referrer, view } = await Autobase.getUserData(core)` — Get user data associated with an autobase core.
- static:isAutobase: `const isBase = await Autobase.isAutobase(core, opts)`
- setUserData: `await base.setUserData(key, value)` — Sets the User Data value for the provided key.
- getUserData: `const value = await base.getUserData(key)`
- getWriterEncryption: `base.getWriterEncryption()`
- repair: `await base.repair()`
- forceFastForward: `await base.forceFastForward()`
- pause: `await base.pause()` — Pauses the autobase prevent the next apply from running.
- resume: `await base.resume()` — Resumes a paused autobase and will check for an update.
- waitForWritable: `base.waitForWritable()`
- removeable: `host.removeable(key)`
- ready: `await base.ready()`
- close: `await base.close()`
- opened: `base.opened`
- closed: `base.closed`
- on: `base.on(event, listener)`
- once: `base.once(event, listener)`
- off: `base.off(event, listener)`
- emit: `base.emit(event, [...args])`
- id: `base.id`
- key: `base.key` — The primary key of the autobase.
- discoveryKey: `base.discoveryKey` — The discovery key associated with the autobase.
- backoff: `base.backoff`
- keyPair: `base.keyPair`
- valueEncoding: `base.valueEncoding`
- store: `base.store`
- globalCache: `base.globalCache`
- migrated: `base.migrated`
- encrypted: `base.encrypted`
- encrypt: `base.encrypt`
- encryptionKey: `base.encryptionKey`
- encryption: `base.encryption`
- blindEncryption: `base.blindEncryption`
- activeBatch: `base.activeBatch`
- local: `base.local`
- localWriter: `base.localWriter`
- isIndexer: `base.isIndexer` — Whether the instance is an indexer.
- activeWriters: `base.activeWriters`
- linearizer: `base.linearizer`
- updating: `base.updating`
- nukeTip: `base.nukeTip`
- wakeupOwner: `base.wakeupOwner`
- wakeupCapability: `base.wakeupCapability`
- wakeupProtocol: `base.wakeupProtocol`
- wakeupSession: `base.wakeupSession`
- fastForwardEnabled: `base.fastForwardEnabled`
- fastForwarding: `base.fastForwarding`
- fastForwardTo: `base.fastForwardTo`
- fastForwardFailedAt: `base.fastForwardFailedAt`
- fastForwardMinimum: `base.fastForwardMinimum`
- bigBatches: `base.bigBatches`
- paused: `base.paused`
- view: `base.view` — The view of the autobase derived from writer inputs.
- core: `base.core`
- version: `base.version`
- interrupted: `base.interrupted`
- recoveries: `base.recoveries`
- on:rotate-local-writer: `base.on('rotate-local-writer', listener)`
- on:interrupt: `base.on('interrupt', (reason) => { ... })` — Triggered when host.interrupt(reason) is called in the apply handler.
- on:update: `base.on('update', () => { ... })` — Triggered when the autobase view updates after apply has finished running.
- on:error: `base.on('error', (err) => { ... })` — Triggered when an error is triggered while updating the autobase.
- on:fast-forward: `base.on('fast-forward', (to, from) => { ... })` — Triggered when the autobase fast forwards to a state already with a quorum.
- on:reboot: `base.on('reboot', listener)`
- on:is-indexer: `base.on('is-indexer', () => { ... })` — Triggered when the autobase instance is an indexer.
- on:is-non-indexer: `base.on('is-non-indexer', () => { ... })` — Triggered when the autobase instance is not an indexer.
- on:writable: `base.on('writable', () => { ... })` — Triggered when the autobase instance is now a writer.
- on:unwritable: `base.on('unwritable', () => { ... })` — Triggered when the autobase instance is no longer a writer.
- on:warning: `base.on('warning', (warning) => { ... })` — Triggered when a warning is triggered.
- get: `const core = store.get(name || { name, valueEncoding })` — Load a Hypercore by name (passed as name).
- addWriter: `await host.addWriter(key, { indexer = true })` — Add a writer with the given key to the autobase allowing their local core to append.
- removeWriter: `await host.removeWriter(key)` — Remove a writer from the autobase.
- ackWriter: `await host.ackWriter(key)` — Acknowledge a writer even if they haven't been added before.
- interrupt: `host.interrupt(reason)` — Interrupt the applying of writer blocks optionally giving a reason.
# class WakeupHandler
- constructor: `new WakeupHandler(base, discoveryKey)`
- onpeeractive: `base.onpeeractive(peer, session)`
- onlookup: `base.onlookup(req, peer, session)`
- onannounce: `base.onannounce(wakeup, peer, session)`
- active: `base.active`
- discoveryKey: `base.discoveryKey`
- base: `base.base`

Write an example for each of these members (use the exact member key):
- hash: `const hash = await base.hash()`
- heads: `const heads = base.heads()`
- setBigBatches: `base.setBigBatches(enable = true)`
- update: `await base.update()`
- ack: `await base.ack(bg = false)`
- static:getLocalCore: `const core = Autobase.getLocalCore(store, handlers, encryptionKey)`
- static:getUserData: `const { referrer, view } = await Autobase.getUserData(core)`
- static:isAutobase: `const isBase = await Autobase.isAutobase(core, opts)`
- setUserData: `await base.setUserData(key, value)`
- getUserData: `const value = await base.getUserData(key)`
- pause: `await base.pause()`
- resume: `await base.resume()`
- removeable: `host.removeable(key)`
- get: `const core = store.get(name || { name, valueEncoding })`
- addWriter: `await host.addWriter(key, { indexer = true })`
- removeWriter: `await host.removeWriter(key)`
- ackWriter: `await host.ackWriter(key)`
- interrupt: `host.interrupt(reason)`

Also write a "returns" sentence for these (others: leave "returns" as ""): heads, static:getLocalCore, static:getUserData, get
