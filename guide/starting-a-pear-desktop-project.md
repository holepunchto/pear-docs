# Starting a Pear Desktop Project

In preparation for [Making a Pear Desktop Application](./making-a-pear-desktop-app.md) the following steps outline how to generate, configure, and develop a Pear Desktop Project.

## Step 1. Initialization

To create a new Pear project use `pear init`.

```
mkdir chat
cd chat
pear init --yes
```

This will create a base structure for the project.

- `package.json`. Configuration for the app. Notice the `pear` property.
- `index.html`. The html for the app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.

## Step 2. Check that everything works

Before writing any code, make sure that everything works the way it's supposed to by using `pear dev`.

```
pear dev
```

This will open the app in development mode, by default developer tools are also opened.

![Running pear dev](../assets/chat-app-1.png)

## Step 3. Automatic reload

By default Pear watches project files and automatically reloads the page when files change.

This means that there is no need to stop and start the app again to see changes.

While keeping the app open with `pear dev`, open `index.html` in a code editor.

Try changing `<h1>chat</h1>` to `<h1>Hello world</h1>` and look observe the app update.

It should now look like this:

![Automatic reload](../assets/chat-app-2.png)

> Live reloading with hot-module reloading can be achieved with a combination of `pear.watch` configuration, [`pear.updates`](../reference/api.md#pearupdateslistener-async-functionfunction) API or the [pear-hotmods](https://github.com/holepunchto/pear-hotmods) convenience module.

## Step 4. Configuration

Application configuration all happens via the `pear` property in `package.json`

For now, open `package.json` and update it like so:

```
{
  ...
  "pear": {
    "gui": {
      "backgroundColor": "#3592C3",
      "height": 400,
      "width": 700
    }
  }
  ...
}
```

If the app is open, close it and then run `pear dev` to see the configuration change.

The initial background color will be light blue and the window will start with a different initial size.

See the [Configuration Documentation](../reference/configuration.md) for all configuration possibilities.


## Next

* [Making a Pear Desktop Application](./making-a-pear-desktop-app.md)
