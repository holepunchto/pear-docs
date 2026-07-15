// scripts/bare-refgen/layouts/bare-structured-clone.ts
// Editorial layout for bare-structured-clone: param/returns/throws prose
// grounded in the upstream README, index.js, and lib/errors.js. The
// DataCloneError static methods are error factories (each returns a new
// DataCloneError carrying the matching code); structuredClone's throw
// conditions are the `errors.*(...)` sites reached while serializing and
// transferring the value.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    structuredClone: {
      value: 'The value to clone.',
      opts: 'Options carrying the optional `transfer` and `interfaces` lists.',
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
    'DataCloneError.ALREADY_TRANSFERRED': 'A new `DataCloneError` with code `ALREADY_TRANSFERRED`.',
    'DataCloneError.INVALID_INTERFACE': 'A new `DataCloneError` with code `INVALID_INTERFACE`.',
    'DataCloneError.INVALID_REFERENCE': 'A new `DataCloneError` with code `INVALID_REFERENCE`.',
    'DataCloneError.INVALID_VERSION': 'A new `DataCloneError` with code `INVALID_VERSION`.',
    'DataCloneError.UNSERIALIZABLE_TYPE': 'A new `DataCloneError` with code `UNSERIALIZABLE_TYPE`.',
    'DataCloneError.UNTRANSFERABLE_TYPE': 'A new `DataCloneError` with code `UNTRANSFERABLE_TYPE`.',
  },
  throws: {
    structuredClone: [
      '`UNSERIALIZABLE_TYPE` — `value`, or a value it references, is of a type that cannot be serialized (e.g. a function, a symbol, or a detached `ArrayBuffer`).',
      '`UNTRANSFERABLE_TYPE` — a value in the `transfer` list cannot be transferred.',
      '`ALREADY_TRANSFERRED` — a value in the `transfer` list has already been transferred.',
      '`INVALID_INTERFACE` — a serializable or transferable value has an interface that is not present in the `interfaces` list.',
    ],
  },
};

export default layout;
