---
name: autobase
description: Use when building a deterministic multi-writer view over many Hypercores with Autobase — linearizing causal writes from several peers through an apply handler, often materialized into a Hyperbee view.
---

# Autobase

Autobase is a multi-writer linearization layer over Hypercore. Writers
append causal nodes to local cores; Autobase linearizes that graph into an
eventually consistent order, and an `apply` handler materializes a
deterministic view — often into a Hyperbee.

Reference: https://docs.pears.com/reference/building-blocks/autobase/
