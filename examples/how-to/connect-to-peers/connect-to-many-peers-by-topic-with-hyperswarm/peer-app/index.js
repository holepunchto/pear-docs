
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import process from 'bare-process'

const swarm = new Hyperswarm()
const name = b4a.toString(swarm.keyPair.publicKey, 'hex')
process.once('SIGINT', () => swarm.destroy().then(() => process.exit(0)))

// Keep track of all connections and console.log incoming data
const conns = []
swarm.on('connection', conn => {
  const peer = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', peer, '*')
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', data => console.log(`${peer}: ${data}`))
  conn.on('error', e => console.log(`Connection error: ${e}`))
})

// Broadcast stdin to all connections
process.stdin.on('data', d => {
  console.log(`${name}: ${d}`)
  for (const conn of conns) {
    conn.write(d)
  }
})

// Join a common topic
const topic = Bare.argv[2] ? b4a.from(Bare.argv[2], 'hex') : crypto.randomBytes(32)
const discovery = swarm.join(topic, { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
  console.log('joined topic:', b4a.toString(topic, 'hex'))
})
