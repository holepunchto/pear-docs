# hello-pear-bare (documentation snapshot)

Vendored from [holepunchto/hello-pear-bare](https://github.com/holepunchto/hello-pear-bare),
branch **`main`**, at commit `e391b8a`
([tree](https://github.com/holepunchto/hello-pear-bare/tree/e391b8a8330e514df4fe37cd6dfc7572a4d0e21e)).

`bin.mjs` and `app.js` back the code imports in
`content/getting-started/from-a-template/start-from-hello-pear-bare.mdx` (via
`file=<rootDir>/examples/getting-started/hello-pear-bare/…#L…`).

Unlike the `hello-pear-electron` snapshot, this is a **complete, runnable app**. It is booted by the
`hello-pear-bare` scenario in `scripts/test-examples.ts`:

```sh
npm run test:examples -- --filter=hello-pear-bare
```

See also the two variant snapshots alongside it — `../hello-pear-bare-single-thread` and
`../hello-pear-bare-daemon` — which track long-lived non-default upstream branches and record their
own provenance in `SNAPSHOT.md`.

## Deliberate deviations from upstream

Preserve these when refreshing; they are intentional, not drift:

- **`package.json` → `upgrade`** is a syntactically valid placeholder key
  (`pear://bwkbsetjgy5uhtkckppgn4dxq36ajnh1ugokxmiizubhiwqa59uy`) instead of upstream's
  `pear://<YOUR_KEY_HERE>`, which fails URL validation at startup with `INVALID_URL` and would break
  the scenario. The link is inert — nothing seeds it. Everything else in `package.json` matches
  upstream byte-for-byte.
- **`workers/main.js` is an inlined copy of the `hello-pear-worker` package**, not upstream's
  two-line `require('hello-pear-worker')`. The docs show readers the actual worker source, so the
  real upstream for this file is
  [holepunchto/hello-pear-worker](https://github.com/holepunchto/hello-pear-worker) — do **not**
  overwrite it from this repo's `main`. `scripts/check-workers-in-sync.ts` enforces that every
  `examples/**/workers/main.js` stays byte-identical to the canonical copy in
  `../hello-pear-electron/workers/main.js`, so this file can only change in lockstep with all ten.
- **`test/index.js` is a docs-authored test** asserting the `App` constructor's config handling.
  Upstream ships a `test('REMOVE ME')` placeholder; this replaces it with something meaningful.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit, keeping the
deviations above, re-check the `#L…` ranges in the MDX (a shifted range fails silently), then bump
both the `pinned` SHA in that workflow and the commit recorded here.
