// scripts/bare-refgen/layouts/bare-wasi.ts
// Editorial layout for bare-wasi (0.1.x). The .d.ts carries full TSDoc, so this
// only fixes README links that are relative to the repo, adds how Bare hands
// the options to WebAssembly addons (bare-module 7.5.0), and compares the
// options with Node's `wasi` module. Verified on Bare 1.36.0: Bare has no
// `crypto` global, so `random` uses bare-crypto.

import type { Layout } from '../layout';

const layout: Layout = {
  patch: [
    {
      in: 'Conformance',
      from: '[`test/suite.json`](test/suite.json)',
      to: '[`test/suite.json`](https://github.com/holepunchto/bare-wasi/blob/main/test/suite.json)',
    },
    {
      in: 'Backends',
      from: 'See [`index.d.ts`](index.d.ts) for the interface.',
      to: 'See [`WASIDirectory`](#wasidirectory), [`WASIFile`](#wasifile), and [`WASISymlink`](#wasisymlink) for the interface.',
    },
    {
      in: 'Backends',
      from: '[`bare-directory`](https://github.com/holepunchto/bare-directory)',
      to: '[`bare-directory`](/bare/reference/bare/modules/bare-directory)',
    },
  ],
  params: {
    'WASI.constructor': {
      opts: "The capabilities of the instance. `version` is required and must be `'preview1'`. `args` defaults to `[]`, `env` to `{}`, and `preopens` to `{}`. `stdin`, `stdout`, and `stderr` default to `null`, and then don't exist. `clock` defaults to the host clocks, and `null` denies them, though file timestamps set to now still come from the host clock. `random` defaults to `null`, which denies randomness. `returnOnExit` defaults to `true`; with `false`, `start()` exits the process with the guest's exit code.",
    },
  },
  describe: {
    'HostDirectory.constructor':
      'A host directory backed by a `bare-directory` capability. The guest reaches only what the capability reaches, with its rights, and `bare-wasi` resolves symbolic links within the preopen. On Windows, link targets use `/` as the separator, and drive letter, UNC, and device paths are absolute. Files are opened when looked up, with the most access the rights and the file allow, so an open file stays the same file if it is renamed. Without the `write` right, a file is opened for appending if the rights include `append`, so the guest can still write at the end of existing files. Creating symbolic and hard links isn\'t supported.',
    'HostDirectory.create': 'Implements [`WASIDirectory.create()`](#wasidirectory). Creating a file needs the `write` right as well as `create`; creating a directory needs only `create`.',
    'HostDirectory.entries': 'Implements [`WASIDirectory.entries()`](#wasidirectory).',
    'HostDirectory.lookup': 'Implements [`WASIDirectory.lookup()`](#wasidirectory).',
    'HostDirectory.rename': 'Implements [`WASIDirectory.rename()`](#wasidirectory). Renaming into a directory of another backend fails with `EXDEV`. The capability needs `rename` on both directories and `remove` on the target, even when no entry is replaced.',
    'HostDirectory.rmdir': 'Implements [`WASIDirectory.rmdir()`](#wasidirectory).',
    'HostDirectory.setTimes': 'Implements [`WASINode.setTimes()`](#wasinode).',
    'HostDirectory.size': 'The number of entries of the directory.',
    'HostDirectory.stat': 'Implements [`WASINode.stat()`](#wasinode).',
    'HostDirectory.type': "The type of the node, which is always `'directory'`.",
    'HostDirectory.unlink': 'Implements [`WASIDirectory.unlink()`](#wasidirectory).',
  },
  seeAlso: [
    '[Run an addon sandboxed in WebAssembly](/bare/how-to/run-an-addon-sandboxed-in-webassembly) — load `bare-sqlite` as WebAssembly with one directory granted.',
    '[WebAssembly addons](/bare/explanation/webassembly-addons) — how the sandbox works and what it doesn\'t stop.',
    '[`bare-directory`](/bare/reference/bare/modules/bare-directory) — the host directory capabilities behind `HostDirectory`.',
    '[`bare-wasm`](/bare/reference/bare/modules/bare-wasm) — the WebAssembly API used to compile and instantiate a guest.',
    '[`bare-module`](/bare/reference/bare/modules/bare-module#webassembly-addons) — how Bare passes these options to WebAssembly addons.',
  ],
  extraSections: [
    {
      heading: 'WebAssembly addons',
      body: [
        'From Bare 1.36.0, the module system loads an addon compiled to WebAssembly through [`bare-wasm-abi`](/bare/reference/bare/modules/bare-wasm-abi), which creates one `WASI` instance per addon. The options for it come from a WASI provider: a module that exports a function, which is called with the `URL` of each WebAssembly addon and returns the options described by [`WASIOptions`](#wasioptions). An importer names the provider with the `wasi` import attribute. See [`bare-module`](/bare/reference/bare/modules/bare-module#webassembly-addons).',
        '',
        '```js',
        "const { DirectorySync } = require('bare-directory')",
        "const { HostDirectory } = require('bare-wasi/host')",
        "const crypto = require('bare-crypto')",
        '',
        'module.exports = (url) => ({',
        "  version: 'preview1',",
        '  preopens: {',
        "    '/': new HostDirectory(DirectorySync.open(__dirname + '/data'))",
        '  },',
        '  random: (buffer) => crypto.randomFillSync(buffer)',
        '})',
        '```',
        '',
        'The provider runs as application code, so install what it imports, such as `bare-wasi` and `bare-directory`: the copy of `bare-wasi` that Bare bundles for its loader can\'t be imported. An addon with no provider gets the options `{ version: \'preview1\' }`, which grant nothing through WASI except clocks. WASI limits only system calls: an addon still reaches the JavaScript global object through the ABI. Bare has no `crypto` global, so take random bytes from [`bare-crypto`](/bare/reference/bare/modules/bare-crypto) when an addon needs them. An addon written in Rust can need them: the `bare-svg` README says its WebAssembly build needs `random` because the Rust standard library seeds its hash maps with it.',
      ].join('\n'),
    },
    {
      heading: 'Compared with Node.js',
      body: [
        'The class has the shape of `WASI` in the Node.js [`wasi`](https://nodejs.org/api/wasi.html) module: `new WASI(options)` with a required `version`, `getImportObject()`, `start()`, `initialize()`, and `wasiImport`. The options differ in what they hand to the guest:',
        '',
        '| Option | `bare-wasi` | Node.js `wasi` |',
        '| --- | --- | --- |',
        '| `preopens` | Map guest paths to directory backends, such as `MemoryDirectory` or `HostDirectory`. | Map guest paths to host paths. |',
        '| `stdin`, `stdout`, `stderr` | Contents, functions, streams, or files. Absent unless given. | File descriptors, `0`, `1`, and `2` by default. |',
        '| `random` | Denied unless a function is given. | Always available. |',
        '| `clock` | Host clocks, or `null` to deny them. | Always available. |',
        '',
        'Node.js documents that its `wasi` module does not provide the comprehensive file system security properties of some WASI runtimes. `bare-wasi` resolves every path itself, one name at a time, and a `HostDirectory` is also confined by the kernel.',
      ].join('\n'),
    },
  ],
};

export default layout;
