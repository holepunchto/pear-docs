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
`content/p2p/getting-started/from-a-template/start-from-hello-pear-bare.mdx` (the "Short-lived CLIs:
hello-pear-daemon" section), via
`file=<rootDir>/examples/getting-started/hello-pear-daemon/…#L…`. Keeping a real copy of the
repository here means the documented code is the code that actually runs, rather than
hand-transcribed excerpts that drift silently.

It is also exercised by the `hello-pear-daemon` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-daemon
```

Note what that scenario does **not** cover: it runs with `--no-updates`, which short-circuits the
`if (updates !== false)` guard in `bin.mjs`, so `App.spawnUpdater` is never called and no
`bare-daemon` process is ever spawned. The scenario asserts the foreground CLI boots and exits; the
daemon machinery itself is not under test, because exercising it needs a live `pear://` link and a
seeding peer.

## Deliberate deviations from upstream

Every file is byte-identical to upstream at the commit above, with one exception:

- `package.json` → `upgrade` is set to a syntactically valid placeholder key
  (`pear://bwkbsetjgy5uhtkckppgn4dxq36ajnh1ugokxmiizubhiwqa59uy`) instead of upstream's
  `pear://<YOUR_KEY_HERE>`. In this boilerplate an invalid link does not fail in the foreground — the
  detached updater reports `INVALID_URL` to `<storage>/updates.log` — but the placeholder keeps the
  snapshot consistent with its siblings. The link is inert; nothing seeds it.

Preserve that deviation when refreshing. `test/index.js` is upstream's `REMOVE ME` placeholder;
that is upstream's content and is intentionally kept as-is. Upstream's `package.json` also still
carries `"name": "hello-pear-bare"` and `--name hello-pear-bare` in its `make:*` scripts from before
the split; that is upstream's content too, so it is kept.

## What the MDX says about this snapshot

The "Build a standalone binary" callout on the same page describes this snapshot's
`scripts/make.js`: it builds for the host only, ignores `HOST`, does not sign, and just runs the
matching `make:<platform>-<arch>` script. If a refresh changes `make.js` (for example by adopting
`hello-pear-bare`'s builder), update that callout in the same change.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Follow the steps in that issue: re-copy the files,
re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump both the `pinned`
SHA in that workflow and the commit recorded above.
