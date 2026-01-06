# Configuration

<mark style="background-color: #8484ff;">**stable**</mark>

## The `package.json` file<a name="package-json"></a>

A Pear project **must** have a `package.json` file and a main entry file.

The `package.json` file **must** have either a `name` property or `pear` object with a `name` property.

The `package.json` `name` field must be lowercase and one word, and may contain letters, numbers, hyphens (`-`), underscores (`_`), forward slashes (`/`) and asperands (`@`).

The `package.json` file may also contain a `main` field, which typically should point to an HTML file. If omitted, `index.html` or `index.js` is the default entry file depending on application type.

Any other fields (such as `dependencies`) may also be present in the `package.json` file.

The `package.json` `pear` object contains application configuration and is exposed via the API as `pear.config.options`.

Pear versioning is automatic. The `package.json` file does **not** require a version field, the version field will be ignored.

## The `package.json` `pear` field.<a name="pear"></a>

### `pear.name <String>`<a name="pear-name"></a>

The name of the application. Overrides `package.json` `name`.

### `pear.stage <Object>`<a name="pear-stage"></a>

Staging configuration options.

#### `pear.stage.entrypoints <Array>`<a name="pear-stage-entrypoints"></a>

An array of entrypoint paths as staging start-points in addition to (deduped) main entry point.

#### `pear.stage.ignore <Array>`<a name="pear-stage-ignore"></a>

An array of file paths to ignore relative to `package.json` file.

#### `pear.stage.includes <Array>`<a name="pear-stage-includes"></a>

Explicitly declare paths to include.

Ensures warmup during staging in addition to all `stage.entrypoints` which can improve application start time.

When used with `pear stage --compact` command flag `pear.stage.includes` can be used to ensure any files that aren't recognized via JavaScript static analysis - which would be any non-JavaScript files, any files that aren't required/imported or any files that are imported/required using an expression in code - eg `require(getPkgName())` would mean
whatever is required wouldn't be identified in static analysis so would need to be added to `pear.stage.includes`.

#### `pear.stage.defer <Array>`<a name="pear-stage-defer"></a>

An array of dependency specifiers, as used with `require` or `import`, to declare it as an uninstalled optional or peer dependency in the dependency tree. Some modules use the pattern: `try { require('a-dep') } catch { fallback() }`, in order to try to include an optional dependency if available. Adding such specifiers (`a-dep` in the example) to the `pear.stage.defer` configuration array let's the static-analysis steps during `pear stage` (compact and warmup phases) step over these cases. If there are a lot of cases like this in an applications dependency tree, it will slow the static-analysis phases down since by default it brute forces and grows a dynamic defers list until there's no MODULE_NOT_FOUND errors left. The `pear stage` command will print out skip hints for these dependencies - add any specifiers identified to `pear.stage.defer`.

### `pear.pre <String>`<a name="pear-pre"></a>

A specifier such as `./path/to/pre.js` or `some-module`, or `pear-electron/pre`.

The specifier must point to a script that executes prior to run-from-disk, prior to stage but **not** prior to run-from-link:

* `pear run ./some-dir` - `pre` specifier executes prior
* `pear stage ./some-dir` - `pre` specifier executes prior
* `pear run pear://some/link` - `pre` specifier **does not** execute

When a `pre` script is executed, it has a `pipe` available which can be obtained via [`pear-pipe`](https://github.com/holepunchto/pear-pipe). This can be used to modify configuration which is sent as [`compact-encoding`](https://github.com/holepunchto/compact-encoding) `any` encoding (i.e. an encoded object, like JSON). The first encoded object sent to `pipe` is the application configuration. The first response expected on the pre scripts `pipe` by the `pear run` or `pear stage` command is an `any` encoded configuration object. This allows the prescript to send back mutated application configuration back to `pear run` or `pear stage`. The application is then loaded with that mutated confiruation in the case of `pear run`, in the case of `pear stage` the configuration overrides the application drives `manifest` property. The `pear info --manifest <link>` command can be used to view any mutated configuration post-stage.

### `pear.routes <Object|String>`<a name="pear-routes"></a>

By default, [`pear run`](./cli.md#pear-run) considers link pathnames to be entrypoints. This means `pear run` can execute any valid file staged to a Pear application. For example `pear run pear://<key>/some/path.js` would run some/path.js if it's valid. In that case [`Pear.app.route`](./api.md#pear-app-route) would contain `/some/path.js` and [`Pear.app.entrypoint`](./api.md#pear-app-entrypoint) would also contain `/some/path.js`.

To opt-out, and only allow top-level running set `Pear.routes` to `.` or `/` (it means the same thing):

```json
{
  "pear": {
    "routes": "."
  }
}
```

This redirects all paths to the entrypoint.

In this case `pear run pear://<key>/some/path.js` would run the application entrypoint, [`Pear.app.route`](./api.md#pear-app-route) would contain `/some/path.js` while [`Pear.app.entrypoint`](./api.md#pear-app-entrypoint) would also be `/` - because `Pear.app.route` holds the raw pathname whereas `Pear.app.entrypoint` holds the mapped pathname.

The `pear.routes` configuration can also be an object where the keys are pathnames to map from, and the values are pathnames to map to:

```json
{
  "pear": {
    "routes": {
      "/from/path": "/to/path"
    }
  }
}
```

When `routes: "."` is used in conjuction with [`pear-electron`](https://github.com/holepunchto/pear-electron) and [`pear-bridge` `waypoint` option](https://github.com/holepunchto/pear-bridge/#options) this enables in-app single-page-application routing.


### `pear.unrouted <Array>`<a name="pear-unrouted"></a>

Array of paths to exclude from any routing rules in [`pear.routes`](#pear-routes).


### `pear.assets <Object>`<a name="pear-assets"></a>

Asset declarations to fetch and store on disk on behalf of the application.

By convention namespaces (the object keys) should be used to describe the asset type.

In particular, Desktop applications should use the `ui` namespace to declare UI assets.

Asset objects take the form `{link, name?, only?}`.

* `link` `<String>` - Required. The  `pear://<fork>.<length>.<key>` link to fetch the assets from. The link must contain the full version (`fork.length.key`)
* `name` `<String>` - Optional. Used in UI integration libraries such as [`pear-electron`](https://github.com/holepunchto/pear-electron) to determine bin name.
* `only` `<Array<String>>` - Optional. An array of drive keys (pathnames) to exclusively fetch from the link with interpolation support for a special `%%HOST%%` keyword which is mapped to `<platform>-<architecture>` as in: `linux-x64`, `darwin-arm64` etc. This is useful for asset builds per OS and CPU architecture.

Example:

```JSON
{
  "pear": {
    "assets": {
      "ui": {
        "link": "pear://0.940.pkzpbccx8ojp4516p7abompuhyj5gcpqfux1s9e7e4zzcdhyhdto",
        "name": "Pear Runtime",
        "only": [
          "/boot.bundle",
          "/by-arch/%%HOST%%",
          "/prebuilds/%%HOST%%"
        ]
      }
    }
  }
}
```

The `pear.assets` config isn't just for User Interface runtimes, such as [`pear-electron`](https://github.com/holepunchto/pear-electron), it's for any assets that needs to be placed on disk for some reason, such as llms, prebuilds, other runtimes/binaries.

Declared assets are updated onto user machines passively while the application is running.
Initial assets are fetched by `pear run` on first-run but application installers/distributables call `pear run --preflight <link>` to ensure the assets are in place prior to first-run.

While assets can be declared directly on the `pear.assets` as described but when used in combination with [`pear.pre`](#pear-pre), installable modules such as [`pear-electron`](https://github.com/holepunchto/pear-electron) can also automatically define assets (and other configuration) on behalf of the application.

Assets are automatically stored in the platform folder. Use [`Pear.app.assets[namespace].path`](./api.md#pear-app-assets) within the application to get the path to the asset. For example, `Pear.assets.ui.path`.

###  `pear.links <Object|Array>`<a name="pear-links"></a>

Storing and managing Pear application links and domains.

`links` can be an object or an array. If it's an object, naming the key makes it easy to reference from [`Pear.config.links`](./api.md#pear-config)

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

### `pear.gui <Object>`<a name="pear-gui"></a>

Graphical User Interface configuration options.

This is a namespace reserved for UI integration libraries to use for configuration options.

Defined per UI Integration library.

* [pear-electron pear.gui](https://github.com/holepunchto/pear-electron#graphical-user-interface-options-)


#### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `pear.stage.prefetch <Array>`

Deprecated, use `pear.stage.includes`.

### <mark style="background-color: #ffffa2;">**DEPRECATED**</mark> `pear.userAgent <string>` (default: `Pear ${Pear.#state.id}`)

Deprecated. Use `pear.gui.userAgent` per [pear-electron pear.gui](https://github.com/holepunchto/pear-electron#graphical-user-interface-options-)