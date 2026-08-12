// scripts/bare-refgen/layouts/bare-make.ts
// Editorial layout for bare-make: param/throws prose grounded in the upstream
// README (CLI flag help) and lib/*.js. Option defaults read from the
// `opts = { ... }` destructuring defaults in lib/build.js, lib/generate.js,
// lib/install.js, and lib/test.js; error codes from lib/errors.js and their
// reject/throw sites. The `errors` class (main export) and `MakeError`
// (bare-make/errors subpath) are the same class, so their members are keyed
// twice with matching prose.

import type { Layout } from '../layout';

const ctor = {
  msg: 'Human-readable error message.',
  code: 'The error code, assigned to `err.code`.',
  fn: 'The function to omit from the captured stack trace (default the `MakeError` constructor).',
};

const factoryMsg = { msg: 'Human-readable error message.' };

const layout: Layout = {
  seeAlso: [
    'It drives CMake with Ninja and Clang for a consistent toolchain across platforms, while staying plain CMake underneath so you can eject.',
    'The CLI is installed globally via `npm i -g bare-make`.',
    '[Bundle a Bare app](/how-to/run-on-native/bundle-a-bare-app) — where addon compilation fits in packaging.',
    '[`bare-pack`](/reference/modules/bare-modules) — bundles the compiled addons.',
  ],
  params: {
    'errors.constructor': ctor,
    'MakeError.constructor': ctor,
    'errors.BUILD_FAILED': factoryMsg,
    'errors.GENERATE_FAILED': factoryMsg,
    'errors.INSTALL_FAILED': factoryMsg,
    'errors.TEST_FAILED': factoryMsg,
    'errors.UNKNOWN_TOOLCHAIN': factoryMsg,
    'MakeError.BUILD_FAILED': factoryMsg,
    'MakeError.GENERATE_FAILED': factoryMsg,
    'MakeError.INSTALL_FAILED': factoryMsg,
    'MakeError.TEST_FAILED': factoryMsg,
    'MakeError.UNKNOWN_TOOLCHAIN': factoryMsg,
    build: {
      opts: 'Options; `build` defaults to `\'build\'` (unset when `preset` is set), `parallel` to `0`, and `clean` and `verbose` to `false`.',
    },
    generate: {
      opts: 'Options; `source` defaults to `\'.\'`, `build` to `\'build\'`, `platform` and `arch` to the host, `cache` to `true`, and the build-type flags (`debug`, `fuzz`, `withDebugSymbols`, `withMinimalSize`, `verbose`) to `false`.',
    },
    install: {
      opts: 'Options; `build` defaults to `\'build\'`, `prefix` to `\'prebuilds\'`, and `link`, `strip`, and `verbose` to `false`.',
    },
    test: {
      opts: 'Options; `build` defaults to `\'build\'`, `timeout` to `30` seconds, `parallel` to `-1`, and `verbose` to `false`.',
    },
  },
  throws: {
    generate: [
      '`UNKNOWN_TOOLCHAIN` — no toolchain is available for the resolved `platform`-`arch` target.',
      '`GENERATE_FAILED` — build system generation exits with a non-zero status.',
    ],
    build: ['`BUILD_FAILED` — the build exits with a non-zero status.'],
    install: ['`INSTALL_FAILED` — the install exits with a non-zero status.'],
    test: ['`TEST_FAILED` — one or more tests fail.'],
  },
};

export default layout;
