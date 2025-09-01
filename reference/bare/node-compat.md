# Node.js Compatibility with Bare
Bare offers great compatibility with Node.js counterparts.
Most of the modules and APIs used by developers are covered and supported.

## Currently supported modules
* `assert`: [`bare-assert`](https://github.com/holepunchto/bare-assert) (through `npm:bare-node-assert)`
* `buffer`: [`bare-buffer`](https://github.com/holepunchto/bare-buffer) (through `npm:bare-node-buffer)`
* `child_process`: [`bare-subprocess`](https://github.com/holepunchto/bare-subprocess) (through `npm:bare-node-child-process)`
* `console`: [`bare-console`](https://github.com/holepunchto/bare-console) (through `npm:bare-node-console)`
* `crypto`: [`bare-crypto`](https://github.com/holepunchto/bare-crypto) (through `npm:bare-node-crypto)`
* `events`: [`bare-events`](https://github.com/holepunchto/bare-events) (through `npm:bare-node-events)`
* `fs`: [`bare-fs`](https://github.com/holepunchto/bare-fs) (through `npm:bare-node-fs)`
* `http`: [`bare-http1`](https://github.com/holepunchto/bare-http1) (through `npm:bare-node-http)`
* `https`: [`bare-https`](https://github.com/holepunchto/bare-https) (through `npm:bare-node-https)`
* `inspector`: [`bare-inspector`](https://github.com/holepunchto/bare-inspector) (through `npm:bare-node-inspector)`
* `module`: [`bare-module`](https://github.com/holepunchto/bare-module) (through `npm:bare-node-module)`
* `os`: [`bare-os`](https://github.com/holepunchto/bare-os) (through `npm:bare-node-os)`
* `path`: [`bare-path`](https://github.com/holepunchto/bare-path) (through `npm:bare-node-path)`
* `process`: [`bare-process`](https://github.com/holepunchto/bare-process) (through `npm:bare-node-process)`
* `readline`: [`bare-readline`](https://github.com/holepunchto/bare-readline) (through `npm:bare-node-readline)`
* `repl`: [`bare-repl`](https://github.com/holepunchto/bare-repl) (through `npm:bare-node-repl)`
* `stream`: [`bare-stream`](https://github.com/holepunchto/bare-stream) (through `npm:bare-node-stream)`
* `timers`: [`bare-timers`](https://github.com/holepunchto/bare-timers) (through `npm:bare-node-timers)`
* `tls`: [`bare-tls`](https://github.com/holepunchto/bare-tls) (through `npm:bare-node-tls)`
* `tty`: [`bare-tty`](https://github.com/holepunchto/bare-tty) (through `npm:bare-node-tty)`
* `url`: [`bare-url`](https://github.com/holepunchto/bare-url) (through `npm:bare-node-url)`
* `util`: [`bare-utils`](https://github.com/holepunchto/bare-utils) (through `npm:bare-node-util)`
* `worker_threads`: [`bare-worker`](https://github.com/holepunchto/bare-worker) (through `npm:bare-node-worker-threads)`
* `zlib`: [`bare-zlib`](bhttps://github.com/holepunchto/bare-zlib) (through `npm:bare-node-zlib)`

## Config for the Node.js stdlib

To get the full Node.js compatible layer that Bare currently supports add the following lines to the package.json file.

```json
{
  "dependencies": {
    "bare-assert": "^1.0.1",
    "assert": "npm:bare-node-assert",
    "bare-buffer": "^2.3.0",
    "buffer": "npm:bare-node-buffer",
    "bare-subprocess": "^2.0.4",
    "child_process": "npm:bare-node-child-process",
    "bare-console": "^4.1.0",
    "console": "npm:bare-node-console",
    "bare-crypto": "^1.0.0",
    "crypto": "npm:bare-node-crypto",
    "bare-events": "^2.2.0",
    "events": "npm:bare-node-events",
    "bare-fs": "^2.1.5",
    "fs": "npm:bare-node-fs",
    "bare-http1": "^2.0.3",
    "http": "npm:bare-node-http",
    "bare-https": "^1.0.0",
    "https": "npm:bare-node-https",
    "bare-inspector": "^1.1.2",
    "inspector": "npm:bare-node-inspector",
    "bare-module": "^1.2.5",
    "module": "npm:bare-node-module",
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
    "bare-stream": "^1.0.0",
    "stream": "npm:bare-node-stream",
    "bare-timers" : "^1.0.0",
    "timers": "npm:bare-node-timers",
    "bare-tls": "^1.0.0",
    "tls": "npm:bare-node-tls",
    "bare-tty": "^3.2.0",
    "tty": "npm:bare-node-tty",
    "bare-url": "^1.0.7",
    "url": "npm:bare-node-url",
    "bare-utils": "^1.0.0",
    "util": "npm:bare-node-util",
    "bare-worker": "^1.0.0",
    "worker_threads": "npm:bare-node-worker-threads",
    "bare-zlib": "^1.0.0",
    "zlib": "npm:bare-node-zlib"
  }
}
```
## Consuming dependencies that use core Node.js modules

If the project dependencies use core [Node.js](https://nodejs.org/en/download) modules, use [NPM aliases](./nodejs-compatibility-with-bare.md#consuming-dependencies-using-npm-aliases) or [import maps](./nodejs-compatibility-with-bare.md#consuming-dependencies-using-import-maps)  to consume the Bare version of those modules. 




### Consuming dependencies using NPM Aliases

NPM aliasing is a feature that allows developers to define custom names, or aliases, for their dependencies. This enables them to use a more intuitive or project-specific naming convention instead of relying on the package’s official name.

In your project’s `package.json` file, use the `alias` field to specify package aliases. For example:

```json
{
  "dependencies": {
    "my-package": "npm:actual-package@1.0.0"
  }
}
```

After defining aliases, install the dependencies as usual:

```bash
npm install
```

Then, in the code import the aliased package:

```js
// Instead of using the name of the package, use the alias
const myPackage = require('my-package');
```

### Example of using `fs` in a project using aliases

> Make sure [Node.js](https://nodejs.org/en/download) is installed on your system. This can be checked by running `node -v` in the terminal.

#### Start a new project

Init a new terminal project.

```bash
mkdir test-fs
cd test-fs
pear init --yes --type=terminal
```

Replace the contents of `index.js` with the following:

```js
import * as fs from 'node:fs';

async function test() {
  try {
    await fs.promises.writeFile('test.txt', `Hello ${global.Bare ? 'Bare' : 'Node'}`);
    const content = await fs.promises.readFile('test.txt', 'utf8');
    console.log('File content:', content);
    await fs.promises.unlink('test.txt');
    console.log('Test successful!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
```

This will create a file called `test.txt` and write a string to it. It will then read the file and log the content to the console.


Now run the file using Node.js.

```bash
node index.js
```

This should output the following.

```bash
File content: Hello Node 
Test successful!
```

If we run the same project using Bare, it will fail with the `MODULE_NOT_FOUND` error.

Now to make it compatible with Bare, we will create an alias for `fs` in our project and install the respective Bare package to make it work again. In this case it's [bare-fs](https://github.com/holepunchto/bare-fs).

Add the following lines to the `package.json` file.

```json
{
  "dependencies": {
    "bare-fs": "^2.1.5",
    "fs": "npm:bare-node-fs"
  }
}
```

This installs `bare-fs` newer than `^2.1.5`.
Then, adds alias `fs` to the wrapper `npm:bare-node-fs`.

The only thing the wrapper does is `module.exports = require('bare-fs')` and at version `*`,
meaning the version that is specified is used.

Using the wrapper saves space as npm will only include `bare-fs` once if something else installs it.

Now install the dependencies.

```bash
npm install
```

Now run the project using Bare.

```bash
bare index.js
```

This should output the following.

```bash
File content: Hello Bare
Test successful!
```

### Consuming dependencies using Import Maps

When writing a module that uses `fs` the mapping can be specified directly in the module instead of relying on the compatible. This can be achieved using an 'import map'.

For example [Localdrive](https://github.com/holepunchto/localdrive) uses `fs` and to work in both Bare and Node.js it adds the following import map to the `package.json` file.

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

Let's take the `fs` example and use import maps instead of aliases.

### Example of using `fs` in a project using import maps

Start a new terminal project

```bash
mkdir test-fs
cd test-fs
pear init --yes --type=terminal
```

Replace contents of `index.js` with the code from the NPM aliases [example](./nodejs-compatibility-with-bare.md#example-of-using-fs-in-a-project-using-aliases).

Change the import statement at the top:

```js
import * as fs from 'fs';
```

Add the following fields to the `package.json`:


```json
{
  "imports": {
    "fs": {
      "bare": "bare-fs",
      "default": "fs"
    }
  },
  "optionalDependencies": {
    "bare-fs": "^2.1.5"
  }
}
```

Install the dependencies:

```bash
npm install
```

Now run the file using Node.js.

```bash
node index.js
```

This should output the following.

```bash
File content: Hello Node 
Test successful!
```

Run the same file using Bare

```bash
bare index.js
```

It should log the following output:
```bash
File content: Hello Bare 
Test successful!
```


This way the module is in full control of exactly which version of `fs` is bound to Bare.

This is the best option, as it provides the best of both worlds. Node.js compatibility, but with full control of the dependencies.



