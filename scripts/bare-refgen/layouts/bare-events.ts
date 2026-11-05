// scripts/bare-refgen/layouts/bare-events.ts
//
// Editorial layout for bare-events. Group titles/order only for the top-level
// EventEmitter/EventEmitterError/EventMap/EventHandler exports; the
// bare-events/web and bare-events/global subpaths always render by kind.
//
// NOTE on member keys: the extracted model gives the static utility functions
// EventEmitter.getMaxListeners/listenerCount/on/once/setMaxListeners the SAME
// "key" as their same-named instance method (only "name" differs — the static
// one's name is also the qualified "EventEmitter.X" form, the instance one's
// name is the bare "X"). Renderer override lookup (`own()` in render.ts) checks
// `key` before `name`, so a qualified key ("EventEmitter.on") is matched by
// BOTH the static and instance member and would leak between them if the fact
// isn't true for both. Bare keys ("on") only ever match the instance member.
// See the report for where this blocked otherwise-groundable additions
// (static `on`/`once` return semantics, static `on`'s abort throw).

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [
    {
      title: 'Adding and removing listeners',
      members: [
        'EventEmitter.addListener',
        'EventEmitter.addOnceListener',
        'EventEmitter.prependListener',
        'EventEmitter.prependOnceListener',
        'EventEmitter.removeListener',
        'EventEmitter.removeAllListeners',
        'on',
        'once',
        'off',
      ],
    },
    {
      title: 'Emitting',
      members: ['EventEmitter.emit'],
    },
    {
      title: 'Inspecting listeners',
      members: [
        'EventEmitter.listeners',
        'EventEmitter.rawListeners',
        'EventEmitter.eventNames',
        'listenerCount',
        'getMaxListeners',
        'setMaxListeners',
      ],
    },
    {
      title: 'Static utilities',
      members: [
        'EventEmitter.defaultMaxListeners',
        'EventEmitter.forward',
        'EventEmitter.getMaxListeners',
        'EventEmitter.listenerCount',
        'EventEmitter.on',
        'EventEmitter.once',
        'EventEmitter.setMaxListeners',
      ],
    },
    {
      title: 'Errors',
      members: ['EventEmitterError', 'EventEmitterError.OPERATION_ABORTED', 'EventEmitterError.UNHANDLED_ERROR'],
    },
    {
      title: 'Types',
      members: ['EventMap', 'EventHandler'],
    },
  ],
  params: {
    'EventEmitter.addListener': { name: 'The event name to listen for.', fn: "The listener function, called with the event's arguments on each emit." },
    'EventEmitter.addOnceListener': { name: 'The event name to listen for.', fn: "The listener function, called once with the event's arguments then removed." },
    'EventEmitter.prependListener': { name: 'The event name to listen for.', fn: 'The listener function to add to the front of the listener list instead of the end.' },
    'EventEmitter.prependOnceListener': { name: 'The event name to listen for.', fn: 'The listener function to add to the front of the listener list, removed after it fires once.' },
    'EventEmitter.removeListener': { name: 'The event name to remove the listener from.', fn: 'The listener function to remove.' },
    'EventEmitter.removeAllListeners': { name: 'If given, remove listeners only for this event name; otherwise remove all listeners for every event.' },
    'EventEmitter.off': { name: 'The event name to remove the listener from.', fn: 'The listener function to remove.' },
    'EventEmitter.emit': { name: 'The event name to emit.', args: 'Arguments passed to each listener registered for `name`.' },
    'EventEmitter.listeners': { name: 'The event name to return the listener array for.' },
    'EventEmitter.rawListeners': { name: 'The event name to return the raw listener array for.' },
    // Shared with the static twin (same model key) — "name" kept context-neutral on purpose.
    'EventEmitter.listenerCount': { emitter: 'The emitter to query.', name: 'The event name.' },
    'EventEmitter.forward': {
      from: 'The emitter to forward events from.',
      to: 'The emitter to forward events to.',
      names: 'The event name, or array of event names, to forward.',
      opts: 'Options; `emit` overrides how forwarded events are re-emitted on `to` (defaults to `to.emit`).',
    },
    // Static-only params (instance getMaxListeners takes none), safe under the shared key.
    'EventEmitter.getMaxListeners': { emitter: 'The emitter to query.' },
    // Shared with the static twin; "name" kept context-neutral since the static form
    // means "iterate" and the instance form means "listen for" — see file header note.
    'EventEmitter.on': {
      emitter: 'The emitter to iterate events from.',
      name: 'The event name.',
      opts: 'Options; `signal` aborts the iteration, rejecting it with an `EventEmitterError`.',
      fn: "The listener function, called with the event's arguments on each emit.",
    },
    'EventEmitter.once': {
      emitter: 'The emitter to wait on.',
      name: 'The event name.',
      opts: 'Options; `signal` aborts the wait, rejecting the promise with an `EventEmitterError`.',
      fn: "The listener function, called once with the event's arguments then removed.",
    },
    'EventEmitter.setMaxListeners': {
      n: 'The maximum number of listeners to allow.',
      emitters: 'The emitters to apply the new limit to; if omitted, sets the global default instead.',
    },
    'EventEmitterError.OPERATION_ABORTED': { cause: 'The abort reason wrapped by the error.', msg: 'An optional custom message for the wrapping error.' },
    'EventEmitterError.UNHANDLED_ERROR': { cause: 'The underlying error wrapped by the error.', msg: 'An optional custom message for the wrapping error.' },
    'Event.constructor': { type: "The event's type, exposed as `event.type`.", options: 'Options controlling `bubbles`, `cancelable`, and `composed`.' },
    'CustomEvent.constructor': { type: "The event's type, exposed as `event.type`.", options: 'Options controlling `bubbles`/`cancelable`/`composed` plus the `detail` value.' },
    'EventTarget.addEventListener': {
      type: 'The event type to listen for.',
      callback: 'The listener function, or an object with a `handleEvent` method.',
      options: 'Options, or a boolean shorthand for `capture`; `once` removes the listener after it fires, `signal` removes it when the given `AbortSignal` aborts.',
    },
    'EventTarget.removeEventListener': {
      type: 'The event type to stop listening for.',
      callback: 'The listener to remove.',
      options: 'Options, or a boolean shorthand for `capture`; must match the `capture` value passed to `addEventListener`.',
    },
    'EventTarget.dispatchEvent': { event: "The event to dispatch to this target's listeners." },
    'EventHandler.handleEvent': { event: 'The event passed to the handler.' },
  },
  returns: {
    // Safe under the shared static/instance key: both flavors return the same
    // value in the current implementation (instance getMaxListeners() always
    // returns EventEmitter.defaultMaxListeners; the static form delegates to it).
    'EventEmitter.getMaxListeners': '`EventEmitter.defaultMaxListeners`; bare-events does not track a per-instance limit separately.',
    // Bare keys — instance-only (see file header note), since on()/once() as
    // instance methods are implemented identically to addListener/addOnceListener.
    on: 'The emitter itself, for chaining — implemented identically to `addListener`.',
    once: 'The emitter itself, for chaining — implemented identically to `addOnceListener`.',
    // Unique keys (no static twin), grounded in index.js: both delegate to the
    // same internal helper as their non-prepend/non-off counterparts and return
    // `ctx` (`this`) — a fact not already stated by their `describe` text.
    'EventEmitter.prependListener': 'The emitter itself, for chaining, like `addListener`.',
    'EventEmitter.prependOnceListener': 'The emitter itself, for chaining, like `addOnceListener`.',
    'EventEmitter.off': 'The emitter itself, for chaining — implemented identically to `removeListener`.',
    'EventTarget.dispatchEvent': "`false` if the event is cancelable and `preventDefault()` was called on it during dispatch, `true` otherwise.",
  },
};

export default layout;
