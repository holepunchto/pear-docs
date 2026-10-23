const { Central, Server } = require('..')

const NAME = 'bare-l2cappong'

// Peers are matched on this rather than on NAME: a name only reaches the other
// side reliably once connected, but an advertised service UUID always does.
// Kept in the Bluetooth base range so it costs 2 bytes of advertising budget
// instead of 16.
const SERVICE_UUID = '0000f00d-0000-1000-8000-00805f9b34fb'

const role = Bare.argv[2]
const psm = Number(Bare.argv[3])

if (role === 'listen') listen()
else if (role === 'connect' && psm) connect(psm)
else {
  console.error('usage: bare example/l2cappong.js listen')
  console.error('       bare example/l2cappong.js connect <psm>')
  Bare.exit(1)
}

function listen() {
  const server = new Server()

  server.on('stateChange', (state) => {
    console.log('state:', state)
    if (state !== 'poweredOn') return

    server.publishChannel()
    server.startAdvertising({ name: NAME, serviceUUIDs: [SERVICE_UUID] })
    console.log('advertising', SERVICE_UUID)
  })

  server.on('channelPublish', (psm) => {
    console.log(`listening on psm ${psm}, advertising as "${NAME}"`)
    console.log(`run: bare example/l2cappong.js connect ${psm}`)
  })

  server.on('channelOpen', (channel) => {
    console.log('channel open:', channel.peer)
    rally(channel, false)
  })

  server.on('error', (err) => console.error('error:', err.message))
}

function connect(psm) {
  const central = new Central()
  let connecting = false

  // Nothing advertising the service looks exactly like a hung scan, so say so
  // rather than sit there quietly.
  let searching = null

  central.on('stateChange', (state) => {
    console.log('state:', state)
    if (state !== 'poweredOn') return

    console.log('scanning for', SERVICE_UUID)
    central.startScan([SERVICE_UUID])

    searching = setTimeout(() => {
      console.error('nothing advertising that service after 20s')
      console.error('is "bare example/l2cappong.js listen" still running on the other machine?')
    }, 20000)
  })

  // BlueZ replays devices cached from earlier scans too; no RSSI means this
  // scan has not actually heard it.
  central.on('discover', (discovered) => {
    if (connecting || discovered.rssi === null) return

    connecting = true
    clearTimeout(searching)
    console.log('found:', discovered.id, discovered.rssi)
    central.stopScan()
    central.connect(discovered)
  })

  central.on('connect', (peripheral) => {
    console.log('connected:', peripheral.id)

    peripheral.on('channelOpen', (channel) => {
      console.log('channel open:', channel.psm)
      rally(channel, true)
    })

    peripheral.on('error', (err) => console.error('peripheral error:', err.message))
    peripheral.openL2CAPChannel(psm)
  })

  central.on('error', (err) => console.error('error:', err.message))
}

function rally(channel, serves) {
  channel.on('data', (data) => {
    const received = Buffer.from(data).toString()
    console.log('<', received)

    const reply = received === 'ping' ? 'pong' : 'ping'
    setTimeout(() => {
      console.log('>', reply)
      channel.write(Buffer.from(reply))
    }, 1000)
  })

  channel.on('close', () => console.log('channel closed'))
  channel.on('error', (err) => console.error('channel error:', err.message))

  if (serves) {
    console.log('>', 'ping')
    channel.write(Buffer.from('ping'))
  }
}
