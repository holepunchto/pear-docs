---
name: pear-cli
description: Use when you need the Pear v3 CLI command surface — pear touch, pear build, pear stage, pear provision, pear multisig, pear seed, pear install, pear info — or the production release flow that replaced the single-key pear release command.
---

# Pear CLI

The `pear` command line tool builds, stages, and manages peer-to-peer
desktop and terminal apps. This covers **Pear v3**; `pear run` and
`pear release` were both removed in v3 and have no drop-in replacement
command — see below.

Key concepts:
- `pear touch` — mint a `pear://<key>` link. Needed before `pear stage` or `pear build` can write anywhere.
- `pear build` — assemble a multi-architecture deployment directory from per-OS Electron makes. From 3.6.0 it prints the app, version, and target, then one `+ <file> (origin: <source>)` line per artifact and `Build complete!`; before that it printed nothing on success. With `--json` it emits `building` (`name`, `version`, `target`), one `executable` (`file`, `origin`) per artifact, and `final`. An `executable` event has no architecture field: read the `by-arch/<arch>` segment of `file`.
- `pear stage <link> [dir]` — sync local changes to the link's hypercore (a preview/staging sync, not a production release).
- `pear provision` + `pear multisig` — the v3 production release path: provision block-syncs a staged build to a pre-production target, multisig cosigns it onto the production link with a quorum of keys. This replaced the old single-key `pear release` command.
- `pear seed <link>` — seed a link so peers can fetch it. From 3.6.0 the `App:` name and version follow the drive as it updates, so a long-running seeder needs no restart across a release.
- `pear install pear://<key>` — install a built app from the swarm.
- `pear info` / `pear dump` / `pear changelog` / `pear cores` — read-only inspection, no writes. From 3.6.0 `pear info` reports `writable`: whether this machine holds the key pair for the link, so it can stage to it. It applies to stage and provision links, not a multisig production link, and it does not prove a stage will succeed. A link with nothing on this machine yet reports `empty` instead of an `info` object.
- `pear blind-peer start|request`, `pear blind-relay start`, and the global `--relay <key>` flag — run a blind peer or relay, or route connections through one.
- `pear identity seed|blind-relay|blind-peer|blind-peer-client` — print one of this machine's network keys, for another machine to pass to `pear seed --until-sync`, `--relay`, `pear seed --blind-peer`, or `pear blind-peer start --trusted-peer`. Replaced `pear blind-peer identity` in 3.5.0.
- Link arguments may be wrapped in one matching pair of single or double quotes from 3.6.0; earlier releases reject a quoted link with `A valid pear link must be specified.`
- An unknown argument fails with `Unexpected argument  '<value>'` (two spaces before the quote) from 3.6.0, and with `Unrecognized Argument at index <n> with value <value>` before.
- There is no `pear dev` command, and `pear run` no longer launches an app — apps now embed the `pear-runtime` (Pear OTA) library directly instead of being launched by the CLI.

Full reference: https://docs.pears.com/pear/reference/pear/cli/
Configuration (package.json `pear` block): https://docs.pears.com/pear/reference/pear/configuration/
Migrating off `pear run`: https://docs.pears.com/pear/how-to/operate-an-app/migration/
