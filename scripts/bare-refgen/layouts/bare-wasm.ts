// scripts/bare-refgen/layouts/bare-wasm.ts
// Editorial layout for bare-wasm (0.1.x): descriptions for the members the
// .d.ts leaves bare, worded after the WebAssembly JavaScript API it mirrors.

import type { Layout } from '../layout';

const layout: Layout = {
  intro:
    '[`bare-wasm`](https://github.com/holepunchto/bare-wasm) — WebAssembly JavaScript API for Bare. Each export is the same-named member of the `WebAssembly` global. Where the global is unavailable, such as when V8 runs without a JIT on iOS, 0.1.0 throws a `ReferenceError` when it loads. From 0.1.1, the exports still load, but the constructors, the static methods of `Module` and `validate()` throw an error with the code `WEBASSEMBLY_UNAVAILABLE`, and `compile()` and `instantiate()` reject with it. Bare 1.36.0 bundles 0.1.0.',
  describe: {
    ModuleExportDescriptor: 'An export of a module, as listed by `Module.exports()`.',
    ModuleImportDescriptor: 'An import of a module, as listed by `Module.imports()`.',
    MemoryDescriptor: 'The size, in 64 KiB pages, and sharing of a memory.',
    'Memory.constructor': 'Create a memory of `descriptor.initial` pages.',
    TableDescriptor: 'The element type and size of a table.',
    'Table.constructor': 'Create a table of `descriptor.initial` elements, each set to `value`.',
    GlobalDescriptor: 'The value type and mutability of a global.',
    'Global.constructor': 'Create a global holding `value`.',
    TagType: 'The parameter types of an exception tag.',
    'Tag.constructor': 'Create an exception tag.',
    ExceptionOptions: 'Options for an `Exception`.',
    'Exception.constructor': 'Create an exception of `tag` carrying `payload`.',
    InstantiatedSource: 'The result of instantiating the bytes of a module: the compiled `module` and its `instance`.',
  },
  seeAlso: [
    '[`bare-wasi`](/bare/reference/bare/modules/bare-wasi) — WASI preview 1 imports for an instance.',
    '[`bare-wasm-abi`](/bare/reference/bare/modules/bare-wasm-abi) — runs Bare addons compiled to WebAssembly on top of this API.',
  ],
};

export default layout;
