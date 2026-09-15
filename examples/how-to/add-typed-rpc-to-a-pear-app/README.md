# add-typed-rpc-to-a-pear-app

Worked example for [Add typed RPC to a Pear app](../../../../content/how-to/add-typed-rpc-to-a-pear-app.mdx).
The guide imports its code from these files with `remark-code-import`, so what
the page renders is exactly what is here.

| File | What it is |
| --- | --- |
| `build-spec.js` | The codegen script: registers the [hyperschema](https://github.com/holepunchto/hyperschema) types, then the [HRPC](https://github.com/holepunchto/hrpc) methods that use them. This is the `node build-spec.js` the guide tells you to run. |
| `spec/hyperschema/`, `spec/hrpc/` | Its generated output. **Not committed here** — the repo-wide `examples/**/spec/` rule in `.gitignore` covers it, and the `hrpc-codegen` scenario regenerates it on every run. The guide tells readers to commit this directory in their *own* app, which is the right advice there: both ends of the IPC stream must compile from the same generated code. Regenerate locally with `npm run build:spec`. |
| `workers/rpc-worker.js` | The worker end: handles `getStatus`, emits `log`. Named `rpc-worker.js` rather than the usual `main.js` because `scripts/check-workers-in-sync.ts` byte-compares every `examples/**/workers/main.js` against the shared `hello-pear-worker` inline, and this is an app-specific worker, not a copy of that one. |
| `host.js` | The host end: calls `getStatus()`, listens for `log`. |

`build-spec.js` is fully runnable and is exercised in CI by the `hrpc-codegen`
scenario in `scripts/test-examples.ts`. That matters: registering a method
without a `request` — which the guide once showed — throws
`TypeError: Cannot read properties of undefined (reading 'name')` in hrpc's
builder, and running the codegen is what catches it.

It lives at the app root rather than inside `spec/` because `spec/` is the
generated-output directory and is gitignored; hand-written source there would
not be committed, and the guide imports its snippets from this file.

`workers/main.js` and `host.js` are the real shapes the guide walks through, but
they are not standalone-runnable: they assume a Pear host that supplies
`pear.run`/`Bare.IPC` and a `swarm` the worker already holds. See
[hello-pear-bare](../../../getting-started/hello-pear-bare) for a complete host.
