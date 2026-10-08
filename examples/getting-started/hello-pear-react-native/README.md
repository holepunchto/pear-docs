# hello-pear-react-native (documentation snapshot)

Vendored from [holepunchto/hello-pear-react-native](https://github.com/holepunchto/hello-pear-react-native),
branch **`main`**, at commit `aa421c0`
([tree](https://github.com/holepunchto/hello-pear-react-native/tree/aa421c0febd005642201059182cec27ca2390102)).

`src/App.tsx` backs the code import in
`content/getting-started/from-a-template/start-from-hello-pear-react-native.mdx`
(via `file=<rootDir>/examples/getting-started/hello-pear-react-native/src/App.tsx#L…`).

This is a partial, documentation-only snapshot — only the one imported file is vendored, so it is
not a runnable app.

## No vendored `workers/main.js`

Unlike the `hello-pear-electron` and `hello-pear-bare` snapshots beside it, this snapshot does
**not** vendor a copy of `workers/main.js`. Upstream's is the literal `require('hello-pear-worker')`
one-liner — identical in spirit to the other two templates — and the docs already inline and explain
that shared worker once, via `content/_snippets/_hello-pear-worker-source-callout.mdx`, which imports
from the **canonical** copy at `examples/getting-started/hello-pear-electron/workers/main.js`. This
page's "Where the app logic goes" section includes that same snippet rather than duplicating the
explanation. Do not add a `workers/main.js` here to "complete" this snapshot — it would just be a
second, unwatched copy of text already covered by the canonical one.

`src/App.tsx` is upstream's file with one deliberate deviation (#369): upstream stores the update
callback in `useState` and sets it from the effect body, which this repo's `react-hooks`
lint rule (`set-state-in-effect`) rejects and so fails `npm run lint`. This copy keeps the framed
pipe in a `pipeRef` and derives `applyUpdate` with `useCallback`, and drops the button's
`!applyUpdate` guard that goes with it. The behaviour is identical.
`content/pear/how-to/operate-an-app/integrate-pear-ota/mobile.mdx` calls this out for readers, and
it must change in step with this file. Upstream's `src/App.tsx` was unchanged between the previous
pin (`5c79f39`) and `aa421c0`, so only the hunks above differ.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Re-apply the deviation above to the upstream `src/App.tsx` for the new commit,
re-check the `#L…` range in the MDX (a shifted range fails silently), then bump both the `pinned`
SHA in that workflow and the commit recorded here.
