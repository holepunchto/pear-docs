# Making your first Pear app

This tutorial will teach you on how to make your first Pear app.

As a simple example we will create a chat app where you can create a chat, and have others join it.

## Step 1. Init

Let's first create a new project using `pear init`.

```
$ mkdir chat
$ cd chat
$ pear init --yes
```

This will create a base structure for your project.

- `package.json`. Config for your app. You should notice the `pear` property.
- `index.html`. The UI for your app.
- `app.js`. The main code.
- `test/index.test.js`. Skeleton for writing tests.

## Step 2. Test that everything works

Before we write any code, let's just make sure that everything works the way it's supposed to by using `pear dev`.

```
$ pear dev
```

This will open your app. Because it's opened in development mode, developer tools are also opened.

![Running pear dev](/chat-app-1.png)

## Step 3. Automatic reload

Pear apps have automatic reload included. This means that you don't have to stop and start the app again to see the changes.

While keeping the app open with `pear dev`, open `index.html` in your editor. Change `<h1>chat</h1>` to `<h1>Hello world</h1>` and see the app again. It should now look like.

![Automatic reload](/chat-app-2.png)

## Step 4. Install modules

For this chat app we are going to use these modules: `hyperswam`, `hypercore-crypto`, `graceful-goodbye`, and `b4a`.


```
$ npm i hyperswam graceful-goodbye b4a
```

**Note**: If you install these while having the app running you will get an error similar to `Cannot find package 'graceful-goodbye' imported from /app.js`. When installing modules, you will need to close down your app, before they can be found.

- [hyperswam](https://www.npmjs.com/package/hyperswam). One of Pear's building blocks. Able to find peers that share a "topic".
- [hypercore-crypto](https://www.npmjs.com/package/hypercore-crypto). A set of crypto function used in Pear.
- [graceful-goodbye](https://www.npmjs.com/package/graceful-goodbye). A nice-to-have module that makes it easier to do some cleanup before your app exits.
- [b4a](https://www.npmjs.com/package/b4a). A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class.

## Step 5. Create the UI for your app

In your first chat app we want to be able to start a chat room and have others join it, and then write messages to each other.

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

If you run with `pear dev` you will see this

![Layout of the app](/chat-app-3.png)

## Step 6. Write the javascript code, using `hyperswarm`

Open `app.js` in your code editor and replace it with this

``` js
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

const peers = []
const swarm = new Hyperswarm()

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
goodbye(() => swarm.destroy())

// When there's a new connection, add it to the `peers` array
swarm.on('connection', peer => {
  const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  peers.push(peer)
  document.querySelector('#peers-count').textContent = peers.length

  peer.on('data', message => addMessage(name, message))
  peer.once('close', () => {
    peers.splice(peers.indexOf(peer), 1)
    document.querySelector('#peers-count').textContent = peers.length
  })
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

  addMessage('You', message)

  // Send the message to all peers (that you are connected to)
  for (const peer of peers) {
    peer.write(message)
  }
}

function addMessage(from, message) {
  const $div = document.createElement('div')
  $div.textContent = `<${from}> ${message}`
  document.querySelector('#messages').appendChild($div)
}
```

## Step 7. Run the code

Now we need to run the app we just wrote.

As we need to have to apps running, open two terminals and run this in both of them

```
$ pear dev
```

In the first app, you click on `Create chat room`. When it has started you will see a topic at the top. This is a 32 byte public key that counts as the shared topic.

In the second app you paste in the topic you got from the first, and then click on `Join chat room`.

![Use topic from creator](/chat-app-4.png)

After that you can send messages between the peers

![Messages between the peers](/chat-app-5.png)

## Step 8. Understanding the code

As you look through the code you may notice that quite a lot of it is just handling the layout. Understanding that is outside of this scope, but shouldn't look unfamiliar to you. You can easily use frameworks like React, but we'll cover that in other examples.

There are two main differences between a more common client-server chat app vs your new chat app

### 1. Discovery

In a client-server setup you would have a server hosted on an ip (or hostname) and a port, e.g. `http://localhost:3000`. This is what clients use to connect the server. And then it's the servers responsibility to have clients find each other.

If you look in the code in your chat app you can see `swarm.join(topicBuffer, { client: true, server: true })`. Here `topicBuffer` is a 32 byte string. The creator of a chat room will create a random byte string, which they will share with others, who can then join.

### 2. There are no server

When you started your chat app there was not one of them that acted as a server, and another as a client. Instead they join/leave topics. This is an important point, because it means that even if the peer that created a chat room leaves, then it doesn't stop working.

## Step 9. Release your app

With Pear you can have one "release" (or "production") version of your app, and many other versions. Think of it, the same way that `git` works where you have branches. You put your code in a branch. This way others can test it, and when you are ready, you pull that branch into the main one.

Similarly, you use `pear stage some-name` to create a version of the app that others can testout. When you are ready you use `pear release some-name` and now this becomes the main version of your app.

We want to test your app, and since we don't have other versions, let's call it `main`. It is just a name, so you can call it whatever you want.

```
$ pear stage main
```

For now we won't go into details with stage/release, so just release it immediately by running

```
$ pear release main
```

## Step 10. Seeding

Afer releasing, your app is still only available on your computer. To distribute it to others, you need to start seeding it. You can think of this as deployment in a more traditional setup.

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

## Step 11. Share your app

From another terminal (or even another machine) you can now run

```
$ pear launch pear:w7tu... # Use the key you got in the previous output
```

And now your app should run.

**Note**: You could now exit the process running `pear seed main` and while at least one computer is running the app, others will still be able to launch it using the key you had before. This is because that any user of the app also helps seeding it.

![Launching the app with pear launch](/chat-app-6.png)


## Learnings, main takeaways

- How to set up a basic app with `pear init`
- Discover other peers/computers with `hyperswarm` (also when developing locally)
- Easy to distribute with `pear stage/release/seed`
- There are no servers used

## Next

That is it for the first version of your chat app.

Next you will turn it into a real peer-to-peer app, and learn how to do that.
