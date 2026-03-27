---
title: "Starting a Pear Terminal Project"
description: "Create a terminal Pear project with pear init --type terminal."
---

<Cards>
  <Card title="Build with Pear - Episode 04: Pear Terminal Applications" href="https://www.youtube.com/watch?v=UoGJ7PtAwtI" external />
</Cards>

## Step 1. Init

First create a new project using `pear init --type terminal`.

```
mkdir chat-app
cd chat-app
pear init --yes --type terminal
```

This creates the base project structure.

- `package.json`. App configuration. Notice the `pear` property.
- `index.js`. App entrypoint.
- `test/index.test.js`. Test skeleton.

## Step 2. Verify Everything Works

Use `pear run` to see that it works.

```
pear run --dev .
```

> A directory or link needs to be specified with `pear run`, here `.` denotes the current Project directory.

The app will now run. That's all there is to getting a Pear Terminal project started.


## Next

* [Making a Pear Terminal Application](./making-a-pear-terminal-app.md)
