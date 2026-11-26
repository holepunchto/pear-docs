// scripts/bare-refgen/layouts/bare-querystring.ts
//
// Param/returns overrides for bare-querystring. Defaults and behavior verified
// against index.js (parse/stringify default separator '&' and delimiter '=').

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    parse: {
      input: 'Query string to parse.',
      separator: "Substring that separates key/value pairs (default `'&'`).",
      delimiter: "Substring that separates a key from its value (default `'='`).",
    },
    decode: {
      input: 'Query string to parse.',
      separator: "Substring that separates key/value pairs (default `'&'`).",
      delimiter: "Substring that separates a key from its value (default `'='`).",
    },
    stringify: {
      params: 'Object whose enumerable entries become key/value pairs; array values produce one pair per element.',
      separator: "Substring used to join key/value pairs (default `'&'`).",
      delimiter: "Substring used to join a key to its value (default `'='`).",
    },
    encode: {
      params: 'Object whose enumerable entries become key/value pairs; array values produce one pair per element.',
      separator: "Substring used to join key/value pairs (default `'&'`).",
      delimiter: "Substring used to join a key to its value (default `'='`).",
    },
  },
  returns: {
    parse: 'An object (with a `null` prototype) mapping decoded keys to decoded values; repeated keys collect into an array.',
    decode: 'The parsed parameters, exactly as `parse` returns them.',
    stringify: 'The percent-encoded query string.',
    encode: 'The percent-encoded query string, exactly as `stringify` returns it.',
  },
};

export default layout;
