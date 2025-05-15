# How to connect to many peers by topic with Hyperswarm

In the former example, two peers connected directly using the first peer's public key. Hyperswarm helps to discover peers swarming a common topic, and connect to as many of them as possible. This will become clearer in the Hypercore example, but it's the best way to distribute peer-to-peer data structures.

The [Hyperswarm](../building-blocks/hyperswarm.md) module provides a higher-level interface over the underlying DHT, abstracting away the mechanics of establishing and maintaining connections. Instead, 'join' topics, and the swarm discovers peers automatically. It also handles reconnections in the event of failures.

In the [How to connect two Peers by key with Hyperdht](./connect-two-peers-by-key-with-hyperdht.md), we needed to explicitly indicate which peer was the server and which was the client. By using Hyperswarm, we create two peers, have them join a common topic, and let the swarm deal with connections.

This How-to consists of a single application, `peer-app`. 

Create the `peer-app` project with the following commands:

```
mkdir peer-app
cd peer-app
pear init -y -t terminal
npm install hyperswarm hypercore-crypto b4a bare-process
```

Alter the peer-app/index.js file to the following:

```javascript
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import process from 'bare-process'

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

// Keep track of all connections and console.log incoming data
const conns = []
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', name, '*')
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', data => console.log(`${name}: ${data}`))
  conn.on('error', e => console.log(`Connection error: ${e}`))
})

// Broadcast stdin to all connections
process.stdin.on('data', d => {
  for (const conn of conns) {
    conn.write(d)
  }
})

// Join a common topic
const topic = Pear.config.args[0] ? b4a.from(Pear.config.args[0], 'hex') : crypto.randomBytes(32)
const discovery = swarm.join(topic, { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
  console.log('joined topic:', b4a.toString(topic, 'hex'))
})
```

In one terminal, open `peer-app` with `pear run --dev .`

```
cd peer-app
pear run --dev .
```

This will display the topic. Copy/paste that topic into as many additional terminals as desired with `pear run --dev . <SUPPLY TOPIC HERE>` (assuming that the current working directory of each terminal is the `peer-app` folder). Each peer will log information about the other connected peers.

Start typing into any terminal, and it will be broadcast to all connected peers.

> It is best practice to only have one Hyperswarm instance per application. This will speed up connections by reducing number of entries per topic and connections.
