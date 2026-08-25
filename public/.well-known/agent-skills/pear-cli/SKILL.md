---
name: pear-cli
description: Use when you need the Pear CLI command surface — pear dev, pear run, pear stage, pear release, pear seed, pear info, pear touch — the difference between staging and release channels, or the format of Pear keys and links.
---

# Pear CLI

The `pear` command line tool builds, runs, stages, and releases peer-to-peer
desktop and terminal apps.

Key concepts:
- `pear dev` / `pear run` — run an app locally against a directory or a `pear://` link.
- `pear stage` — publish a staging version under a writable Hypercore.
- `pear release` — promote a staged version to the release channel.
- `pear seed` — keep an app's data available on the network.
- Staging vs release are separate channels with separate keys/links.

Full reference: https://docs.pears.com/reference/pear/cli/
Configuration (package.json `pear` block): https://docs.pears.com/reference/pear/configuration/
