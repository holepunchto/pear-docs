# pear-chat-blind-peering

- P2P chat app using blind peering, running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, blind-peering, hyperdb, hrpc, autobase

## Documentation

Delta walkthrough: [Add blind peering to a chat app](https://docs.pears.com/how-to/store-and-replicate/add-blind-peering-to-a-chat-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/production-shape).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Usage

```shell
npm i
npm run build

# run a blind peer (separate terminal) + print listening-key
npm i -g blind-peer-cli@latest
npx blind-peer -s /tmp/blind1

# user1: create room + print invite
npm start -- --storage /tmp/user1 --name user1 --blind-peer-key <listening-key>

# user2: join room
npm start -- --storage /tmp/user2 --name user2 --blind-peer-key <listening-key> --invite <invite>
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
