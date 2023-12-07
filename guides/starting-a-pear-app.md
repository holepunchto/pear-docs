# Starting a Pear App

This tutorial will show how to create a basic chat app with Pear, and through that teach how to use some of the main building blocks.

In this first part of the app, users will be able to create chat rooms, connect to each other, and send messages.

## Step 1. Init

First create a new project using `pear init`.

```
$ mkdir chat
$ cd chat
$ pear init --yes
```

This will create a base structure for the project.

- `package.json`. Config for the app. Notice the `pear` property.
- `index.html`. The UI for the app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.

## Step 2. Test that everything works

Before writing any code, make sure that everything works the way it's supposed to by using `pear dev`.

```
$ pear dev
```

This will open the app. Because it's opened in development mode, developer tools are also opened.

![Running pear dev](../assets/chat-app-1.png)

## Step 3. Automatic reload

Pear apps have automatic reload included. This means that there is no need to stop and start the app again to see changes.

While keeping the app open with `pear dev`, open `index.html` in a code editor. Change `<h1>chat</h1>` to `<h1>Hello world</h1>` and go to the app again. It should now look like this:

![Automatic reload](../assets/chat-app-2.png)
