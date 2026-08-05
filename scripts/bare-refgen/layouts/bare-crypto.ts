// scripts/bare-refgen/layouts/bare-crypto.ts
//
// Editorial layout for bare-crypto. Facts (signatures, types) come from the
// .d.ts; prose here is transcribed/derived from the upstream README and
// lib/*.js implementation (holepunchto/bare-crypto), not invented.
//
// Grouping: left as `groups: []` deliberately — the default per-container
// grouping (Hash / Hmac / Cipheriv / Decipheriv / Functions / Constants)
// already mirrors the README's class-based structure.
//
// Error codes: string algorithm lookups go through lib/constants.js
// (`toHash`/`toCipher`/`toKeyType`), which throw `CryptoError`s with codes
// `UNKNOWN_HASH` / `UNKNOWN_CIPHER` / `UNKNOWN_KEY_TYPE` (lib/errors.js).
// The RangeError conditions are visible at throw sites in lib/cipher.js,
// lib/pbkdf2.js, lib/random.js, and lib/timing.js.

import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    'Hash.constructor': {
      algorithm:
        "The hash algorithm, as a string (for example `'sha256'`, `'sha-256'`) or a numeric constant from `constants.hash`.",
      opts: 'Options forwarded to the `Transform` constructor from `bare-stream`.',
    },
    createHash: {
      algorithm:
        "The hash algorithm, as a string (for example `'sha256'`, `'sha-256'`) or a numeric constant from `constants.hash`.",
      opts: 'Options forwarded to the `Transform` constructor from `bare-stream`.',
    },
    'Hash.update': {
      data: 'The data to push into the hash.',
      encoding: "The encoding of `data` when it is a string (defaults to `'utf8'`).",
    },
    'Hash.digest': {
      encoding: "The encoding for the returned digest; omit (or pass `'buffer'`) to get a `Buffer`.",
    },
    'Hmac.constructor': {
      algorithm:
        "The hash algorithm, as a string (for example `'sha256'`, `'sha-256'`) or a numeric constant from `constants.hash`.",
      key: "The HMAC key; a string is decoded using the `encoding` option (defaults to `'utf8'`).",
      opts: 'Options forwarded to the `Transform` constructor from `bare-stream`.',
    },
    createHmac: {
      algorithm:
        "The hash algorithm, as a string (for example `'sha256'`, `'sha-256'`) or a numeric constant from `constants.hash`.",
      key: "The HMAC key; a string is decoded using the `encoding` option (defaults to `'utf8'`).",
      opts: 'Options forwarded to the `Transform` constructor from `bare-stream`.',
    },
    'Hmac.update': {
      data: 'The data to push into the HMAC.',
      encoding: "The encoding of `data` when it is a string (defaults to `'utf8'`).",
    },
    'Hmac.digest': {
      encoding: "The encoding for the returned digest; omit (or pass `'buffer'`) to get a `Buffer`.",
    },
    'Cipheriv.constructor': {
      algorithm: 'The cipher algorithm, as a string or a numeric constant from `constants.cipher`.',
      key: "The encryption key; must match the algorithm's required length.",
      iv: "The initialization vector / nonce; must match the algorithm's required length.",
      opts: "Options forwarded to `Transform`; may include `encoding` (defaults to `'utf8'`) and, for AEAD algorithms, `authTagLength` (defaults to `16`; must be `12`, `14`, or `16`).",
    },
    createCipheriv: {
      algorithm: 'The cipher algorithm, as a string or a numeric constant from `constants.cipher`.',
      key: "The encryption key; must match the algorithm's required length.",
      iv: "The initialization vector / nonce; must match the algorithm's required length.",
      opts: "Options forwarded to `Transform`; may include `encoding` (defaults to `'utf8'`) and, for AEAD algorithms, `authTagLength` (defaults to `16`; must be `12`, `14`, or `16`).",
    },
    'Decipheriv.constructor': {
      algorithm: 'The cipher algorithm, as a string or a numeric constant from `constants.cipher`.',
      key: "The decryption key; must match the algorithm's required length.",
      iv: "The initialization vector / nonce; must match the algorithm's required length.",
      opts: 'Accepts the same options as `createCipheriv`.',
    },
    createDecipheriv: {
      algorithm: 'The cipher algorithm, as a string or a numeric constant from `constants.cipher`.',
      key: "The decryption key; must match the algorithm's required length.",
      iv: "The initialization vector / nonce; must match the algorithm's required length.",
      opts: 'Accepts the same options as `createCipheriv`.',
    },
    'Cipheriv.update': {
      data: 'The chunk to encrypt.',
      inputEncoding: 'The encoding of `data` when it is a string.',
      outputEncoding: 'If provided, the encrypted result is returned as a string in this encoding.',
    },
    'Cipheriv.final': {
      outputEncoding: 'If provided, the final output is returned as a string in this encoding.',
    },
    'Decipheriv.update': {
      data: 'The chunk to decrypt.',
      inputEncoding: 'The encoding of `data` when it is a string.',
      outputEncoding: 'If provided, the decrypted result is returned as a string in this encoding.',
    },
    'Decipheriv.final': {
      outputEncoding: 'If provided, the final output is returned as a string in this encoding.',
    },
    // Bare-name keys: apply to both Cipheriv and Decipheriv members.
    setAutoPadding: {
      pad: '`true` to enable automatic padding, `false` to disable it.',
    },
    setAAD: {
      buffer: 'The additional authenticated data.',
      opts: 'May include an `encoding` for string `buffer` inputs.',
    },
    setAuthTag: {
      authTag: 'The expected authentication tag.',
      encoding: 'The encoding of `authTag` when it is a string.',
    },
    randomBytes: {
      size: 'The number of random bytes to generate.',
    },
    randomFill: {
      buffer: 'The buffer to fill.',
      offset: 'Offset at which filling starts (defaults to `0`).',
      size: 'Amount to fill (defaults to `buffer.byteLength - offset`).',
    },
    randomFillSync: {
      buffer: 'The buffer to fill.',
      offset: 'Offset at which filling starts (defaults to `0`).',
      size: 'Amount to fill (defaults to `buffer.byteLength - offset`).',
    },
    pbkdf2: {
      password: 'The password to derive the key from.',
      salt: 'The salt.',
      iterations: 'The number of PBKDF2 iterations; must be between `1` and `2^32 - 1`.',
      keylen: 'The length in bytes of the derived key.',
      digest: 'The hash algorithm, as a string or a numeric constant from `constants.hash`.',
    },
    pbkdf2Sync: {
      password: 'The password to derive the key from.',
      salt: 'The salt.',
      iterations: 'The number of PBKDF2 iterations; must be between `1` and `2^32 - 1`.',
      keylen: 'The length in bytes of the derived key.',
      digest: 'The hash algorithm, as a string or a numeric constant from `constants.hash`.',
    },
    generateKeyPair: {
      type: "The key type, as a string (for example `'ed25519'`) or a numeric constant from `constants.keyType`.",
    },
    sign: {
      algorithm: 'Ignored for Ed25519 — pass `null`.',
      data: 'The data to sign.',
      key: 'The key to sign with.',
    },
    verify: {
      algorithm: 'Ignored for Ed25519 — pass `null`.',
      data: 'The signed data.',
      key: 'The key to verify against.',
      signature: 'The signature to check.',
    },
    timingSafeEqual: {
      a: 'The first buffer to compare.',
      b: 'The second buffer to compare.',
    },
    getRandomValues: {
      array: 'The buffer to fill with cryptographically secure random bytes.',
    },
  },
  throws: {
    'Hash.constructor': ['`UNKNOWN_HASH` — `algorithm` is a string that does not name a supported hash algorithm.'],
    createHash: ['`UNKNOWN_HASH` — `algorithm` is a string that does not name a supported hash algorithm.'],
    'Hmac.constructor': ['`UNKNOWN_HASH` — `algorithm` is a string that does not name a supported hash algorithm.'],
    createHmac: ['`UNKNOWN_HASH` — `algorithm` is a string that does not name a supported hash algorithm.'],
    'Cipheriv.constructor': [
      '`UNKNOWN_CIPHER` — `algorithm` is a string that does not name a supported cipher.',
      "`RangeError` — `key` or `iv` does not match the algorithm's required length, or (AEAD) `authTagLength` is not `12`, `14`, or `16`.",
    ],
    createCipheriv: [
      '`UNKNOWN_CIPHER` — `algorithm` is a string that does not name a supported cipher.',
      "`RangeError` — `key` or `iv` does not match the algorithm's required length, or (AEAD) `authTagLength` is not `12`, `14`, or `16`.",
    ],
    'Decipheriv.constructor': [
      '`UNKNOWN_CIPHER` — `algorithm` is a string that does not name a supported cipher.',
      "`RangeError` — `key` or `iv` does not match the algorithm's required length, or (AEAD) `authTagLength` is not `12`, `14`, or `16`.",
    ],
    createDecipheriv: [
      '`UNKNOWN_CIPHER` — `algorithm` is a string that does not name a supported cipher.',
      "`RangeError` — `key` or `iv` does not match the algorithm's required length, or (AEAD) `authTagLength` is not `12`, `14`, or `16`.",
    ],
    generateKeyPair: ['`UNKNOWN_KEY_TYPE` — `type` is a string that does not name a supported key type.'],
    pbkdf2: [
      '`RangeError` — `iterations` or `keylen` is out of range.',
      '`UNKNOWN_HASH` — `digest` is a string that does not name a supported hash algorithm.',
    ],
    pbkdf2Sync: [
      '`RangeError` — `iterations` or `keylen` is out of range.',
      '`UNKNOWN_HASH` — `digest` is a string that does not name a supported hash algorithm.',
    ],
    randomFill: ['`RangeError` — `offset`, `size`, or `offset + size` is out of range for `buffer`.'],
    randomFillSync: ['`RangeError` — `offset`, `size`, or `offset + size` is out of range for `buffer`.'],
    timingSafeEqual: ['`RangeError` — `a` and `b` differ in byte length.'],
  },
};

export default layout;
