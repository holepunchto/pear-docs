# Making your first pear app

This tutorial will teach you on how to make your first pear app.

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

For this chat app we are going to use these modules: `hyperdht`, `graceful-goodbye`, and `b4a`.


```
$ npm i hyperdht graceful-goodbye b4a
```

**Note**: If you install these while having the app running you will get an error similar to `Cannot find package 'graceful-goodbye' imported from /app.js`. When installing modules, you will need to close down your app, before they can be found.

- [hyperdht](https://www.npmjs.com/package/hyperdht). One of pear's building blocks. Makes you able to create connections between nodes.
- [graceful-goodbye](https://www.npmjs.com/package/graceful-goodbye). A nice-to-have module that makes it easier to do some cleanup before your app exits.
- [b4a](https://www.npmjs.com/package/b4a). A set of functions for bridging the gap between the Node.js `Buffer` class and the `Uint8Array` class

## Step 5. Create the UI for our app

In our first chat app we want to be able to start a chat room and have others join it, and then write messages to each other.

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

      #messages {
        flex: 1;
        font-family: 'Courier New', Courier, monospace;
        overflow-y: scroll;
      }

      #message-panel {
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
        <input id="join-chat-room-public-key" type="text" placeholder="Public key for chat room" />
      </div>
    </div>
    <div id="loading" class="hidden">Loading ...</div>
    <div id="chat" class="hidden">
      <div id="header">
        Chat room: <span id="chat-room-public-key"></span>
      </div>
      <div id="messages"></div>
      <div id="message-panel">
        <input id="message" type="text" />
        <button id="send-message">Send</button>
      </div>
    </div>
  </body>
</html>
```

If you run with `pear dev` you will see this

![Layout of the app](/chat-app-3.png)

## Step 6. Write the javascript code, using `hyperdht`

Open `app.js` in your code editor and replace it with this

``` js
import DHT from 'hyperdht'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

document.querySelector('#create-chat-room').addEventListener('click', startAsServer)
document.querySelector('#join-chat-room').addEventListener('click', startAsClient)

async function startAsServer() {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  const dht = new DHT()

  // This keypair is your peer identifier in the DHT
  const keyPair = DHT.keyPair()

  const server = dht.createServer(conn => {
    conn.on('data', message => addMessage('client', message))

    document.querySelector('#send-message').addEventListener('click', () => {
      const message = document.querySelector('#message').value
      conn.write(message)
      addMessage('You', message)
    })
  })

  await server.listen(keyPair)

  const publicKey = b4a.toString(keyPair.publicKey, 'hex')
  document.querySelector('#chat-room-public-key').innerText = publicKey
  document.querySelector('#loading').classList.add('hidden')
  document.querySelector('#chat').classList.remove('hidden')

  // Unnannounce the public key before exiting the process
  // (This is not a requirement, but it helps avoid DHT pollution)
  goodbye(() => server.close())
}

async function startAsClient() {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  const publicKey = document.querySelector('#join-chat-room-public-key').value
  const publicKeyBuffer = b4a.from(publicKey, 'hex')
  const dht = new DHT()
  const conn = dht.connect(publicKeyBuffer)
  conn.on('data', message => addMessage('server', message))
  conn.once('open', () => {
    document.querySelector('#chat-room-public-key').innerText = publicKey
    document.querySelector('#loading').classList.add('hidden')
    document.querySelector('#chat').classList.remove('hidden')

    document.querySelector('#send-message').addEventListener('click', () => {
      const message = document.querySelector('#message').value
      conn.write(message)
      addMessage('You', message)
    })
  })
}

function addMessage(from, message) {
  document.querySelector('#messages').innerHTML = document.querySelector('#messages').innerHTML + `<div>${from}: ${message}</div>`
}
```

## Step 7. Run the code

Now we need to run the app we just wrote.

As we need to have to apps running, open two terminals and run this in both of them

```
$ pear dev
```

In the first app, you click on `Create chat room`. When it has started you will see a key at the top. This is the public key.

In the second app you paste in the public key you got from the other app, and then click on `Join chat room`.

![Use public key from server to join from the client](/chat-app-4.png)

After that you can send messages between the server and the client

![Messages between the server and the client](/chat-app-5.png)

## Step 8. Understanding the code

As you look through the code you may notice that quite a lot of it is just handling the layout. Understanding that is outside of this scope, but shouldn't look unfamiliar to you.

Because we are using peer-to-peer, things are done a little differently. In our chat app, the one who creates a chat room will act a server, and someone who connects will be a client.

In a non-peer-to-peer world that server would start hosting on a port and the client would connect similar to `http://localhost:3000`. For a pear app they will use a unique key string to connect to each other, like `[insert byte string]`. This makes it easier for them to always reach each other no matter what kind of network they may be on.

**Note**: An important thing to note is that in peer-to-peer you will often not have servers and clients the way you are used to. But we will build use this chat app to build on top of this. There is also a lot of things like that aren't handled, like clients disconnecting.

## Step 9. Release your app

With pear you can have one "release" (or "production") version of your app, and many other versions. Think of it, the same way that `git` works where you have branches. You put your code in a branch. This way others can test it, and when you are ready, you pull that branch into the main one.

Similarly, you use `pear stage some-name` to create a version of the app that others can testout. When you are ready you use `pear release some-name` and now this becomes the main version of your app.

We want to test our app, and since we don't other version, let's call it `main`. It is just a name, so you can call it whatever you want.

```
$ pear stage main
```

For now we won't go into details with stage/release, so just release it immediately by running

```
$ pear release main
```

## Step 10. Seeding

Afer releasing, your app is still only available on your computer. To have others be able to get it, you need to start seeding it. Think of this as deployment in a more traditional setup.

Run this:

```
$ pear seed main
```

Do not close the process. The output will look similar to:

```
🍐 Seeding: chat [ main ]
   ctrl^c to stop & exit

-o-:-
    pear:w7tux8mzhqp8jo763adw39apcyuju3cthp8mt3yowfft8gg5xj8o
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

- Good: There are no host/ip
- Good: Easy to discover from other computers, even in development (no localhost)
- Good: Easy to deploy without setting up servers
- Bad: Still a standard client/server pattern
- Bad: Every time we restart the server, the public key changes and we need to restart
- Bad: Testing without internet access [how do we actually do this?]
