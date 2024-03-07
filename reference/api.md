# Application Programming Interface (API)

<mark style="background-color: #8484ff;">**experimental**</mark>

The Pear API enables applications to interact with Pear platform features.

Most application peer-to-peer functionality is provided by ecosystem modules rather than the API.

Platform APIs are unchangable. Compatiblity cannot break. So the Pear API surface aims to be (and remain)
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

Command-line application arguments passed like `pear dev . --some arg`.

### `Pear.config.release <Number>`

The current release length as marked by the `pear release` command.

**References**

* [`pear release`](./cli.md)

### `Pear.config.link <String>`

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**
* [Pear.config.linkData](#pearconfiglinkdata-string)
* [`pear dev`](./cli.md)
* [`pear run`](./cli.md)

### `Pear.config.linkData <String>`

Holds just the data portion of a Pear link.

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**

* [Pear.config.link](#pearconfiglink-string)
* [`pear dev`](./cli.md)
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

## `Pear.checkpoint(<Any>) => Promise`

Stores state that will be available as `Pear.config.checkpoint` next time the application starts.

The `Pear.config.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [Pear.config.checkpoint()](#pear--config-checkpoint-any)

## Pear.messages([ pattern ], [ listener ]) -> Iterable

A function which accepts a pattern object and returns an [`Iambus`](https://github.com/holepunchto/iambus) subscriber (which inherits from [`streamx`](https://github.com/mafintosh/streamx) `Readable`) which emits message objects matching a provided pattern object.

If no pattern object or an empty pattern object is provided all messages will be emitted. A pattern object is an object (typically) containing a subset of matching values for a given target object. Message objects can be user generated or platform generated.

The subscriber stream has a `data` event which can be listened to, it can also be consumed with `for await` and an listener function can be passed in addition to pattern (`message(pattern, listener)`) or as a single argument (`messages(listener)`) (indicateding a catch-all pattern).

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

const ctaClicks = message({ type: 'my-app/user-cta' })

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

## `Pear.preferences <Function|Object>`

User preferences management.

### `for await (const [operation, key, value] of Pear.preferences())`

An async iterable that yields arrays containing `operation <String>`, `key <String>` and `value <any>`.

Watch for application updates. The `operation` may be `set` or `del`. In the case of `del`, `value` is always `null`.

### `for await (const [key, value] of Pear.preferences.list())`

Iterate through all available application preferences.

### `const success = await Pear.preferences.set(key, value)`

Set a preference. The promise resolves to a boolean indicating success when the operation is complete.

### `const value = await Pear.preferences.get(key)`

Get a preference. The promise resolves with the value.

### `const success = await Pear.preferences.del(key)`

Delete a preference. The promise resolves to a boolean indicating success when the operation is complete.


```js
const { preferences } = Pear

async function logPrefUpdates () {
  for await (const [ operation, key, value ] of preferences()) console.table({ update: { operation, key, value }})
}

logPrefUpdates().catch(console.error)
```

## `Pear.media <Object>`

Media interface

### `const status = await Pear.media.status.microphone()`

Resolves to: `<String>`

If access to the microphone is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const status = await Pear.media.status.camera()`

Resolves to: `<String>`

If access to the camera is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const status = await Pear.media.status.screen()`

Resolves to: `<String>`

If access to the screen is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const success = await Pear.media.access.microphone()`

Resolves to: `<Boolean>`

Request access to the microphone. Resolves to `true` if permission is granted.

### `const success = await Pear.media.access.camera()`

Resolves to: `<Boolean>`

Request access to the camera. Resolves to `true` if permission is granted.

### `const success = await Pear.media.access.screen()`

Resolves to: `<Boolean>`

Request access to screen sharing. Resolves to `true` if permission is granted.

### `const sources = await Pear.media.desktopSources(options <Object>)`

Captures available desktop sources. Resolves to an array of objects with shape `{ id <String>, name <String>, thumbnail <NativeImage>, display_id <String>, appIcon <NativeImage> }`. The `id` is the window or screen identifier. The `name` is the window title or `'Screen <index>'` in multiscreen scenarios or else `Entire Screen`. The `display_id` identifies the screen. The thumbnail is a scaled down screen capture of the window/screen.

**Options**

* `types <Array<String>>` - Default: `['screen', 'window']`. Filter by types. Types are `'screen'` and `'window'`.
* `thumbnailSize <Object>` - Default: `{width: 150, height: 150}`. Set thumbnail scaling (pixels)
* `fetchWindowIcons <Boolean>` - Default: `false`. Populate `appIcon` with Window icons, or else `null`.

**References**

* [win.getMediaSourceId()](#const-sourceid--await-wingetmediasourceid)
* [view.getMediaSourceId()](#const-sourceid--await-viewgetmediasourceid)
* [self.getMediaSourceId()](#const-sourceid--await-selfgetmediasourceid)
* [parent.getMediaSourceId()](#const-sourceid--await-parentgetmediasourceid)
* https://www.electronjs.org/docs/latest/api/desktop-capturer#desktopcapturergetsourcesoptions
* https://www.electronjs.org/docs/latest/api/structures/desktop-capturer-source
* [`<NativeImage>`](https://www.electronjs.org/docs/latest/api/native-image)

### `Pear.versions <Object>`

Versions object. Pear versions are objects with the shape `{ fork <Integer>, length <Integer>, key <Buffer> }`.

The `key` is a Buffer of the run key. The `length` is the size of the relevant Hypercore. The `fork` property is determined by data truncation.

These three properties together are a unique identifier for the entire state of both applications and the Pear platform.

### `Pear.versions.platform { fork <Integer>, length <Integer>, key <Buffer> }`

The platform version.

### `Pear.versions.application { fork <Integer>, length <Integer>, key <Buffer> }`

The application version.

**References**

* [Pear.config.key](#pearconfigkey-objectnull)


### `Pear.teardown(fn <Async Function|Function>)`

Register application clean-up handlers to be called when an application begins to unload.

May be called multiple times to register multiple teardown handlers.

Functions supplied to teardown will be executed in order of registration when
an application begins to unload. Any promise returned from each supplied function
will be waited upon until resolution before calling the next teardown handler.

### `Pear.restart()`

Restart the application.

### `Pear.updates(listener <Async Function|Function>) => streamx.Readable`

The `listener` function is called for every incoming update with an `update` object of the form:

```js
{
  type: 'pear/updates',
  version: { fork <Integer>, length <Integer>, key <String(hex)>,  } | null,
  app <Boolean>,
  diff <Array <String> >,
}
```

* `version` is a Pear version object holding incoming version information
* `app` indicates whether the update represents an application (`true`) or platform (`false`) update
* `diff` requires `--update-diffs` flag (else `null`). An array of objects of form `{ type, key}`.
  * `type` `<String>` - Operation type `update` or `delete`
  * `key` `<String>` - Drive key for a given updated file e.g. `/path/to/file.txt`

Also returns a [`streamx`](https://github.com/mafintosh/streamx) `Readable`) stream.

### `Pear.wakeups(listener <Async Function|Function>) => streamx.Readable`

A wakeup occurs in the following cases:

* when a trusted `pear://` link is clicked and the application for that link is already open
* when used with `pear run --detached pear://<key>[/data]`

The `listener` function is called for every incoming wakeup with a `wakeup` object of the form:

```js
{
  type: 'pear/wakeup',
  link: <String>,
  data: <String>
}
```

* `link` is the `pear://` link for the application receiving the wakeup
* `data` is everything after the key in the `pear://` link - this would be `pathname` of a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) object but without the leading slash (`/`). Given `pear://8ts9yz9dtucxzwbxafygnjasqe9ti3dt3w7rm6sbiu8prmidacao/some/more/stuff` the `data` string would hold `some/more/stuff`.

Also returns a [`streamx`](https://github.com/mafintosh/streamx) `Readable`) stream.

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


### `const sourceId = await win.getMediaSourceId()`

Resolves to: `<String>`

Correlates to the `id` property of objects in the array returned from [Pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options).

**References**

* [Pear.media.desktopSources](#const-sources--await-appmediadesktopsourcesoptions-object)
* https://www.electronjs.org/docs/latest/api/browser-window#wingetmediasourceid

### `const dimensions = await win.dimensions()`

Resolves to: `{x <Integer>, y <Integer>, width <Integer>, height <Integer>} | null`.

The height, width, horizontal (`x`), vertical (`y`) position of the window relative to the screen.

All units ar (pixels)

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

### `const sourceId = await view.getMediaSourceId()`

Resolves to: `<String>`

Supplies the `id` property of objects in the array returned from [Pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options).

**References**

* [Pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options)
* https://www.electronjs.org/docs/latest/api/browser-window#wingetmediasourceid

### `const dimensions = await view.dimensions()`

Resolves to: `{x <Integer>, y <Integer>, width <Integer>, height <Integer>} | null`.

The height, width, horizontal (`x`), vertical (`y`) position of the window relative to the screen.

All units ar (pixels)

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

### `const sourceId = await self.getMediaSourceId()`

Get the sourceId of the current window or view.

**References**

* [win.getMediaSourceId()](const-sourceId--await-wingetMediaSourceId)


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

Whether the current window is minmized. Throws a `TypeError` if `self` is a view.

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

### `const sourceId = await parent.getMediaSourceId()`

Get the sourceId of the parent window or view.

**References**

* [win.getMediaSourceId()](#const-sourceId--await-wingetMediaSourceId)


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

Whether the parent window is minmized. Throws a `TypeError` if `parent` is a view.


## Web APIs

Most [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) will work as-is.

This section details deviations in behavior from and notable aspects of Web APIs as they relate to Pear.

### `window.open`

The [`window.open`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) Web API function will ignore all arguments except for the URL parameter.

In browsers, `window.open` opens a new browser window. The opened window belongs to the same browser from which `window.open` is called.

In Pear, `window.open` loads the URL in the **default system browser**. It does *not* create a new application window (use `Pear.Window` to create application windows).

Therefore Pear's `window.open` only supports a single url argument. The `target` and `windowFeatures` parameters that browsers support are discarded.

### Scripts and Modules

Like browsers, there is no support for CommonJS (e.g. the `require` function as used by Node.js is not supported in Pear Applications).

Like browsers, there is support for native EcmaScript Modules (ESM). A JavaScript Script has no module capabilities. A JavaScript Module has ESM capabilities.

Use `<script type="module" src="path/to/my-file.js">` to load a JavaScript Module.

Use `<script src="path/to/my-file.js">` to load a JavaScript Script.
