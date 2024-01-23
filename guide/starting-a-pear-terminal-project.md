# Starting a Pear Terminal Project

## Step 1. Init

First create a new project using `pear init`.

```
mkdir chat-bot
cd chat-bot
pear init --yes
```

This will create a base structure for the project.

- `package.json`. Configuration for the app. Notice the `pear` property.
- `index.js`. The entrpoint for the app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.
