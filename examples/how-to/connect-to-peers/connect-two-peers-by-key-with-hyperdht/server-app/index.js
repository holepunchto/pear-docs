import DHT from 'hyperdht'
import b4a from 'b4a'
import process from 'bare-process'

const dht = new DHT()

// This keypair is the peer identifier in the DHT
const keyPair = DHT.keyPair()
const name = b4a.toString(keyPair.publicKey, 'hex')

const server = dht.createServer(conn => {
  const peer = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', peer, '*')

  conn.on('data', data => console.log(`${peer}: ${data}`))
  process.stdin.on('data', d => {
    console.log(`${name}: ${d}`)
    conn.write(d)
  })
})

server.listen(keyPair).then(() => {
  console.log('listening on:', name)
})

// Unannounce the public key before exiting the process
// (Not strictly required, but it helps avoid DHT pollution.)
process.once('SIGINT', () => server.close().then(() => process.exit(0)))
