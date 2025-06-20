# Application Programming Interface (API)

<mark style="background-color: #8484ff;">**experimental**</mark>

The Pear API enables applications to interact with Pear platform features.

Most application peer-to-peer functionality is provided by ecosystem modules rather than the API.

Platform APIs are unchangeable. Compatibility cannot break. So the Pear API surface aims to be (and remain)
as small as possible.

## `global.Pear`

The Pear Platform API is made available globally as `Pear`.

The `Pear` API is designed to be small and immutable.

Any future changes to the `Pear` API will be non-breaking additions.

## `Pear.config <Object>`

Contains application configuration data.

### `Pear.config.key <Object|null>`

The application key, `null` in development mode.
The `config.key` object holds both Hexadecimal and Z-Base-32 encodings of the key, and is of the form `{ z32: <String>, hex: <String> }`,

### `Pear.config.dev <Boolean>`

Application is local (loaded from disk).

Equivalent to `pear.config.key === null`.

### `Pear.config.tier <String>`

Runtime scenario (dev, staging or production)

### `Pear.config.storage <String>`

Application storage path

### `Pear.config.name <String>`

Application name

### `Pear.config.main <String>`

Application entry file

### `Pear.config.channel <String|null>`

Application release/staging channel, `null` in development mode.

### `Pear.config.options <Object>`

Configuration options.
The `pear` configuration object as supplied via an applications `package.json` file.

**References**

* [Configuration](./configuration.md)

### `Pear.config.env <Object>`

The environment variables that an application was started with, as key-value pairs in an object.

### `Pear.config.cwd <String>`

The current working directory that an application was started from.

### `Pear.config.flags <Object>`

Parsed command-line flag values as supplied when an application was started.

### `Pear.config.tools <Boolean>`

Indicates whether or not Devtools is enabled.

### `Pear.config.watch <Boolean>`

Indicates whether or not Watch-Reload functionality is enabled.

### `Pear.config.storage <String>`

Application storage path.

### `Pear.config.args <Array>`

Command-line application arguments passed like `pear run --dev . --some arg`.

### `Pear.config.release <Number>`

The current release length as marked by the `pear release` command.

**References**

* [`pear release`](./cli.md)

### `Pear.config.link <String>`

Pear application link. Can be a `pear://` link or a local directory.

Can include a fragment link eg. `pear://link#fragment`.

**References**
* [Pear.config.linkData](#pearconfiglinkdata-string)
* [`pear run`](./cli.md)

### `Pear.config.links <Object|Array>`

Holds trusted Pear application links and domains as specified in the `links` field inside `package.json`.

**References**
* [pear.links](./configuration.md#pearlinks-objectarray)
* [`pear run`](./cli.md)

### `Pear.config.linkData <String>`

Holds just the data portion of a Pear link.

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**

* [Pear.config.link](#pearconfiglink-string)
* [`pear run`](./cli.md)


### `Pear.config.checkpoint <Any>`

Holds state as set by `Pear.checkpoint()`. When an application restarts it will hold the most recent value passed to `Pear.checkpoint()`.

Stores state that will be available as `Pear.config.checkpoint` next time the application starts.

The `Pear.config.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.checkpoint()](#pear-checkpoint-any)

### `Pear.config.release <Integer>`

Application release sequence integer, `null` in development mode.

### `Pear.config.flags <Object>`

Parsed runtime flags. For internal/advanced use.

### `Pear.config.applink <String>`

Pear application link. May be a `pear://` link or a local directory.
Can also include entrypoint and fragment eg. `pear://link#fragment`.

### `Pear.config.dependencies <Object>`

Application dependencies.

### `Pear.config.dir <String>`

Root directory of project.

### `Pear.config.pearDir <String>`

Directory for Pear runtime.

### `Pear.config.dht.nodes <Array<Object>>`

A list of known [DHT](../../building-blocks/hyperdht.md) nodes of the form `{ host: <String>, port: <Number> }`. The nodes are set when the Pear application is started.

Unless started with a custom set of bootstrap nodes, Pear caches known nodes to speed up connecting to the swarm and to make it more resilient.

### `Pear.config.dht.bootstrap <Array<Object>>`

A list of custom bootstrap nodes Pear is started with of the form `{ host: <String>, port: <Number> }`.

## `Pear.checkpoint(<Any>) => Promise`

Stores state that will be available as `Pear.config.checkpoint` next time the application starts.

The `Pear.config.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.config.checkpoint()](#pear--config-checkpoint-any)


## Pear.messages([ pattern ], [ listener ]) -> Iterable

A function which accepts a pattern object and returns an [`Iambus`](https://github.com/holepunchto/iambus) subscriber (which inherits from [`streamx`](https://github.com/mafintosh/streamx) `Readable`) which emits message objects matching a provided pattern object.

If no pattern object or an empty pattern object is provided all messages will be emitted. A pattern object is an object (typically) containing a subset of matching values for a given target object. Message objects can be user generated or platform generated.

The subscriber stream has a `data` event which can be listened to, it can also be consumed with `for await` and an listener function can be passed in addition to pattern (`message(pattern, listener)`) or as a single argument (`messages(listener)`) (indicating a catch-all pattern).

A message object may have any properties. Platform-generated messages are given a `type` property.

### Examples:

Listen for an internal platform message using a pattern object and listener function:

```js
const { messages } = Pear

messages({ type: 'pear/wakeup' }, ({ data, link }) => {
  console.log('pear/wakeup', data, link)
})
```

Tiny utility module which logs all messages using `for await`:

```js
const { messages } = Pear

for await (const message of messages()) {
  if (global.LOGBUS) console.log('BUS:', message)
}
```

Use `message` to create an application message:

```js
const { message, messages } = Pear

const ctaClicks = messages({ type: 'my-app/user-cta' })

ctaClicks.on('data', (msg) => { console.log('cta click', msg) })

// elsewhere
onUserClickCta((event, data) => {
  message({ type: 'my-app/user-cta', event, data })
})
```

## `await Pear.message(<Object>)`

Send a message which will be:

```js
const { message, messages } = Pear

async function logMessages () {
  for await (const message of messages()) console.log(message)
}

logMessages().catch(console.error)

let count = 0
do {
  await message({ type: 'tick', count })
  await new Promise((resolve) => setTimeout(resolve, 1000))
} while (count++ < 1000)
```

### `const pipe = Pear.run(link <String>, args <Array<String>>)`

Runs a Pear Worker by spawning a Pear Application process from the specified `link` parameter. The Worker uses the flags of the parent application but any application arguments must be passed using the `args` parameter, the `args` parameter also sets `Pear.config.args`. Returns a pipe (a [`streamx`](https://github.com/mafintosh/streamx) `Duplex` stream) for Worker communication. 

### `const pipe = Pear.pipe()`

Returns the pipe (a [`streamx`](https://github.com/mafintosh/streamx) `Duplex` stream) created to the worker process.

### `Pear.versions <Async Function>`

Function that returns a promise which resolves to a Pear versions object with the shape `{ fork <Integer>, length <Integer>, key <Buffer> }`.

The `key` is a Buffer of the run key. The `length` is the size of the relevant Hypercore. The `fork` property is determined by data truncation.

These three properties together are a unique identifier for the entire state of both applications and the Pear platform.

### `Pear.versions.platform { fork <Integer>, length <Integer>, key <Buffer> }`

The platform version.

### `Pear.versions.app { fork <Integer>, length <Integer>, key <Buffer> }`

The application version.

### `Pear.versions.runtimes { bare <Integer>, electron <Integer>, pear <Integer> }`

The versions of runtimes.

**References**

* [Pear.config.key](#pearconfigkey-objectnull)


### `Pear.teardown(fn <Async Function|Function>)`

Register application clean-up handlers to be called when an application begins to unload.

May be called multiple times to register multiple teardown handlers.

Functions supplied to teardown will be executed in order of registration when
an application begins to unload. Any promise returned from each supplied function
will be waited upon until resolution before calling the next teardown handler.

### Pear.reload()

Refresh application in Desktop applications. Not available in terminal
applications.

### `Pear.restart()`

Restart the application. Desktop Applications only.

### `Pear.exit(code)`

Exits the process with the provided exit code.

### `Pear.exitCode <Integer>`

The current exit code. Initially set to `0`.

### `Pear.argv <Array <String>>`

Command-line arguments passed to pear like `pear run --dev . --some arg` which returns: `[ 'pear', 'run', '--dev', '.', '--some', 'arg' ]`.

### `Pear.pid <Integer>`

The ID of the current process.

### `const stream = Pear.asset(link, opts <Object>)`

Returns a stream of updates to mirror assets in the Pear link `link`. Stream chunks will contain objects of the following shape:

```
{ tag: <String>, data: <Object> }
```

Possible `tag`s are the following:

- `stats-error` : An error occurred coming from the drive monitor.
- `stats` : Reported stats from the drive monitor.
- `dumping` : Signalling that assets are about to be mirrored to the file system.  
  The `data` property will include two properties:
    - `link` : The Pear link that is being mirrored.
    - `dir` : The file path the assets are being mirrored into.
- `dry` : This is a dry-run of mirroring the asset.
- `byteDiff` : The byte difference updating a file.  
  The `data` will have the following shape:
  ```
  {
    type: <1|0|-1>, // 1 = added, 0 = changed, -1 = removed
    sizes: Array<<Number>, // The bytes removed and/or added. In that order. `type = 1` only has bytes added
    message: <String> // the file path
  }
  ```
- `error` : An error occurred while mirroring.
- `final` : The assets mirroring is finished.  
  The `data` property will include two properties:
    - `link` : The Pear link that is being mirrored.
    - `dir` : The file path the assets are being mirrored into.
    - `success` : Whether the mirroring was successful.

Available options (`opts`):

- `force <Boolean>` : Whether to force mirroring the asset even if it already exists.
- `dryRun <Boolean>` : Enable to mirror asset without
- `only <Array<String>|String>` : Set of file paths which should be mirrored. Can be an array of file paths or a comma delimited string of paths. Will disable `prune` option if `true`.
- `prune <Boolean>` : Will remove any files that have been already mirrored but aren't in the current version.

### `const stream = Pear.dump(link, opts <Object>)`

Returns a stream of updates to dump the Pear link `link` into `opts`'s `dir` file path. Stream chunks will contain objects of the following shape:

```
{ tag: <String>, data: <Object> }
```

Possible `tag`s are the following:

- `stats-error` : An error occurred coming from the drive monitor.
- `stats` : Reported stats from the drive monitor.
- `dumping` : Signalling that the contents of the link are about to be dumped to the file system.  
  The `data` property will include two properties:
    - `link` : The Pear link that is being dumped.
    - `dir` : The file path where the contents are being dumped into.
- `dry` : This is a dry-run of dumping the link's contents.
- `byteDiff` : The byte difference updating a file.  
  The `data` will have the following shape:
  ```
  {
    type: <1|0|-1>, // 1 = added, 0 = changed, -1 = removed
    sizes: Array<<Number>, // The bytes removed and/or added. In that order. `type = 1` only has bytes added
    message: <String> // the file path
  }
  ```
- `file` : A file record while in 'output-only' mode.  
  The `data` property will include:
    - `key` : The file path for the file
    - `value` : The file contents. Disabled if `list` is `true`.
- `error` : An error occurred while dumping.
- `final` : The link dumping is finished. Only fired for a single file and with 'output-only' mode enabled.  
  The `data` property will include two properties:
    - `key` : The file path for the file
    - `value` : The file contents. Disabled if `list` is `true`.
    - `success` : Whether the dumping was successful.

Available options (`opts`):

- `dir <String>` : Where to dump `link`'s contents. **Required.** If set to `-`, contents will be dumped in 'output-only' mode.
- `list <Boolean>` : Will list contents instead of dumping them. Overrides `dir` to be `-`.
- `force <Boolean>` : Whether to force dumping the asset even if it already exists.
- `dryRun <Boolean>` : Enable to dump asset without
- `only <Array<String>|String>` : Set of file paths which should be dumped. Can be an array of file paths or a comma delimited string of paths. Will disable `prune` option if `true`.
- `prune <Boolean>` : Will remove any files that have been already dumped but aren't in the current version.
- `checkout <Number>` : The length to dump from of the underlying Hypercore.

### `Pear.updates(listener <Async Function|Function>) => streamx.Readable`

The `listener` function is called for every incoming update with an `update` object of the form:

```js
{
  type: 'pear/updates',
  version: { fork <Integer>, length <Integer>, key <String(hex)>,  } | null,
  app <Boolean>,
  diff <Array <{ type: string, key: string }> >,
}
```

* `version` is a Pear version object holding incoming version information
* `app` indicates whether the update represents an application (`true`) or platform (`false`) update
* `diff` requires `--update-diffs` flag (else `null`). An array of objects of form `{ type, key}`.
  * `type` `<String>` - Operation type `update` or `delete`
  * `key` `<String>` - Drive key for a given updated file e.g. `/path/to/file.txt`

Also returns a [`streamx`](https://github.com/mafintosh/streamx) `Readable`) stream.

### `Pear.updated()`

Returns the current `update` object of the form:

```js
{
  version: { fork <Integer>, length <Integer>, key <String(hex)>,  } | null,
  app <Boolean>,
  diff <Array <String>>,
}
```

* `version` is a Pear version object holding incoming version information
* `app` indicates whether the update represents an application (`true`) or platform (`false`) update
* `diff` requires `--update-diffs` flag (else `null`). An array of objects of form `{ type, key}`.
  * `type` `<String>` - Operation type `update` or `delete`
  * `key` `<String>` - Drive key for a given updated file e.g. `/path/to/file.txt`

### `Pear.wakeups(listener <Async Function|Function>) => streamx.Readable`

A wakeup occurs in the following cases:

* when a trusted `pear://` link is clicked and the application for that link is already open
* when used with `pear run --detached pear://<key>[/data]`

The `listener` function is called for every incoming wakeup with a `wakeup` object of the form:

```js
{
  type: 'pear/wakeup',
  link: <String>,
  linkData: <String>,
  fragment: <String>,
  entrypoint: <String>
}
```

* `link` is the `pear://` link for the application receiving the wakeup
* `linkData` is everything after the key in the `pear://` link - this would be `pathname` of a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) object but without the leading slash (`/`). Given `pear://8ts9yz9dtucxzwbxafygnjasqe9ti3dt3w7rm6sbiu8prmidacao/some/more/stuff` the `data` string would hold `some/more/stuff`.
* `fragment` is the `fragment` part of `pear://link#fragment` (location hash without the `#` prefix).
* `entrypoint` includes `entrypoint` of `pear://link/some/entry/point` (URL pathname).

Also returns a [`streamx`](https://github.com/mafintosh/streamx) `Readable`) stream.

### `Pear.badge(count <Integer|null>) => Promise<Boolean>`

Set the badge number for the application on desktop for Linux & MacOS. Setting the `count` to `0` will hide the badge while `null` will display a plain dot on MacOS only.

Returns a `Boolean` promise for whether the call succeeded.

Desktop Applications only.

### `const win = new Pear.Window(entry <String>, options <Object>)`

Desktop Applications only.

Create a new `Window` instance.

**Options**

* `show <Boolean>` Default: `true` - show the window as soon as it has been opened
* `x <Integer>` - the horizontal position of left side of the window (pixels)
* `y <Integer>` - vertical window position (pixels)
* `width <Integer>` - the width of the window (pixels)
* `height <Integer>` - the height of the window (pixels)
* `animate <Boolean>` Default: `false` - animate the dimensional change. MacOS only, ignored on other OS's.
* `center <Boolean` - center the window upon opening
* `minWidth <Integer>` - window minimum width (pixels)
* `minHeight <Integer>` - window minimum height (pixels)
* `maxWidth <Integer>` - window maximum width (pixels)
* `maxHeight <Integer>` - window maximum height (pixels)
* `resizable <Boolean>` - window resizability
* `movable <Boolean>` - window movability
* `minimizable <Boolean>` - window minimizability
* `maximizable <Boolean>` - window maximizability
* `closable <Boolean>` - window closability
* `focusable <Boolean>` - window focusability
* `alwaysOnTop <Boolean>` - Set window to always be on top
* `fullscreen <Boolean>` - Set window to fullscreen upon open
* `kiosk <Boolean>` - Set window to enter kiosk mode upon open
* `autoHideMenuBar <Boolean>` - Hide menu bar unless Alt key is pressed (Linux, Windows)
* `hasShadow <Boolean>` - Set window shadow
* `opacity <Number>` - Set window opacity (0.0 - 1.0) (Windows, macOS)
* `transparent <Boolean>` - Set window transparency
* `backgroundColor <String>` Default: `'#FFF'` - window default background color. Hex, RGB, RGBA, HSL HSLA, CSS color

### `win.on[ce]('message', (...args) => { })`
### `for await (const [ ...args ] of win)`

Receive a message from the window. The received `args` array is deserialized via `JSON.parse`.

**References**

* [`win.send()`](#await-winsendargs)

### `const success = await win.open(options <Object>)`

Resolves to: `<Boolean>`

Open the window.

**Options**

* `show` Default: `true` - show the window as soon as it has been opened
* `x <Integer>` - the horizontal position of left side of the window (pixels)
* `y <Integer>` - vertical window position (pixels)
* `width <Integer>` - the width of the window (pixels)
* `height <Integer>` - the height of the window (pixels)
* `animate <Boolean>` Default: `false` - animate the dimensional change. MacOS only, ignored on other OS's.
* `center <Boolean` - center the window upon opening
* `minWidth <Integer>` - window minimum width (pixels)
* `minHeight <Integer>` - window minimum height (pixels)
* `maxWidth <Integer>` - window maximum width (pixels)
* `maxHeight <Integer>` - window maximum height (pixels)
* `resizable <Boolean>` - window resizability
* `movable <Boolean>` - window movability
* `minimizable <Boolean>` - window minimizability
* `maximizable <Boolean>` - window maximizability
* `closable <Boolean>` - window closability
* `focusable <Boolean>` - window focusability
* `alwaysOnTop <Boolean>` - Set window to always be on top
* `fullscreen <Boolean>` - Set window to fullscreen upon open
* `kiosk <Boolean>` - Set window to enter kiosk mode upon open
* `autoHideMenuBar <Boolean>` - Hide menu bar unless Alt key is pressed (Linux, Windows)
* `hasShadow <Boolean>` - Set window shadow
* `opacity <Number>` - Set window opacity (0.0 - 1.0) (Windows, macOS)
* `transparent <Boolean>` - Set window transparency
* `backgroundColor <String>` Default: `'#FFF'` - window default background color. Hex, RGB, RGBA, HSL HSLA, CSS color

### `const success = await win.close()`

Resolves to: `<Boolean>`

Close the window.

### `const success = await win.show()`

Resolves to: `<Boolean>`

Show the window.

### `const success = await win.hide()`

Resolves to: `<Boolean>`

Hide the window.

### `const success = await win.focus()`

Resolves to: `<Boolean>`

Focus the window.

### `const success = await win.blur()`

Resolves to: `<Boolean>`

Blur the window.

### `const success = await win.minimize()`

Resolves to: `<Boolean>`

Minimize the window.

### `const success = await win.maximize()`

Resolves to: `<Boolean>`

Maximize the window.

### `const success = await win.restore()`

Resolves to: `<Boolean>`

Unmaximize/unminimize the window if it is currently maximized/minimized.

### `await win.send(...args)`

Send arguments to the window. They will be serialized with `JSON.stringify`.


### `const dimensions = await win.dimensions()`

Resolves to: `{x <Integer>, y <Integer>, width <Integer>, height <Integer>} | null`.

The height, width, horizontal (`x`), vertical (`y`) position of the window relative to the screen.

All units are (pixels)

If the window is closed this will resolve to `null`.

**References**

* [await win.dimensions(options)](#await-windimensionsoptions-object)

### `await win.dimensions(options <Object>)`

```js
const win = new Pear.Window('./some.html', {
  x: 10,
  y: 450,
  width: 300,
  height: 350
})

await win.open()
await new Promise((resolve) => setTimeout(resolve, 1000))

await win.dimensions({
  x: 20,
  y: 50,
  width: 550,
  height: 300,
  animate: true // only has an effect on macOS
})

```

Sets the dimensions of the window.

**Options**

* `x <Integer>` - the horizontal position of left side of the window (pixels)
* `y <Integer>` - the vertical position of the top of the window (pixels)
* `width <Integer>` - the width of the window (pixels)
* `height <Integer>` - the height of the window (pixels)
* `animate <Boolean>` Default: `false` - animate the dimensional change. MacOS only, ignored on other OS's.
* `position <String>` - may be `'center'` to set the window in the center of the screen or else `undefined`.

**References**

* [const dimensions = await win.dimensions()](#const-dimensions-await-windimensions)


### `const visible = await win.isVisible()`

Resolves to: `<Boolean>`

Whether the window is visible.

### `const minimized = await win.isMinimized()`

Resolves to: `<Boolean>`

Whether the window is minimized.

### `const maximized = await win.isMaximized()`

Resolves to: `<Boolean>`

Whether the window is maximized.

### `const closed = await win.isClosed()`

Resolves to: `<Boolean>`

Whether the window is closed.

### `const view = new Pear.View(options <Object>)`

Desktop Applications only.

Create a new `View` instance. Views provide isolated content views. Frameless, chromeless windows that can be embedded inside other windows and views.

**Options**

* `x <Integer>` - the horizontal position of left side of the view (pixels)
* `y <Integer>` - vertical view position (pixels)
* `width <Integer>` - the width of the view (pixels)
* `height <Integer>` - the height of the view (pixels)
* `backgroundColor <String>` Default: `'#FFF'` - view default background color. Hex, RGB, RGBA, HSL HSLA, CSS color
* `autoresize <Object>` Default `{ width=true, height=true, vertical=false, horizontal=false }` - dimensions for the view to autoresize alongside. For example, if `width` is `true` and the view container increases/decreases in width, the view will increase/decrease in width at the same rate.

**References**

* https://www.electronjs.org/docs/latest/api/browser-view#viewsetautoresizeoptions-experimental
* https://www.electronjs.org/docs/latest/api/browser-view#viewsetbackgroundcolorcolor-experimental

### `view.on[ce]('message', (...args) => { })`
### `for await (const [ ...args ] of view)`

Receive a message from the view. The received `args` array is deserialized via `JSON.parse`.

**References**

* [`view.send()`](#await-viewsendargs)

### `const success = await view.open(options <Object>)`

Resolves to: `<Boolean>`

Open the view.

**Options**

* `x <Integer>` - the horizontal position of left side of the view (pixels)
* `y <Integer>` - vertical view position (pixels)
* `width <Integer>` - the width of the view (pixels)
* `height <Integer>` - the height of the view (pixels)
* `backgroundColor <String>` Default: `'#FFF'` - view default background color. Hex, RGB, RGBA, HSL HSLA, CSS color
* `autoresize <Object>` Default `{ width=true, height=true, vertical=false, horizontal=false }` - dimensions for the view to autoresize alongside. For example, if `width` is `true` and the view container increases/decreases in width, the view will increase/decrease in width at the same rate.

### `const success = await view.close()`

Resolves to: `<Boolean>`

Close the view.

### `const success = await view.show()`

Resolves to: `<Boolean>`

Show the view.

### `const success = await view.hide()`

Resolves to: `<Boolean>`

Hide the view.

### `const success = await view.focus()`

Resolves to: `<Boolean>`

Focus the view.

### `const success = await view.blur()`

Resolves to: `<Boolean>`

Blur the view.

### `await view.send(...args)`

Send arguments to the view. They will be serialized with `JSON.stringify`.

### `const dimensions = await view.dimensions()`

Resolves to: `{x <Integer>, y <Integer>, width <Integer>, height <Integer>} | null`.

The height, width, horizontal (`x`), vertical (`y`) position of the window relative to the screen.

All units are (pixels)

If the Window is closed this will resolve to `null`.

**References**

* [await view.dimensions(options)](#await-viewdimensionsoptions-object)

### `await view.dimensions(options <Object>)`

```js
const view = new Pear.View('./some.html', {
  x: 10,
  y: 450,
  width: 300,
  height: 350
})

await view.open()
await new Promise((resolve) => setTimeout(resolve, 1000))

await view.dimensions({
  x: 20,
  y: 50,
  width: 550,
  height: 300
})
```

Sets the dimensions of the view.

**Options**

* `x <Integer>` - the horizontal position of left side of the window (pixels)
* `y <Integer>` - the vertical position of the top of the window (pixels)
* `width <Integer>` - the width of the window (pixels)
* `height <Integer>` - the height of the window (pixels)


**References**

* [const dimensions = await view.dimensions()](#const-dimensions--await-viewdimensions)

### `const visible = await view.isVisible()`

Resolves to: `<Boolean>`

Whether the view is visible.

### `const closed = await view.isClosed()`

Resolves to: `<Boolean>`

Whether the view is closed.

### `const { self } = Pear.Window`  `const { self } = Pear.View`

### `const success = await self.focus()`

Resolves to: `<Boolean>`

Focus current view or window.

### `const success = await self.blur()`

Resolves to: `<Boolean>`

Blur current view or window.

### `const success = await self.show()`

Resolves to: `<Boolean>`

Show current view or window.

### `const success = await self.hide()`

Resolves to: `<Boolean>`

Hide current view or window.

### `const success = await self.minimize()`

Resolves to: `<Boolean>`

Minimize current window.

Throws a `TypeError` if `self` is a view.

### `const success = await self.maximize()`

Resolves to: `<Boolean>`

Maximize current window.

Throws a `TypeError` if `self` is a view.

### `const success = await self.restore()`

Resolves to: `<Boolean>`

Unmaximize/unminimize the current window if it is currently maximized/minimized.

Throws a `TypeError` if `self` is a view.


### `const success = await self.close()`

Resolves to: `<Boolean>`

Closes the current view or window.


### `const isVisible = await self.isVisible()`

Resolves to: `<Boolean>`

Whether the current window or view is visible.

### `const isMaximized = await self.isMaximized()`
Resolves to: `<Boolean>`

Whether the current window is maximized. Throws a `TypeError` if `self` is a view.


### `const isMinimized = await self.isMinimized()`

Resolves to: `<Boolean>`

Whether the current window is minimized. Throws a `TypeError` if `self` is a view.

### `const { parent } = Pear.Window`  `const { parent } = Pear.View`

### `parent.on[ce]('message', (...args) => { })`
### `for await (const [ ...args ] of parent)`

Receive a message from the parent window or view. The received `args` array is deserialized via `JSON.parse`.

### `await parent.send(...args)`

Send arguments to the parent view or window. They will be serialized with `JSON.stringify`.


### `const success = await parent.focus()`

Resolves to: `<Boolean>`

Focus parent view or window.

### `const success = await parent.blur()`

Resolves to: `<Boolean>`

Blur parent view or window.

### `const success = await parent.show()`

Resolves to: `<Boolean>`

Show parent view or window.

### `const success = await parent.hide()`

Resolves to: `<Boolean>`

Hide parent view or window.

### `const success = await parent.minimize()`

Resolves to: `<Boolean>`

Minimize parent window.

Throws a `TypeError` if `parent` is a view.

### `const success = await parent.maximize()`

Resolves to: `<Boolean>`

Maximize parent window.

Throws a `TypeError` if `parent` is a view.

### `const success = await parent.restore()`

Resolves to: `<Boolean>`

Unmaximize/unminimize the parent window if it is currently maximized/minimized.

Throws a `TypeError` if `parent` is a view.

### `const success = await parent.close()`

Resolves to: `<Boolean>`

Closes the parent view or window.

### `const isVisible = await parent.isVisible()`

Resolves to: `<Boolean>`

Whether the parent window or view is visible.

### `const isMaximized = await parent.isMaximized()`
Resolves to: `<Boolean>`

Whether the parent window is maximized. Throws a `TypeError` if `parent` is a view.


### `const isMinimized = await parent.isMinimized()`

Resolves to: `<Boolean>`

Whether the parent window is minimized. Throws a `TypeError` if `parent` is a view.
