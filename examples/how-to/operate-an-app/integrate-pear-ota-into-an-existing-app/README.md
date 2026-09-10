# integrate-pear-ota-example

- The **"before" state** for [Integrate Pear OTA into an existing Electron app](https://docs.pears.com/how-to/operate-an-app/integrate-pear-ota/electron): a plain Electron app with no `pear-runtime` dependency, no updater worker, and no `upgrade` link.

- Stack: electron

## Documentation

Walkthrough: [Integrate Pear OTA into an existing Electron app](https://docs.pears.com/how-to/operate-an-app/integrate-pear-ota/electron).

The guide's steps turn this into an app that receives peer-to-peer over-the-air
updates. Start here, follow the guide, and compare against
[pear-chat](../../../getting-started/pear-chat) — the finished reference for the
same wiring.

## Usage

```shell
npm i
npm start
```

## What is deliberately missing

The guide adds each of these in turn; none of them are here yet.

| Missing | Added by |
| --- | --- |
| `pear-runtime` and the updater worker's dependencies | Install the dependencies |
| `upgrade` field in `package.json` | First-time `package.json` setup |
| `workers/main.js` | Add a dedicated updater worker |
| Updater spawn + `pear:applyUpdate` / `app:afterUpdate` IPC handlers | Wire the main process |
| `applyUpdate` / `appAfterUpdate` / `onPearEvent` on the preload bridge | Expose `applyUpdate` and `appAfterUpdate` on the preload bridge |
| A renderer script driving `#update-banner` | Wire a UI affordance |

`version` is already `1.0.0` — it is a normal `package.json` field, and the
guide only needs `upgrade` added beside it.

## Verify the config contract

`check-config.js` reads `version` and `upgrade` back out of `package.json` the
same way the updater worker's `argv()` helper will. It is what the guide's
executable example runs:

```shell
npm pkg set upgrade=pear://qxenz5wmspmryjc13m9yzsqj1conqotn8fb4ocbufwtz9mtbqq5o
node check-config.js
```
