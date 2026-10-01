
import DHT from 'hyperdht'
import b4a from 'b4a'
import process from 'bare-process'

const key = Bare.argv[2]
if (!key) throw new Error('provide a key')

console.log('Connecting to:', key)
const publicKey = b4a.from(key, 'hex')

const dht = new DHT()
const name = b4a.toString(dht.defaultKeyPair.publicKey, 'hex')

const conn = dht.connect(publicKey)
conn.once('open', () => {
  const peer = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', peer, '*')
})

conn.on('data', data => {
  const peer = b4a.toString(conn.remotePublicKey, 'hex')
  console.log(`${peer}: ${data}`)
})

process.stdin.on('data', d => {
  console.log(`${name}: ${d}`)
  conn.write(d)
})
