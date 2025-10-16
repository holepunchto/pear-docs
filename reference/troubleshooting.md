# Troubleshooting

* [Pear](#pear)
* [Bare](#bare)

## Pear <a name="pear"></a>

Troubleshooting confusing scenarios while developing Pear applications.

### `Pear.teardown` Callback Fires But Worker Keeps Running

The `Pear.teardown(cb)` callback is triggered whenever the Pear app start to unload. If it is not exiting, then something is keeping the applications event loop running. A common cause of this is not cleaning up the [worker pipe](/reference/api.md#const-pipe-pear.worker.pipe) by calling `pipe.end()` to gracefully end the writable part of the stream.

### `pear` CLI Exits Without Running the Application

If after debugging an application it seems the issue is happening in the Pear platform itself, try the following steps to debug the issue:

1. Run pear command with logs enabled `pear --log [command]`.
2. If no helpful info, run sidecar with logs `pear sidecar --log-level 3`.  
   If the `pear sidecar` stops after printing `Closing any current Sidecar clients...`, then the current Pear Sidecar process is hanging. Check the next steps for forensics that might explain why, but then kill existing Pear processes.  
   _Note_ that this will close any running pear applications such as Keet.
3. If still no helpful info, check that there are still pear processes running via `ps aux | grep pear` or equivalent method for finding processes by name.
4. Finally check the crash logs in platform's `current` directory.
   - For sidecar: `sidecar.crash.log`
   - For electron: `electron-main.crash.log`
   - For pear cli: `cli.crash.log`

### You get a `Error: While lock File .. Resource temporarily unavailable`

The Error:
```
Uncaught (in promise) Error: While lock file: ./pear/app-storage/by-random/.../db/LOCK: Resource temporarily unavailable
    at Object.onopen (pear://dev/node_modules/rocksdb-native/lib/state.js:155:27)
```

Means the application is trying to open a RockDB instance on files currently
locked by another process. This means either:

- An application is trying to open the same storage twice.  
  If using `Corestore`, it is recommended to only create only one instance and
  reusing it.
- There are multiple of processes running for the same application.

### Joining a Hyperswarm Topic takes a long time

There can be many reasons but here are a few common reasons:

- Random NAT networks can take longer as another node may be needed to facility the connection.
- Not destroying the hyperswarm instance in the `Pear.teardown()` callback so
  Hyperswarm can unannounce and clean up the DHT.  
  It's recommended to clean up the hyperswarm instance with `swarm.destroy()` before exiting the application. This prevents conflicting records in the DHT for the application's peer which cause it take longer to join a topic.  

  Example:
  ```js
  Pear.teardown(() => swarm.destroy())
  ```

  Make sure to unregister the teardown callback if the swarm is destroyed
  prematurely.

- A firewall is blocking the traffic.  
  Please let Holepunch know if this is the case.

### Running Bare modules in Pear Desktop Applications

For now this is not possible because Pear desktop applications run in Electron which uses Node.js integration. Pear v2 will unify running Pear applications in Bare with Electron as a UI module. This way the main application will be defined as a "Pear-end" process that can be shared across different versions of the application such as CLI, GUI, mobile, etc.

Running a Bare module will give you one of the following errors:

- `Uncaught TypeError: require.addon is not a function`
- `Uncaught ReferenceError: Bare is not defined`

To support both Bare and Node.js compatible modules, import maps can be defined
so a module `fs` can be resolved to `bare-fs` on Bare and `fs` on Node.js.

```
{
  "imports": {
    "fs": {
      "bare": "bare-fs",
      "default": "fs"
    },
    "fs/*": {
      "bare": "bare-fs/*",
      "default": "fs/*"
    }
  },
  "dependencies": {
    "bare-fs": "^2.1.5"
  }
}
```

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.

## Bare <a name="bare"></a>

Troubleshooting confusing scenarios while developing Pear applications.

### Missing builtin Modules when Running with Bare

Bare is minimal by design, so does not include all of the modules provided with Node.js. Instead modules such as `process` can be imported as a Bare specific module, for example `bare-process`. For a list of Node.js builtins and their Bare replacements, check out `bare-node`'s ["Modules" table](https://github.com/holepunchto/bare-node?tab=readme-ov-file#modules)

#### Writing a module with Support for Bare & Node.js

If writing a library that can be run in both the Bare and Node.js runtimes, import maps should be used to support both the Bare version and the Node.js version of builtin modules. Import maps only apply to the `package.json`'s package so does not modify dependencies of the module.

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.

#### Running 3rd Party Modules Written for Node.js

To support dependencies that rely on Node.js builtins (eg. `fs`, `os`, etc), an alias can be used to point to a wrapper module to use the Bare version. For example to use `bare-net` where ever `net` is used in dependencies, install it as an alias:

```
npm i bare-net net@npm:bare-node-net
```

See [Consuming dependencies using NPM Aliases](/reference/node-compat.md#consuming-dependencies-using-npm-aliases) for more info.

For compatibility and to support builtin globals, such as `process`, the corresponding `bare-*` module will include a `/global.js` submodule that sets the global variable to `global`. This is useful when importing modules that assume the global variable exists. It is not recommended to use global variables when writing new code as it is less flexible and a harder to upgrade piecemeal.

Usage of a globals submodule looks like:

```
require('bare-process/global')
console.log('platform', process.platform) // now prints
```

### `AddonError: ADDON_NOT_FOUND: Cannot find addon` when running Bare

As the error suggests, this is because the native addon cannot be found. This could either be because the addon is missing or Bare is looking in a different place than expected.

A few reasons why an addon may be missing:

- The addon is not available for the current platform and/or architecture.  
  To see what platform and architecture Bare is running on, log `Bare.platform` and `Bare.arch`.
- The addon wasn't linked ahead of time.  
  Mobile applications require native code to be linked as part of compiling the application.

  If developing with `react-native-bare-kit` (including using `bare-expo` as a template), check that the addon was loaded in `node_modules/react-native-bare-kit/ios/addons` for iOS and `node_modules/react-native-bare-kit/android/src/main/addons` for Android. This is where the libraries are linked from.

  If other solutions are not working, it may be an issue with the build cache. Try clearing the cache and recompiling.

### `bare-pack` with conditional module loading

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


