# Starting a Pear Terminal Project

{% embed url="https://www.youtube.com/watch?v=UoGJ7PtAwtI" %} Build with Pear - Episode 04: Pear Terminal Applications {% embeded %}

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

The app will now run. Note that it will keep running until you exit with `ctrl + c`.

That's all there is to getting a Pear Terminal project started.


## Next

* [Making a Pear Terminal Application](./making-a-pear-terminal-app.md)
