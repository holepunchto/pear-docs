# snake-mobile (documentation snapshot)

Vendored from [holepunchto/snake-mobile](https://github.com/holepunchto/snake-mobile),
branch **`main`**, at commit `87694ee`
([tree](https://github.com/holepunchto/snake-mobile/tree/87694ee010d4916f6d06800fa8b409082a67d6ad)).

`workers/main.custom.js` and `src/App.tsx` back the code imports in
`content/how-to/run-on-native/add-custom-p2p-logic-to-a-react-native-app.mdx`
(via `file=<rootDir>/examples/how-to/run-on-native/snake-mobile/…#L…`).

This is a partial, documentation-only snapshot — only the two imported files are vendored, so it is
not a runnable app.

## Deliberate deviation from upstream

Preserve this when refreshing; it is intentional, not drift:

- **`workers/main.custom.js` is vendored under a renamed filename.** The real upstream path is
  `workers/main.js`. It is stored here as `workers/main.custom.js` solely so
  `scripts/check-workers-in-sync.ts` — which recursively byte-compares every
  `examples/**/workers/main.js` against the canonical `hello-pear-worker` inline vendored at
  `examples/getting-started/hello-pear-electron/workers/main.js` — does not treat this
  legitimately different, app-specific worker as drift from that shared source. snake-mobile does
  **not** use `hello-pear-worker`; it ships its own custom worker with a second `Hyperswarm` for
  the game topic and a JSON message protocol, which is the entire point of the how-to this
  snapshot backs. Do **not** rename it back to `workers/main.js` when refreshing — that would make
  `npm run check:workers-in-sync` fail on the next run.

  Both files otherwise match upstream byte-for-byte.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit into this
snapshot — keeping `workers/main.js` renamed to `workers/main.custom.js` as above — re-check the
`#L…` ranges in the MDX (a shifted range fails silently), then bump both the `pinned` SHA in that
workflow and the commit recorded here.
