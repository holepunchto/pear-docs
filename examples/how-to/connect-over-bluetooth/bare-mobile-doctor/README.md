# bare-mobile-doctor (documentation snapshot)

Vendored from [holepunchto/bare-mobile-doctor](https://github.com/holepunchto/bare-mobile-doctor),
branch **`main`**, at commit `b59f79b`
([tree](https://github.com/holepunchto/bare-mobile-doctor/tree/b59f79b207f9173cca9362999e0080224fd808ca)).
Apache-2.0, Copyright 2025 Holepunch Inc (see upstream `LICENSE` and `NOTICE`).

Only the files behind the Bluetooth chat screen are vendored. They back code imports in the guides under
`content/bare/how-to/connect-over-bluetooth/` (via
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

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. This is a partial snapshot of a repository that changes
often, so most of that drift won't touch the files the guides import. Copy the imported files from the
new commit, re-check every `#L…` range in the guides (`npm run check:code-imports` catches ranges that
fall out of bounds, not ones that drift onto different code), then bump both the `pinned` SHA for
`bare-mobile-doctor` in that workflow and the commit recorded here.
