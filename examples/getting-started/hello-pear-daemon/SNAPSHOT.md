# hello-pear-daemon (documentation snapshot)

Vendored from [`holepunchto/hello-pear-daemon`](https://github.com/holepunchto/hello-pear-daemon),
branch **`main`**, at commit `0a2e3ef`
([tree](https://github.com/holepunchto/hello-pear-daemon/tree/0a2e3efbbf0cf0421fa78726d3c3ebe93234b244)).

This is the detached-updater boilerplate: the foreground command spawns a `bare-daemon` updater and
returns immediately, so a short-lived CLI invocation never blocks on an update check. There is no
`workers/` directory. It moved out of the `variant/daemon` branch of
[`holepunchto/hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare) into its own
repository.

## Why this directory exists

`bin.mjs` and `app.js` back the code imports in
`content/p2p/getting-started/from-a-template/start-from-hello-pear-daemon.mdx`, via
`file=<rootDir>/examples/getting-started/hello-pear-daemon/…#L…`. Keeping a real copy of the
repository here means the documented code is the code that actually runs, rather than
hand-transcribed excerpts that drift silently.

It is also exercised by the `hello-pear-daemon` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-daemon
```

Note what that scenario does **not** cover: it runs with `--no-updates`, which short-circuits the
`if (updates !== false)` guard in `bin.mjs`, so `App.spawnUpdater` is never called and no
`bare-daemon` process is ever spawned. The scenario asserts only that the foreground CLI prints
`CLI ready.`; the daemon machinery itself is not under test, because exercising it needs a standalone
build, a live `pear://` link, and a seeding peer.

## Deliberate deviations from upstream

Every file is byte-identical to upstream at the commit above, with two exceptions, both in
`package.json` (the name change is mirrored in `package-lock.json`):

- `upgrade` is set to a syntactically valid placeholder key
  (`pear://bwkbsetjgy5uhtkckppgn4dxq36ajnh1ugokxmiizubhiwqa59uy`) instead of upstream's
  `pear://<YOUR_KEY_HERE>`. In this boilerplate an invalid link does not fail in the foreground — the
  detached updater reports `INVALID_URL` to `<storage>/updates.log` — but the placeholder keeps the
  snapshot consistent with its siblings. The link is inert; nothing seeds it.
- `name` is `hello-pear-daemon`, as are the `--name` in every `make:*` script, the `repository` and
  `bugs` URLs, and the lockfile's root entry and `bin` name. Upstream still carries
  `hello-pear-bare` in all of them from before the split. `bin.mjs` derives the command, storage
  directory, and updater lookup name from `productName || name`, so the copied name would make the
  snapshot pose as `hello-pear-bare`. The MDX tells readers about upstream's value, since that is
  what they get when they clone.

Preserve both deviations when refreshing; drop the second one if upstream fixes its name.
`test/index.js` is upstream's `REMOVE ME` placeholder; that is upstream's content and is
intentionally kept as-is.

## What the MDX says about this snapshot

The "Build a standalone binary" section of the page describes this snapshot's `scripts/make.js`: it
builds for the host only, ignores `HOST`, does not sign, and just runs the matching
`make:<platform>-<arch>` script. If a refresh changes `make.js` (for example by adopting
`hello-pear-bare`'s builder), update that section in the same change.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Follow the steps in that issue: re-copy the files,
re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump both the `pinned`
SHA in that workflow and the commit recorded above.
