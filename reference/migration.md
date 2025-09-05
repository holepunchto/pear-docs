# Migration

Pear v2 introduces a breaking change to the application entrypoint and includes several API deprecations.

Pear v1 supports HTML entrypoints, while Pear v2 supports only JavaScript entrypoints.

## Migration Scenarios

There are two migratory scenarios:

* Pre-transitional Migration: a Pear v1 application, preparing to migrate to Pear v2 prior to Pear v2 release
* Post-transitional Migration: a Pear v1 application updating to Pear v2 after Pear v2 release has occurred

In both cases the Migration Strategy will work.

## Migration Strategy

To prepare a Pear Desktop Application written for Pear v1 to seamlessly migrate to v2 prior to v2 release use the following strategy:

1. Ensure the project `package.json` `main` field is **unset** and ensure that the HTML entry file is named `index.html`.
2. Install dependencies: `npm install pear-electron pear-bridge`
3. Set `package.json` `pear.pre` field to `pear-electron/pre`
4. Add an `index.js` file that uses `pear-electron` and `pear-bridge`:

```js
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

const bridge = new Bridge()
await bridge.ready()

const runtime = new Runtime()
const pipe = await runtime.start({ bridge })
pipe.on('close', () => Pear.exit())
```

Install the dependencies:

```sh
npm install pear-electron pear-bridge
```

### Explanation

List numbers correspond as explanations for items in Pear v1 to Pear v2 Pre-transitional Migration Strategy.

1. v1 supports `.html` `main` fields, v2 only supports `.js` fields. This approach relies on `index.html` (v1) and `index.js` (v2) `main` field defaults so that when the update occurs from v1 to v2 there's no validation issue on the `main` field and the entrypoint exists whichever version of Pear the app is running on.
2. `pear-electron` is the UI library for v2, `pear-bridge` provides http-p2p functionality for electron, installing them into a v1 application makes it v2 ready prior to v2 release.
3. `pear.pre` is a v2 feature that runs pre-run (from disk) and pre-stage. `pear-electron/pre` is a script that autosets `pear.assets.ui` and `pear.stage.entrypoints` (for html script tag entrypoint warmups)
4. v2 applications only run `.js` files. The `index.js` file starts desktop application code in electron UI.

## Config Migration

The `package.json` `pear` field supplies configuration information for Pear applications.

* `pear.userAgent` -> `pear.gui.userAgent`
* `pear.gui.hideable` -> `pear.gui.closeHides`

When preparing for v2 in advance, both fields must be present:

```json
"pear": {
  "userAgent": "custom user agent",
  "gui": {
    "userAgent": "custom user agent",
    "hideable": true,
    "closesHides": true
  }
}
```

### Route-Handling Migration

If applications are performing route handling, in v2 it is necessary for an application to opt-in to routing.

In v1 when a `pear://` link is clicked outside of the application (e.g. in another app), or supplied to `pear run` the application is either opened, or sent a wakeup notification if already open.

When the application is opened, `Pear.config.linkData` contains the pathname of the `pear://` link, excluding the leading `/`. For example pear://runtime/pathname/to/some/where `linkData` would be `pathname/to/some/where`.

When woken, `Pear.updates((wakeup) => {})` provides `wakeup.linkData`.

In v2 `linkData` is still available in both cases, but soft-deprecated in favor of v2 routing:

* `Pear.app.entrypoint` & `wakeup.entrypoint` - full pathname: pear://runtime/pathname/to/some/where -> `/pathname/to/some/where`. The `entrypoint` is mapped per `pear.routes` configuration.
* `Pear.app.fragment` & `wakeup.fragment` - location hash without `#`: pear://runtime/pathname#something -> `something`
* `Pear.app.query` & `wakeup.query` - query string without `?`. pear://runtime/pathname?some-query -> `some-query`

To opt-in fully to v1 behavior the catch-all `routes` config can be used:

```json
{
  "pear": {
    "routes": "."
  }
}
```

## API Migration

The Pear v2 API deprecates all UI related methods now exported from `pear-electron` and a few others that have been moved to modules or renamed.

### `Pear` -> `ui`

```js
import ui from 'pear-electron'
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

## Verifying Migration

Verify in development with

 ```sh
 pear run -d .
 ```
 
Production equivalent verification:

```sh
pear stage check
``` 

Then per link output from stage command:

```sh
pear run <link>
```

If the application starts and operates correctly in any related areas where changes have been made, then migration is verified.

If the SemVer printed by `pear -v` is 2.x.x then migration verification is complete.

If the SemVer printed by `pear -v` is 1.x.x then these steps need to performed on v2 also. 

Switch to v2 with:

```sh
pear sidecar --key dhpc5npmqkansx38uh18h3uwpdp6g9ukozrqyc4irbhwriedyeho
```

This will run the current sidecar in the terminal and switch to the v2 release line per the supplied key.

The command should output something similar to:

```sh
- Closing any current Sidecar clients...
- Shutting down current Sidecar...
✔ Sidecar has shutdown
- Rebooting current process as Sidecar
  - [ pqbzjhqyonxprx8hghxexnmctw75mr91ewqw5dxe1zmntfyaddqy ]
- Runtime: pear-runtime

========================= INIT ===================================

- Sidecar Booting [+0ms]

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

✔ Current process is now Sidecar
- Version: {
    "key": "pqbzjhqyonxprx8hghxexnmctw75mr91ewqw5dxe1zmntfyaddqy",
    "length": 9195,
    "fork": 0
  }

========================= RUN ====================================

- Switching to key dhpc5npmqkansx38uh18h3uwpdp6g9ukozrqyc4irbhwriedyeho with length 3097... [+261.4711ms]
Platform update Available. Restart to update to: [+367.2348ms]
 v0.3097.dhpc5npmqkansx38uh18h3uwpdp6g9ukozrqyc4irbhwriedyeho [+0.0349ms]
- DHT known-nodes read from database 100 nodes [+4631.6207ms]
- Drive bundle dhpc5npmqkansx38uh18h3uwpdp6g9ukozrqyc4irbhwriedyeho core length: 3097 [+5.1877ms]
- Sidecar swarm joining discovery key of dhpc5npmqkansx38uh18h3uwpdp6g9ukozrqyc4irbhwriedyeho [+0.0797ms]
- Sidecar Booted [+1.1023ms]
```

Once the "Restart to update" message is observed, use ctrl+c to close the sidecar and then run `pear -v` to verify that the key is correct. If it isn't, try again. If it is, verify the application on v2.

Verify in development with

 ```sh
 pear run -d .
 ```
 
Production equivalent verification:

```sh
pear stage check
``` 

Then per link output from stage command:

```sh
pear run -d <link>
```

If the application starts and operates correctly, then migration is verified.

Once verified, switch back to production:

```sh
pear sidecar --key pqbzjhqyonxprx8hghxexnmctw75mr91ewqw5dxe1zmntfyaddqy
```

If there's any problems switching back, make sure there are no `pear-runtime` processes running and run `npx pear`.

>  ⚠️ **WARNING:** Omitting to switch back to production Pear leaves the system on a release-line that will be ended. 
>
>  **In order to avoid any issues, be sure to switch back to production [ pqbzjhqyonx... ]**
>

## Compat Mode

While v1 Pear APIs will continue to function with deprecation messages, for projects that need a legacy-bridge during overlapping transitional periods, compat-mode can be used to:

* Silence deprecation warnings
* Ensure legacy methods to continue to function after their removal for a longer time period
* Limit ability to use new APIs in future
* Eventually itself be deprecated & removed

Compat mode is a temporary transitioning utility, if usage can be avoided in favour of moving to the equivalent methods this avoids potential for legacy lock-in.

Enable with `<script>Pear.constructor.COMPAT = true</script>` at the top of the `<head>` element in the HTML entrypoint and `Pear.constructor.COMPAT = true` at the top of worker or terminal app entrypoints.

Compat mode isn't needed for premigration, only if time is needed for the application to transition to equivalent v2 APIs.