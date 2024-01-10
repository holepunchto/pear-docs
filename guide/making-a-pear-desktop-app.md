# Making a Pear Desktop Application

This guide demonstrates how to build a straightforward peer-to-peer chat application.

The following steps walkthrough the feature implementations of chat room creation, connecting between users and sending messages.

## Step 1. HTML Structure and CSS Styles

This guide follows on from [Starting a Pear Desktop Project](./starting-a-pear-desktop-project.md).

We should have a project folder with the following files

- `package.json`
- `index.html`
- `app.js`
- `test/index.test.js`

Since this is a small chat application, we'll keep styles and HTML in one file.

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


## Step 2. Module dependencies

Our app is going to use these modules:

- [hyperswarm](https://www.npmjs.com/package/hyperswarm) - Find peers that share a "topic". An essential building block.
- [hypercore-crypto](https://www.npmjs.com/package/hypercore-crypto) - A set of crypto functions.
- [b4a](https://www.npmjs.com/package/b4a) - A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class.

The dependencies can be installed with the following command:

```
$ npm i hyperswarm hypercore-crypto b4a
```

**Note**: If the modules are installed while the app is running, an error is thrown similar to `Cannot find package 'hyperswarm' imported from /app.js`. When installing modules, close down the app before attempting dependency installation.

## Step 3. Implement the program with JavaScript

Open `app.js` in a code editor and replace the contents with the following:

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
swarm.on('connection', (peer) => {
  // name incoming peers after first 6 chars of its public key as hex
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

async function joinChatRoom () {
  const topicStr = document.querySelector('#join-chat-room-topic').value
  const topicBuffer = b4a.from(topicStr, 'hex')
  joinSwarm(topicBuffer)
}

async function joinSwarm (topicBuffer) {
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

function sendMessage (e) {
  const message = document.querySelector('#message').value
  document.querySelector('#message').value = ''
  e.preventDefault()

  onMessageAdded('You', message)

  // Send the message to all peers (that you are connected to)
  const peers = [...swarm.connections]
  for (const peer of peers) peer.write(message)
}

// appends element to #messages element with content set to sender and message
function onMessageAdded (from, message) {
  const $div = document.createElement('div')
  $div.textContent = `<${from}> ${message}`
  document.querySelector('#messages').appendChild($div)
}
```

> Note that code in `app.js` imports from `pear` but no `pear` dependency has been installed. This is the [Pear API](../reference/api.md)


## Step 5 Open two application instances

As there will be two apps running, open two terminals and in each of them run the following:

```
$ pear dev
```

In the first app, click on `Create chat room`. Once the app has started the topic can be found near the top. 

Paste the topic from the first app into the input of the second app and then click on `Join chat room`.

<p align="center">
  <img src="../assets/chat-app-4a.png" alt="The first app, with the topic"> <img src="../assets/chat-app-4b.png" alt="Second app, using topic from the first">
</p>

Once connected messages can be sent between the applications.

<p align="center">
  <img src="../assets/chat-app-5a.png" alt="View from the first app"> <img src="../assets/chat-app-5b.png" alt="View from the second app">
</p>


### Discussion

In a traditional client-server setup the server is hosted at an IP address (or hostname) and a port, e.g. `http://localhost:3000`. This is what clients use to connect to the server.

The code in `app.js` contains the line `swarm.join(topicBuffer, { client: true, server: true })`. Here `topicBuffer` is a 32 byte string. The creator of a chat room will generate a random byte string which acts as a room invinitation. Any peers with this invite (the topic) can use it to message all other peers with the invite. Note also that both applications behave the same way, neither is only a client and neither is only a server.

Applications join and leave topics, so if the peer who created the topic/invite goes offline or even leaves the topic this has no effect on functionality.

Two application instances are running on the same machine, connecting over a Distributed Hash Table (DHT) via `hyperswarm`.

The code could be copied to another machine and `pear dev` could be ran on two machines instead of two terminals. However [Sharing a Pear Application](./sharing-a-pear-app.md) covers sharing the application itself over the same DHT. So then instead of copying, `pear` can be used to generate a topic for an app (the application key) and then that app on a peer machine by passing that key to the `pear` installation on that machine.

> No frameworks were used to build this application but any frontend framework can be used with Pear.

## Next

* [Starting a Pear Terminal Project](./starting-a-pear-terminal-project.md)
* [Sharing a Pear Application](./sharing-a-pear-app.md)