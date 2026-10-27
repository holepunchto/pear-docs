# bare-bluetooth-android (documentation snapshot)

Vendored from [holepunchto/bare-bluetooth-android](https://github.com/holepunchto/bare-bluetooth-android),
branch **`main`**, at commit `bc9f057`
([tree](https://github.com/holepunchto/bare-bluetooth-android/tree/bc9f05760382db69f85f196ccf2f5a14999ea756)),
except for the three files under `test/test-app/`, which stay at commit `ca36e9b`
([tree](https://github.com/holepunchto/bare-bluetooth-android/tree/ca36e9b16f6c15ac9f54a78e528acd8cf647260d/test/test-app))
because upstream deleted that directory. The repository has no `LICENSE` file; its `package.json`
declares Apache-2.0. Paths mirror upstream's.

These files back code imports in `content/bare/how-to/connect-over-bluetooth/` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-bluetooth-android/…#L…`):

- `test/test-app/`: the minimal native Android app (Kotlin, no React Native) that upstream used
  at `ca36e9b` to run its test suite on a phone. Upstream's `main` has since removed it (`6be8969`,
  "chore: use `bare-native-test`", whose parent is `ca36e9b`): `bare-native-test` now builds the
  test app, with `test/AndroidManifest.xml` as its manifest, so there is nothing on `main` to
  refresh these files from. They are **frozen** at `ca36e9b`, the last commit that had them. The
  guides link to the pinned tree above, not to `main`. Only three files are vendored:
  - `app/src/main/AndroidManifest.xml`: the Bluetooth permissions.
  - `app/src/main/java/to/holepunch/bare/bluetooth/test/MainActivity.kt`: requests the
    permissions at runtime before it starts the Bare Kit worklet.
  - `app/build.gradle`: the `link` and `pack` tasks that run `bare-link` and `bare-pack`, and
    the dependency on the addons' `*.classes.jar` files.
- `test/peripheral.js`: dials a bonded device without scanning first. This one follows `main`.

This is a partial, documentation-only snapshot and not runnable on its own. The rest of the test app
(`setup.sh`, `test.sh`, the Gradle project) exists only in the pinned `ca36e9b` tree, and the rest
of the test suite stays upstream.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. This is a partial snapshot of a repository that changes
often, so most of that drift won't touch the files the guides import. Copy `test/peripheral.js`
from the new commit, re-check every `#L…` range in the guides (`npm run check:code-imports` catches
ranges that fall out of bounds, not ones that drift onto different code), then bump both the
`pinned` SHA for `bare-bluetooth-android` in that workflow and the commit recorded here. Leave the
three `test/test-app/` files and their `ca36e9b` links alone.
