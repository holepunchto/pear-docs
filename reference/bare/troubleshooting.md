# Troubleshooting

The article aims to help troubleshooting confusing scenarios while developing Bare applications.

## Missing builtin Modules when Running with Bare

Bare is minimal by design, so does not include all of the modules provided with Node.js. Instead modules such as `process` can be imported as a Bare specific module, for example `bare-process`. For a list of Node.js builtins and their Bare replacements, check out `bare-node`'s ["Modules" table](https://github.com/holepunchto/bare-node?tab=readme-ov-file#modules)

### Writing a module with Support for Bare & Node.js

If writing a library that can be run in both the Bare and Node.js runtimes, import maps should be used to support both the Bare version and the Node.js version of builtin modules. Import maps only apply to the `package.json`'s package so does not modify dependencies of the module.

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.

### Running 3rd Party Modules Written for Node.js

To support dependencies that rely on Node.js builtins (eg. `fs`, `os`, etc), an alias can be used to point to a wrapper module to use the Bare version. For example to use `bare-net` where ever `net` is used in dependencies, install it as an alias:

```
npm i bare-net net@npm:bare-node-net
```

See [Consuming dependencies using NPM Aliases](./nodejs-compatibility-with-bare.md#consuming-dependencies-using-npm-aliases) for more info.

For compatibility and to support builtin globals, such as `process`, the corresponding `bare-*` module will include a `/global.js` submodule that sets the global variable to `global`. This is useful when importing modules that assume the global variable exists. It is not recommended to use global variables when writing new code as it is less flexible and a harder to upgrade piecemeal.

Usage of a globals submodule looks like:

```
require('bare-process/global')
console.log('platform', process.platform) // now prints
```

## `AddonError: ADDON_NOT_FOUND: Cannot find addon` when running Bare

As the error suggests, this is because the native addon cannot be found. This could either be because the addon is missing or Bare is looking in a different place than expected.

A few reasons why an addon may be missing:

- The addon is not available for the current platform and/or architecture.  
  To see what platform and architecture Bare is running on, log `Bare.platform` and `Bare.arch`.
- The addon wasn't linked ahead of time.  
  Mobile applications require native code to be linked as part of compiling the application.

  If developing with `react-native-bare-kit` (including using `bare-expo` as a template), check that the addon was loaded in `node_modules/react-native-bare-kit/ios/addons` for iOS and `node_modules/react-native-bare-kit/android/src/main/addons` for Android. This is where the libraries are linked from.

  If other solutions are not working, it may be an issue with the build cache. Try clearing the cache and recompiling.

## `bare-pack` with conditional module loading

[`bare-pack`](https://github.com/holepunchto/bare-pack) does not evaluate your code but scans for imports. This means it cannot infer dynamic imports but assumes all imports will be loaded for the target platform. For example:

```
const { runtime } = require('which-runtime')

let crypto
if (runtime === 'bare') {
  crypto = require('bare-crypto')
} else {
  crypto = require('node:crypto')
}
```

Will thrown:

```
./node_modules/paparam/index.js:514
    throw new Bail(bail.reason)
          ^

Bail: ModuleTraverseError: MODULE_NOT_FOUND: Cannot find module 'node:crypto' imported from 'file://./index.js'
    at exports.imports (./node_modules/bare-module-traverse/index.js:331:24)
    at exports.imports.next (<anonymous>)
    at exports.module (./node_modules/bare-module-traverse/index.js:152:18)
    at exports.module.next (<anonymous>)
    at process (./node_modules/bare-pack/index.js:50:26)
    at async pack (./node_modules/bare-pack/index.js:24:3)
    at async Command._runner (./node_modules/bare-pack/bin.js:46:18)
    at async runAsync (./node_modules/paparam/index.js:793:5)
    at Command._bail (./node_modules/paparam/index.js:514:11)
    at Command.bail (./node_modules/paparam/index.js:127:36)
    at runAsync (./node_modules/paparam/index.js:795:7)
```

This is because it is trying to pack `node:crypto` for Bare which isn't possible.

Instead of dynamic conditions based on runtime environment, modules should have an import map defined to use the correct module for the given runtime.

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.
