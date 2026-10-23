# hello-pear-bare (documentation snapshot)

Vendored from [holepunchto/hello-pear-bare](https://github.com/holepunchto/hello-pear-bare),
branch **`main`**, at commit `28ce09a`
([tree](https://github.com/holepunchto/hello-pear-bare/tree/28ce09ac39f73507875433444a146da09bea48f5)).

`bin.mjs` and `app.js` back the code imports in
`content/p2p/getting-started/from-a-template/start-from-hello-pear-bare.mdx` (via
`file=<rootDir>/examples/getting-started/hello-pear-bare/…#L…`).

Unlike the `hello-pear-electron` snapshot, this is a **complete, runnable app**. It is booted by the
`hello-pear-bare` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-bare
```

See also `../hello-pear-daemon`, the sibling boilerplate for short-lived CLIs. It lives in its own
upstream repository and records its own provenance in `SNAPSHOT.md`.

## Deliberate deviations from upstream

Preserve these when refreshing; they are intentional, not drift:

- **`package.json` → `upgrade`** is a syntactically valid placeholder key
  (`pear://bwkbsetjgy5uhtkckppgn4dxq36ajnh1ugokxmiizubhiwqa59uy`) instead of upstream's
  `pear://<YOUR_KEY_HERE>`, which fails URL validation at startup with `INVALID_URL` and would break
  the scenario. The link is inert — nothing seeds it. Everything else in `package.json` matches
  upstream byte-for-byte.
- **`workers/main.js` omits upstream's two-line source header.** Upstream inlines the worker (its
  `npm run inline-worker` script runs `inline-worker-module` over the `hello-pear-worker` package),
  so its file starts with `// https://github.com/holepunchto/hello-pear-worker v1.2.0` and a blank
  line. This copy drops those two lines and is otherwise upstream's, so it stays byte-identical to
  the canonical copy in `../hello-pear-electron/workers/main.js`.
  `scripts/check-workers-in-sync.ts` enforces that for every `examples/**/workers/main.js`, so this
  file can only change in lockstep with every other vendored copy. The `hello-pear-worker` entry in
  `watch-boilerplates.yml` flags a new worker release; when it does, update the canonical copy and
  every other copy together, and do **not** overwrite this file from this repo's `main`.
- **`test/index.js` is a docs-authored test** asserting the `App` constructor's config handling.
  Upstream ships a `test('REMOVE ME')` placeholder; this replaces it with something meaningful.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit, keeping the
deviations above, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump
both the `pinned` SHA in that workflow and the commit recorded here.
