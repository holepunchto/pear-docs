# Application Programming Interface (API)

The Pear API enables applications to interact with Pear platform features.

Most application peer-to-peer functionality is provided by ecosystem modules rather than the API.

Platform APIs are unchangable. Compatiblity cannot break. So the Pear API surface aims to be (and remain)
as small as possible.

## `import pear from 'pear'`

To use the Pear Platform API: import `pear`.

```js
import pear from 'pear'
```

Import namespaces are also supported, for example:

```js
import { config } from 'pear'
```

## `pear.config <Object>`

Contains application configuration data.

### `pear.config.key <Object|null>`

The application key, `null` in development mode.
The `config.key` object holds both Hexadecimal and Z-Base-32 encodings of the key, and is of the form `{ z32: <String>, hex: <String> }`,

### `pear.config.dev <Boolean>`

Whether application is in development mode

### `pear.config.tier <String>`

Runtime scenario (dev, staging or production)

### `pear.config.storage <String>`

Application storage path

### `pear.config.name <String>`

Application name

### `pear.config.main <String>`

Application entry file

### `pear.config.channel <String|null>`

Application release/staging channel, `null` in development mode.

### `pear.config.options <Object>`

Configuration options.
The `pear` configuration object as supplied via an applications `package.json` file.

**References**

* [Configuration](./configuration.md)

### `pear.config.env <Object>`

The environment variables that an application was started with, as key-value pairs in an object.

### `pear.config.cwd <String>`

The current working directory that an application was started from.

### `pear.config.flags <Object>`

Parsed command-line flag values as supplied when an application was started.

### `pear.config.tools <Boolean>`

Indicates whether or not Devtools is enabled.

### `pear.config.watch <Boolean>`

Indicates whether or not Watch-Reload functionality is enabled.

### `pear.config.storage <String>`

Application storage path.

### `pear.config.args <Array>`

Command-line application arguments passed after double dash `--`.

### `pear.config.release <Number>`

The current release length as marked by the `pear release` command.

**References**

* [`pear release`](./cli.md)

### `pear.config.link <String>`

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**
* [pear.config.link](#pearconfiglinkdata-string)
* [`pear dev`](./cli.md)
* [`pear launch`](./cli.md)

### `pear.config.linkData <String>`

Holds just the data portion of a Pear link.

The Pear link of an application. Takes the form `pear://<key>/<data>`.

In development, `pear://dev/<data>`.

**References**

* [pear.config.link](#pearconfiglink-string)
* [`pear dev`](./cli.md)
* [`pear launch`](./cli.md)


### `pear.config.checkpoint <Any>`

Holds state as set by `pear.checkpoint()`. When an application restarts it will hold the most recent value passed to `pear.checkpoint()`.

Stores state that will be available as `pear.config.checkpoint` next time the application starts.

The `pear.config.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [pear.checkpoint()](#pear-checkpoint-any)

### `pear.config.release <Integer>`

Application release sequence integer, `null` in development mode.

### `pear.config.flags <Object>`

Parsed runtime flags. For internal/advanced use.

## `pear.checkpoint(<Any>) => Promise`

Stores state that will be available as `pear.config.checkpoint` next time the application starts.

The `pear.config.checkpoint` property immediately reflects the latest checkpoint.

The returned `Promise` will resolve once the checkpoint has been successfully stored.

**References**

* [pear.config.checkpoint()](#pear--config-checkpoint-any)

## pear.messages([ pattern ], [ listener ])

A function which accepts a pattern object and returns an [`Iambus`](https://github.com/holepunchto/iambus) subscriber (which inherits from [`streamx`](https://github.com/mafintosh/streamx) `Readable`) which emits message objects matching a provided pattern object.

If no pattern object or an empty pattern object is provided all messages will be emitted. A pattern object is an object (typically) containing a subset of matching values for a given target object. Message objects can be user generated or platform generated.

The subscriber stream has a `data` event which can be listened to, it can also be consumed with `for await` and an listener function can be passed in addition to pattern (`message(pattern, listener)`) or as a single argument (`messages(listener)`) (indicateding a catch-all pattern).

A message object may have any properties. Platform-generated messages are given a `type` property.

### Examples:

Listen for an internal platform message using a pattern object and listener function:

```js
import { messages } from 'pear'

messages({ type: 'pear/wakeup' }, ({ data, link }) => {
  console.log('pear/wakeup', data, link)
})
```

Tiny utility module which logs all messages using `for await`:

```js
import { messages } from 'pear'

for await (const message of messages()) {
  if (global.LOGBUS) console.log('BUS:', message)
}
```

Use `message` to create an application message:

```js
import { message, messages } from 'pear'

const ctaClicks = message({ type: 'my-app/user-cta' })

ctaClicks.on('data', (msg) => { console.log('cta click', msg) })

// elsewhere
onUserClickCta((event, data) => {
  message({ type: 'my-app/user-cta', event, data })
})
```

## `await pear.message(<Object>)`

Send a message which will be:

```js
import { message, messages } from 'pear'

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

## `pear.preferences <Function|Object>`

User preferences management.

### `for await (const [operation, key, value] of pear.preferences())`

An async iterable that yields arrays containing `operation <String>`, `key <String>` and `value <any>`.

Watch for application updates. The `operation` may be `set` or `del`. In the case of `del`, `value` is always `null`.

### `for await (const [key, value] of pear.preferences.list())`

Iterate through all available application preferences.

### `const success = await pear.preferences.set(key, value)`

Set a preference. The promise resolves to a boolean indicating success when the operation is complete.

### `const value = await pear.preferences.get(key)`

Get a preference. The promise resolves with the value.

### `const success = await pear.preferences.del(key)`

Delete a preference. The promise resolves to a boolean indicating success when the operation is complete.


```js
import { preferences } from 'pear'

async function logPrefUpdates () {
  for await (const [ operation, key, value ] of preferences()) console.table({ update: { operation, key, value }})
}

logPrefUpdates().catch(console.error)
```

## `pear.media <Object>`

Media interface

### `const status = await pear.media.status.microphone()`

Resolves to: `<String>`.

If access to the microphone is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const status = await pear.media.status.camera()`

Resolves to: `<String>`.

If access to the camera is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const status = await pear.media.status.screen()`

Resolves to: `<String>`

If access to the screen is available, resolved value will be `'granted'`.

Any other string indicates lack of permission. Possible values are `'granted'`, `'not-determined'`, `'denied'`, `'restricted'`, `'unknown'`.

### `const success = await pear.media.access.microphone()`

Resolves to: `<Boolean>`

Request access to the microphone. Resolves to `true` if permission is granted.

### `const success = await pear.media.access.camera()`

Resolves to: `<Boolean>`

Request access to the camera. Resolves to `true` if permission is granted.

### `const success = await pear.media.access.screen()`

Resolves to: `<Boolean>`

Request access to screen sharing. Resolves to `true` if permission is granted.

### `const sources = await pear.media.desktopSources(options <Object>)`

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

### `pear.versions <Object>`

Versions object. Pear versions are objects with the shape `{ fork <Integer>, length <Integer>, key <Buffer> }`.

The `key` is a Buffer of the launch key. The `length` is the size of the relevant Hypercore. The `fork` property is determined by data truncation.

These three properties together are a unique identifier for the entire state of both applications and the Pear platform.

### `pear.versions.platform { fork <Integer>, length <Integer>, key <Buffer> }`

The platform version.

### `pear.versions.application { fork <Integer>, length <Integer>, key <Buffer> }`

The application version.

**References**

* [pear.config.key](#pearconfigkey-objectnull)


### `pear.teardown(fn <Async Function|Function>)`

Register application clean-up handlers to be called when an application begins to unload.

May be called multiple times to register multiple teardown handlers.

Functions supplied to teardown will be executed in order of registration when
an application begins to unload. Any promise returned from each supplied function
will be waited upon until resolution before calling the next teardown handler.

### `pear.restart()`

Restart the application.

### `const win = new pear.Window(entry <String>, options <Object>)`

Create a new `Window` instance.

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

### `win.on[ce]('message', (...args) => { })`
### `for await (const [ ...args ] of win)`

Receive a message from the window. The received `args` array is deserialized via `JSON.parse`.

**References**

### [`win.send()`](#await-winsendargs)

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

Correlates to the `id` property of objects in the array returned from [pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options).

**References**

* [pear.media.desktopSources](#const-sources--await-appmediadesktopsourcesoptions-object)
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
import { Window } from 'pear'
const win = new Window('./some.html', {
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

### `const view = new pear.View(options <Object>)`

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

Supplies the `id` property of objects in the array returned from [pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options).

**References**

* [pear.media.desktopSources](#const-sources---await-appmediadesktopsources-options)
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
import { View } from 'pear'
const view = new View('./some.html', {
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

### `const { self } = pear.Window`  `const { self } = pear.View`

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

### `const { parent } = pear.Window`  `const { parent } = pear.View`

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

In Pear, `window.open` loads the URL in the **default system browser**. It does *not* create a new application window (use `pear.Window` to create application windows).

Therefore Pear's `window.open` only supports a single url argument. The `target` and `windowFeatures` parameters that browsers support are discarded.

### Scripts and Modules

Like browsers, there is no support for CommonJS (e.g. the `require` function as used by Node.js is not supported in Pear Applications).

Like browsers, there is support for native EcmaScript Modules (ESM). A JavaScript Script has no module capabilities. A JavaScript Module has ESM capabilities.

Use `<script type="module" src="path/to/my-file.js">` to load a JavaScript Module.

Use `<script src="path/to/my-file.js">` to load a JavaScript Script.

## Development Global

The Pear API is exposed as `global.pear` for the explicit purpose of easy API experimentation in the Devtools Console. It is *only* exposed globally in development mode. Any module that uses the Pear API must be sure to import `pear`, relying on `global.pear` will cause production breakage.