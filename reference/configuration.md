# Configuration

<mark style="background-color: #8484ff;">**experimental**</mark>

## The `package.json` file

A Pear project **must** have a `package.json` file and a main entry file.

The `package.json` file **must** have either a `name` property or `pear` object with a `name` property.

The `package.json` `name` field must be lowercase and one word, and may contain letters, numbers, hyphens (`-`), underscores (`_`), forward slashes (`/`) and asperands (`@`).

The `package.json` file may also contain a `main` field, which typically should point to an HTML file. If omitted, `index.html` or `index.js` is the default entry file depending on application type.

Any other fields (such as `dependencies`) may also be present in the `package.json` file.

The `package.json` `pear` object contains application configuration and is exposed via the API as `pear.config.options`.

Pear versioning is automatic. The `package.json` file does **not** require a version field, the version field will be ignored.

## The `package.json` `pear` field.

### `pear.name <String>`

The name of the application. Overrides `package.json` `name`.

### `pear.gui <Object>`

Graphical User Interface configuration options.

#### `pear.gui[platform] <Object>`

Platform specific options can be set by nesting options under the platform name. For example the following sets the macOS version to not be resizable:

```json
{
  "pear": {
    "gui": {
      "darwin": {
        "resizable": false
      }
    }
  }
}
```

The following `platform`s are supported:

- `darwin`
- `linux`
- `win32`

### `pear.gui.name <String>`

Override the app name which otherwise defaults to [name](#pear.name-less-than-string-greater-than).

#### `pear.gui.width <Number>`

Window width (pixels).

#### `pear.gui.height <Number>`

Window height (pixels).

#### `pear.gui.x <Number>`

Horizontal window position (pixels).

#### `pear.gui.y <Number>`

Vertical window position (pixels).

#### `pear.gui.minWidth <Number>`

Window minimum width (pixels).

#### `pear.gui.minHeight <Number>`

Window minimum height (pixels).

#### `pear.gui.maxWidth <Number>`

Window maximum width (pixels).

#### `pear.gui.maxHeight <Number>`

Window maximum height (pixels).

#### `pear.gui.center <Boolean>` (default: `false`)

Center window.

#### `pear.gui.resizable <Boolean>` (default: `true`)

Window resizability.

#### `pear.gui.movable <Boolean>` (default: `true`)

Window movability.

#### `pear.gui.minimizable <Boolean>` (default: `true`)

Window minimizability.

#### `pear.gui.maximizable <Boolean>` (default: `true`)

Window maximizability.

#### `pear.gui.closable <Boolean>` (default: `true`)

Window closability.

#### `pear.gui.focusable <Boolean>` (default: `true`)

Window focusability.

#### `pear.gui.alwaysOnTop <Boolean>` (default: `false`)

Set window to always be on top.

#### `pear.gui.fullscreen <Boolean>` (default: `false`)

Set window to fullscreen on start.

#### `pear.gui.kiosk <Boolean>` (default: `false`)

Set window to enter kiosk mode on start.

#### `pear.gui.autoHideMenuBar <Boolean>` (default: `false`)

Hide menu bar unless Alt key is pressed (Linux, Windows).

#### `pear.gui.hasShadow <Boolean>` (default: `true`)

Window shadow.

#### `pear.gui.opacity <Number>` (default: `1`)

Set window opacity (0.0 - 1.0) (Windows, macOS).

#### `pear.gui.transparent <Boolean>` (default: `false`)

Enable transparency. Must be set for opacity to work.

#### `pear.gui.hideable <Boolean>` (default: `false`)

Keep app running when all windows are closed.

WARNING: Linux tray support varies which can cause scenarios where the application's tray doesn't work and closing the app will be hidden and inaccessible. Using a tray and `hideable` on Linux is not recommended.

#### `pear.gui.backgroundColor <String>` (default: "#000" non-transparent, "#00000000" transparent)

Background color (Hex, RGB, RGBA, HSL, HSLA, CSS color).

###  `pear.links <Object|Array>` 

Storing and managing Pear application links and domains.

`links` can be an object or an array. If it's an object, naming the key makes it easy to reference from [`Pear.config.links`](./api.md#pearconfiglinks-objectarray)

By default in Pear apps, only requests to the sidecar host (127.0.0.1:9342) are allowed. Additional hosts and trusted keys must be added in `pear.links` to allow access.

Any Pear links that the app trusts to run (eg as a worker) must be added and any http(s) domains that the app wants to access must also be added, including localhost.

Adding `"https://*"` or `"http://*"` will trust all domains based on their respective protocol.

Note that this is only for requests that the Pear app makes itself such as loading assets.

```json
{
  // ...
  "pear": {
    // accessed at runtime using Pear.config.links[index] eg. Pear.config.links[0] for pear://somePearKey
    "links": [ 
      "pear://somePearKey", 
      "https://example.com" 
    ]
    // OR
    // accessed at runtime using Pear.config.links.name eg. Pear.config.links.myWorker for myWorker
    "links": {
      "myWorker": "pear://somePearKey",
      "host": "https://example.com"
    }
  }
}
```

### `pear.userAgent <string>` (default: `Pear ${Pear.#state.id}`)

User Agent to use when Pear makes web requests. Pear will use the default `userAgent` when making requests to the Sidecar.

Desktop Applications only.

### `pear.stage <Object>`

Staging configuration options.

#### `pear.stage.entrypoints <Array>`

An array of entrypoint paths as staging start-points in addition to (deduped) main entry point.

#### `pear.stage.prefetch <Array>`

An array of file paths to the warmup during staging in addition to all entry points. This is useful for loading assets needed to start the application quickly.

#### `pear.stage.ignore <Array>`

An array of file paths to ignore relative to `package.json` file.
