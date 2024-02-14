# Starting a Pear Terminal Project

> [Build with Pear - Episode 04: Pear Terminal Applications](https://www.youtube.com/watch?v=UoGJ7PtAwtI)

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

## Step 2. Verify Everything Works

Use `pear dev` to see that it works.

```
pear dev
```

The app will now run. Note that it will keep running until you exit with `ctrl + c`.

That's all there is to getting a Pear Terminal project started.


## Next

* [Making a Pear Terminal Application](./making-a-pear-terminal-app.md)
