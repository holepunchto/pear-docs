# Creating the project setup

### Step 1. Init

First create a new project using `pear init`.

```
$ mkdir chat-bot
$ cd chat-bot
$ pear init --yes
```

This will create a base structure for the project.

- `package.json`. Configuration for the app. Notice the `pear` property.
- `index.js`. The entrpoint for the app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.
----
## Making a Pear Terminal Application

### Step 1. Install modules

This app uses these modules: `hyperswarm`, `hypercore-crypto`, and `b4a`.

```
$ npm i hyperswarm hypercore-crypto b4a
```

**Note**: If the modules are installed while the app is running an error is thrown similar to `Cannot find package 'hyperswarm' imported from /app.js`. When installing modules, close down the app, before they can be installed.

- [hyperswarm](https://www.npmjs.com/package/hyperswarm). One of the main building blocks. Find peers that share a "topic".
- [hypercore-crypto](https://www.npmjs.com/package/hypercore-crypto). A set of crypto function used in Pear.
- [b4a](https://www.npmjs.com/package/b4a). A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class.

### Step 2. 
TBD
