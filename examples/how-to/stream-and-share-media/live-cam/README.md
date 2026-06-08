# pear-live-cam

- P2P live camera streaming app. Each peer captures from a local webcam via ffmpeg (fragmented MP4) and streams the H.264 fragments over Hypercore. Running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase, hyperblobs, hypercore-blob-server, bare-ffmpeg, bare-subprocess

## Documentation

Delta walkthrough: [Stream a live camera in a peer-to-peer app](https://docs.pears.com/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Prerequisites

Install `ffmpeg` so the worker can fall back to a system ffmpeg if `bare-ffmpeg` fails.

```shell
brew install ffmpeg          # macOS
apt-get install -y ffmpeg    # Debian/Ubuntu
```

On macOS, the first launch will prompt for camera and microphone access. Grant both
and restart the app so ffmpeg can open the AVFoundation device.

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
