# Making a Pear app

This tutorial builds on top of [this tutorial](/making-a-pear-app-1.md) and will teach how to send persistent state between peers, by sharing a peer's nickname.

It is important to understand that the complexity increases from the first version of the chat app. This is because there was no shared state between them in the first example. In peer-to-peer, if peer A writes some data, then peer C may receive this data from peer B, but still needs to be able to verify that it was written by A and not tampered with.

## Understand how hypercore data is shared and accessed

Before going into the code, let's look at how data is shared in the network of peers, but can't be read by everyone. This means that peers help share data, even though they may not have read access for it. A lot of this happens under the hood, but it's important to understand.

A `hypercore` is an append-only log, where it's guaranteed that only a single peer can write to it, but all other peers can share it between each other. Each new entry in `hypercore` is called a block. Only peers with the (read access) `key` to the hypercore can read the data.

**Sequence diagram about how blocks of data can be shared without read access**

```
Peer A                Peer B                     Peer C
  |                     |                          |
Writes block a1b2c3     |                          |
  |                     |                          |
  |  ====Send key====>  |                          |
  |                     |                          |
  |  =============Send block a1b1c3=============>  |
  |                     |                          |
  |                     | <===Send block a1b1c3==  |
```

In this scenario Peer A shares its `key` with Peer B. Some data from Peer A's hypercore is send to Peer C. Because Peer C does not have access to Peer A's `key`, they cannot read it. Later on, Peer B gets the block of data from Peer C, and can now read it.

The most important thing to understand is that the way data is shared between peers and having read access to data is not the same thing.


## Step 1. Install modules.

For this part of the tutorial, add `corestore`, `hyperbee`, and `protomux-rpc`.

```
$ npm i corestore hyperbee protomux-rpc
```

- [protomux-rpc](https://www.npmjs.com/package/protomux-rpc). Use rpc (remote procedure calls) on top of hyperswarm.
- [corestore](https://www.npmjs.com/package/corestore). A [hypercore](https://github.com/holepunchto/hypercore) is an append-only log that can be written by one, but shared between peers. Corestore is a way to handle several hypercores. In this example it's used to store the peer's nickname. Every time a peer's nickname nickname change, it will be a new log entry.
- [hyperbee](https://www.npmjs.com/package/hyperbee). Use a map in a [hypercore](https://github.com/holepunchto/hypercore), which in this tutorial is used to store the (read access) `key` for known peers' hypercore.

## Step 2. Initialize state

### Corestore

``` js
const store = new Corestore(config.storage)
```

To store data, we're going to use a `Corestore`, which is really just a factory of `hypercores`. The store is always written to disk,  `config.storage` it's possible to pass a path to our app with `-s /tmp/foo`. This will become important when running the app.

### User state

``` js
const userCore = store.get({
  name: 'local',
  valueEncoding: 'json'
})
```

The user's nickname is stored in a hypercore, `store.get()`. The name of the hyercore is set to `local` but can be anything, as it's just a name. Then every time the nickname of the user changes, the change is appended as a new block to `userCore`. Blocks are shared between peers and they can verify who it was written by.

### Keys for peers' hypercore

``` js
const peerCoreKeys = new Hyperbee(store.get({ // swarm.connection.remotePublicKey => coreKey
  name: 'peerCoreKeys'
}), {
  keyEncoding: 'binary',
  valueEncoding: 'binary'
})
```

Initially a peer cannot read other peers' hypercores. Even if they have data blocks, they cannot read them. This is a way to ensure that data can be shared between peers, even though not all of them can read the data. If peer B needs to read data from peer A, they will need to receive their `hypercore.key` somehow.

Put this data in a map and use `hyperbee` for it. `Hyperbee` is just a map abstraction on top of a `hypercore` (it's a B-tree, but that's not relevant for this).

### Step 3. Bootstrapping data

``` js
// Bootstrap own nickname
const isFirstRun = userCore.length === 0
if (isFirstRun) {
  await userCore.append({
    nickname: `User ${Math.floor(1000 * Math.random())}`
  })
}
```

Bootstrapping the initial state often needs to be handled in code. In this case, as it's just the nickname, generate a random name, and store it.

## Step 4. Set up RPC and share access to local blocks of data

``` js
swarm.on('connection', async connection => {
  ...
  const rpc = new ProtomuxRPC(connection)
  rpc.respond('getKey', () => userCore.key) // Return our core's key, which grants read access
  rpc.respond('message', async data => {
    ...
  })
})
```

In the previous version of the chat app, all messages were just send as chunks on a stream. Now the stream needs to include replication of shared data, share access to that data, and send messages. To do that on one stream is called multiplexing, and to achieve this in a `hyperswarm`, use `protomux-rpc`. This module also allows RPC (remote procedure call) on the same stream.

There needs to handling the exchange of the `key` that gets read access to the sahred data. Without this `key`, the other peer cannot read data (but could still share it). There also needs to be a way of exchanging the actual chat messages.

First, set up the respond functions that triggers when the other peer calls them. As you can seee, one triger is simply returning the `key` to the `userCore` data. In other cases you may want to build some form of authentication into this, but that depends on the usecase.

## Step 5. Enable replication of data

``` js
swarm.on('connection', async connection => {
  ...
  store.replicate(connection) // This enables replication later on from this peer
  ...
})
```

Now also enable replication with `store.replicate(connection)`. This tells the store to allow the peer (`connection`) to replicate all the blocks of data that the `store` knows. It's important to understand that in a peer-to-peer context, data can be shared freely between peers, but not read by everyone. So peer A may know some block of data about peer B, which they can freely send to all other peers. The other peers can only read it, if they have access to peer B's key.

## Step 6. Get access to the other peer's blocks of data

``` js
swarm.on('connection', async connection => {
  ...
  const isCoreKeyKnown = !!await peerCoreKeys.get(remotePublicKey)
  if (!isCoreKeyKnown) {
    const coreKey = await rpc.request('getKey')
    createPeerCore(coreKey, remotePublicKey)
    await peerCoreKeys.put(connection.remotePublicKey, coreKey)
  }
})

function createPeerCore(coreKey, remotePublicKey) {
  const peerCore = store.get({ key: coreKey, valueEncoding: 'json' })

  trackLatestState(peerCore, remotePublicKey) // <-- We'll get back to this in the next step

  return peerCore
}
```

If it's the first time this peer is seen, ask them for their `key`, to enable reading their shared data.

The `rpc.request('getKey')` calls the `rpc.respond('getKey', ...)` above, but on the other peer's end. Now keys have been exchaged.

Another hypercore, `peerCoreKeys` is used to store these keys in. Remember that this is also stored locally on your disk, so there is no need to exchange keys when restarting the app.

With the `key` shared, another hypercore instance is added. This allows to actually read the data, which is covered in the next step.

## Step 7. Continuously read updates to shared data

```js
function trackLatestState(core, remotePublicKey) {
  core.ready().then(reloadLatest)
  core.on('append', reloadLatest)

  async function reloadLatest() {
    if (core.length === 0) return
    const latestState = await core.get(core.length - 1)
    ...
  }
}
```

Now that keys have been shared, it's time to read their blocks of shared data.

With `await core.get(core.length - 1)`, the latest block of data is fetched. Together with `core.on('append', ...)` it's how the app handles to always have the latest state.

The important part to understand is that even though the data is written by Peer A, it may have been sent it through other peers.

## Step 8. Read data when starting the app

``` js
trackLatestState(userCore)
...
async function initAllPeerCores() {
  for await (const { key: remotePublicKey, value: coreKey } of peerCoreKeys.createReadStream()) {
    createPeerCore(coreKey, remotePublicKey)
  }
}
```

The last part is actually the first part. When the app starts, start listening to updates from the peers that's already known. At the same time also listen to updates to `userCore`. This is important if the same peer would be connected from several clients at the same (meaning that several can write to the same hypercore), then they would still be able to share the state between them.

## Step 9. Putting it all together

### index.html

``` html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="./style.css">
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
          <div>
            Topic: <span id="chat-room-topic"></span>
          </div>
          <div>
              Peers: <span id="peers-count">0</span>
          </div>
        </div>
        <div>
          <div id="nickname-icon">
            👤
          </div>
          <div id="nickname-wrapper">
            <div id="nickname"></div>
            <form id="edit-nickname-form" class="hidden">
              <input id="new-nickname" type="text" />
              <input type="submit" value="Change" />
            </form>
          </div>
        </div>
      </div>
      <div id="messages"></div>
      <form id="message-form">
        <input id="new-message" type="text" />
        <input type="submit" value="Send" />
      </form>
    </div>
  </body>
</html>
```

### style.css

``` css
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

#nickname-icon {
  text-align: center;
}

#nickname-wrapper {
  cursor: pointer;
  display: flex;
}

#nickname {
  text-decoration: underline;
}

#edit-nickname-form {
  display: flex;
}

#messages {
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  overflow-y: scroll;
}

#message-form {
  display: flex;
}

#new-message {
  flex: 1;
}

.message span+span {
  margin-left: 10px;
}
```

### app.js

``` js
import { teardown, config } from 'pear'
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import ProtomuxRPC from 'protomux-rpc'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'

const swarm = new Hyperswarm()
const peers = new Map() // swarm.connection.remotePublicKey => { rpc, core, coreKey, state }
const store = new Corestore(config.storage)
const userCore = store.get({
  name: 'local',
  valueEncoding: 'json'
})
const peerCoreKeys = new Hyperbee(store.get({ // swarm.connection.remotePublicKey => { coreKey }
  name: 'peerCoreKeys'
}), {
  keyEncoding: 'binary',
  valueEncoding: 'binary'
})

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
teardown(async () => {
  await store.close()
  await swarm.destroy()
})

await initAllPeerCores()
await userCore.ready()

// Bootstrap own nickname
const isFirstRun = userCore.length === 0
if (isFirstRun) {
  await userCore.append({
    nickname: `User ${Math.floor(1000 * Math.random())}`
  })
}

trackLatestState(userCore)

swarm.on('update', () => {
  document.querySelector('#peers-count').textContent = swarm.connections.size
})

swarm.on('connection', async connection => {
  const { remotePublicKey } = connection
  const remotePublicKeyStr = b4a.toString(remotePublicKey, 'hex')
  store.replicate(connection) // This enables replication later on from this peer

  const rpc = new ProtomuxRPC(connection)
  updatePeer(remotePublicKey, { rpc })

  rpc.respond('getKey', () => userCore.key) // Return our core's key, which grants read access
  rpc.respond('message', async data => {
    const { message } = JSON.parse(data)
    const { state } = peers.get(remotePublicKeyStr)

    onMessageAdded({
      nickname: state.nickname,
      remotePublicKey,
      message
    })
  })

  connection.once('close', () => peers.delete(remotePublicKeyStr))

  const isCoreKeyKnown = !!await peerCoreKeys.get(remotePublicKey)
  if (!isCoreKeyKnown) {
    const coreKey = await rpc.request('getKey')
    const core = createPeerCore(coreKey, remotePublicKey)
    await peerCoreKeys.put(connection.remotePublicKey, coreKey)
    updatePeer(remotePublicKey, { core })
  }
})

document.querySelector('#create-chat-room').addEventListener('click', createChatRoom)
document.querySelector('#join-chat-room').addEventListener('click', joinChatRoom)
document.querySelector('#message-form').addEventListener('submit', sendMessage)
document.querySelector('#nickname').addEventListener('click', openEditNickname)
document.querySelector('#edit-nickname-form').addEventListener('submit', updateNickname)

async function initAllPeerCores() {
  for await (const { key: remotePublicKey, value: coreKey } of peerCoreKeys.createReadStream()) {
    createPeerCore(coreKey, remotePublicKey)
  }
}

function createPeerCore(coreKey, remotePublicKey) {
  const peerCore = store.get({ key: coreKey, valueEncoding: 'json' })

  trackLatestState(peerCore, remotePublicKey)

  return peerCore
}

function trackLatestState(core, remotePublicKey) {
  core.ready().then(reloadLatest)
  core.on('append', reloadLatest)

  async function reloadLatest() {
    if (core.length === 0) return
    const latestState = await core.get(core.length - 1)

    if (remotePublicKey) {
      updatePeer(remotePublicKey, { state: latestState })
      onNicknameUpdated({ nickname: latestState.nickname, remotePublicKey })
    } else {
      onNicknameUpdated({ nickname: latestState.nickname })
      document.querySelector('#nickname').textContent = latestState.nickname
    }
  }
}

function updatePeer(remotePublicKey, data) {
  const remotePublicKeyStr = b4a.toString(remotePublicKey, 'hex')
  const peerExists = peers.has(remotePublicKeyStr)
  if (!peerExists) peers.set(remotePublicKeyStr, {})

  const peer = peers.get(remotePublicKeyStr)
  Object.assign(peer, data)
}

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

async function sendMessage(e) {
  const message = document.querySelector('#new-message').value
  document.querySelector('#new-message').value = ''
  e.preventDefault()

  const { nickname } = await userCore.get(userCore.length - 1)
  onMessageAdded({
    nickname,
    message
  })

  // Send the message to all peers (that you are connected to)
  const peerConnections = [...swarm.connections]
  await Promise.allSettled(peerConnections.map(async connection => {
    const remotePublicKeyStr = b4a.toString(connection.remotePublicKey, 'hex')
    const { rpc } = await peers.get(remotePublicKeyStr)
    await rpc.request('message', Buffer.from(JSON.stringify({ message })))
  }))
}

async function openEditNickname() {
  const { nickname } = await userCore.get(userCore.length - 1)
  document.querySelector('#new-nickname').setAttribute('value', nickname)
  document.querySelector('#nickname').classList.add('hidden')
  document.querySelector('#edit-nickname-form').classList.remove('hidden')
}

async function updateNickname(e) {
  e.preventDefault()
  const newNickname = document.querySelector('#new-nickname').value
  await userCore.append({ nickname: newNickname })
  document.querySelector('#edit-nickname-form').classList.add('hidden')
  document.querySelector('#nickname').classList.remove('hidden')
}

function onMessageAdded({ nickname, message, remotePublicKey }) {
  const remotePublicKeyStr = remotePublicKey ? b4a.toString(remotePublicKey, 'hex') : 'local'
  const $div = document.createElement('div')
  $div.classList.add('message')
  const $spanName = document.createElement('span')
  $spanName.classList.add(`user-${remotePublicKeyStr || 'local'}`)
  $spanName.textContent = `<${nickname}>`
  const $spanMessage = document.createElement('span')
  $spanMessage.textContent = message

  $div.append($spanName, $spanMessage)

  document.querySelector('#messages').appendChild($div)
}

function onNicknameUpdated({ nickname, remotePublicKey }) {
  const remotePublicKeyStr = remotePublicKey ? b4a.toString(remotePublicKey, 'hex') : 'local'
  const $spans = document.querySelectorAll(`span.user-${remotePublicKeyStr}`)
  for (const $span of $spans) [
    $span.textContent = `<${nickname}>`
  ]
}
```

## Step 10. Running two different peers

In the previous version of the app nothing was stored on disk, so there were no issues with running multiple instances of the same app on the same computer. That was also not a problem when we tested locally.

After adding `corestore` data is being stored on disk. This can be a problem when running multiple instances because they would use and overwrite the same storage. To avoid this, use the `-s` flag to let Pear know what to set `config.storage` to.

Run one instance of the app:

```
$ pear dev -s /tmp/peer1
```

And in another terminal run another instance of the app:

```
$ pear dev -s /tmp/peer2
```

After a few messages have been exchanged:

![Some messages have been exchanged](/chat-app-7.png)

One user updates their nickname, and it is updated on the peers:

![Nickname has been updated](/chat-app-8.png)

## Learnings, main takeaways

- `hypercore` is an append-only log where each change is called a block
- `corestore` is a factory that can create `hypercores` and store them on disk
- Blocks of `hypercore` data can be shared amongst peers, but only read if they have been granted read access through `hypercore.key`
- You can overload a hyperswarm connection (a stream) for both replication of hypercores and messaging with `protomux-rpc`
- If you need a map or a tree in a `hypercore`, you can use `hyperbee`

## Next

For the next tutorial you'll learn how to persist chat messages by using hypercores

[Go to next lesson](/making-a-pear-app-3.md)
