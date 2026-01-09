# Starting a Pear Terminal Project

[![Build with Pear - Episode 04: Pear Terminal Applications](https://img.youtube.com/vi/UoGJ7PtAwtI/0.jpg)](https://www.youtube.com/watch?v=UoGJ7PtAwtI)

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
