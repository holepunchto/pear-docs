# pear-chat

- Production-shaped peer-to-peer desktop chat: Bare chat worker, Autobase room with blind-pairing invites, on-disk persistence, separate OTA updater worker, and Tailwind UI.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase

## Documentation

Step-by-step walkthrough: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app) (part 2 of the getting started path).

This is the **shared scaffold** that chat-family and media how-to examples extend. Read it before adapting any delta under `examples/how-to/`.

> **Note:** This example embeds `pear-runtime` as a library, following the [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Usage

```shell
npm i
npm run build

# user1: create the room + print an invite
npm start -- --storage /tmp/pear-chat-user1 --name user1

# user2: join (separate terminal)
npm start -- --storage /tmp/pear-chat-user2 --name user2 --invite <invite>
```

## Build installers

```shell
npm i
npm run build
npm run make
```

## Troubleshoot

```shell
npm start -- --storage /tmp/pear-chat-user1 --name user1 --reset
```
