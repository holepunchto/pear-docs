# Starting a Pear Terminal Project

> [Build with Pear - Episode 04: Pear Terminal Applications]https://www.youtube.com/watch?v=73KVE0wocTE

## Step 1. Init

First create a new project using `pear init`.

```
mkdir chat-bot
cd chat-bot
pear init --yes
```

This creates the base project structure.

- `package.json`. App configuration. Notice the `pear` property.
- `index.js`. App entrypoint.
- `app.js`. Main code.
- `test/index.test.js`. Test skeleton.
