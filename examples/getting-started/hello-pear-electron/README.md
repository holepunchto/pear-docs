# hello-pear-electron (documentation snapshot)

Vendored from [holepunchto/hello-pear-electron](https://github.com/holepunchto/hello-pear-electron),
branch **`main`**, at commit `ad23048`
([tree](https://github.com/holepunchto/hello-pear-electron/tree/ad23048ae2a02ee9a0961c280e795da66a08d77d)).

`renderer/app.js` and `workers/main.js` back the code imports in
`content/getting-started/from-a-template/start-from-hello-pear-electron.mdx`
(via `file=<rootDir>/examples/getting-started/hello-pear-electron/…#L…`).

This is a partial, documentation-only snapshot — only the two imported files are vendored, so it is
not a runnable app. (The `hello-pear-bare` snapshot beside it *is* complete and runnable.)

## Deliberate deviations from upstream

Preserve these when refreshing; they are intentional, not drift:

- **`workers/main.js` is an inlined copy of the `hello-pear-worker` package**, not upstream's
  two-line `require('hello-pear-worker')`. The docs show readers the actual worker source, so the
  real upstream for this file is
  [holepunchto/hello-pear-worker](https://github.com/holepunchto/hello-pear-worker) — do **not**
  overwrite it from this repo's `main`.

  This copy is the **canonical** one: `scripts/check-workers-in-sync.ts` asserts that all ten
  `examples/**/workers/main.js` files are byte-identical to it, because the worker's positional
  `argv` parsing is a contract with every host that spawns it. Changing it means re-syncing all ten
  copies and re-checking each host's `PearRuntime.run` spawn array.

`renderer/app.js` matches upstream byte-for-byte.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit, keeping the
deviations above, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump
both the `pinned` SHA in that workflow and the commit recorded here.
