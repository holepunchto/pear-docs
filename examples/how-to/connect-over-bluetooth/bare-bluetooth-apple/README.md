# bare-bluetooth-apple (documentation snapshot)

Vendored from [holepunchto/bare-bluetooth-apple](https://github.com/holepunchto/bare-bluetooth-apple),
branch **`main`**, at commit `e823f6d`
([tree](https://github.com/holepunchto/bare-bluetooth-apple/tree/e823f6d68cafded14e2bda51cbd542160b06dd01)).
The repository has no `LICENSE` file; its `package.json` declares Apache-2.0. Paths mirror
upstream's.

`test/central.js` backs the code import in
`content/bare/how-to/connect-over-bluetooth/use-platform-specific-bluetooth-features.mdx` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-bluetooth-apple/test/central.js#L…`),
which shows reconnecting to a known peripheral without scanning for it.

This is a documentation-only snapshot: the test requires `./helpers` and `../lib/central` from an
upstream checkout, and needs a Bluetooth radio, so it does not run here.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. This is a partial snapshot of a repository that changes
often, so most of that drift won't touch the files the guides import. Copy the imported files from the
new commit, re-check every `#L…` range in the guides (`npm run check:code-imports` catches ranges that
fall out of bounds, not ones that drift onto different code), then bump both the `pinned` SHA for
`bare-bluetooth-apple` in that workflow and the commit recorded here.
