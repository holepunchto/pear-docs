---
name: migrating-node-to-bare
description: Use when porting an existing standalone Node.js application to run on Bare — swapping built-ins for bare-* modules or the bare-node shim, handling native addons, and common migration pitfalls. Independent of Pear; see the bare-runtime and build-a-pear-app skills for the Pear-specific worker case.
---

# Migrating a Node.js App to Bare

Practical guidance for taking a standalone Node.js codebase (no Pear
involved) and running it under Bare: which built-ins differ, which npm
packages need a `bare-*` equivalent or the `bare-node` shim, and what
commonly breaks first (native addons especially).

How-to: https://docs.pears.com/bare/how-to/migrate-a-nodejs-app-to-bare/
Explanation of the underlying differences:
https://docs.pears.com/bare/explanation/migrating-from-nodejs/
