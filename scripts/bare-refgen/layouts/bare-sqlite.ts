// scripts/bare-refgen/layouts/bare-sqlite.ts
// Editorial layout for bare-sqlite: param/returns/throws prose grounded in the
// upstream lib source.
//   - Options defaults from lib/database-sync.js constructor destructuring.
//   - Error codes from lib/errors.js (DATABASE_ALREADY_OPEN, DATABASE_NOT_OPEN,
//     LOAD_EXTENSION_DISABLED, INVALID_ARGUMENT) verified at their throw sites.
//   - Parameter binding semantics from lib/statement-sync.js `splitParameters`
//     (a leading plain object is bound as named params, the rest positionally)
//     and lib/tag-store.js (`strings` joined with `?`, values bound positionally).
// Keys are qualified model keys (for example `StatementSync.all`) so StatementSync and
// TagStore members with the same short name get distinct prose.

import type { Layout } from '../layout';

const NOT_OPEN = '`DATABASE_NOT_OPEN` — the database is not open.';
const EXT_DISABLED =
  '`LOAD_EXTENSION_DISABLED` — `allowExtension` was not enabled at construction.';

const BIND_PARAMS =
  'Values to bind to the statement placeholders. An optional leading plain object binds named parameters; the remaining arguments bind positional placeholders.';

const layout: Layout = {
  params: {
    'DatabaseSync.constructor': {
      location:
        "Path to the database file, or `':memory:'` for an in-memory database.",
      opts: 'Options. `open` opens the database immediately (default `true`); `readOnly` opens it read-only (default `false`); `enableForeignKeyConstraints` enforces foreign keys (default `true`); `enableDoubleQuotedStringLiterals` permits double-quoted string literals (default `false`); `allowExtension` permits loading extensions (default `false`); `timeout` is the busy-timeout in milliseconds (default `0`).',
    },
    'DatabaseSync.exec': {
      sql: 'One or more SQL statements to execute, separated by `;`.',
    },
    'DatabaseSync.prepare': {
      sql: 'The SQL to compile into a reusable prepared statement.',
    },
    'DatabaseSync.createTagStore': {
      maxSize:
        'Maximum number of cached prepared statements before the least-recently-used entry is evicted (default `1000`).',
    },
    'DatabaseSync.enableLoadExtension': {
      allow: 'When `true`, enable extension loading; when `false`, disable it.',
    },
    'DatabaseSync.loadExtension': {
      path: 'Path to the shared library implementing the SQLite extension.',
      entryPoint:
        'Name of the C initialization function to call; when omitted (`null`), SQLite derives it from the filename.',
    },
    'StatementSync.all': { params: BIND_PARAMS },
    'StatementSync.values': { params: BIND_PARAMS },
    'StatementSync.get': { params: BIND_PARAMS },
    'StatementSync.run': { params: BIND_PARAMS },
    'StatementSync.iterate': { params: BIND_PARAMS },
    'StatementSync.setAllowBareNamedParameters': {
      allow: 'When `true` (the default), named-parameter lookup falls back to the bare key when the sigil-prefixed key is not found; when `false`, only sigil-prefixed keys match.',
    },
    'StatementSync.setAllowUnknownNamedParameters': {
      allow: 'When `false` (the default), unknown named-parameter keys throw; when `true`, they are silently ignored.',
    },
    'StatementSync.setReadBigInts': {
      enabled:
        'When `true`, `INTEGER` columns (and the `changes`/`lastInsertRowid` from `run()`) are returned as `BigInt` rather than `Number` (default `false`).',
    },
    'TagStore.all': {
      strings: 'The template string parts (the `strings` array of a tagged template).',
      params: 'The interpolated template values, bound positionally to the placeholders between the string parts.',
    },
    'TagStore.values': {
      strings: 'The template string parts (the `strings` array of a tagged template).',
      params: 'The interpolated template values, bound positionally to the placeholders between the string parts.',
    },
    'TagStore.get': {
      strings: 'The template string parts (the `strings` array of a tagged template).',
      params: 'The interpolated template values, bound positionally to the placeholders between the string parts.',
    },
    'TagStore.iterate': {
      strings: 'The template string parts (the `strings` array of a tagged template).',
      params: 'The interpolated template values, bound positionally to the placeholders between the string parts.',
    },
    'TagStore.run': {
      strings: 'The template string parts (the `strings` array of a tagged template).',
      params: 'The interpolated template values, bound positionally to the placeholders between the string parts.',
    },
  },
  returns: {
    'DatabaseSync.prepare':
      'A `StatementSync` that can be reused with different parameter values.',
    'DatabaseSync.createTagStore':
      'A `TagStore` exposing `all`, `get`, `iterate`, and `run` as tagged-template functions.',
    'StatementSync.all':
      'All result rows, as an array of objects keyed by column name.',
    'StatementSync.values':
      'All result rows, as an array of value tuples ordered by `columns()`.',
    'StatementSync.get':
      'The first result row, or `undefined` if the query produced no rows.',
    'StatementSync.iterate':
      'An iterator that yields result rows one at a time as objects keyed by column name.',
    'StatementSync.run':
      'A result object with `changes` (the number of rows modified) and `lastInsertRowid`.',
    'StatementSync.columns':
      'An array describing the statement result columns.',
    'TagStore.all':
      'All result rows, as an array of objects keyed by column name.',
    'TagStore.values':
      'All result rows, as an array of value tuples ordered by `columns()`.',
    'TagStore.get':
      'The first result row, or `undefined` if the query produced no rows.',
    'TagStore.iterate':
      'An iterator that yields result rows one at a time as objects keyed by column name.',
    'TagStore.run':
      'A result object with `changes` (the number of rows modified) and `lastInsertRowid`.',
  },
  describe: {
    errors:
      'The `SQLiteError` class. Errors thrown by the module are instances of it, with a `code` such as `DATABASE_NOT_OPEN`, `DATABASE_ALREADY_OPEN`, `INVALID_ARGUMENT`, or `LOAD_EXTENSION_DISABLED`, or an SQLite result code such as `CANTOPEN`, `BUSY`, or `IOERR`.',
  },
  seeAlso: [
    '[Run an addon sandboxed in WebAssembly](/bare/how-to/run-an-addon-sandboxed-in-webassembly) — load the WebAssembly build with one directory granted.',
  ],
  throws: {
    'DatabaseSync.open': ['`DATABASE_ALREADY_OPEN` — the database is already open.'],
    'DatabaseSync.close': [NOT_OPEN],
    'DatabaseSync.exec': [NOT_OPEN],
    'DatabaseSync.prepare': [NOT_OPEN],
    'DatabaseSync.createTagStore': [
      NOT_OPEN,
      '`INVALID_ARGUMENT` — `maxSize` is not a positive integer.',
    ],
    'DatabaseSync.enableLoadExtension': [NOT_OPEN, EXT_DISABLED],
    'DatabaseSync.loadExtension': [NOT_OPEN, EXT_DISABLED],
  },
  // 0.1.5 added prebuilds/wasi-wasm32/bare-sqlite.wasm (holepunchto/bare-sqlite#20).
  // Behaviour below was run on Bare 1.36.0.
  extraSections: [
    {
      heading: 'WebAssembly build',
      body: [
        'From 0.1.5, the package also ships a WebAssembly build, `prebuilds/wasi-wasm32/bare-sqlite.wasm`. On Bare 1.36.0 and later, the `host` import attribute loads it in place of the native build, sandboxed through WASI, so the database reaches only the directories its WASI provider grants:',
        '',
        '```js',
        "const { DatabaseSync } = require('bare-sqlite', {",
        "  with: { host: 'wasi-wasm32', wasi: './wasi.js' }",
        '})',
        '',
        "const db = new DatabaseSync('/books.db')",
        '```',
        '',
        "Database paths are paths inside the provider's `preopens`, so `/books.db` is `books.db` in the directory mounted at `/`. Without a provider, an in-memory database (`':memory:'`) still works, and opening a file throws `CANTOPEN`. The WebAssembly build cannot load extensions: on a database opened with `allowExtension: true`, `loadExtension()` throws a `SQLiteError` with code `ERROR` and the message `ERROR: extension loading is not supported`. See [WebAssembly addons](/bare/reference/bare/modules/bare-module#webassembly-addons) for the provider and the rules for loading a package this way.",
        '',
        "The WebAssembly build locks a database by creating and removing a `<name>.lock` directory next to it, so the provider's directory needs the `create` and `remove` [rights](/bare/reference/bare/modules/bare-directory#rights) as well as `lookup` and `read`, even for a database opened with `readOnly: true`. Writing also needs `write`, and `truncate`, which SQLite uses to shrink the file on `VACUUM` and when it rolls back a transaction. Without them, statements fail with `IOERR`. A process that leaves the `.lock` directory behind, because it lacked `remove` or exited while holding the lock, makes every later open fail with `BUSY` until the directory is deleted.",
      ].join('\n'),
    },
  ],
};

export default layout;
