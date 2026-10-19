# bare-mobile-doctor (documentation snapshot)

Vendored from [holepunchto/bare-mobile-doctor](https://github.com/holepunchto/bare-mobile-doctor),
branch **`main`**, at commit `5bfe51b`
([tree](https://github.com/holepunchto/bare-mobile-doctor/tree/5bfe51b288fa66ed524502fd46fff3ef2038b4fe)).
Apache-2.0, Copyright 2025 Holepunch Inc (see upstream `LICENSE` and `NOTICE`).

Only the files behind the Bluetooth chat screen are vendored. They back the code imports in
`content/bare/how-to/connect-over-bluetooth/build-a-bluetooth-chat-for-ios-and-android.mdx` and
`content/bare/how-to/connect-over-bluetooth/set-up-bluetooth-in-a-mobile-app.mdx` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-mobile-doctor/…#L…`):

- `bare/bluetooth.js`: the Bare worklet. Advertises and scans, hands out its L2CAP PSM through
  a readable characteristic, and runs the chat over the L2CAP channel.
- `app/views/bluetooth/BluetoothTests.tsx`: the React Native screen that requests the Android
  permissions, starts the worklet and talks to it over IPC.
- `app.json`: the iOS usage description and the Android permissions.
- `package.json`: the `gen:bluetooth` bundling script and the dependency versions.
- `scripts/link.mjs`: links the worklets' native addons with `bare-link`.

This is a partial, documentation-only snapshot, so it is not runnable on its own: the rest of the
app (other screens, assets, native projects) stays upstream. It needs two physical phones and a
radio, so it is not in `scripts/test-examples.ts`.

Refresh by copying the same paths from a newer upstream commit and updating the commit above and
every `#L` range that imports from these files (`npm run check:code-imports` catches ranges that
fall out of bounds, not ones that drift onto different code).
