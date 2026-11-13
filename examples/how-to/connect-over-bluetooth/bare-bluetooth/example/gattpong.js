const { Central, Server, Service, Characteristic } = require('..')

const NAME = 'bare-gattpong'

// Peers are matched on this rather than on NAME: a name only reaches the other
// side reliably once connected, but an advertised service UUID always does.
const SERVICE_UUID = '0000ca11-0000-1000-8000-00805f9b34fb'
const CHARACTERISTIC_UUID = '0000ca12-0000-1000-8000-00805f9b34fb'

// CoreBluetooth reports UUIDs uppercase, and Bluetooth-base ones in their
// 16-bit short form; BlueZ and Android report them long and lowercase.
function same(uuid, other) {
  return expand(uuid) === expand(other)
}

function expand(uuid) {
  uuid = uuid.toLowerCase()
  if (uuid.length === 4) return `0000${uuid}-0000-1000-8000-00805f9b34fb`
  if (uuid.length === 8) return `${uuid}-0000-1000-8000-00805f9b34fb`
  return uuid
}

const role = Bare.argv[2]

if (role === 'listen') listen()
else if (role === 'connect') connect()
else {
  console.error('usage: bare example/gattpong.js listen')
  console.error('       bare example/gattpong.js connect')
  Bare.exit(1)
}

function listen() {
  const server = new Server()
  const characteristic = new Characteristic(CHARACTERISTIC_UUID, { write: true, notify: true })

  server.on('stateChange', (state) => {
    console.log('state:', state)
    if (state !== 'poweredOn') return

    server.addService(new Service(SERVICE_UUID, [characteristic]))
  })

  server.on('serviceAdd', () => {
    server.startAdvertising({ name: NAME, serviceUUIDs: [SERVICE_UUID] })
    console.log(`advertising as "${NAME}"`)
    console.log('run: bare example/gattpong.js connect')
  })

  server.on('subscribe', (peer, uuid) => {
    if (same(uuid, CHARACTERISTIC_UUID)) console.log('central subscribed')
  })

  // The central writes, the server answers with a notification.
  const reply = rally((message) => server.updateValue(characteristic, Buffer.from(message)))

  server.on('writeRequest', (requests) => {
    for (const request of requests) {
      if (request.responseNeeded) server.respondToRequest(request, Server.ATT_SUCCESS)
      reply(Buffer.from(request.data).toString())
    }
  })

  server.on('error', (err) => console.error('error:', err.message))
}

function connect() {
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
      console.error('is "bare example/gattpong.js listen" still running on the other machine?')
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

    let characteristic = null

    // The server notifies, the central answers with a write.
    const reply = rally((message) => peripheral.write(characteristic, Buffer.from(message)))

    peripheral.on('servicesDiscover', (services) => {
      for (const service of services) {
        if (same(service.uuid, SERVICE_UUID)) peripheral.discoverCharacteristics(service)
      }
    })

    peripheral.on('characteristicsDiscover', (service, characteristics) => {
      for (const found of characteristics) {
        if (!same(found.uuid, CHARACTERISTIC_UUID)) continue
        characteristic = found
        peripheral.subscribe(characteristic)
      }
    })

    peripheral.on('notifyState', (subscribed, isNotifying) => {
      if (!isNotifying) return
      console.log('subscribed')
      console.log('>', 'ping')
      peripheral.write(characteristic, Buffer.from('ping'))
    })

    peripheral.on('notify', (notified, data) => reply(Buffer.from(data).toString()))

    peripheral.on('disconnect', () => console.log('disconnected'))
    peripheral.on('error', (err) => console.error('peripheral error:', err.message))

    peripheral.discoverServices([SERVICE_UUID])
  })

  central.on('disconnect', () => console.log('disconnected'))
  central.on('error', (err) => console.error('error:', err.message))
}

// Answers every message a second later with the other word, through `send`.
function rally(send) {
  return (received) => {
    console.log('<', received)

    const message = received === 'ping' ? 'pong' : 'ping'
    setTimeout(() => {
      console.log('>', message)
      send(message)
    }, 1000)
  }
}
