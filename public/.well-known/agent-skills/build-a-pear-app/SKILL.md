---
name: build-a-pear-app
description: Use when scaffolding a new Pear application — choosing the desktop (Electron + Bare worker) or terminal (standalone Bare binary) shape, the package.json fields pear-runtime actually reads, and the end-to-end path for building a peer-to-peer chat app from scratch.
---

# Build a Pear App

A Pear app is one of two shapes, both built around embedding the
`pear-runtime` (Pear OTA) library rather than around a `pear` CLI command:

- **Desktop** — an Electron app where the main process is a thin shell that
  spawns a Bare worker over IPC. The Bare worker (not the renderer) owns
  `pear-runtime`, Hyperswarm, and Hypercore; the renderer stays a normal web
  view with no P2P modules loaded directly. See the
  `hello-pear-electron` template.
- **Terminal** — a standalone Bare binary with no Electron and no HTML/CSS/JS
  UI at all: CLIs, REPLs, TUIs, daemons. The Pear CLI itself is built this
  way. See the `hello-pear-bare` template.

In `package.json`, `pear-runtime` reads the top-level `version` field (bump
it before every OTA update) and `upgrade` (a `pear://` link to the seeded
app to update from). The `pear.stage.*` block (`entrypoints`, `ignore`,
`only`, `purge`) controls what `pear stage` syncs — there is no `pear.type`
or `permissions` field.

Getting-started path: https://docs.pears.com/getting-started/
Full walkthrough (build a P2P chat app end to end):
https://docs.pears.com/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat/
Desktop architecture (main/renderer/worker split):
https://docs.pears.com/explanation/pear-desktop-architecture/
Terminal template (hello-pear-bare):
https://docs.pears.com/getting-started/from-a-template/start-from-hello-pear-bare/
Configuration reference: https://docs.pears.com/reference/pear/configuration/
