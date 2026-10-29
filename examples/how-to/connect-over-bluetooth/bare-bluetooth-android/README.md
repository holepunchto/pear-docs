# bare-bluetooth-android (documentation snapshot)

Vendored from [holepunchto/bare-bluetooth-android](https://github.com/holepunchto/bare-bluetooth-android),
branch **`main`**, at commit `bc9f057`
([tree](https://github.com/holepunchto/bare-bluetooth-android/tree/bc9f05760382db69f85f196ccf2f5a14999ea756)).
The repository has no `LICENSE` file; its `package.json` declares Apache-2.0. Paths mirror
upstream's.

These files back code imports in `content/bare/how-to/connect-over-bluetooth/` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-bluetooth-android/…#L…`):

- `test/AndroidManifest.xml`: the manifest that upstream's tests build their Android app from. It
  is a template: `bare-native-test` fills in the `${…}` placeholders. The guide imports the three
  Bluetooth permissions from it. Upstream used to keep a hand-written Kotlin test app under
  `test/test-app/`. It deleted that in `6be8969` ("chore: use `bare-native-test`"), so the
  snapshot no longer has those files, and the guides don't link to them.
- `test/peripheral.js`: dials a bonded device without scanning first.

This is a partial, documentation-only snapshot and not runnable on its own. The rest of the test
suite stays upstream.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. This is a partial snapshot of a repository that changes
often, so most of that drift won't touch the files the guides import. Copy `test/AndroidManifest.xml`
and `test/peripheral.js` from the new commit, re-check every `#L…` range in the guides
(`npm run check:code-imports` catches ranges that fall out of bounds, not ones that drift onto
different code), then bump both the `pinned` SHA for `bare-bluetooth-android` in that workflow and
the commit recorded here.
