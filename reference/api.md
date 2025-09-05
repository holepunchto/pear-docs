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

#### `Pear.app.key <Object|null>`

The `config.key` object holds both Hexadecimal and Z-Base-32 encodings of the key, and is of the form `{ z32: <String>, hex: <String> }`,

#### `Pear.app.dev <Boolean>`

Whether the application is in development mode.

#### `Pear.app.storage <String>`

Application storage path

#### `Pear.app.name <String>`

Application name

#### `Pear.app.main <String>`

Application entry file

#### `Pear.app.channel <String|null>`

Application release/staging channel.

#### `Pear.app.options <Object>`

Configuration options.
The `pear` configuration object as supplied via an applications `package.json` file.

**References**

* [Configuration](./configuration.md)

#### `Pear.app.env <Object>`

The environment variables that an application was started with, as key-value pairs in an object.

#### `Pear.app.cwd <String>`

The current working directory that an application was started from.

#### `Pear.app.flags <Object>`

Parsed command-line flag values as supplied when an application was started.

#### `Pear.app.tools <Boolean>`

Indicates whether or not Devtools is enabled.

#### `Pear.app.watch <Boolean>`

Indicates whether or not Watch-Reload functionality is enabled.

#### `Pear.app.storage <String>`

Application storage path.

#### `Pear.app.args <Array>`

Command-line application arguments passed like `pear run --dev . --some arg`.

#### `Pear.app.release <Number>`

The current release length as marked by the `pear release` command.

**References**

* [`pear release`](./cli.md)

#### `Pear.app.link <String>`

Pear application link. Can be a `pear://` link or a local directory.

Can include a fragment link eg. `pear://link#fragment`.

**References**
* [Pear.app.linkData](#pearconfiglinkdata-string)
* [`pear run`](./cli.md)

#### `Pear.app.links <Object|Array>`

Holds trusted Pear application links and domains as specified in the `links` field inside `package.json`.

**References**
* [pear.links](./configuration.md#pearlinks-objectarray)
* [`pear run`](./cli.md)

#### `Pear.app.linkData <String>`

Holds just the data portion of a Pear link.

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**

* [Pear.app.link](#pearconfiglink-string)
* [`pear run`](./cli.md)

#### `Pear.app.checkpoint <Any>`

Holds state as set by `Pear.checkpoint()`. When an application restarts it will hold the most recent value passed to `Pear.checkpoint()`.

Stores state that will be available as `Pear.app.checkpoint` next time the application starts.

The `Pear.app.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.checkpoint()](#pear-checkpoint-any)

#### `Pear.app.release <Integer>`

Application release sequence integer.

#### `Pear.app.flags <Object>`

Parsed runtime flags. For internal/advanced use.

#### `Pear.app.applink <String>`

Pear application link. May be a `pear://` link or a local directory.
Can also include entrypoint and fragment eg. `pear://link#fragment`.

#### `Pear.app.dir <String>`

Root directory of project.

#### `Pear.app.pearDir <String>`

Directory for Pear runtime.

#### `Pear.app.dht.nodes <Array<Object>>`

A list of known [DHT](../../building-blocks/hyperdht.md) nodes of the form `{ host: <String>, port: <Number> }`. The nodes are set when the Pear application is started.

Unless started with a custom set of bootstrap nodes, Pear caches known nodes to speed up connecting to the swarm and to make it more resilient.

#### `Pear.app.dht.bootstrap <Array<Object>>`

A list of custom bootstrap nodes Pear is started with of the form `{ host: <String>, port: <Number> }`.

### `Pear.checkpoint(<Any>) => Promise`

Stores state that will be available as `Pear.app.checkpoint` next time the application starts.

The `Pear.app.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.app.checkpoint](#pear--config-checkpoint-any)

### `Pear.teardown(fn <Async Function|Function>)`

Register application clean-up handlers to be called when an application begins to unload.

May be called multiple times to register multiple teardown handlers.

Functions supplied to teardown will be executed in order of registration when
an application begins to unload. Any promise returned from each supplied function
will be waited upon until resolution before calling the next teardown handler.

### `Pear.argv`

The command line arguments passed to the process when launched.

### `Pear.pid`

The ID of the current process.

### `Pear.exitCode`

The code that will be returned once the process exits. If the process is exited using `Bare.exit()` without specifying a code, `Bare.exitCode` is used.

### `Pear.exit(code)` 

Exits the process with the provided exit code. Follows Pear teardown flow, whereas `Bare.exit()` does not.

### `Pear.restart()`  <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-restart`](https://github.com/holepunchto/pear-restart).

  static RTI = global.Pear?.constructor.RTI ?? null
  static IPC = kIPC
  static RUNTIME = RUNTIME
  static RUNTIME_ARGV = []
  static set COMPAT (compat) {
    if (compat) Pear.app.tier = Pear.app.key ? 'production' : 'dev'
    return (COMPAT = compat)
  }

  static get COMPAT () { return COMPAT }
  static CUTOVER = true

### `Pear.config <Object>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`Pear.app`](#pear-app).

### `Pear.messages([ pattern ], [ listener ]) -> Iterable` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-messages`](https://github.com/holepunchto/pear-messages).

### `await Pear.message(<Object>)` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-message`](https://github.com/holepunchto/pear-message).

### `Pear.worker <Object>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-run`](https://github.com/holepunchto/pear-run) & [`pear-pipe`](https://github.com/holepunchto/pear-pipe).

Deprecated. Use [`pear-pipe`](https://github.com/holepunchto/pear-pipe).

### `Pear.media <Object>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-electron ui.media`](https://github.com/holepunchto/pear-electron#uimedia-object).

### `Pear.versions <Async Function>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-versions`](https://github.com/holepunchto/pear-versions).

### `Pear.reload()` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use `location.reload()` in Desktop apps. No reload in terminal apps.

### `Pear.updates(listener <Async Function|Function>) => streamx.Readable` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-updates`](https://github.com/holepunchto/pear-updates).

### `const update = await Pear.updated()` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. No-op. Do not use.

### `Pear.wakeups(listener <Async Function|Function>) => streamx.Readable` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-updates`](https://github.com/holepunchto/pear-wakeups).

### `Pear.badge(count <Integer|null>) => Promise<Boolean>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-electron ui.app.badge()`](https://github.com/holepunchto/pear-electron#const-success--await-appbadgecount-integernull).

### `Pear.tray(options <Object>, listener <Async Function|Function>) => Promise<untray()>` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-electron ui.app.tray()`](https://github.com/holepunchto/pear-electron#const-untray--await-apptrayoptions-object-listener-function).

### `const win = new Pear.Window(entry <String>, options <Object>)` <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-electron ui.Window`](https://github.com/holepunchto/pear-electron#const-win--new-uiwindowentry-string-options-object).

### `const view = new Pear.View(options <Object>)`  <mark style="background-color: #ffffa2;">**deprecated**</mark>

Deprecated. Use [`pear-electron ui.View`](https://github.com/holepunchto/pear-electron#const-view--new-uiviewoptions-object).

## `global.Bare` <a name="bare"></a>

<mark style="background-color: #8484ff;">**stable**</mark>

The core JavaScript API of Bare is available through the global `Bare` namespace.

The `Bare` API is designed to be as minimal as possible.

The majority of capabilities are supplied via [Bare Modules](../README.md#bare-modules).

### `Bare.platform`

The identifier of the operating system for which Bare was compiled. The possible values are `android`, `darwin`, `ios`, `linux`, and `win32`.

### `Bare.arch`

The identifier of the processor architecture for which Bare was compiled. The possible values are `arm`, `arm64`, `ia32`, `mips`, `mipsel`, and `x64`.

### `Bare.simulator`

Whether or not Bare was compiled for a simulator.

### `Bare.argv`

The command line arguments passed to the process when launched.

### `Bare.pid`

The ID of the current process.

### `Bare.exitCode`

The code that will be returned once the process exits. If the process is exited using `Bare.exit()` without specifying a code, `Bare.exitCode` is used.

### `Bare.suspended`

Whether or not the process is currently suspended.

### `Bare.exiting`

Whether or not the process is currently exiting.

### `Bare.version`

The Bare version string.

### `Bare.versions`

An object containing the version strings of Bare and its dependencies.

### `Bare.exit([code])`

Immediately terminate the process or current thread with an exit status of `code` which defaults to `Bare.exitCode`.

### `Bare.suspend([linger])`

Suspend the process and all threads. This will emit a `suspend` event signalling that all work should stop immediately. When all work has stopped and the process would otherwise exit, an `idle` event will be emitted. If the process is not resumed from an `idle` event listener, the loop will block until the process is resumed.

### `Bare.idle()`

Immediately suspend the event loop and trigger the `idle` event.

### `Bare.resume()`

Resume the process and all threads after suspension. This can be used to cancel suspension after the `suspend` event has been emitted and up until all `idle` event listeners have run.

### `Bare.on('uncaughtException', err)`

Emitted when a JavaScript exception is thrown within an execution context without being caught by any exception handlers within that execution context. By default, uncaught exceptions are printed to `stderr` and the processes aborted. Adding an event listener for the `uncaughtException` event overrides the default behavior.

### `Bare.on('unhandledRejection', reason, promise)`

Emitted when a JavaScript promise is rejected within an execution context without that rejection being handled within that execution context. By default, unhandled rejections are printed to `stderr` and the process aborted. Adding an event listener for the `unhandledRejection` event overrides the default behavior.

### `Bare.on('beforeExit', code)`

Emitted when the loop runs out of work and before the process or current thread exits. This provides a chance to schedule additional work and keep the process from exiting. If additional work is scheduled, `beforeExit` will be emitted again once the loop runs out of work.

If the process is exited explicitly, such as by calling `Bare.exit()` or as the result of an uncaught exception, the `beforeExit` event will not be emitted.

### `Bare.on('exit', code)`

Emitted before the process or current thread terminates. Additional work must not be scheduled from an `exit` event listener. If the process is forcefully terminated from an `exit` event listener, the remaining listeners will not run.

### `Bare.on('teardown')`

Emitted after the process or current thread has terminated and before the JavaScript environment is torn down. Additional work must not be scheduled from a `teardown` event listener. Bare itself will register `teardown` event listeners to join dangling threads and unload native addons.

> [!IMPORTANT]
>
> ##### Teardown ordering
>
> `teardown` listeners **SHOULD** be prepended to have the listeners run in last in, first out order:
>
> ```js
> Bare.prependListener('teardown', () => { ... })
> ```

### `Bare.on('suspend', linger)`

Emitted when the process or current thread is suspended. Any in-progress or outstanding work, such as network activity or file system access, should be deferred, cancelled, or paused when the `suspend` event is emitted and no additional work should be scheduled.

### `Bare.on('idle')`

Emitted when the process or current thread becomes idle after suspension. After all handlers have run, the event loop will block and no additional work be performed until the process is resumed. An `idle` event listener may call `Bare.resume()` to cancel the suspension.

### `Bare.on('resume')`

Emitted when the process or current thread resumes after suspension. Deferred and paused work should be continued when the `resume` event is emitted and new work may again be scheduled.

## `Bare.Addon`

The `Bare.Addon` namespace provides support for loading native addons, which are typically written in C/C++ and distributed as shared libraries.

### `const addon = Addon.load(url[, options])`

Load a static or dynamic native addon identified by `url`. If `url` is not a static native addon, Bare will instead look for a matching dynamic object library.

Options are reserved.

### `const unloaded = Addon.unload(url[, options])`

Unload a dynamic native addon identified by `url`. If the function returns `true`, the addon was unloaded from memory. If it instead returns `false`, the addon is still in use by one or more threads and will only be unloaded from memory when those threads either exit or explicitly unload the addon.

Options are reserved.

### `const url = Addon.resolve(specifier, parentURL[, options])`

Resolve a native addon specifier by searching for a static native addon or dynamic object library matching `specifier` imported from `parentURL`.

Options are reserved.

## `Bare.Thread`

The `Bare.Thread` provides support for lightweight threads. Threads are similar to workers in Node.js, but provide only minimal API surface for creating and joining threads.

### `Thread.isMainThread`

`true` if the current thread is the main thread.

### `Thread.self`

A reference to the current thread as a `ThreadProxy` object. Will be `null` on the main thread.

### `Thread.self.data`

A copy of or, if shared, reference to the `data` buffer that was passed to the current thread on creation. Will be `null` if no buffer was passed.

### `const thread = new Thread([filename][, options][, callback])`

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

### `const thread = Thread.create([filename][, options][, callback])`

Convenience method for the `new Thread()` constructor.

### `thread.joined`

Whether or not the thread has been joined with the current thread.

### `thread.join()`

Block and wait for the thread to exit.

### `thread.suspend([linger])`

Suspend the thread. Equivalent to calling `Bare.suspend()` from within the thread.

### `thread.resume()`

Resume the thread. Equivalent to calling `Bare.resume()` from within the thread.
