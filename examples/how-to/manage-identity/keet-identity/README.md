# pear-chat-identity

- P2P chat app with user identity (mnemonic-based), running in an Electron desktop shell with embedded `pear-runtime`.

- Stack: holepunch, bare, electron, pear-runtime, corestore, hyperswarm, blind-pairing, hyperdb, hrpc, autobase, keet-identity-key

## Documentation

Delta walkthrough: [Add Keet identity to a chat app](https://docs.pears.com/how-to/manage-identity/add-keet-identity-to-a-chat-app).

Build the shared scaffold first: [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app).

> **Note:** This example was migrated off the deprecated `pear run` workflow. The app
> is now an Electron app that embeds `pear-runtime` as a library, following the
> [hello-pear-electron](https://github.com/holepunchto/hello-pear-electron) template.

## Usage

```shell
npm i
npm run build

# user1: create room + print invite (mnemonic generated on first run)
npm start -- --storage /tmp/user1 --name user1

# user2: join room
npm start -- --storage /tmp/user2 --name user2 --invite <invite>
```

Pass `--mnemonic <24 words>` to reuse an existing identity. The mnemonic is otherwise
persisted under `<storage>/identity-mnemonic.txt`.

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
