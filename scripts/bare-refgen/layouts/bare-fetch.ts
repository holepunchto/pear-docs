// scripts/bare-refgen/layouts/bare-fetch.ts
// Editorial layout for bare-fetch: param/returns/throws prose grounded in the
// upstream README (main branch, `init = { ... }` defaults block and redirect
// prose) and lib/{request,response,headers,body,errors}.js throw sites.
// Error codes are read from lib/errors.js; for `fetch()` and the async Body
// methods the listed errors are promise rejections.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    fetch: {
      input: 'The URL string, `URL`, or `Request` to fetch.',
      init: "Request options; `body`, `signal`, and `agent` default to `null`, `method` to `'GET'`, and `headers` to an empty `Headers`.",
    },
    'Request.constructor': {
      input: 'The URL string, `URL`, or `Request` to base the request on.',
      init: 'Request options, identical to the ones accepted by `fetch()`.',
    },
    'Response.constructor': {
      body: 'The response body, or `null` (default `null`).',
      init: "Options; `status` defaults to `200`, `statusText` to `''`, and `headers` to an empty `Headers`.",
    },
    'Headers.constructor': {
      init: 'A plain object of name–value pairs, an iterable of `[name, value]` pairs, or another `Headers` instance.',
    },
    'Headers.append': {
      name: 'The header name.',
      value: 'The value to append to the header.',
    },
    'Headers.delete': {
      name: 'The header name.',
    },
    'Headers.get': {
      name: 'The header name.',
    },
    'Headers.has': {
      name: 'The header name.',
    },
    'Headers.set': {
      name: 'The header name.',
      value: 'The value to set, replacing any existing values.',
    },
    'Headers.forEach': {
      callback: 'Called with `(value, name, headers)` for each header.',
      thisArg: 'The value of `this` inside `callback`.',
    },
  },
  returns: {
    fetch: 'A promise that resolves with the `Response` once the response headers arrive.',
  },
  throws: {
    fetch: [
      '`INVALID_URL` — `input` or a redirect `Location` is not a valid URL.',
      '`UNKNOWN_PROTOCOL` — the URL protocol is neither `http:` nor `https:`.',
      '`TOO_MANY_REDIRECTS` — more than 20 redirects were followed.',
      '`NETWORK_ERROR` — the underlying request failed or the connection was lost.',
    ],
    'Request.constructor': [
      '`INVALID_URL` — `input` is not a valid URL.',
      '`BODY_UNUSABLE` — `init.body` is a `ReadableStream` that is locked or has already been consumed.',
    ],
    'Response.constructor': [
      '`BODY_UNUSABLE` — `body` is a `ReadableStream` that is locked or has already been consumed.',
    ],
    'Headers.append': [
      '`INVALID_HEADER_NAME` — `name` is empty or contains characters that are not valid in a header name.',
      '`INVALID_HEADER_VALUE` — `value` contains a NUL, CR, or LF character.',
    ],
    'Headers.set': [
      '`INVALID_HEADER_NAME` — `name` is empty or contains characters that are not valid in a header name.',
      '`INVALID_HEADER_VALUE` — `value` contains a NUL, CR, or LF character.',
    ],
    'Body.buffer': ['`BODY_UNUSABLE` — the body has already been consumed.'],
    'Body.bytes': ['`BODY_UNUSABLE` — the body has already been consumed.'],
    'Body.arrayBuffer': ['`BODY_UNUSABLE` — the body has already been consumed.'],
    'Body.text': ['`BODY_UNUSABLE` — the body has already been consumed.'],
    'Body.json': ['`BODY_UNUSABLE` — the body has already been consumed.'],
    'Body.formData': [
      '`BODY_UNUSABLE` — the body has already been consumed.',
      '`INVALID_FORM_DATA` — the content type is not form data, or the multipart boundary parameter is missing.',
    ],
  },
};

export default layout;
