# Node.js Compatibility

Pear's native runtime is [Bare](https://github.com/holepunchto/bare).

Pear, via Bare, offers compatibility with Node.js codebases.

The majority of the Node.js API surface used by developers can be supported using `bare-*` modules and `package.json` import maps.

## Import Maps

For example, given a Node.js module using `fs`, the `package.json` `imports` field should look like so:

```json
{
  "imports": {
    "node:fs": {
      "fs": {
        "bare": "bare-fs",
        "default": "fs"
      }
    },
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

## Runtime Module Mapping using the `with.imports` pragma

Import maps apply to the same scope as the `package.json` - that is, the module scope. It does not override any dependencies that may be using core Node.js modules. For example, the app had a dependency that was using `fs` and the `package.json` has an imports map that maps `fs` to `bare-fs`, the `with.imports` pragma can be used to apply the same import mappings at module loading time:

```js
import depThatUsesFs from 'dep-that-uses-fs' with { imports: './package.json' }
```

```js
const depThatUsesFs = require('dep-that-uses-fs', { with:  { imports: './package.json' } })
```

This will override `fs` with `bare-fs` down the entire dependency tree from `dep-that-uses-fs`.

This is useful for converting higher-level Node.js libraries and applications to Pear & Bare without having to modify every dependency in the tree using Node.js core APIs while declaring import maps in the package.json of modules is ideal for creating hybrid modules that support Node.js, Bare & Pear out of the gate.

## Node.js Globals

By design, Bare & Pear lack a `global.process` object.

When creating a hybrid module, importing or requiring [`bare-process`](https://github.com/holepunchto/bare-process) and using it should be enough. But if a  module or application relies on a global process object then `bare-process/global` can be imported/required to set the process global.

## Deviant Mappings

Most Node.js core API modules names map to suffixes of [bare-* modules](/README.md#bare-modules) with a few exceptions:

* `http` -> [`bare-http1`](https://github.com/holepunchto/bare-http1)
* `child_process` -> [`bare-subprocess`](https://github.com/holepunchto/bare-subprocess)
  * NOTE: If using `detached` option, use [`bare-daemon`](https://github.com/holepunchto/bare-daemon) instead