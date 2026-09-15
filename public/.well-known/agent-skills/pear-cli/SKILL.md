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
- `pear build` — assemble a multi-architecture deployment directory from per-OS Electron makes.
- `pear stage <link> [dir]` — sync local changes to the link's hypercore (a preview/staging sync, not a production release).
- `pear provision` + `pear multisig` — the v3 production release path: provision block-syncs a staged build to a pre-production target, multisig cosigns it onto the production link with a quorum of keys. This replaced the old single-key `pear release` command.
- `pear seed <link>` — seed a link so peers can fetch it.
- `pear install pear://<key>` — install a built app from the swarm.
- `pear info` / `pear dump` / `pear changelog` / `pear cores` — read-only inspection, no writes.
- There is no `pear dev` command, and `pear run` no longer launches an app — apps now embed the `pear-runtime` (Pear OTA) library directly instead of being launched by the CLI.

Full reference: https://docs.pears.com/pear/reference/pear/cli/
Configuration (package.json `pear` block): https://docs.pears.com/pear/reference/pear/configuration/
Migrating off `pear run`: https://docs.pears.com/pear/how-to/operate-an-app/migration/
