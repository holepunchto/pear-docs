// scripts/bare-refgen/layouts/bare-stream.ts
//
// Editorial layout for bare-stream: group titles/order for the main export
// (Stream/Readable/Writable/Duplex/Transform + their Events/Options shapes),
// plus param/returns/throws prose. The `bare-stream/web` subpath is always
// grouped by kind (classes are expanded automatically) and isn't addressable
// via `groups`, but its members still take `params`/`returns`/`throws`.
//
// Facts below are grounded in the bare-stream README on `main` (before the
// chore/ts-doc splice replaced it with generated content — see
// ts-doc-upstream/bare-stream, `git show main:README.md`) and in index.js /
// web.js source (for example the `StreamCallback` type shape, and the literal
// `TypeError` messages thrown/used as destroy reasons in web.js). Nothing
// here assumes Node.js `stream` semantics beyond what this module's own
// docs/source state.

import type { Layout } from '../layout';

const CB = 'Called with an error, or `null` on success.';
const STRING_ENCODING = "Encoding used to convert a string `data` to a `Buffer`; defaults to `'utf8'`.";
const CHUNK_ENCODING = "Encoding of `data`, or `'buffer'` if it is not a string.";

const layout: Layout = {
  // NOTE: two old-page facts are NOT restored below — genuine upstream gaps,
  // not layout fixes. `bare-stream/promises`: the package's own
  // package.json#exports maps `./promises` to `promises.js` with no `types`
  // entry at all (unlike `.`/`./web`/`./global`, which all have one) — it's
  // untyped upstream, invisible to this .d.ts-driven pipeline by design.
  // `isEnding`/`isFinishing`: confirmed absent from the current published
  // `index.d.ts` entirely (checked via `npm pack bare-stream`), alongside the
  // other `isStream`/`isEnded`/etc. helpers that IS documented here.
  seeAlso: [
    "It's pure JavaScript and underpins much of the `bare-*` ecosystem—[`bare-fs`](/reference/bare/modules/bare-fs), [`bare-tcp`](/reference/bare/modules/bare-tcp), and others return its streams.",
  ],
  groups: [
    {
      title: 'Stream basics',
      members: [
        'Stream._destroy', 'Stream._open', 'Stream._predestroy', 'Stream.destroy',
        'Stream.destroyed', 'Stream.destroying', 'Stream.readable', 'Stream.writable',
      ],
    },
    {
      title: 'Stream utilities',
      members: [
        'Stream.addAbortSignal', 'Stream.duplexPair', 'Stream.finished', 'Stream.getStreamError',
        'Stream.isDisturbed', 'Stream.isEnded', 'Stream.isErrored', 'Stream.isFinished',
        'Stream.isReadable', 'Stream.isStream', 'Stream.isWritable', 'Stream.pipeline',
      ],
    },
    {
      title: 'Readable streams',
      members: [
        'Readable.constructor', 'Readable._read', 'Readable.closed', 'Readable.errored',
        'Readable.pause', 'Readable.pipe', 'Readable.push', 'Readable.read',
        'Readable.from', 'Readable.fromWeb', 'Readable.isBackpressured', 'Readable.isPaused',
        'Readable.toWeb', 'Readable.resume', 'Readable.setEncoding', 'Readable.unshift',
      ],
    },
    {
      title: 'Writable streams',
      members: [
        'Writable.constructor', 'Writable._final', 'Writable._write', 'Writable._writev',
        'Writable.closed', 'Writable.cork', 'Writable.end', 'Writable.errored', 'Writable.uncork',
        'Writable.drained', 'Writable.fromWeb', 'Writable.isBackpressured', 'Writable.toWeb',
        'Writable.write',
      ],
    },
    {
      title: 'Duplex and Transform streams',
      members: [
        'Duplex.constructor', 'Duplex.fromWeb', 'Duplex.toWeb',
        'Transform.constructor', 'Transform._flush', 'Transform._transform',
      ],
    },
    {
      title: 'Events',
      members: ['StreamEvents', 'ReadableEvents', 'WritableEvents', 'DuplexEvents', 'TransformEvents'],
    },
    {
      title: 'Options',
      members: ['StreamOptions', 'ReadableOptions', 'WritableOptions', 'DuplexOptions', 'TransformOptions'],
    },
  ],

  // Per-parameter descriptions. Keyed by the exact model `key` (not the bare
  // display name) throughout, since many bare-stream member names collide
  // across classes (`close`, `closed`, `error`, `write`, `abort`, `cancel`, …)
  // and the flat-map lookup falls back to bare-name matching — a qualified
  // key avoids ever bleeding a description onto an unrelated same-named member.
  params: {
    'Stream._destroy': {
      err: 'The error the stream is being destroyed with, or `null` for a clean destroy.',
      cb: CB,
    },
    'Stream._open': { cb: 'Called with an error, or `null`, once opening finishes.' },
    'Stream.destroy': { err: 'The error to destroy the stream with; omit or pass `null` for a clean destroy.' },
    'Stream.addAbortSignal': {
      signal: 'The `AbortSignal` that destroys `stream` on abort.',
      stream: 'The stream to destroy when `signal` aborts.',
    },
    'Stream.duplexPair': { opts: 'Passed to both ends of the pair.' },
    'Stream.finished': {
      stream: 'The stream to wait on.',
      opts: "Set `cleanup: true` to detach the listeners automatically once `cb` runs.",
      cb: "Called with an error, or `null`, once `stream` finishes.",
    },
    'Stream.getStreamError': { stream: 'The stream to inspect.' },
    'Stream.isDisturbed': { stream: 'The stream to test.' },
    'Stream.isEnded': { stream: 'The stream to test.' },
    'Stream.isErrored': { stream: 'The stream to test.' },
    'Stream.isFinished': { stream: 'The stream to test.' },
    'Stream.isReadable': { stream: 'The stream to test.' },
    'Stream.isStream': { stream: 'The stream to test.' },
    'Stream.isWritable': { stream: 'The stream to test.' },
    'Stream.pipeline': {
      streams: 'A `Readable` source, zero or more `Duplex` transforms, and a `Writable` destination.',
      cb: 'Called with an error, or `null`, once the pipeline finishes or errors.',
    },

    'StreamOptions.destroy': {
      err: 'The error the stream is being destroyed with, or `null` for a clean destroy.',
      cb: CB,
    },
    'StreamOptions.open': { cb: 'Called with an error, or `null`, once opening finishes.' },

    'Readable.pipe': { dest: 'The destination stream to write into.', cb: CB },
    'Readable.push': {
      data: 'Data to add to the buffer, or `null` to end the stream.',
      encoding: STRING_ENCODING,
    },
    'Readable.from': { data: 'A value, array of values, or async iterable to read from.' },
    'Readable.fromWeb': {
      readableStream: 'The web `ReadableStream` to convert.',
      opts: 'Options for the conversion; supports `encoding` and `signal`, matching `ReadableOptions`.',
    },
    'Readable.isBackpressured': { rs: 'The stream to check.' },
    'Readable.isPaused': { rs: 'The stream to check.' },
    'Readable.toWeb': {
      readable: 'The `Readable` to convert.',
      opts: 'Options for the conversion; `strategy` is a custom queuing strategy passed through to the `ReadableStream` constructor.',
    },
    'Readable.setEncoding': { encoding: 'Encoding used to decode emitted data to strings.' },
    'Readable.unshift': {
      data: 'Data to prepend to the buffer, or `null` to end the stream.',
      encoding: STRING_ENCODING,
    },

    'Writable._final': { cb: CB },
    'Writable._write': { data: 'The chunk to write.', encoding: CHUNK_ENCODING, cb: CB },
    'Writable._writev': {
      batch: 'Queued chunks to write, each with its `chunk` and `encoding`.',
      cb: CB,
    },
    'Writable.end': { cb: 'Called with an error, or `null`, once the stream has finished.' },
    'Writable.drained': { ws: 'The stream to wait on.' },
    'Writable.fromWeb': {
      writableStream: 'The web `WritableStream` to convert.',
      opts: 'Options for the conversion; supports `signal`, matching `WritableOptions`.',
    },
    'Writable.isBackpressured': { ws: 'The stream to check.' },
    'Writable.toWeb': { writable: 'The `Writable` to convert.' },
    'Writable.write': {
      data: 'Data to write. If a string, it is encoded using `encoding`.',
      encoding: STRING_ENCODING,
      cb: 'Called with an error, or `null`, once the write has drained.',
    },

    'WritableOptions.write': { data: 'The chunk to write.', encoding: CHUNK_ENCODING, cb: CB },
    'WritableOptions.writev': {
      batch: 'Queued chunks to write, each with its `chunk` and `encoding`.',
      cb: CB,
    },
    'WritableOptions.final': { cb: CB },

    // Duplex.fromWeb's destructured param is left undocumented: the .d.ts
    // signature's inner type (`writable: Writable`) and return type
    // (`Readable`) don't match the README's own description of the method
    // (web `WritableStream` in, `Duplex` out) — see the report for details.
    'Duplex.fromWeb': {
      opts: 'Options for the conversion; combines the `Readable` and `Writable` conversion options (`encoding`, `signal`).',
    },

    'Transform._flush': { cb: 'Called with an error, or `null`, once flushing finishes.' },
    'Transform._transform': { data: 'The chunk to transform.', encoding: CHUNK_ENCODING, cb: CB },

    'TransformOptions.transform': { data: 'The chunk to transform.', encoding: CHUNK_ENCODING, cb: CB },
    'TransformOptions.flush': { cb: 'Called with an error, or `null`, once flushing finishes.' },

    // bare-stream/web
    isReadableStream: { value: 'The value to test.' },
    isReadableStreamErrored: { stream: 'The stream to test.' },
    isReadableStreamDisturbed: { stream: 'The stream to test.' },
    isWritableStream: { value: 'The value to test.' },
    isTransformStream: { value: 'The value to test.' },

    'ReadableStreamDefaultReader.constructor': { stream: 'The `ReadableStream` to read from.' },
    'ReadableStreamDefaultReader.cancel': {
      reason: "Reason for the cancellation, passed to the stream's `destroy()`; defaults to a `TypeError` if omitted.",
    },

    'ReadableStreamDefaultController.constructor': { stream: 'The `ReadableStream` the controller manages.' },
    'ReadableStreamDefaultController.enqueue': { data: 'The chunk to enqueue.' },
    'ReadableStreamDefaultController.error': { error: 'The error to destroy the stream with.' },

    'UnderlyingSource.cancel': { reason: 'Reason the stream was cancelled.' },
    'UnderlyingSource.pull': { controller: 'The `ReadableStreamDefaultController` to enqueue data into.' },
    'UnderlyingSource.start': { controller: 'The `ReadableStreamDefaultController` to enqueue data into.' },

    'ReadableStream.constructor': {
      underlyingSource: 'May provide `start`, `pull`, and `cancel` methods, or be an existing `streamx` stream to wrap.',
      queuingStrategy: 'Defaults to a `CountQueuingStrategy` if omitted.',
    },
    'ReadableStream.cancel': {
      reason: "Reason for the cancellation, passed to the stream's `destroy()`; defaults to a `TypeError` if omitted.",
    },
    'ReadableStream.pipeTo': { destination: 'The `WritableStream` to pipe into.' },
    'ReadableStream.from': { iterable: 'A value, array of values, or async iterable to read from.' },

    'QueuingStrategy.size': { chunk: 'The chunk to measure.' },

    'WritableStreamDefaultWriter.constructor': { stream: 'The `WritableStream` to write to.' },
    'WritableStreamDefaultWriter.abort': {
      reason: "Reason for the abort, passed to the stream's `destroy()`; defaults to a `TypeError` if omitted.",
    },
    'WritableStreamDefaultWriter.write': { chunk: 'The chunk to write.' },

    'WritableStreamDefaultController.constructor': { stream: 'The `WritableStream` the controller manages.' },
    'WritableStreamDefaultController.error': { err: 'The error to destroy the stream with.' },

    'UnderlyingSink.abort': { reason: 'Reason the stream was aborted.' },
    'UnderlyingSink.start': { controller: 'The `WritableStreamDefaultController` to signal errors through.' },
    'UnderlyingSink.write': {
      chunk: 'The chunk to write.',
      controller: 'The `WritableStreamDefaultController` to signal errors through.',
    },

    'WritableStream.constructor': {
      underlyingSink: 'May provide `start`, `write`, `close`, and `abort` methods, or be an existing `streamx` stream to wrap.',
    },
    'WritableStream.abort': {
      reason: "Reason for the abort, passed to the stream's `destroy()`; defaults to a `TypeError` if omitted.",
    },

    'TransformStreamDefaultController.constructor': { stream: 'The `TransformStream` the controller manages.' },
    'TransformStreamDefaultController.enqueue': { data: 'The chunk to enqueue.' },
    'TransformStreamDefaultController.error': { error: 'The error to destroy the stream with.' },

    'Transformer.flush': {
      controller: 'The `TransformStreamDefaultController` to enqueue output or signal errors through.',
    },
    'Transformer.start': {
      controller: 'The `TransformStreamDefaultController` to enqueue output or signal errors through.',
    },
    'Transformer.transform': {
      chunk: 'The chunk to transform.',
      controller: 'The `TransformStreamDefaultController` to enqueue output or signal errors through.',
    },

    'TransformStream.constructor': { transformer: 'May provide `start`, `transform`, and `flush` methods.' },
  },

  // Return-value semantics beyond the bare type, for callables where the
  // description doesn't already state it (skipping for example `Writable.write` /
  // `Stream.pipeline`, whose existing `describe` prose already covers the
  // return value and would otherwise render a redundant **Returns** line).
  returns: {
    'ReadableStreamDefaultReader.read':
      'Resolves with the next chunk as `{ value, done: false }`, or `{ value: undefined, done: true }` once the stream ends; rejects with the stream\'s error if the stream is errored.',
    'WritableStreamDefaultWriter.write':
      "Resolves once `chunk` has been written and the stream has drained; rejects with the stream's error if the stream is or becomes errored.",
    'WritableStreamDefaultWriter.close': 'Resolves once the stream has finished closing.',
    'WritableStream.close': 'Resolves once the stream has finished closing.',
  },

  // Grounded in web.js: both `getReader()` and `getWriter()` guard on
  // `this.locked` and `throw new TypeError('Stream is locked')` synchronously.
  throws: {
    'ReadableStream.getReader': [
      '`TypeError` — thrown if the stream already has an active reader (`locked` is `true`).',
    ],
    'WritableStream.getWriter': [
      '`TypeError` — thrown if the stream already has an active writer (`locked` is `true`).',
    ],
  },
};

export default layout;
