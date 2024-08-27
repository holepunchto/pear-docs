# Making a Pear Terminal Application

This guide demonstrates how to build a peer-to-peer chat application.

It continues where [Starting a Pear Terminal Project](./starting-a-pear-terminal-project.md) left off.

{% embed url="https://www.youtube.com/watch?v=UoGJ7PtAwtI" %} Build with Pear - Episode 04: Pear Terminal Applications {% embeded %}

## Step 1. Install modules

For the chat part of the app, the same modules are needed as in [Making a Pear Desktop Application](./making-a-pear-desktop-app.md), `hyperswarm`, `b4a` and  `hypercore-crypto`.

Pear runs on [`Bare`](https://github.com/holepunchto/bare), a lightweight JavaScript runtime which is similar to Node.js but comes with very few internal modules. Almost all Bare functionality comes from dependencies. Pear Terminal Applications are Bare applications so we will need `bare-readline` and `bare-tty` to read user input.


```
npm i bare-readline bare-tty bare-process hyperswarm b4a hypercore-crypto
```

## Step 2. JavaScript

Replace `index.js` with

``` js
/* global Pear */
import Hyperswarm from 'hyperswarm'   // Module for P2P networking and connecting peers
import b4a from 'b4a'                 // Module for buffer-to-string and vice-versa conversions 
import crypto from 'hypercore-crypto' // Cryptographic functions for generating the key in app
import readline from 'bare-readline'  // Module for reading user input in terminal
import tty from 'bare-tty'            // Module to control terminal behavior
import process from 'bare-process'    // Process control for Bare


const { teardown, config, updates } = Pear    // Import configuration options, updates and cleanup functions from Pear
const key = config.args.pop()       // Retrieve a potential chat room key from command-line arguments
const shouldCreateSwarm = !key      // Flag to determine if a new chat room should be created
const swarm = new Hyperswarm()

// Unannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
teardown(() => swarm.destroy())

// Enable automatic reloading for the app
// This is optional but helpful during production
updates(() => Pear.reload())

const rl = readline.createInterface({
  input: new tty.ReadStream(0),
  output: new tty.WriteStream(1)
})

// When there's a new connection, listen for new messages, and output them to the terminal
swarm.on('connection', peer => {
  const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  console.log(`[info] New peer joined, ${name}`)
  peer.on('data', message => appendMessage({ name, message }))
  peer.on('error', e => console.log(`Connection error: ${e}`))
})

// When there's updates to the swarm, update the peers count
swarm.on('update', () => {
  console.log(`[info] Number of connections is now ${swarm.connections.size}`)
})

if (shouldCreateSwarm) {
  await createChatRoom()
} else {
  await joinChatRoom(key)
}

rl.input.setMode(tty.constants.MODE_RAW) // Enable raw input mode for efficient key reading
rl.on('data', line => {
  sendMessage(line)
  rl.prompt()
})
rl.prompt()

rl.on('close', () => {
  process.kill(process.pid, 'SIGINT')
})

async function createChatRoom () {
  // Generate a new random topic (32 byte string)
  const topicBuffer = crypto.randomBytes(32)
  // Create a new chat room for the topic
  await joinSwarm(topicBuffer)
  const topic = b4a.toString(topicBuffer, 'hex')
  console.log(`[info] Created new chat room: ${topic}`)
}

async function joinChatRoom (topicStr) {
  const topicBuffer = b4a.from(topicStr, 'hex')
  await joinSwarm(topicBuffer)
  console.log(`[info] Joined chat room`)
}

async function joinSwarm (topicBuffer) {
  // Join the swarm with the topic. Setting both client/server to true means that this app can act as both.
  const discovery = swarm.join(topicBuffer, { client: true, server: true })
  await discovery.flushed()
}

function sendMessage (message) {
  // Send the message to all peers (that you are connected to)
  const peers = [...swarm.connections]
  for (const peer of peers) peer.write(message)
}

function appendMessage ({ name, message }) {
  // Output chat msgs to terminal
  console.log(`[${name}] ${message}`)
}
```

## Step 3. Run in dev mode

To test this chat app, in one terminal run `pear run --dev .`

The app will output something similar to:

```
[info] Created new chat room: a1b2c35fbeb452bc900c5a1c00306e52319a3159317312f54fe5a246d634f51a
```

In another terminal use this key as input, `pear run --dev . a1b2c35fbeb452bc900c5a1c00306e52319a3159317312f54fe5a246d634f51a`

The app will output:

```
[info] Number of connections is now 0
[info] New peer joined, 6193ec
[info] Number of connections is now 1
[info] Joined chat room
```

Type something in one of the applications. Two Terminal Applications are now connected peer-to-peer.

## Next

* [Sharing a Pear Application](./sharing-a-pear-app.md)