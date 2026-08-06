// scripts/bare-refgen/layouts/bare-structured-clone.ts
// Editorial layout for bare-structured-clone: param/returns/throws prose
// grounded in the upstream README, index.js, and lib/errors.js. The
// DataCloneError static methods are error factories (each returns a new
// DataCloneError carrying the matching code); structuredClone's throw
// conditions are the `errors.*(...)` sites reached while serializing and
// transferring the value.
//
// `structuredClone.serialize`/`serializeWithTransfer`/`deserialize`/
// `deserializeWithTransfer` and the `constants`/`symbols` statics only
// extract as members of `structuredClone` as of the extract.ts/render.ts fix
// that recovers a function's namespace-merge statics (`declare namespace X {
// export ... }` on `declare function X()`, previously dropped entirely since
// `symbolKind` prefers 'function' over 'namespace' in KIND_PRECEDENCE) — see
// docs/plans/bare-refs/handover-2026-08-05.md §14. Their param/returns prose
// below is grounded in the upstream README's "Low-level serialization"
// section. `preencode`/`encode`/`decode` (the wire codec) from that same old
// README section do NOT exist anywhere in the current published `.d.ts` —
// a genuine upstream gap, not an extractor bug, left undocumented rather
// than fabricated. The `Serializable`/`Transferable` classes' own
// `[symbols.serialize]`/`[symbols.deserialize]`/`[symbols.detach]`/
// `[symbols.attach]` methods are a separate, still-open extractor gap
// (computed/well-known-symbol members never populate `sym.members`, only
// `checker.getPropertiesOfType` sees them, and collecting members that way
// everywhere is a bigger change than this pass takes on) — restored as prose
// + worked examples on the class-level `describe` entries instead, in
// bare-structured-clone.describe.json.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-channel`](/reference/bare/modules/bare-channel) and [`bare-broadcast-channel`](/reference/bare/modules/bare-broadcast-channel) — inter-thread messaging built on this.',
  ],
  params: {
    structuredClone: {
      value: 'The value to clone.',
      opts: 'Options carrying the optional `transfer` and `interfaces` lists.',
    },
    'structuredClone.serialize': {
      value: 'The value to serialize.',
      forStorage: 'Whether the serialized form will be persisted rather than sent across a boundary immediately.',
      interfaces: 'Serializable and transferable constructors to recognize when serializing custom platform objects.',
    },
    'structuredClone.serializeWithTransfer': {
      value: 'The value to serialize.',
      transferList: 'Transferable objects to include in the transfer list; each is detached from the original after serializing.',
      interfaces: 'Serializable and transferable constructors to recognize when serializing custom platform objects.',
    },
    'structuredClone.deserialize': {
      serialized: 'A value previously produced by `serialize`.',
      interfaces: 'Serializable and transferable constructors to recognize when deserializing custom platform objects.',
    },
    'structuredClone.deserializeWithTransfer': {
      serialized: 'A value previously produced by `serializeWithTransfer`.',
      interfaces: 'Serializable and transferable constructors to recognize when deserializing custom platform objects.',
    },
    'DataCloneError.ALREADY_TRANSFERRED': { msg: 'The error message.' },
    'DataCloneError.INVALID_INTERFACE': { msg: 'The error message.' },
    'DataCloneError.INVALID_REFERENCE': { msg: 'The error message.' },
    'DataCloneError.INVALID_VERSION': { msg: 'The error message.' },
    'DataCloneError.UNSERIALIZABLE_TYPE': { msg: 'The error message.' },
    'DataCloneError.UNTRANSFERABLE_TYPE': { msg: 'The error message.' },
  },
  returns: {
    structuredClone: 'A deep copy of `value`, with any transferred objects detached from the original.',
    'structuredClone.serialize': 'A serialized representation of `value`.',
    'structuredClone.serializeWithTransfer': 'A serialized representation of `value`, plus its transfer list.',
    'structuredClone.deserialize': 'The value reconstructed from `serialized`.',
    'structuredClone.deserializeWithTransfer': 'The value reconstructed from `serialized`, with its transferred objects re-attached.',
    'DataCloneError.ALREADY_TRANSFERRED': 'A new `DataCloneError` with code `ALREADY_TRANSFERRED`.',
    'DataCloneError.INVALID_INTERFACE': 'A new `DataCloneError` with code `INVALID_INTERFACE`.',
    'DataCloneError.INVALID_REFERENCE': 'A new `DataCloneError` with code `INVALID_REFERENCE`.',
    'DataCloneError.INVALID_VERSION': 'A new `DataCloneError` with code `INVALID_VERSION`.',
    'DataCloneError.UNSERIALIZABLE_TYPE': 'A new `DataCloneError` with code `UNSERIALIZABLE_TYPE`.',
    'DataCloneError.UNTRANSFERABLE_TYPE': 'A new `DataCloneError` with code `UNTRANSFERABLE_TYPE`.',
  },
  throws: {
    structuredClone: [
      '`UNSERIALIZABLE_TYPE` — `value`, or a value it references, is of a type that cannot be serialized (for example a function, a symbol, or a detached `ArrayBuffer`).',
      '`UNTRANSFERABLE_TYPE` — a value in the `transfer` list cannot be transferred.',
      '`ALREADY_TRANSFERRED` — a value in the `transfer` list has already been transferred.',
      '`INVALID_INTERFACE` — a serializable or transferable value has an interface that is not present in the `interfaces` list.',
    ],
  },
};

export default layout;
