# Migration

Pear v2 introduces a breaking change to the application entrypoint and includes several API deprecations.

Pear v1 supports HTML entrypoints, while Pear v2 supports only JavaScript entrypoints.

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
2. `pear-electron` is the UI library for v2, `pear-bridge` provides http-p2p functionality for electron, installing them into a v1 application makes it v2 ready prior to v2 release.
3. `pear.pre` is a v2 feature that runs pre-run (from disk) and pre stage. pear-electron/pre is a script that autosets `pear.assets.ui` and `pear.stage.entrypoints` (for html script tag entrypoint warmups)
4. v2 applications only run `.js` files. The `pear-electron` `index.js` template starts desktop application code in electron UI. `pear-bridge` `waypoint` option is a catch-all HTML file for unmatched pathnames - this allows for in-app UI routing, which overrides v2 default behaviour of opening specified routes as UI application paths.

There are two migratory scenarios:

* Pre-transitional Migration: a Pear v1 application, preparing to migrate to Pear v2 prior to Pear v2 release
* Post-transitional Migration: a Pear v1 application updating to Pear v2 after Pear v2 release has occurred

This strategy should work in both scenarios. After v2 is released however, `main` field can be set to any JS file and `pear-bridge` waypoint can be set to any `index.html` file.


## API Migration

The Pear v2 API deprecates all UI related methods now exported from `pear-electron` and a few others that have been moved to modules or renamed.

### `Pear` -> `ui`

```js
import ui from `pear-electron`
```

* `Pear.media` -> `ui.media`
* `Pear.tray` -> `ui.app.tray`
* `Pear.badge` -> `ui.app.badge`
* `Pear.Window` -> `ui.Window`
* `Pear.View` -> `ui.View`
* `Pear.Window.self` / `Pear.View.self` -> `ui.app`

### `Pear` -> `pear-*`

* `Pear.worker.run` -> [`pear-run`](https://github.com/holepunchto/pear-run)
* `Pear.worker.pipe` -> [`pear-pipe`](https://github.com/holepunchto/pear-pipe)
* `Pear.message` -> [`pear-message`](https://github.com/holepunchto/pear-message)
* `Pear.messages` -> [`pear-messages`](https://github.com/holepunchto/pear-messages)
* `Pear.wakeups` -> [`pear-wakeups`](https://github.com/holepunchto/pear-wakeups)
* `Pear.updates` -> [`pear-updates`](https://github.com/holepunchto/pear-updates)

### `Pear`

* `Pear.config` -> `Pear.app`
* `Pear.reload` -> `location.reload`


### Compat Mode

While v1 Pear APIs will continue to function (with deprecation messages), for projects that need a legacy-bridge during overlapping transitional periods, compat-mode can be opted into which will

* Silence deprecation warnings
* Ensure legacy methods to continue to function after their removal for a longer time period
* Limit ability to use new APIs in future
* Eventually itself be deprecated & removed

Compat mode is a temporary transitioning utility, if usage can be avoided in favour of moving to the equivalent methods this avoids potential for legacy lock-in.

Enable with `<script>Pear.constructor.COMPAT = true</script>` at the top of the `<head>` element in the HTML entrypoint and `Pear.constructor.COMPAT = true` at the top of worker or terminal app entrypoints.

Compat mode isn't needed for premigration, only if time is needed for the application to transition to equivalent v2 APIs.

## Config Migration

The `package.json` `pear` field supplies configuration information for Pear applications.

* `pear.userAgent` -> `pear.gui.userAgent`
* `pear.gui.hideable` -> `pear.gui.closeHides`

### Route-Handling Migration

If applications are performing route handling, in v2 it is necessary for an application to opt-in to routing.

In v1 when a `pear://` link is clicked outside of the application (e.g. in another app), or supplied to `pear run` the application is either opened, or sent a wakeup notification if already open.

When opened, `Pear.config.linkData` contains the pear:// link pathname with the leading `/` omitted. For example pear://runtime/pathname/to/some/where `linkData` would be `pathname/to/some/where`.

When woken, `Pear.updates((wakeup) => {})` provides `wakeup.linkData`.

In v2 `linkData` is still available in both cases, but soft-deprecated in favor of v2 routing:

* `Pear.app.route` & `wakeup.route` - full pathname: pear://runtime/pathname/to/some/where -> `/pathname/to/some/where`.
* `Pear.app.fragment` & `wakeup.fragment` - location hash without `#`: pear://runtime/pathname#something -> `something`
* `Pear.app.query` & `wakeup.query` - query string without `?`. pear://runtime/pathname?some-query -> `some-query`

In v1 any link regardless of pathname ends up opening/waking the application. In v2, by default, pathnames are treated as sub-apps. This means `pear run` and `pear-run` can execute any valid file staged to a Pear application. Therefore in v2, it is necessary to opt-in via route mapping using `package.json` `pear.routes`. For example:

```json
{
  "pear": {
    "routes": {
      "/from/pathname/": "foo.js"
    }
  }
}
```

This configuration would route `pear://yourapp/from/pathname` to `pear://yourapp/foo.js` but it's `Pear.app.route` / `wakeup.route` would be `/from/pathname`.

To opt-in fully to v1 behaviour the catch-all can be used:

```json
{
  "pear": {
    "routes": "."
  }
}
```

The configuration routes all pathnames to the application entrypoint.

The `pear.unrouted` field may be used provide exceptions to the catch-all, for instance in order to run a sub-app (a "worker").

```json
{
  "pear": {
    "routes": ".",
    "unrouted": ["./bots"]
  }
}
```
