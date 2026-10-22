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

This snapshot isn't in `.github/workflows/watch-boilerplates.yml`. That job compares the whole upstream
repository's HEAD with the pinned commit, and these repositories change often, so it would keep reporting
drift that doesn't affect the guides. Re-pin by hand when the guides move to a newer release, and re-check
every `#L` range.
