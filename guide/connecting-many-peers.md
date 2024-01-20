### Hyperswarm: Connecting to Many Peers by Topic

Get setup by creating a project folder and installing dependencies:

```bash
mkdir connect-two-peers
cd connect-two-peers
pear init -y -t terminal
npm install hyperswarm b4a graceful-goodbye hypercore-crypto
```

In the former example, two peers connected directly using the first peer's public key. Hyperswarm helps to discover peers swarming a common topic, and connect to as many of them as possible. This will become clearer in the Hypercore example, but it's the best way to distribute peer-to-peer data structures.

The [Hyperswarm](../building-blocks/hyperswarm.md) module provides a higher-level interface over the underlying DHT, abstracting away the mechanics of establishing and maintaining connections. Instead, 'join' topics, and the swarm discovers peers automatically. It also handles reconnections in the event of failures.

In the previous example, we needed to explicitly indicate which peer was the server and which was the client. By using Hyperswarm, we create two peers, have them join a common topic, and let the swarm deal with connections.

This example consists of a single file, `peer.js`. In one terminal, type `node peer.js`, it will display the topic. Copy/paste that topic into N additional terminals with `node peer.mjs (topic)`. Each peer will log information about the other connected peers.

Start typing into any terminal, and it will be broadcast to all connected peers.

```javascript
//peer.js
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

// Keep track of all connections and console.log incoming data
const conns = []
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', name, '*')
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', data => console.log(`${name}: ${data}`))
})

// Broadcast stdin to all connections
process.stdin.on('data', d => {
  for (const conn of conns) {
    conn.write(d)
  }
})

// Join a common topic
const topic = process.argv[2] ? b4a.from(process.argv[2], 'hex') : crypto.randomBytes(32)
const discovery = swarm.join(topic, { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
  console.log('joined topic:', b4a.toString(topic, 'hex'))
})
```
