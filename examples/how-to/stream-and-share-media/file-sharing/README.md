# pear-file-sharing

- P2P file sharing app: each peer publishes a local "my drive" and receives the others' drives via Hyperdrive. Running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase, hyperdrive, localdrive

## Documentation

Delta walkthrough: [Share files in a peer-to-peer app](https://docs.pears.com/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Usage

```shell
npm i
npm run build

# user1: create room + print invite
npm start -- --storage /tmp/user1 --name user1

# user2: join room
npm start -- --storage /tmp/user2 --name user2 --invite <invite>
```

Drag-and-drop files into the window to add them to your local "my drive". Files appear
on peers' UIs as soon as Hyperdrive syncs them.

## Build installers

```shell
npm i
npm run build
npm run make
```

## Troubleshoot

```shell
npm start -- --storage /tmp/user1 --name user1 --reset
```
