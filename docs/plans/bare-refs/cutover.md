# Cutover plan: generated bare refs → content/ (NOT executed — needs user approval)

State as of 2026-07-02 (branch `feat/bare-docs`). 68 generated pages in
`generated/bare-refs/`, 36 hand-written pages in
`content/reference/bare/modules/`.

## Page mapping

- **Replaced (30)** — generated page supersedes an existing hand-written page,
  same slug, same route → no redirects needed:
  bare-addon-resolve, bare-atomics, bare-bluetooth-android, bare-bluetooth-apple,
  bare-broadcast-channel, bare-console, bare-crypto, bare-fetch, bare-fs,
  bare-inspector, bare-ipc, bare-make, bare-mdns-discovery, bare-module,
  bare-module-resolve, bare-module-traverse, bare-os, bare-pipe, bare-posix,
  bare-prom-client, bare-rpc, bare-semver, bare-sidecar, bare-sqlite,
  bare-stream, bare-structured-clone, bare-subprocess, bare-tcp, bare-tls, bare-url.
- **New (38)** — no page exists today; `--write` creates them:
  bare-abort, bare-abort-controller, bare-ansi-escapes, bare-assert, bare-buffer,
  bare-bundle, bare-bundle-id, bare-collabora, bare-dns, bare-encoding,
  bare-events, bare-file-logger, bare-format, bare-hrtime, bare-http1,
  bare-https, bare-inspect, bare-logger, bare-module-lexer, bare-net, bare-pack,
  bare-path, bare-process, bare-querystring, bare-readline, bare-realm,
  bare-signals, bare-sqlite-vector, bare-stow, bare-string-decoder,
  bare-system-logger, bare-timers, bare-tty, bare-type, bare-type-stripper,
  bare-vm, bare-ws, bare-zlib.
  - Of these, **bare-bundle-id** and **bare-collabora** have no row in
    `bare-modules.mdx` — `syncCatalog` needs add-row support (below) or manual rows.
- **Keep hand-written (6)** — no generated counterpart (no usable `.d.ts`
  upstream); do NOT delete: bare-apk, bare-channel, bare-form-data, bare-mime,
  bare-sdl, bare-union-bundle.
- **Skipped by pipeline (3)** — bare-dgram, bare-env, bare-stdio have neither a
  hand-written page nor types; Instance B is drafting `.d.ts` for them.

## Steps (when approved)

1. `npm run gen:bare-refs -- --top 80 --write` — writes the 68 pages into
   `content/reference/bare/modules/` and syncs catalog rows.
2. Add catalog rows for bare-bundle-id + bare-collabora (extend `syncCatalog`
   with add-row support, or add manually — decide section placement).
3. Wire the 38 new pages into `content/reference/index.mdx` (follow the pattern
   of existing bare module links) and re-run `npm run check:internal-links`.
4. No redirects required: every route is either unchanged or brand new
   (verified against `scripts/redirects.ts` conventions).
5. Gates: `npm run check:bare-refs && npm run test:bare-refs &&
   npm run audit:reference-docs && npm run build`.
6. Enable the Loop A workflow (`.github/workflows/regenerate-bare-refs.yml`) —
   already authored; it opens review PRs into `published`, never auto-merges.

## Open questions for the user

- Replace all 30 hand-written pages at once, or stage (top-10 first)?
- Where should bare-bundle-id / bare-collabora sit in the catalog sections?
- Should the 6 kept hand-written pages get a "manually maintained" marker so a
  future `--write` never touches them? (Pipeline never writes slugs it didn't
  generate, so they're safe today — this is belt-and-braces.)

## Pear family

`--write` for pear is moot until upstream ships types: **all 36 pear-\* packages
ship no `.d.ts`** (verified against published tarballs 2026-07-02; see
`generated/pear-refs/TODO.md`). Machinery is ready (`npm run gen:pear-refs`);
the moment a pear module publishes declarations it will generate.
