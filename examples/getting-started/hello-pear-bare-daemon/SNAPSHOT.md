# hello-pear-bare `variant/daemon` (documentation snapshot)

Vendored from [`holepunchto/hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare),
branch **`variant/daemon`**, at commit `1f0cebf`
([tree](https://github.com/holepunchto/hello-pear-bare/tree/1f0cebf406f42dd1b3e90fc7e74e9831631e6441)).

This is the detached-updater variant: the foreground command spawns a `bare-daemon` updater and
returns immediately, so a short-lived CLI invocation never blocks on an update check. There is no
`workers/` directory.

## Why this directory exists

`bin.mjs` and `app.js` back the code imports in
`content/getting-started/from-a-template/start-from-hello-pear-bare.mdx` (the `### daemon` part of
the "Variants" section), via
`file=<rootDir>/examples/getting-started/hello-pear-bare-daemon/…#L…`. Keeping a real copy of the
branch here means the documented code is the code that actually runs, rather than hand-transcribed
excerpts that drift silently.

It is also exercised by the `hello-pear-bare-daemon` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-bare-daemon
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
  `pear://<YOUR_KEY_HERE>`. On this branch an invalid link does not fail in the foreground — the
  detached updater reports `INVALID_URL` to `<storage>/updates.log` — but the placeholder keeps the
  snapshot consistent with its siblings. The link is inert; nothing seeds it.

Preserve that deviation when refreshing. `test/index.js` is upstream's `REMOVE ME` placeholder;
that is upstream's content and is intentionally kept as-is.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `variant/daemon` moves past the pinned commit. Follow the steps in that issue: re-copy the
files, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump both the
`pinned` SHA in that workflow and the commit recorded above.
