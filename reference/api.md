# Application Programming Interface (API)

Pear is built on [Bare](https://github.com/holepunchto/bare). Pear applications have a `global.Pear` object and a`global.Bare` object.

* [global.Pear](#pear)
* [global.Bare](#bare)

## `global.Pear` <a name="pear"></a>

<mark style="background-color: #8484ff;">**stable**</mark>

The Pear Platform API is made available globally as `Pear`.

The `Pear` API is designed to be as minimal as possible. 

The majority of capabilities are supplied via [Pear Modules](../README.md#pear-modules).

### `Pear.app <Object>` <a name="#pear-app"></a>

Contains application information. Supersedes `Pear.config`.

#### `Pear.app.key <Buffer|null>` <a name="pear-app-key"></a>

A buffer of the application key. If running from disk, `Pear.app.key` is null.

#### `Pear.app.length <Integer>` <a name="pear-app-length"></a>

The application drive length. The application version consists of `Pear.app.key`, `Pear.app.length` and `Pear.app.fork`.

#### `Pear.app.fork <Integer>` <a name="pear-app-fork"></a>

The application drive fork count. A fork is where the append-only log of the drive is truncated.

The application version consists of `Pear.app.key`, `Pear.app.length` and `Pear.app.fork`.

#### `Pear.app.alias <String|null>` <a name="pear-app-alias"></a>

Given an application that is run from a pear:// link with an alias it, contains that alias.
For example the `Pear.app.alias` for `pear run pear://keet` would be `keet`.

#### `Pear.app.dev <Boolean>` <a name="pear-app-dev"></a>

Whether the application is in development mode.

Note that development mode means, the application has been run with the `--dev` flag.

Development mode is not the same as development environment. Development environment equates to running from disk.

For example, to detect both development mode & environment:

```js
const fromDisk = Pear.app.key === null
const isDev = fromDisk && Pear.app.dev
```

#### `Pear.app.name <String>` <a name="pear-app-name"></a>

Application name.

#### `Pear.app.main <String>` <a name="pear-app-main"></a>

Application entry file.

#### `Pear.app.channel <String|null>` <a name="pear-app-channel"></a>

Application release/staging channel.

#### `Pear.app.storage <String>` <a name="pear-app-storage"></a>

Application storage path

#### `Pear.app.options <Object>` <a name="pear-app-options"></a>

Configuration options.
The `pear` configuration object as supplied via an applications `package.json` file.

**References**

* [Configuration](./configuration.md)

#### `Pear.app.env <Object>` <a name="pear-app-env"></a>

The environment variables that an application was started with, as key-value pairs in an object.

#### `Pear.app.flags <Object>` <a name="pear-app-flags"></a>

Parsed command-line flag values as supplied when an application was started.

#### `Pear.app.checkout <String>` <a name="pear-app-checkout"></a>

The value of the [`pear run --checkout`](./cli.md#pear-run) flag. Same as [`Pear.app.flags.checkout`](#pear-app-checkout).

**References**

* [`pear run`](./cli.md#pear-run)
* [`Pear.app.flags`](./#pear-app-flags)

#### `Pear.app.storage <String>` <a name="pear-app-storage"></a>

Application storage path.

#### `Pear.app.args <Array>` <a name="pear-app-args"></a>

Command-line application arguments passed like `pear run --dev . --some arg`.

#### `Pear.app.release <Number>` <a name="pear-app-release"></a>

The current release length as marked by the `pear release` command.

**References**

* [`pear release`](./cli.md#pear-release)

#### `Pear.app.link <String>` <a name="pear-app-link"></a>

The link that was passed to `pear run` with alias resolved to key.

Includes any potential pathname, query or fragment.

**References**

* [`pear run`](./cli.md)

#### `Pear.app.links <Object|Array>` <a name="pear-app-links"></a>

Holds trusted Pear application links and domains as specified in the `links` field inside `package.json`.

**References**
* [pear.links](./configuration.md#pear-links)
* [`pear run`](./cli.md#pear-run)

#### `Pear.app.routes <String>` <a name="pear-app-routes"></a>

The configuration provided [`pear.routes`](./configuration.md#pear-routes) mapping object.

#### `Pear.app.entrypoint <String>` <a name="pear-app-entrypoint"></a>

The link pathname (`pear://<key>/<pathname>`), after any route mappings have been applied per [`pear.routes`](./configuration.md#pear-routes).

Includes the leading `/`, e.g given `pear://foo/bar/baz`, `Pear.app.entrypoint` would be `/bar/baz`.

Only `Pear.app.entrypoint` supports route-mapping via the [`pear.routes`](./configuration.md#pear-routes) mapping object. `Pear.app.route` is provides access the raw pathname, including the leading slash (`/`), while `Pear.app.linkData` is legacy, excludes the slash, but is still supported.

* [`Pear.app.route`](#pear-app-entrypoint)
* [`Pear.app.routes`](#pear-app-routes)
* [`pear.routes`](./configuration.md#pear-routes)

#### `Pear.app.fragment <String>` <a name="pear-app-fragment"></a>

The link hash, without the leading `#`.

Given `pear://<key>/<pathname>#frag` `Pear.app.fragment` would be `frag`.

#### `Pear.app.query <String>` <a name="pear-app-query"></a>

The link query string, without the leading `?`.

Given `pear://<key>/<pathname>?qs` `Pear.app.query` would be `qs`.

#### `Pear.app.route <String>` <a name="pear-app-route"></a>

The link pathname (`pear://<key>/<pathname>`), prior to any route mappings being applied.

Includes the leading `/`, e.g given `pear://foo/bar/baz`, `Pear.app.route` would be `/bar/baz`.

**References**

* [`Pear.app.entrypoint`](#pear-app-entrypoint)
* [`Pear.app.routes`](#pear-app-routes)
* [`pear.routes`](./configuration.md#pear-routes)

#### `Pear.app.linkData <String>` <a name="pear-app-linkData"></a>

Holds just the data portion of a Pear link.

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

Unlike `Pear.app.route` and `Pear.app.entrypoint` *does not* include the leading slash (`/`).

Legacy but still supported. Prefer `Pear.app.entrypoint` or `Pear.app.route`.

**References**

* [`Pear.app.entrypoint`](#pear-app-entrypoint)
* [`Pear.app.route`](#pear-app-route)
* [Pear.app.link](#pear-app-link)
* [`pear run`](./cli.md#pear-run)

#### `Pear.app.checkpoint <Any>` <a name="pear-app-checkpoint"></a>

Holds state as set by `Pear.checkpoint()`. When an application restarts it will hold the most recent value passed to `Pear.checkpoint()`.

Stores state that will be available as `Pear.app.checkpoint` next time the application starts.

The `Pear.app.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.checkpoint()](#pear-checkpoint-any)

#### `Pear.app.release <Integer>` <a name="pear-app-release"></a>

Application release sequence integer.

#### `Pear.app.flags <Object>` <a name="pear-app-flags"></a>

Parsed `pear run` flags.

#### `Pear.app.applink <String>`  <a name="pear-app-applink"></a>

Pear application link. May be a `pear://` link or a local directory.

#### `Pear.app.dir <String>`  <a name="pear-app-dir"></a>

The current working directory of `pear run` when the application was started.

#### `Pear.app.dht.nodes <Array<Object>>` <a name="pear-app-dht-nodes"></a>

A list of known [DHT](../../building-blocks/hyperdht.md) nodes of the form `{ host: <String>, port: <Number> }`. The nodes are set when the Pear application is started.

Unless started with a custom set of bootstrap nodes, Pear caches known nodes to speed up connecting to the swarm and to make it more resilient.

#### `Pear.app.dht.bootstrap <Array<Object>>`  <a name="pear-app-dht-bootstrap"></a>

A list of custom bootstrap nodes Pear is started with of the form `{ host: <String>, port: <Number> }`.

#### `Pear.app.assets  <String>` <a name="pear-app-assets"></a>

Advanced / integration purposes.

Per [`pear-assets`](./configuration.md#pear-assets) configuration assets are fetched and stored to disk. Use `Pear.app.assets[namespace].path` to get the path that given asset is stored to.

Takes the form `{ [namespace]: { link <String>, ns <String>, path <String>, name <String>, only <Array<String>>, bytes <Integer> } }`. `namespace` is per the property name on the assets object. By convention, should be describe the asset type, for example: `ui`.

* `link` - Configuration supplied `pear://<fork>.<length>.<key>` 
* `ns` - Namespace - same as the property name
* `path` - The path that Pear stored the asset to on-disk
* `name` - Configuration supplied name
* `only` - Configuration supplied only array
* `bytes` - The total bytes used by asset on-disk

Example:

```js
{
  "ui": {
    "link": "pear://0.940.cktxzetiwt6un3ado5kgqedge6ya4nfazjckzq76zcapefwxakdy",
    "ns": "ui",
    "path": "/Users/xxx/Library/Application Support/pear/assets/0c82035d08c00ae4da2f307eb5d2c1fd",
    "name": "Pear Runtime",
    "only": [
      "/boot.bundle",
      "/by-arch/%HOST%",
      "/prebuilds/%HOST%"
    ],
    "bytes": 259158801
  }
}
```

#### `Pear.app.prerunning <Boolean>` <a name="pear-app-prerunning"></a>

Whether the current application is a [`pre`](./configuration.md#pear-pre) script.

#### `Pear.app.startId <String>` <a name="pear-app-startid"></a>

Advanced. Integration purposes.

The application start identifier. Can be used to register a [`pear-ipc`](https://github.com/holepunchto/pear-ipc) client to an applicaiton, with
`ipc.identify()`

#### `Pear.app.swapDir <String>` <a name="pear-app-swapdir"></a>

Advanced. Integration purposes.

The active swap directory with Pear platform directory.

#### `Pear.app.pearDir <String>` <a name="pear-app-peardir"></a>

Advanced. Integration purposes.

Pear platform directory.

### `Pear.checkpoint(<Any>) => Promise` <a name="pear-checkpoint"></a>

Stores state that will be available as `Pear.app.checkpoint` next time the application starts.

The `Pear.app.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.app.checkpoint](#pear--config-checkpoint-any)

### `Pear.teardown(fn <Async Function|Function>)` <a name="pear-teardown"></a>

Register application clean-up handlers to be called when an application begins to unload.

May be called multiple times to register multiple teardown handlers.

Functions supplied to teardown will be executed in order of registration when
an application begins to unload. Any promise returned from each supplied function
will be waited upon until resolution before calling the next teardown handler.

### `Pear.argv` <a name="pear-argv"></a>

The command line arguments passed to the process when launched.

### `Pear.pid` <a name="pear-pid"></a>

The ID of the current process.

### `Pear.exitCode` <a name="pear-exitcode"></a>

The code that will be returned once the process exits. If the process is exited using `Bare.exit()` without specifying a code, `Bare.exitCode` is used.

### `Pear.exit(code)` <a name="pear-exit"></a>

Exits the process with the provided exit code. Follows Pear teardown flow, whereas `Bare.exit()` does not.

### `Pear.constructor.CUTOVER` (Integration)

> NOTE: Integration APIs may change.

For auto-cutover opt-out do `Pear.constructor.CUTOVER = false` in the first-tick.

Cutover signals the end of the application init phase and instructs sidecar to stop buffering critical streams, such as updates.

This stops an internal `ipc.cutover` call to the sidecar, indicating that a manual call will be made later which in turn allows child processes to listen to critical streams without any data loss but the onus is then on child process to call cutover in order free resources in the sidecar.

### `Pear.constructor.COMPAT` (Integration)

> NOTE: Integration APIs may change.

Compat-mode opt-in. See [./migration.md#compat-mode]

### `Pear.constructor.RTI` (Integration)

> NOTE: Integration APIs may change.

Runtime Information. Used by additional runtimes to bootstrap runtime state at boot. Used by [`pear-run`](https://github.com/holepunchto/pear-run).

### `Pear.constructor.IPC` (Integration)

> NOTE: Integration APIs may change.

Symbol for accessing built-in IPC client. Used by libraries and other integrations.

```js
const ipc = Pear[Pear.constructor.IPC]
```

### `Pear.constructor.RUNTIME` (Integration)

> NOTE: Integration APIs may change.

The runtime binary to spawn when running. Used by [`pear-run`](https://github.com/holepunchto/pear-run). Useful for certain testing scenarios.

### `Pear.constructor.RUNTIME_ARGV` (Integration)

> NOTE: Integration APIs may change.

Used to modify argv passed spawn when running. Used by [`pear-run`](https://github.com/holepunchto/pear-run). Useful for certain testing scenarios.


### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.restart()`

Deprecated. Use [`pear-restart`](https://github.com/holepunchto/pear-restart).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.config <Object>`

Deprecated. Use [`Pear.app`](#pear-app).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.messages([ pattern ], [ listener ]) -> Iterable` 

Deprecated. Use [`pear-messages`](https://github.com/holepunchto/pear-messages).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `await Pear.message(<Object>)`

Deprecated. Use [`pear-message`](https://github.com/holepunchto/pear-message).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.worker <Object>`

Deprecated. Use [`pear-run`](https://github.com/holepunchto/pear-run) & [`pear-pipe`](https://github.com/holepunchto/pear-pipe).

Deprecated. Use [`pear-pipe`](https://github.com/holepunchto/pear-pipe).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.media <Object>`

Deprecated. Use [`pear-electron ui.media`](https://github.com/holepunchto/pear-electron#uimedia-object).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.versions <Async Function>`

Deprecated. Use [`pear-versions`](https://github.com/holepunchto/pear-versions).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.reload()`

Deprecated. Use `location.reload()` in Desktop apps. No reload in terminal apps.

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.updates(listener <Async Function|Function>) =>streamx.Readable` 

Deprecated. Use [`pear-updates`](https://github.com/holepunchto/pear-updates).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `const update = await Pear.updated()`

Deprecated. No-op. Do not use.

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.wakeups(listener <Async Function|Function>) =>streamx.Readable` 

Deprecated. Use [`pear-updates`](https://github.com/holepunchto/pear-wakeups).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.badge(count <Integer|null>) =>Promise<Boolean>` 

Deprecated. Use [`pear-electron ui.app.badge()`](https://github.com/holepunchto/pear-electron#const-success--await-appbadgecount-integernull).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `Pear.tray(options <Object>, listener <AsyncFunction|Function>) => Promise<untray()>` 

Deprecated. Use [`pear-electron ui.app.tray()`](https://github.com/holepunchto/pear-electron#const-untray--await-apptrayoptions-object-listener-function).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `const win = new Pear.Window(entry <String>, options<Object>)` 

Deprecated. Use [`pear-electron ui.Window`](https://github.com/holepunchto/pear-electron#const-win--new-uiwindowentry-string-options-object).

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `const view = new Pear.View(options <Object>)`

Deprecated. Use [`pear-electron ui.View`](https://github.com/holepunchto/pear-electron#const-view--new-uiviewoptions-object).

## `global.Bare` <a name="bare"></a>

<mark style="background-color: #8484ff;">**stable**</mark>

The core JavaScript API of Bare is available through the global `Bare` namespace.

The `Bare` API is designed to be as minimal as possible.

The majority of capabilities are supplied via [Bare Modules](../README.md#bare-modules).

### `Bare.platform` <a name="bare-platform"></a>

The identifier of the operating system for which Bare was compiled. The possible values are `android`, `darwin`, `ios`, `linux`, and `win32`.

### `Bare.arch` <a name="bare-arch"></a>

The identifier of the processor architecture for which Bare was compiled. The possible values are `arm`, `arm64`, `ia32`, `mips`, `mipsel`, and `x64`.

### `Bare.simulator` <a name="bare-simulator"></a>

Whether or not Bare was compiled for a simulator.

### `Bare.argv` <a name="bare-argv"></a>

The command line arguments passed to the process when launched.

### `Bare.pid` <a name="bare-pid"></a>

The ID of the current process.

### `Bare.exitCode` <a name="bare-exitcode"></a>

The code that will be returned once the process exits. If the process is exited using `Bare.exit()` without specifying a code, `Bare.exitCode` is used.

### `Bare.suspended` <a name="bare-suspended"></a>

Whether or not the process is currently suspended.

### `Bare.exiting` <a name="bare-exiting"></a>

Whether or not the process is currently exiting.

### `Bare.version` <a name="bare-version"></a>

The Bare version string.

### `Bare.versions` <a name="bare-versions"></a>

An object containing the version strings of Bare and its dependencies.

### `Bare.exit([code])` <a name="bare-exit"></a>

Immediately terminate the process or current thread with an exit status of `code` which defaults to `Bare.exitCode`.

### `Bare.suspend([linger])` <a name="bare-suspend"></a>

Suspend the process and all threads. This will emit a `suspend` event signalling that all work should stop immediately. When all work has stopped and the process would otherwise exit, an `idle` event will be emitted. If the process is not resumed from an `idle` event listener, the loop will block until the process is resumed.

### `Bare.idle()` <a name="bare-idle"></a>

Immediately suspend the event loop and trigger the `idle` event.

### `Bare.resume()` <a name="bare-resume"></a>

Resume the process and all threads after suspension. This can be used to cancel suspension after the `suspend` event has been emitted and up until all `idle` event listeners have run.

### `Bare.on('uncaughtException', err)` <a name="bare-on-uncaught-exception"></a>

Emitted when a JavaScript exception is thrown within an execution context without being caught by any exception handlers within that execution context. By default, uncaught exceptions are printed to `stderr` and the processes aborted. Adding an event listener for the `uncaughtException` event overrides the default behavior.

### `Bare.on('unhandledRejection', reason, promise)` <a name="bare-on-unhandled-rejection"></a>

Emitted when a JavaScript promise is rejected within an execution context without that rejection being handled within that execution context. By default, unhandled rejections are printed to `stderr` and the process aborted. Adding an event listener for the `unhandledRejection` event overrides the default behavior.

### `Bare.on('beforeExit', code)` <a name="bare-on-beforeexit"></a>

Emitted when the loop runs out of work and before the process or current thread exits. This provides a chance to schedule additional work and keep the process from exiting. If additional work is scheduled, `beforeExit` will be emitted again once the loop runs out of work.

If the process is exited explicitly, such as by calling `Bare.exit()` or as the result of an uncaught exception, the `beforeExit` event will not be emitted.

### `Bare.on('exit', code)` <a name="bare-on-exit"></a>

Emitted when the process or current thread exits. If the process is forcefully terminated from an `exit` event listener, the remaining listeners will not run.

> [!CAUTION]
> Additional work **MUST NOT** be scheduled from an `exit` event listener.

### `Bare.on('suspend', linger)` <a name="bare-on-suspend"></a>

Emitted when the process or current thread is suspended. Any in-progress or outstanding work, such as network activity or file system access, should be deferred, cancelled, or paused when the `suspend` event is emitted and no additional work should be scheduled.

### `Bare.on('idle')` <a name="bare-on-idle"></a>

Emitted when the process or current thread becomes idle after suspension. After all handlers have run, the event loop will block and no additional work be performed until the process is resumed. An `idle` event listener may call `Bare.resume()` to cancel the suspension.

### `Bare.on('resume')` <a name="bare-on-resume"></a>

Emitted when the process or current thread resumes after suspension. Deferred and paused work should be continued when the `resume` event is emitted and new work may again be scheduled.

## `Bare.Addon` <a name="bare-addon"></a>

The `Bare.Addon` namespace provides support for loading native addons, which are typically written in C/C++ and distributed as shared libraries.

### `const addon = Addon.load(url[, options])` <a name="bare-addon-load"></a>

Load a static or dynamic native addon identified by `url`. If `url` is not a static native addon, Bare will instead look for a matching dynamic object library.

Options are reserved.

### `const unloaded = Addon.unload(url[, options])` <a name="bare-addon-unload"></a>

Unload a dynamic native addon identified by `url`. If the function returns `true`, the addon was unloaded from memory. If it instead returns `false`, the addon is still in use by one or more threads and will only be unloaded from memory when those threads either exit or explicitly unload the addon.

Options are reserved.

### `const url = Addon.resolve(specifier, parentURL[, options])` <a name="bare-addon-resolve"></a>

Resolve a native addon specifier by searching for a static native addon or dynamic object library matching `specifier` imported from `parentURL`.

Options are reserved.

## `Bare.Thread` <a name="bare-thread"></a>

The `Bare.Thread` provides support for lightweight threads. Threads are similar to workers in Node.js, but provide only minimal API surface for creating and joining threads.

### `Thread.isMainThread` <a name="bare-thread-ismainthread"></a>

`true` if the current thread is the main thread.

### `Thread.self` <a name="bare-thread-self"></a>

A reference to the current thread as a `ThreadProxy` object. Will be `null` on the main thread.

### `Thread.self.data` <a name="bare-self-data"></a>

A copy of or, if shared, reference to the `data` buffer that was passed to the current thread on creation. Will be `null` if no buffer was passed.

### `const thread = new Thread([filename][, options][, callback])` <a name="bare-new-thread"></a>

Start a new thread that will run the contents of `filename`. If `callback` is provided, its function body will be treated as the contents of `filename` and invoked on the new thread with `Thread.self.data` passed as an argument.

Options include:

```js
{
  // Optional data to pass to the thread
  data: null,
  // Optional file source, will be read from `filename` if neither `source` nor `callback` are provided
  source: string | Buffer,
  // Optional source encoding if `source` is a string
  encoding: 'utf8',
  // Optional stack size in bytes, pass 0 for default
  stackSize: 0
}
```

### `const thread = Thread.create([filename][, options][, callback])` <a name="bare-thread-create"></a>

Convenience method for the `new Thread()` constructor.

### `thread.joined` <a name="bare-new-thread-joined"></a>

Whether or not the thread has been joined with the current thread.

### `thread.join()` <a name="bare-new-thread-join"></a>

Block and wait for the thread to exit.

### `thread.suspend([linger])` <a name="bare-new-thread-suspend"></a>

Suspend the thread. Equivalent to calling `Bare.suspend()` from within the thread.

### `thread.resume()` <a name="bare-new-thread-resume"></a>

Resume the thread. Equivalent to calling `Bare.resume()` from within the thread.
