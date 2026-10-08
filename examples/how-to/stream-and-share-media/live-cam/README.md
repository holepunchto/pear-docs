# pear-live-cam

- P2P live camera streaming app. The creator captures its webcam in the renderer via the browser `getUserMedia` + `MediaRecorder` APIs (WebM/VP8) and uploads the raw WebM fragments as Hyperblobs. Viewers replicate the fragments, fetch them from `hypercore-blob-server`, and reassemble the stream with `MediaSource`. Running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hyperdispatch, autobase, hyperblobs, hypercore-blob-server

## Documentation

Delta walkthrough: [Stream a live camera in a peer-to-peer app](https://docs.pears.com/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Prerequisites

The creator captures video with the browser `getUserMedia` API, so the host
machine needs a webcam. Capture is video-only (`audio: false`), so no microphone
is required.

On macOS, the first launch prompts for camera access. Grant it and restart the
app if the prompt appeared after capture already started.

## Usage

```shell
npm i
npm run build

# user1: create room + print invite
npm start -- --storage /tmp/user1 --name user1

# user2: join room
npm start -- --storage /tmp/user2 --name user2 --invite <invite>
```

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
