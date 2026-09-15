# hello-pear-react-native (documentation snapshot)

Vendored from [holepunchto/hello-pear-react-native](https://github.com/holepunchto/hello-pear-react-native),
branch **`main`**, at commit `5c79f39`
([tree](https://github.com/holepunchto/hello-pear-react-native/tree/5c79f39dc9d65ac44c80a9ebab54f0d3f1ae1696)).

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

`src/App.tsx` matches upstream byte-for-byte.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream `src/App.tsx` for the new commit,
re-check the `#L…` range in the MDX (a shifted range fails silently), then bump both the `pinned`
SHA in that workflow and the commit recorded here.
