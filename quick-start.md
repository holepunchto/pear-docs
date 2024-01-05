# Building a Desktop Application with Pear

This tutorial will show you how to build a basic chat app using Pear and building blocks from Holepunch.

In this app users will be able to create chat rooms, connect to each other and send messages.

* [Setup](./making-a-pear-desktop-application.md#installing-pear)
* [Creating a Project](./making-a-pear-desktop-application.md#creating-a-project)
* [Making the Pear App functional](./making-a-pear-desktop-application.md#making-the-pear-app-functional)


## Setup


### Requirements

Pear runs on Windows, Mac and Linux.

The `pear` CLI can be installed from [npm](https://www.npmjs.com/), which comes with [`node`](https://nodejs.org/en/about). 

The `npm` package manager can also be used to install application dependencies later on.

On MacOS and Linux, we recommend installing `node` using [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating)

On Windows we recommend installing `node` with [`nvs`](https://github.com/jasongin/nvs#setup).

{% hint style="info" %}
The Pear Runtime does not rely on `node`, `node` is only needed to install and run the `npm` package manager.
{% endhint %}

### Installing Pear

To install Pear run the following command:

```sh
npm i -g pear
```

To complete the setup, run the `pear` command.

```
pear
```

If a Pear application, such as [Keet](https://keet.io), is already installed then the Pear platform is already available. In this case, running `pear` should show help output.
 
If not, the first run of `pear` will fetch the platform from peers, after which running `pear` again should output help information.

To check that Pear is fully working, try the following command:

```
pear launch keet
```

Pear loads applications from peers, so this command should launch [Keet](https://keet.io) whether or not it was downloaded and installed beforehand.

Now that we're all setup time to build an application with Pear!


## Creating a Project

### Step 1. Initialize project

First create a new project using `pear init`.

```
$ mkdir chat
$ cd chat
$ pear init --yes
```

This will create a base structure for the project.

- `package.json`. Configuration for the app. Notice the `pear` property.
- `index.html`. The html for the app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.

### Step 2. Test that everything works

Before writing any code, make sure that everything works the way it's supposed to by using `pear dev`.

```
$ pear dev
```

This will open the app. Because it's opened in development mode, developer tools are also opened.

![Running pear dev](../assets/chat-app-1.png)

### Step 3. Automatic reload

Pear apps have automatic reload included. This means that there is no need to stop and start the app again to see changes.

While keeping the app open with `pear dev`, open `index.html` in a code editor. Change `<h1>chat</h1>` to `<h1>Hello world</h1>` and go to the app again. It should now look like this:

![Automatic reload](../assets/chat-app-2.png)

### Step 4. Change the Graphical User Interface (GUI) configuration

It's possible to change various settings with Pear. This is done with the `pear` property in `package.json`

For now, open `package.json` and update it :
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

Now the running app will be light blue and have a different size.

See all the possible options in the [Configuration Documentation](../reference/configuration.md).

### Step 5. Create a basic User Interface (UI)

In index.html let's create a simple UI for a chat app where users are able to create or join chat rooms and write messages to each other.


``` html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        display: flex;
        height: 100vh;
        background-color: #3592C3;
        color: white;
        justify-content: center;
        margin: 0;
        padding: 0;
      }

      .hidden {
        display: none !important;
      }

      #setup {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      #loading {
        align-self: center;
      }

      #chat {
        display: flex;
        flex-direction: column;
        width: 100vw;
      }

      #header {
        display: flex;
        justify-content: space-between;
      }

      #messages {
        flex: 1;
        font-family: 'Courier New', Courier, monospace;
        overflow-y: scroll;
      }

      #message-form {
        display: flex;
      }

      #message {
        flex: 1;
      }
    </style>
    <script type='module' src='./app.js'></script>
  </head>
  <body>
    <div id="setup">
      <div>
        <button id="create-chat-room">Create chat room</button>
      </div>
      <div>
        - or -
      </div>
      <div>
        <button id="join-chat-room">Join chat room</button>
        <input id="join-chat-room-topic" type="text" placeholder="Topic for chat room" />
      </div>
    </div>
    <div id="loading" class="hidden">Loading ...</div>
    <div id="chat" class="hidden">
      <div id="header">
        <div>
          Topic: <span id="chat-room-topic"></span>
        </div>
        <div>
          Peers: <span id="peers-count">0</span>
        </div>
      </div>
      <div id="messages"></div>
      <form id="message-form">
        <input id="message" type="text" />
        <input type="submit" value="Send" />
      </form>
    </div>
  </body>
</html>
```

After running with `pear dev` it should look like this:

![Layout of the app](../assets/chat-app-3.png)

## Making the Pear App functional

Now that we've created some basic UI for a chat app, let's integrate it with Pear and Holepunch building blocks to make it functional.

### Step 1. Install modules

This app uses the following modules: `hyperswarm`, `hypercore-crypto`, and `b4a`.

```
$ npm i hyperswarm hypercore-crypto b4a
```

**Note**: If the modules are installed while the app is running an error is thrown similar to `Cannot find package 'hyperswarm' imported from /app.js`. When installing modules, close down the app, before they can be installed.

- [hyperswarm](https://www.npmjs.com/package/hyperswarm). One of the main building blocks. Find peers that share a "topic".
- [hypercore-crypto](https://www.npmjs.com/package/hypercore-crypto). A set of crypto function used in Pear.
- [b4a](https://www.npmjs.com/package/b4a). A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class.

### Step 2. Integrating with Hyperswarm

Open `app.js` in a code editor and replace the content with this:

``` js
import { teardown } from 'pear'
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

const swarm = new Hyperswarm()

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
teardown(() => swarm.destroy())

// When there's a new connection, listen for new messages, and add them to the UI
swarm.on('connection', peer => {
  const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  peer.on('data', message => onMessageAdded(name, message))
})

// When there's updates to the swarm, update the peers count
swarm.on('update', () => {
  document.querySelector('#peers-count').textContent = swarm.connections.size
})

document.querySelector('#create-chat-room').addEventListener('click', createChatRoom)
document.querySelector('#join-chat-room').addEventListener('click', joinChatRoom)
document.querySelector('#message-form').addEventListener('submit', sendMessage)

async function createChatRoom() {
  // Generate a new random topic (32 byte string)
  const topicBuffer = crypto.randomBytes(32)
  joinSwarm(topicBuffer)
}

async function joinChatRoom() {
  const topicStr = document.querySelector('#join-chat-room-topic').value
  const topicBuffer = b4a.from(topicStr, 'hex')
  joinSwarm(topicBuffer)
}

async function joinSwarm(topicBuffer) {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  // Join the swarm with the topic. Setting both client/server to true means that this app can act as both.
  const discovery = swarm.join(topicBuffer, { client: true, server: true })
  await discovery.flushed()

  const topic = b4a.toString(topicBuffer, 'hex')
  document.querySelector('#chat-room-topic').innerText = topic
  document.querySelector('#loading').classList.add('hidden')
  document.querySelector('#chat').classList.remove('hidden')
}

function sendMessage(e) {
  const message = document.querySelector('#message').value
  document.querySelector('#message').value = ''
  e.preventDefault()

  onMessageAdded('You', message)

  // Send the message to all peers (that you are connected to)
  const peers = [...swarm.connections]
  peers.forEach(peer => peer.write(message))
}

function onMessageAdded(from, message) {
  const $div = document.createElement('div')
  $div.textContent = `<${from}> ${message}`
  document.querySelector('#messages').appendChild($div)
}
```

### Step 3. Run the app

Now it's time to run the app.

We'll be running two instances of the application for communication in separate terminals:

```
$ pear dev
```

In the first app, click on `Create chat room`. When it has started the topic will be at the top. This is a 32 byte public key that counts as the shared topic.

In the second instance of the app, enter the public key that was shown in the first app into 'topic for chat room' and then click on `Join chat room`.

<p align="center">
  <img src="../assets/chat-app-4a.png" alt="The first app, with the topic"> <img src="../assets/chat-app-4b.png" alt="Second app, using topic from the first">
</p>

After this the two apps should be able to send messages between them.

View from the first app and second app respectively.

<p align="center">
  <img src="../assets/chat-app-5a.png" alt="View from the first app"> <img src="../assets/chat-app-5b.png" alt="View from the second app">
</p>


## Understand the code

Looking through the code, a lot of it concerns handling the layout. It's outside of the scope of this tutorial to delve into that, but if you're familiar with front-end concepts it should be easy to grasp. It's possible to use larger frameworks like React, but that won't be covered here.

There are two main differences between a more common client-server chat app vs this peer-to-peer chat app

### 1. Discovery

In a traditional client-server setup the server is hosted on an ip (or hostname) and a port, e.g. `http://localhost:3000`. This is what clients use to connect to the server.

In the code it says `swarm.join(topicBuffer, { client: true, server: true })`. Here `topicBuffer` is a 32 byte string. The creator of a chat room will generate a random byte string, which they will share with others, who can then join.

### 2. No servers

When the chat app was started there wasn't one of them that acting as a server, and another as a client. Instead they join/leave topics. This is an important point, because it means that even if the peer that created a chat room leaves, then it doesn't stop working.

## Next steps
We've built the app and got it running, awesome! \
- Let's look at how to [share it with others](../guides/publishing-and-sharing-your-pear-app.md).




