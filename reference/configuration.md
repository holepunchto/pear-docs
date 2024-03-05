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

#### `pear.gui.backgroundColor <String>` (default: "#000" non-transparent, "#00000000" transparent)

Background color (Hex, RGB, RGBA, HSL, HSLA, CSS color).

### `pear.stage <Object>`

Staging configuration options.

#### `pear.stage.entrypoints <Array>`

An array of entrypoints as staging start-points in addition to (deduped) main entry point.

#### `pear.stage.ignore <Array>`

An array of file paths to ignore relative to `package.json` file.
