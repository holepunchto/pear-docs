---
name: bare-runtime
description: Use when writing or porting code to run under Bare instead of Node.js — Bare is a separate runtime (not a Node.js fork) with its own smaller standard library, the bare-node compatibility shim, and when to choose Bare over Node for a Pear app.
---

# Bare Runtime

Bare is the JavaScript runtime every Pear app runs on. It is not a fork of
Node.js — it's a separate runtime (built on `libjs`/`libuv`) that looks
similar (asynchronous, event-driven, module-based) but drops Node's
server-oriented assumptions and its bundled standard library. The
`bare-node` shim maps many Node.js built-ins onto their `bare-*`
equivalents to ease porting; packages with native addons need to target
Bare's addon API instead of Node's N-API.

Reference: https://docs.pears.com/bare/reference/bare/runtime/
Explanation of why Bare exists and when to use it standalone:
https://docs.pears.com/bare/explanation/bare-runtime/
