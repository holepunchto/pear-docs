# bare-bluetooth-android (documentation snapshot)

Vendored from [holepunchto/bare-bluetooth-android](https://github.com/holepunchto/bare-bluetooth-android),
branch **`main`**, at commit `ca36e9b`
([tree](https://github.com/holepunchto/bare-bluetooth-android/tree/ca36e9b16f6c15ac9f54a78e528acd8cf647260d)).
The repository has no `LICENSE` file; its `package.json` declares Apache-2.0. Paths mirror
upstream's.

These files back code imports in `content/bare/how-to/connect-over-bluetooth/` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-bluetooth-android/…#L…`):

- `test/test-app/`: the minimal native Android app (Kotlin, no React Native) upstream uses to
  run its test suite on a phone. Only three files are vendored:
  - `app/src/main/AndroidManifest.xml`: the Bluetooth permissions.
  - `app/src/main/java/to/holepunch/bare/bluetooth/test/MainActivity.kt`: requests the
    permissions at runtime before it starts the Bare Kit worklet.
  - `app/build.gradle`: the `link` and `pack` tasks that run `bare-link` and `bare-pack`, and
    the dependency on the addons' `*.classes.jar` files.
- `test/peripheral.js`: dials a bonded device without scanning first.

This is a partial, documentation-only snapshot and not runnable on its own; the full app, with
`setup.sh` and `test.sh`, and the rest of the test suite stay upstream.
