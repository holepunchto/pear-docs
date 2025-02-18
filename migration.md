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
Pear.teardown(() => pipe.end())
```

### Verify migration

* `pear run` the app