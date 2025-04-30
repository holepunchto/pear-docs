# Migration

## Pear v1.x.x to Pear v2.x.x

* v1 supports `.html` entrypoints, v2 does not
* to migrate, use a `.js` entrypoint that uses [pear-electron](https://github.com/holepunchto/pear-electron) and [pear-bridge](https://github.com/holepunchto/pear-bridge)

### Modify `package.json`

* `package.json` `main` must point to a `.js` file instead of `.html`, e.g. `index.html` -> `index.js`
* `pear-electron` and `pear-bridge` must be specified in `dependencies`
* add a `bootstrap` field to `package.json` `scripts`: `"bootstrap": "pear-electron"`, optionally also do `"postinstall": "npm run bootstrap"`.

### Create JS entrypoint

```
/** @typedef {import('pear-interface')} */
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

const runtime = new Runtime()

const bridge = new Bridge()
await bridge.ready()

const pipe = runtime.start({ bridge })
// use pipe duplex stream for communication with ui
```

On the UI the other side of the pipe can be accessed via `Pear.pipe`.
Passing the `pipe` to an RPC library, such as `bare-rpc` allows for an architecture where application logic is in the Pearend (entrypoint app) with the UI containing only UI logic.


### Verify migration

* `pear run` the app