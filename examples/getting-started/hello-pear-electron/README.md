# hello-pear-electron (documentation snapshot)

Vendored from [holepunchto/hello-pear-electron](https://github.com/holepunchto/hello-pear-electron),
branch **`main`**, at commit `016be67`
([tree](https://github.com/holepunchto/hello-pear-electron/tree/016be67941fb8e30cbd22a411d6a3d4ea5f29516)).

`renderer/app.js` and `workers/main.js` back the code imports in
`content/p2p/getting-started/from-a-template/start-from-hello-pear-electron.mdx`
(via `file=<rootDir>/examples/getting-started/hello-pear-electron/…#L…`). `workers/main.js` is also
imported by `content/_snippets/_hello-pear-worker-source-callout.mdx` and
`content/pear/how-to/operate-an-app/integrate-pear-ota/electron.mdx`.

This is a partial, documentation-only snapshot — only the two imported files are vendored, so it is
not a runnable app. (The `hello-pear-bare` snapshot beside it *is* complete and runnable.)

## Deliberate deviations from upstream

Preserve these when refreshing; they are intentional, not drift:

- **`workers/main.js` is `hello-pear-worker`'s `index.js` without the two-line source header
  upstream adds.** Upstream inlines the worker too since `016be67` (its `npm run inline-worker`
  script runs `inline-worker-module` over the `hello-pear-worker` package), so its file starts with
  `// https://github.com/holepunchto/hello-pear-worker v1.2.0` and a blank line, followed by the
  same source. This copy drops those two lines, as `../hello-pear-bare/workers/main.js` does. Before
  `016be67` upstream's file was the two-line `require('hello-pear-worker')`, and this copy was an
  inline made by hand. The real upstream for the body is
  [holepunchto/hello-pear-worker](https://github.com/holepunchto/hello-pear-worker), tracked by the
  `hello-pear-worker` entry in `watch-boilerplates.yml` — do **not** overwrite this file from this
  repo's `main`.

  This copy is the **canonical** one: `scripts/check-workers-in-sync.ts` asserts that every
  `examples/**/workers/main.js` file is byte-identical to it, because the worker's positional
  `argv` parsing is a contract with every host that spawns it. Changing it means re-syncing every
  other copy and re-checking each host's `PearRuntime.run` spawn array.

`renderer/app.js` matches upstream byte-for-byte.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit, keeping the
deviations above, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump
both the `pinned` SHA in that workflow and the commit recorded here.
