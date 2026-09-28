# hello-pear-qvac-tui (documentation snapshot)

Vendored from [holepunchto/hello-pear-qvac-tui](https://github.com/holepunchto/hello-pear-qvac-tui)
(package name `hello-pear-qvac`), branch **`main`**, at commit `605eb96`
([tree](https://github.com/holepunchto/hello-pear-qvac-tui/tree/605eb96186d25b1b3f888bb234844e4216433c57)).

`bin.mjs`, `app.js`, `lib/inference.js`, and `workers/qvac.js` back the code imports in
`content/bare/how-to/add-on-device-ai/build-a-local-ai-chat-tui-with-qvac.mdx` (via
`file=<rootDir>/examples/how-to/add-on-device-ai/hello-pear-qvac-tui/…#L…`).

This is a **complete, runnable app**, and unlike the other vendored snapshots under
`examples/how-to/`, it is booted by its own test suite rather than a live `bin.mjs` process — see
"Why it isn't wired into CI" below. The scenario lives in `scripts/test-examples.ts` as
`hello-pear-qvac-tui`, for local/manual use:

```sh
npm run test:examples -- --filter=hello-pear-qvac-tui
```

## Deliberate deviations from upstream

Preserve these when refreshing; they are intentional, not drift:

- **`workers/main.js` is an inlined copy of the `hello-pear-worker` package**, not upstream's
  two-line `require('hello-pear-worker')`. The docs show readers the actual worker source, and
  this repo already carries that inlined copy for the other `hello-pear-*` templates — the real
  upstream for this file is [holepunchto/hello-pear-worker](https://github.com/holepunchto/hello-pear-worker),
  not `hello-pear-qvac-tui`. Do **not** overwrite it from this repo's `main`.
  `scripts/check-workers-in-sync.ts` enforces that every `examples/**/workers/main.js` stays
  byte-identical to the canonical copy in `../../../getting-started/hello-pear-electron/workers/main.js`
  — it walks the tree recursively, so this copy is checked automatically.

- **`package.json` needed no placeholder-`upgrade` deviation**, unlike `hello-pear-bare`'s
  snapshot (`hello-pear-electron`'s snapshot vendors no `package.json` at all — see that
  directory's own README). There, constructing `pear-runtime` with the unreplaced
  `pear://<YOUR_KEY_HERE>` throws `INVALID_URL` and would break the scenario. Here, `bin.mjs`
  checks `!pkg.upgrade.includes('<')` itself and skips constructing `App` (the updater) entirely
  when the key is still the placeholder, logging a notice instead of throwing — so upstream's
  `package.json` is vendored byte-for-byte, no deviation required.

Everything else (`bin.mjs`, `app.js`, `lib/inference.js`, `workers/qvac.js`, `ui/app.js`,
`ui/transcript.js`, `test/index.js`, `package-lock.json`) is vendored unmodified.

## Why it isn't wired into CI

Unlike every other terminal-app scenario, this one runs `bare test/index.js` (upstream's own
headless, fake-inference test suite) instead of booting `bin.mjs` live — a live boot needs a ~1GB
model download and, for a real answer, a GPU. But even that lighter check isn't in
`.github/workflows/examples.yml`'s automated matrix. The `ciSkipReason` on the `hello-pear-qvac-tui`
entry in `scripts/test-examples.ts` is the canonical record of why; run it locally with the command
above whenever you touch this snapshot.

## Refreshing

Drift is polled weekly by `.github/workflows/watch-boilerplates.yml`, which opens a tracking issue
when `main` moves past the pinned commit. Copy the upstream files for the new commit, keeping the
deviation above, re-check the `#L…` ranges in the MDX (a shifted range fails silently), re-run
`npm run test:examples -- --filter=hello-pear-qvac-tui` to confirm the test file's pass-summary
marker hasn't changed, then bump both the `pinned` SHA in that workflow and the commit recorded
here.
