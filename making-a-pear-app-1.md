# Making a Pear app

This tutorial will show how to create a basic chat app with Pear, and through that teach you how to use some of the main building blocks.

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

![Running pear dev](/chat-app-1.png)

## Step 3. Automatic reload

Pear apps have automatic reload included. This means that there is no need to stop and start the app again to see changes.

While keeping the app open with `pear dev`, open `index.html` in a code editor. Change `<h1>chat</h1>` to `<h1>Hello world</h1>` and go to your app again. It should now look like this:

![Automatic reload](/chat-app-2.png)

## Step 4. Install modules

This app uses these modules: `hyperswam`, `hypercore-crypto`, and `b4a`.

```
$ npm i hyperswam hypercore-crypto b4a
```

**Note**: If the modules are installed while the app is running an error is thrown similar to `Cannot find package 'hyperswarm' imported from /app.js`. When installing modules, close down your app, before they can be installed.

- [hyperswam](https://www.npmjs.com/package/hyperswam). One of the main building blocks. Find peers that share a "topic".
- [hypercore-crypto](https://www.npmjs.com/package/hypercore-crypto). A set of crypto function used in Pear.
- [b4a](https://www.npmjs.com/package/b4a). A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class.

## Step 5. Create the UI

In this first version, users are able to create a chat room or join others. Then write messages to each other.


``` html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        display: flex;
        height: 100vh;
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

![Layout of the app](/chat-app-3.png)

## Step 6. Write the javascript code, using `hyperswarm`

Open `app.js` in a code editor and replace with this:

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

  // Join the swam with the topic. Setting both client/server to true means that this app can act as both.
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

## Step 7. Run the app

Now it's time to write the app.

As there will be two apps running, open two terminals, and run this in both of them:

```
$ pear dev
```

In the first app, click on `Create chat room`. When it has started the topic is at the top. This is a 32 byte public key that counts as the shared topic.

In the second app, paste in the topic that was shown in the first app, and then click on `Join chat room`.

![Use topic from creator](/chat-app-4.png)

After that the two apps are able to send messages between them

![Messages between the peers](/chat-app-5.png)

## Understanding the code

Looking through the code, a great part of it has to with handling the layout. It's outside of the scope of this tutorial to delve into that, but shouldn't look unfamiliar to most. It's possible to use larger frameworks like React, but that will be covered in other examples.

There are two main differences between a more common client-server chat app vs this peer-to-peer chat app

### 1. Discovery

In a traditional client-server setup the server is hosted on an ip (or hostname) and a port, e.g. `http://localhost:3000`. This is what clients use to connect the server. And then it's the servers responsibility to have clients find each other.

In our code it says `swarm.join(topicBuffer, { client: true, server: true })`. Here `topicBuffer` is a 32 byte string. The creator of a chat room will create a random byte string, which they will share with others, who can then join.

### 2. There are no server

When the chat app was started there wasn't one of them that acting as a server, and another as a client. Instead they join/leave topics. This is an important point, because it means that even if the peer that created a chat room leaves, then it doesn't stop working.

## Step 8. Release the app

With Pear there are one single "release" (or "production") version of an app, and then many other named versions. Think of it, the same way that `git` has branches. Code is put into a branch. This way others can test it, and when everything is ready, that branch is pulled into the main one.

Similarly, use `pear stage some-name` to create a version of the app that others can test out. When everything is ready, use `pear release some-name` and now this becomes the main version of the app.

For now we want to release the app, but since there are no other versions, let's call it `main`. It is just a name, so it can be called anything you want.

```
$ pear stage main
```

For now let's not go into details with stage/release, so just release it immediately by running

```
$ pear release main
```

## Step 9. Seeding

Afer releasing, the app is still only available on that computer. To distribute it to others, start seeding it. Think of this as deployment in a more traditional setup.

Run this:

```
$ pear seed main
```

Do not close the process. The output will look similar to:

```
🍐 Seeding: chat [ main ]
   ctrl^c to stop & exit

-o-:-
    pear:w7tux8mzhqp8jo763adw39apcyuju3cthp8mt3yowfft8gg5xj80
...
^_^ announced
```

## Step 10. Share your app

From another terminal (or even another machine), now run:

```
$ pear launch pear:w7tu... # Use the key you got in the previous output
```

And now the app should run.

**Note**: The process can be that runs `pear seed main` can now be exited, and while at least one computer is running the app, others will still be able to launch it using the key from before. This is because that any user of the app also helps seeding it.

![Launching the app with pear launch](/chat-app-6.png)


## Learnings, main takeaways

- How to set up a basic app with `pear init`
- Discover other peers/computers with `hyperswarm` (also when developing locally)
- Easy to distribute with `pear stage/release/seed`
- There are no servers used

## Next

That is it for the first version of the chat app. Users can create and join rooms, and send messages to each other.

In the next part, let's add a nickname to all users, and the ability for them to change it.

[Go to next tutorial](/making-a-pear-app-2.md)
