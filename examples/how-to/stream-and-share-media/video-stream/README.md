# pear-video-stream

- P2P video sharing app with inline playback (HTTP blob server in worker), running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, autobase, hyperblobs, hypercore-blob-server

## Documentation

Delta walkthrough: [Stream stored video in a peer-to-peer app](https://docs.pears.com/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app).

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

# user2: join room (separate terminal)
npm start -- --storage /tmp/user2 --name user2 --invite <invite>
```

Drag-and-drop video files into the window to share them. Each video is served from a
local `hypercore-blob-server` (HTTP, 127.0.0.1) and streamed to peers via Hypercore.

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
