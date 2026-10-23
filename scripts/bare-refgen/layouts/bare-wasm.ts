// scripts/bare-refgen/layouts/bare-wasm.ts
// Editorial layout for bare-wasm (0.1.x): descriptions for the members the
// .d.ts leaves bare, worded after the WebAssembly JavaScript API it mirrors.

import type { Layout } from '../layout';

const layout: Layout = {
  intro:
    '[`bare-wasm`](https://github.com/holepunchto/bare-wasm) — WebAssembly JavaScript API for Bare. In 0.1.0, each export is the same-named member of the `WebAssembly` global, so the module needs an engine that provides WebAssembly.',
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
