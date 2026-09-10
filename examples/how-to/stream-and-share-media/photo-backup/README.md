# pear-photo-backup

- P2P photo / short-video backup app with gallery + preview generation, running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase, hyperblobs, hypercore-blob-server, bare-media, bare-ffmpeg

## Documentation

Delta walkthrough: [Back up photos in a peer-to-peer app](https://docs.pears.com/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app).

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

Drag-and-drop images or videos into the window. Photos/videos are stored in a local
Hyperblobs store and served via `hypercore-blob-server` on 127.0.0.1.

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
