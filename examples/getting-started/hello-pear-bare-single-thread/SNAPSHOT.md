# hello-pear-bare `variant/single-thread` (documentation snapshot)

Vendored from [`holepunchto/hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare),
branch **`variant/single-thread`**, at commit `31934ae`
([tree](https://github.com/holepunchto/hello-pear-bare/tree/31934aea35f3c0e32d357941218f95b325abbddb)).

This is the workerless variant: `app.js` constructs `pear-runtime` directly in the main Bare
process instead of spawning a Bare worker, so there is no `workers/` directory and no
`framed-stream` IPC.

## Why this directory exists

`app.js` backs the code imports in
`content/getting-started/from-a-template/start-from-hello-pear-bare.mdx` (the `### single-thread`
part of the "Variants" section), via
`file=<rootDir>/examples/getting-started/hello-pear-bare-single-thread/app.js#L…`. Keeping a real
copy of the branch here means the documented code is the code that actually runs, rather than
hand-transcribed excerpts that drift silently.

It is also exercised by the `hello-pear-bare-single-thread` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-bare-single-thread
```

## Deliberate deviations from upstream

Every file is byte-identical to upstream at the commit above, with one exception:

- `package.json` → `upgrade` is set to a syntactically valid placeholder key
  (`pear://bwkbsetjgy5uhtkckppgn4dxq36ajnh1ugokxmiizubhiwqa59uy`) instead of upstream's
  `pear://<YOUR_KEY_HERE>`, which fails URL validation at startup with `INVALID_URL` and would
  break the test scenario. The link is inert — nothing seeds it.

Preserve that deviation when refreshing. `test/index.js` is upstream's `REMOVE ME` placeholder;
that is upstream's content and is intentionally kept as-is.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `variant/single-thread` moves past the pinned commit. Follow the steps in that issue: re-copy
the files, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump both the
`pinned` SHA in that workflow and the commit recorded above.
