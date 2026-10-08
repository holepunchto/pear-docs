# pear-chat (minimal)

- Minimal peer-to-peer desktop chat: Electron shell, Bare worker, and Hyperswarm — no persistence, OTA, or packaging.

- Stack: electron, pear-runtime, hyperswarm

## Documentation

Step-by-step walkthrough: [Build a peer-to-peer chat](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat) (part 1 of the getting started path).

> **Next:** [Reshape into a production app](https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app) adds persistence, pairing, OTA wiring, and the full `hello-pear-electron` scaffold.

## Usage

```shell
npm i
npm start
```

Open a second terminal in this folder and run `npm start` again. Within a few seconds both windows show `peers: 1`; messages typed in one window appear in the other.
