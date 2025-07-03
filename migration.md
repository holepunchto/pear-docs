# Migration

Pear v2 has an application entrypoint breaking change and API deprecations.

Pear v1 supports HTML entrypoints, Pear v2 does not, it supports only JS entrypoints.

## Migration Strategy

To prepare a Pear Desktop Application written for Pear v1 to seamlessly migrate to v2 prior to v2 release use the following strategy:

1. Ensure the project `package.json` `main` field is **unset** and ensure that the HTML entry file is named `index.html`.
2. Install dependencies: `npm install pear-electron pear-bridge`
3. Set `package.json` `pear.pre` field to `pear-electron/pre`
4. Add an `index.js` file per `pear-electron` https://github.com/holepunchto/pear-electron/blob/main/template/index.js
  * alter `waypoint` to `/index.html`: `const bridge = new Bridge({ waypoint: '/index.html' })`

### Explanation

List numbers correspond as explanations for items in Pear v1 to Pear v2 Pre-transitional Migration Strategy.

1. v1 supports `.html` `main` fields, v2 only supports `.js` fields. This approach relies on `index.html` (v1) and `index.js` (v2) `main` field defaults so that when the update occurs from v1 to v2 there's no validation issue on the `main` field and the entrypoint exists whichever version of Pear the app is running on.
2. `pear-electron` is the UI library for v2, `pear-bridge` provides http-p2p functionality for electron, installing them into a v1 application makes it v2 ready pror to v2 release.
3. `pear.pre` is a v2 feature that runs pre-run (from disk) and pre stage. pear-electron/pre is a script that autosets `pear.assets.ui` (which must be manually set prior to transition) and `pear.stage.entrypoints` (for html script tag entrypoint warmups)
4. v2 applications only run `.js` files. The `pear-electron` `index.js` template starts desktop application code in electron UI. `pear-bridge` `waypoint` option is a catch-all HTML file for unmatched pathnames - this allows for in-app UI routing, which overrides v2 default behaviour of opening specified routes as UI application paths.

There are two migratory scenarios:

* Pre-transitional Migration: a Pear v1 application, preparing to migrate to Pear v2 prior to Pear v2 release
* Post-transitional Migration: a Pear v1 application updating to Pear v2 after Pear v2 release has occurred

This strategy should work in both scenarios. After v2 is released however, `main` field can be set to any JS file and `pear-bridge` waypoint can be set to any `index.html` file.


## API Migration

The Pear v2 API deprecates all UI related methods as well as `Pear.worker.run()` (for `Pear.run()`) and `Pear.worker.pipe()` (for `Pear.pipe`). While these methods are v1 compatible upon release, they will be removed from v2 in future and should be accessed from the  `pear-electron` API.

```js
import ui from `pear-electron`
```

* `Pear.media` -> `ui.media`
* `Pear.tray` -> `ui.app.tray`
* `Pear.badge` -> `ui.app.badge`
* `Pear.Window` -> `ui.Window`
* `Pear.View` -> `ui.View`
* `Pear.Window.self` / `Pear.View.self` -> `ui.app`
* `Pear.worker.run()` -> `Pear.run()`
* `Pear.worker.pipe()` -> `Pear.pipe`

### Compat Mode

While v1 Pear APIs will continue to function (with deprecation messages), for projects that need a legacy-bridge during overlapping transitional periods, compat-mode can be opted into which will

* Silence deprecation warnings
* Ensure legacy methods to continue to function after their removal for a longer time period
* Limit ability to use new APIs in future
* Eventually itself be deprecated & removed

Compat mode is a temporary transitioning utility, if usage can be avoided in favour of moving to the equivalent methods this avoids potential for legacy lock-in.

Enable with `<script>Pear.constructor.COMPAT = true</script>` at the top of the `<head>` element in the HTML entrypoint and `Pear.constructor.COMPAT = true` at the top of worker or terminal app entrypoints.

Compat mode isn't needed for premigration, only if time is needed for the application to transition to equivalent v2 APIs.
