# Node.js Compatibility with Bare
Bare offers seamless compatibility with Node.js counterparts.
Most of the modules and APIs used by developers are covered and supported.

## Currently supported modules

* `child_process`: [`bare-subprocess`](https://github.com/holepunchto/bare-subprocess) (through `npm:bare-node-child-process)`
* `console`: [`bare-console`](https://github.com/holepunchto/bare-console) (through `npm:bare-node-console)`
* `events`: [`bare-events`](https://github.com/holepunchto/bare-events) (through `npm:bare-node-events)`
* `fs`: [`bare-fs`](https://github.com/holepunchto/bare-fs) (through `npm:bare-node-fs)`
* `http`: [`bare-http1`](https://github.com/holepunchto/bare-http1) (through `npm:bare-node-http)`
* `inspector`: [`bare-inspector`](https://github.com/holepunchto/bare-inspector) (through `npm:bare-node-inspector)`
* `os`: [`bare-os`](https://github.com/holepunchto/bare-os) (through `npm:bare-node-os)`
* `path`: [`bare-path`](https://github.com/holepunchto/bare-path) (through `npm:bare-node-path)`
* `process`: [`bare-process`](https://github.com/holepunchto/bare-process) (through `npm:bare-node-process)`
* `readline`: [`bare-readline`](https://github.com/holepunchto/bare-readline) (through `npm:bare-node-readline)`
* `repl`: [`bare-repl`](https://github.com/holepunchto/bare-repl) (through `npm:bare-node-repl)`
* `tty`: [`bare-tty`](https://github.com/holepunchto/bare-tty) (through `npm:bare-node-tty)`
* `url`: [`bare-url`](https://github.com/holepunchto/bare-url) (through `npm:bare-node-url)`

## Config for the Node.js stdlib

To get the full Node.js compatible layer that Bare currently supports add the following lines to the package.json file.

```json
{
  "dependencies": {
    "bare-subprocess": "^2.0.4",
    "child_process": "npm:bare-node-child-process",
    "bare-console": "^4.1.0",
    "console": "npm:bare-node-console",
    "bare-events": "^2.2.0",
    "events": "npm:bare-node-events",
    "bare-fs": "^2.1.5",
    "fs": "npm:bare-node-fs",
    "bare-http1": "^2.0.3",
    "http": "npm:bare-node-http",
    "bare-inspector": "^1.1.2",
    "inspector": "npm:bare-node-inspector",
    "bare-os": "^2.2.0",
    "os": "npm:bare-node-os",
    "bare-path": "^2.1.0",
    "path": "npm:bare-node-path",
    "bare-process": "^1.3.0",
    "process": "npm:bare-node-process",
    "bare-readline": "^1.0.0",
    "readline": "npm:bare-node-readline",
    "bare-repl": "^1.0.3",
    "repl": "npm:bare-node-repl",
    "bare-tty": "^3.2.0",
    "tty": "npm:bare-node-tty",
    "bare-url": "^1.0.7",
    "url": "npm:bare-node-url"
  }
}
```
## Example

### Support for 'fs'

Simply add the following lines in the package.json file for using 'fs' in a Bare Application.

```json
{
  "dependencies": {
    "bare-fs": "^2.1.5",
    "fs": "npm:bare-node-fs"
  }
}
```

Firstly, install `bare-fs` newer than `^2.1.5`.
Then, alias `fs` to the wrapper `npm:bare-node-fs`.

The only thing the wrapper does is `module.exports = require('bare-fs')` and at version `*`,
meaning the version that is specified is used.

Using the wrapper saves space as npm will only include `bare-fs` once if something else installs it.

## Using import maps

When writing a module that uses `fs` the mapping can be specified directly in the module instead of relying on the compatible. This can be achieved using an 'import map'.

For example [Localdrive](https://github.com/holepunchto/localdrive) uses `fs` and to work in both Bare and Node.js it adds the following import map
to the package.json file.

```json
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
  "optionalDependencies": {
    "bare-fs": "^2.1.5"
  }
}
```

This way the module is in full control of exactly which version of `fs` is bound to Bare.

This is the best option, as it provides the best of both worlds. Node.js compatibility, but with full control of the dependencies.

