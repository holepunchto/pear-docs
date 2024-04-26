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

## Pear.message(msg)

Sends IPC message while monitoring internal references for streamlined internal communication within the platform.

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

### `Pear.exit(code)`

Exits the process with the provided exit code.

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
