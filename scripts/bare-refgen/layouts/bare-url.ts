// scripts/bare-refgen/layouts/bare-url.ts
// Editorial layout for bare-url: group titles + member order, plus param,
// returns, and throws prose grounded in the bare-url README/source (the
// `.d.ts` alone never carries this level of detail). Facts under each heading
// are still regenerated from the .d.ts on every run.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    '[`bare-path`](/reference/bare/modules/bare-path) — provides the platform-specific path handling used by `fileURLToPath`/`pathToFileURL`.',
  ],
  groups: [
    {
      title: 'Constructing and parsing',
      members: ['URL', 'URL.parse', 'URL.canParse'],
    },
    {
      title: 'Components',
      members: [
        'href', 'protocol', 'username', 'password', 'host', 'hostname',
        'port', 'pathname', 'search', 'searchParams', 'hash',
      ],
    },
    {
      title: 'Converting to string',
      members: ['URL.toString', 'URL.toJSON'],
    },
    {
      title: 'File URL conversion',
      members: ['URL.fileURLToPath', 'URL.pathToFileURL'],
    },
    {
      title: 'Type checks',
      members: ['URL.isURL', 'URL.isURLSearchParams'],
    },
    {
      title: 'Constructing search params',
      members: ['URLSearchParams'],
    },
    {
      title: 'Reading and writing parameters',
      members: ['get', 'getAll', 'has', 'append', 'set', 'delete', 'size'],
    },
    {
      title: 'Serializing search params',
      members: ['URLSearchParams.toString', 'URLSearchParams.toJSON'],
    },
    {
      title: 'Search params type check',
      members: ['URLSearchParams.isURLSearchParams'],
    },
    {
      title: 'Errors',
      members: ['URLError'],
    },
  ],
  params: {
    URL: {
      input: 'The URL string to parse.',
      base: 'A base URL that `input` is resolved relative to, if provided.',
    },
    'URL.parse': {
      input: 'The URL string to parse.',
      base: 'A base URL that `input` is resolved relative to, if provided.',
    },
    'URL.canParse': {
      input: 'The URL string to test.',
      base: 'A base URL that `input` is resolved relative to, if provided.',
    },
    'URL.fileURLToPath': {
      url: 'The `file:` URL to convert, as a `URL` instance or a string.',
    },
    'URL.pathToFileURL': {
      pathname: 'The platform-specific file path to convert.',
    },
    'URL.isURL': {
      value: 'The value to test.',
    },
    'URL.isURLSearchParams': {
      value: 'The value to test.',
    },
    URLSearchParams: {
      init: 'A query string, an iterable of `[name, value]` pairs, or an object of key-value pairs to initialize the params from.',
    },
    append: {
      name: 'The parameter name.',
      value: 'The parameter value.',
    },
    delete: {
      name: 'The parameter name to remove.',
      value: 'If provided, only pairs also matching this value are removed.',
    },
    get: {
      name: 'The parameter name to look up.',
    },
    getAll: {
      name: 'The parameter name to look up.',
    },
    has: {
      name: 'The parameter name to check.',
      value: 'If provided, the pair must also match this value.',
    },
    set: {
      name: 'The parameter name.',
      value: 'The value to set.',
    },
    'URLSearchParams.isURLSearchParams': {
      value: 'The value to test.',
    },
  },
  // `URL.parse` never throws (unlike `new URL()`); its distinguishing fact is
  // what it returns on failure, so that belongs here rather than in `describe`.
  returns: {
    'URL.parse': 'A `URL` instance if `input` parses successfully, or `null` on failure.',
  },
  // Codes and conditions read from lib/errors.js and index.js (URLError.INVALID_URL,
  // .INVALID_URL_SCHEME, .INVALID_FILE_URL_HOST, .INVALID_FILE_URL_PATH); not yet
  // annotated upstream as @throws.
  throws: {
    URL: ["`INVALID_URL` — `input` is not a valid URL."],
    'URL.fileURLToPath': [
      '`INVALID_URL_SCHEME` — the URL does not use the `file:` protocol.',
      "`INVALID_FILE_URL_HOST` — (non-Windows) the URL has a host other than empty or `'localhost'`.",
      '`INVALID_FILE_URL_PATH` — the URL path contains an encoded path-separator or NUL character, or, on Windows, is not an absolute drive path.',
    ],
  },
};

export default layout;
