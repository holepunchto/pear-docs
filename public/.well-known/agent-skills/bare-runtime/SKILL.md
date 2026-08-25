---
name: bare-runtime
description: Use when writing or porting code to run under Bare instead of Node.js — what differs in module resolution and available built-ins, the bare-* module ecosystem, and when to choose Bare over Node for a Pear app.
---

# Bare Runtime

Bare is the small, modular JavaScript runtime that Pear apps run on instead
of Node.js. It shares most of Node's module conventions but has a different,
smaller set of built-ins and a bare-* module ecosystem for the rest.

Reference: https://docs.pears.com/reference/bare/runtime/
Explanation of why Bare exists and when to use it standalone:
https://docs.pears.com/explanation/bare-runtime/
