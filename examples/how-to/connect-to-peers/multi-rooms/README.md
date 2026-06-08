# pear-chat-multi-rooms

- P2P chat app with multiple rooms, running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase

## Documentation

Delta walkthrough: [Host multiple rooms in one chat app](https://docs.pears.com/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/production-shape).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Usage

```shell
npm i
npm run build

# user1: create account + print invite
npm start -- --storage /tmp/user1 --name user1

# user2: join account (in a separate terminal)
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
