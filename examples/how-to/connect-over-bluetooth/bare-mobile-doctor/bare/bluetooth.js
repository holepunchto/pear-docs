const EventEmitter = require('events')
const FramedStream = require('framed-stream')
const { Central, Server, Service, Characteristic } = require('bare-bluetooth')

const SERVICE_UUID = 'B4A3C8A7-0000-1000-8000-00805F9B34FB'
// Readable characteristic that carries the L2CAP PSM the server published, so a
// central can learn where to open the connection-oriented channel.
const PSM_UUID = 'B4A3C8A7-0003-1000-8000-00805F9B34FB'
const CONNECT_TIMEOUT_MS = 15000

const isAndroid = Bare.platform === 'android'
const scanOptions = isAndroid ? { scanMode: Central.SCAN_MODE_LOW_LATENCY } : undefined

function serialize(msg) {
  return Buffer.from(JSON.stringify(msg))
}

let DEBUG = Bare.argv[1] === 'true'

function dbg(...args) {
  if (DEBUG) console.log('[bt]', ...args)
}

function normalizeUUID(uuid) {
  return String(uuid || '')
    .toLowerCase()
    .replace(/-/g, '')
}

function matchesUUID(a, b) {
  return normalizeUUID(a) === normalizeUUID(b)
}

function findByUUID(items, uuid) {
  if (!items) return null
  for (const item of items) {
    if (matchesUUID(item.uuid, uuid)) return item
  }
  return null
}

// Register a batch of "just re-emit this over IPC" listeners. Each entry maps a
// wrapper event to the IPC message it produces, keeping the noisy pass-through
// forwards out of the handlers that carry real logic.
function forward(emitter, send, map) {
  for (const event of Object.keys(map)) {
    const build = map[event]
    emitter.on(event, (...args) => send(build(...args)))
  }
}

// Shared lifecycle for scan/advertise toggles: OFF, ON, or REQUESTED (user
// asked for it but BLE isn't ready yet, so it starts automatically later).
class ToggleState {
  static OFF = 'off'
  static ON = 'on'
  static REQUESTED = 'requested'
}

// A framed, bidirectional message channel over an L2CAP Duplex. Both peers use
// the same object: once the channel is open there is no central/server
// asymmetry, so the chat protocol runs identically on either side.
class PeerLink extends EventEmitter {
  constructor(channel) {
    super()
    dbg('PeerLink: new (wrapping L2CAP channel in FramedStream)')
    this._stream = new FramedStream(channel)

    this._stream.on('data', (data) => {
      dbg('PeerLink: data', data.byteLength, 'bytes')
      let msg
      try {
        msg = JSON.parse(Buffer.from(data).toString())
      } catch (e) {
        this.emit('error', `Bad BLE data (${data.byteLength} bytes)`)
        return
      }
      this.emit('message', msg)
    })

    // L2CAP is reliable: a peer leaving surfaces as end/close/error on the
    // stream, so we don't need platform-specific disconnect detection.
    this._stream.on('close', () => {
      dbg('PeerLink: stream close')
      this.emit('close')
    })
    this._stream.on('error', (err) => {
      dbg('PeerLink: stream error', err && err.message)
      this.emit('close')
    })
  }

  send(msg) {
    dbg('PeerLink: send', msg.t)
    this._stream.write(serialize(msg))
  }

  close() {
    dbg('PeerLink: close()')
    this._stream.destroy()
  }
}

// Central role: scans, connects, reads the peer's PSM and opens the L2CAP
// channel. Emits 'link' with a PeerLink once the channel is open.
class BLECentral extends EventEmitter {
  constructor(opts) {
    super()
    this.serviceUUID = opts.serviceUUID
    this.psmUUID = opts.psmUUID

    this.scanning = ToggleState.OFF
    this.peripheral = null
    this.discoveredPeripherals = new Map()

    this._central = new Central()
    this._setup()
  }

  get state() {
    return this._central.state
  }

  _setup() {
    this._central.on('stateChange', (bleState) => {
      dbg('Central: stateChange', bleState)
      this.emit('stateChange', bleState)
      if (bleState === 'poweredOn') {
        this.emit('ready')
        if (this.scanning === ToggleState.REQUESTED) this.startScan()
      }
    })

    this._central.on('discover', (discovered) => {
      this.discoveredPeripherals.set(discovered.id, discovered)

      let name = discovered.name
      if (!name && discovered.serviceData && discovered.serviceData[this.serviceUUID]) {
        name = Buffer.from(discovered.serviceData[this.serviceUUID]).toString()
      }

      this.emit('discovered', { id: discovered.id, name: name || 'Unknown', rssi: discovered.rssi })
    })

    this._central.on('connect', (peripheral) => {
      dbg('Central: connect')
      this._onConnect(peripheral)
    })

    this._central.on('disconnect', () => {
      dbg('Central: disconnect')
      this.emit('log', 'Central disconnected')
      this.emit('closed')
    })

    this._central.on('error', (err) => {
      dbg('Central: error', err && err.code, err && err.message)
      this.emit('error', err.message || String(err))

      // iOS & Android report errored connects/disconnects as 'error' (not
      // 'disconnect'), so route the codes or the session stays stuck connected.
      if (err && err.code === 'CONNECTION_FAILED') {
        this.emit('connectFailed')
      } else if (err && err.code === 'DISCONNECT') {
        this.emit('closed')
      }
    })
  }

  _onConnect(peripheral) {
    this.peripheral = peripheral
    this.emit('log', `Connected: ${peripheral.name || peripheral.id || 'unknown'}`)

    peripheral.on('servicesDiscover', (services) => {
      dbg('Central: servicesDiscover', services && services.length)
      const service = findByUUID(services, this.serviceUUID)
      if (!service) {
        this.emit('error', 'Chat service not found')
        this.emit('connectFailed')
        return
      }
      peripheral.discoverCharacteristics(service, [this.psmUUID])
    })

    peripheral.on('characteristicsDiscover', (service, chars) => {
      dbg('Central: characteristicsDiscover', chars && chars.length)
      const psmChar = findByUUID(chars, this.psmUUID)
      if (!psmChar) {
        this.emit('error', 'PSM characteristic not found')
        this.emit('connectFailed')
        return
      }
      this.emit('log', 'Reading L2CAP PSM')
      peripheral.read(psmChar)
    })

    peripheral.on('read', (char, data) => {
      const text = Buffer.from(data).toString()
      dbg('Central: read PSM char ->', JSON.stringify(text))
      const psm = Number(text)
      if (!psm) {
        this.emit('error', `Invalid PSM: ${JSON.stringify(text)}`)
        this.emit('connectFailed')
        return
      }
      this.emit('log', `Opening L2CAP channel psm=${psm}`)
      peripheral.openL2CAPChannel(psm)
    })

    peripheral.on('channelOpen', (channel) => {
      dbg('Central: channelOpen (inviter side)')
      this.emit('log', 'L2CAP channel open')
      this.emit('link', new PeerLink(channel))
    })

    peripheral.on('error', (err) => {
      dbg('Central: peripheral error', err && err.message)
      this.emit('error', err.message || String(err))
      this.emit('connectFailed')
    })

    this.emit('log', 'Discovering services')
    peripheral.discoverServices([this.serviceUUID])
  }

  startScan() {
    if (this.scanning === ToggleState.ON) return

    if (this._central.state !== 'poweredOn') {
      this.emit('log', 'Scan is waiting for Bluetooth power')
      return
    }

    this._central.startScan([this.serviceUUID], scanOptions)
    this.scanning = ToggleState.ON
    this.emit('scanStarted')
  }

  stopScan() {
    this._central.stopScan()
    this.scanning = ToggleState.OFF
    this.discoveredPeripherals.clear()
    this.emit('scanStopped')
  }

  setScan(enabled) {
    if (enabled) {
      this.scanning = ToggleState.REQUESTED
      this.startScan()
    } else {
      this.stopScan()
    }
  }

  connect(id) {
    const discovered = this.discoveredPeripherals.get(id)
    if (!discovered) {
      this.emit('error', 'Device not found: ' + id)
      return false
    }

    if (this.scanning !== ToggleState.OFF) this.stopScan()

    this.emit('log', `Connecting to: ${discovered.name || discovered.id || 'unknown'}`)
    this._central.connect(discovered)
    return true
  }

  disconnect() {
    if (this.peripheral) this._central.disconnect(this.peripheral)
    this.peripheral = null
  }

  destroy() {
    this._central.destroy()
  }
}

// Peripheral role: advertises the service, publishes an L2CAP channel and hands
// out its PSM. Emits 'link' with a PeerLink once a central opens the channel.
class BLEServer extends EventEmitter {
  constructor(opts) {
    super()
    this.serviceUUID = opts.serviceUUID
    this.psmUUID = opts.psmUUID

    this.advertising = ToggleState.OFF
    this.serviceAdded = false
    this._deviceName = null
    this._psm = null

    this.psmChar = new Characteristic(opts.psmUUID, { read: true })

    this._server = new Server()
    this._setup()
  }

  get state() {
    return this._server.state
  }

  _setup() {
    this._server.on('stateChange', (bleState) => {
      dbg('Server: stateChange', bleState)
      if (bleState === 'poweredOn') this._start()
    })

    this._server.on('serviceAdd', () => {
      dbg('Server: serviceAdd')
      this.serviceAdded = true
      this.emit('ready')
      if (this.advertising === ToggleState.REQUESTED) this.startAdvertising()
    })

    this._server.on('channelPublish', (psm) => {
      dbg('Server: channelPublish psm=', psm)
      this._psm = psm
      this.emit('log', `L2CAP channel published psm=${psm}`)
      if (this.advertising === ToggleState.REQUESTED) this.startAdvertising()
    })

    this._server.on('channelOpen', (channel) => {
      dbg('Server: channelOpen (invitee side)')
      this.emit('log', 'L2CAP channel open')
      this.emit('link', new PeerLink(channel))
    })

    // A central reads this to discover the PSM before opening the channel. The
    // PSM is a plain number, so send it as raw text (not JSON) - the central
    // parses it with Number().
    this._server.on('readRequest', (req) => {
      dbg('Server: readRequest (PSM) psm=', this._psm)
      const value = this._psm != null ? Buffer.from(String(this._psm)) : Buffer.alloc(0)
      this._server.respondToRequest(req, Server.ATT_SUCCESS, value)
    })

    this._server.on('error', (err) => {
      dbg('Server: error', err && err.code, err && err.message)
      if (err.code === 'ADVERTISE_FAILED') {
        // Advertising never started: keep internal state in sync with the UI
        // (which flips the switch off) instead of a phantom 'requested' state.
        this.advertising = ToggleState.OFF
        this.emit('advertisingStopped')
      }
      this.emit('error', err.message || String(err))
    })

    this._start()
  }

  _start() {
    if (this._server.state !== 'poweredOn') return
    if (!this.serviceAdded) {
      this._server.addService(new Service(this.serviceUUID, [this.psmChar]))
    }
    if (this._psm == null) this._server.publishChannel()
  }

  // Apple only. bare-bluetooth leaves the method undefined on other platforms,
  // so report the deliberate no-op rather than throwing a bare TypeError.
  removeAllServices() {
    if (!this._server.removeAllServices) {
      this.emit('log', 'removeAllServices: no-op on ' + Bare.platform)
      return
    }

    this._server.removeAllServices()
    this.serviceAdded = false
    this.emit('log', 'removeAllServices: all GATT services removed')
  }

  startAdvertising(deviceName) {
    if (deviceName !== undefined) this._deviceName = deviceName
    if (this.advertising === ToggleState.ON) return

    if (this._server.state !== 'poweredOn') {
      this.emit('log', 'Advertising is waiting for Bluetooth power')
      return
    }

    // Both the GATT service (for PSM discovery) and the published PSM must be
    // ready before we invite centrals to connect.
    if (!this.serviceAdded || this._psm == null) {
      this._start()
      this.advertising = ToggleState.REQUESTED
      this.emit('log', 'Advertising is waiting for service and PSM')
      return
    }

    const opts = { serviceUUIDs: [this.serviceUUID] }
    if (this._deviceName) opts.name = this._deviceName

    this.emit('log', `Starting advertising: ${this.serviceUUID}`)
    this._server.startAdvertising(opts)
    this.advertising = ToggleState.ON
    this.emit('advertisingStarted')
  }

  stopAdvertising() {
    this._server.stopAdvertising()
    this.advertising = ToggleState.OFF
    this.emit('advertisingStopped')
  }

  setAdvertising(enabled, deviceName) {
    if (enabled) {
      this._deviceName = deviceName
      this.advertising = ToggleState.REQUESTED
      this.startAdvertising()
    } else {
      this.stopAdvertising()
    }
  }

  destroy() {
    this._server.destroy()
  }
}

// Orchestrates the invite/chat protocol over a single PeerLink. Whoever calls
// inviteDevice() is the inviter (drives the central); the other side becomes the
// invitee when it receives the invite. Data flows the same way for both.
class Session {
  constructor(opts) {
    const { central, server, deviceName, send } = opts

    this.central = central
    this.server = server
    this.deviceName = deviceName
    this.send = send

    this.state = {
      ready: false,
      inviteRole: 'idle',
      link: null,
      connectTimer: null
    }

    this.setupCentralListeners()
    this.setupServerListeners()
  }

  log(message) {
    this.send({ type: 'log', message })
  }

  setupCentralListeners() {
    forward(this.central, this.send, {
      stateChange: (state) => ({ type: 'bleState', state }),
      discovered: ({ id, name, rssi }) => ({ type: 'discovered', id, name, rssi }),
      scanStarted: () => ({ type: 'scanStarted' }),
      scanStopped: () => ({ type: 'scanStopped' }),
      log: (message) => ({ type: 'log', message }),
      error: (message) => ({ type: 'error', message })
    })

    this.central.on('ready', () => this.checkReady())

    // We opened the channel, so we are the inviter: send the invite right away.
    this.central.on('link', (link) => {
      this.clearConnectTimeout()
      this.attachLink(link)
      link.send({ t: 'invite', n: this.deviceName })
      this.send({ type: 'inviteSent' })
    })

    this.central.on('connectFailed', () => {
      this.clearConnectTimeout()
      this.state.inviteRole = 'idle'
      // The invite came from an active scan that connect() stopped; resume it so
      // the user can pick another device instead of re-toggling Scan.
      this.central.setScan(true)
    })

    this.central.on('closed', () => this.onLinkClosed())
  }

  setupServerListeners() {
    forward(this.server, this.send, {
      advertisingStarted: () => ({ type: 'advertisingStarted' }),
      advertisingStopped: () => ({ type: 'advertisingStopped' }),
      log: (message) => ({ type: 'log', message }),
      error: (message) => ({ type: 'error', message })
    })

    this.server.on('ready', () => this.checkReady())

    // A central connected to us: attach and wait for its invite message.
    this.server.on('link', (link) => {
      if (this.state.link) {
        link.close()
        return
      }
      this.attachLink(link)
    })
  }

  attachLink(link) {
    dbg('Session: attachLink (role=' + this.state.inviteRole + ')')
    this.state.link = link
    link.on('message', (msg) => this.handlePeerMessage(msg))
    link.on('error', (message) => this.send({ type: 'error', message }))
    link.on('close', () => this.onLinkClosed())
  }

  checkReady() {
    if (this.state.ready) return

    if (
      this.central.state === 'poweredOn' &&
      this.server.state === 'poweredOn' &&
      this.server.serviceAdded
    ) {
      this.state.ready = true
      this.send({ type: 'ready' })
    }
  }

  handlePeerMessage(msg) {
    dbg('Session: handlePeerMessage t=' + msg.t + ' role=' + this.state.inviteRole)
    switch (msg.t) {
      case 'invite':
        if (this.state.inviteRole === 'idle') {
          this.state.inviteRole = 'invitee'
          this.send({ type: 'inviteReceived', name: msg.n })
        }
        break
      case 'accept':
        if (this.state.inviteRole === 'inviter') this.send({ type: 'chatStarted' })
        break
      case 'reject':
        if (this.state.inviteRole === 'inviter') {
          this.teardown()
          this.send({ type: 'inviteRejected' })
        }
        break
      case 'msg':
        this.send({ type: 'message', text: msg.d, from: 'remote' })
        break
      case 'disconnect':
        if (this.state.inviteRole !== 'idle') {
          this.teardown()
          this.send({ type: 'disconnected' })
        }
        break
    }
  }

  // Close the link and drop any BLE connection we opened. Safe to call from any
  // role: central.disconnect() is a no-op when we never connected.
  teardown() {
    dbg('Session: teardown (role=' + this.state.inviteRole + ')')
    if (this.state.link) {
      this.state.link.close()
      this.state.link = null
    }
    this.central.disconnect()
    this.state.inviteRole = 'idle'
  }

  onLinkClosed() {
    dbg('Session: onLinkClosed (role=' + this.state.inviteRole + ')')
    this.clearConnectTimeout()
    this.state.link = null
    if (this.state.inviteRole !== 'idle') {
      this.state.inviteRole = 'idle'
      this.send({ type: 'disconnected' })
    }
  }

  setScan(enabled) {
    this.central.setScan(enabled)
  }

  setAdvertising(enabled) {
    this.server.setAdvertising(enabled, this.deviceName)
  }

  removeAllServices() {
    this.server.removeAllServices()
  }

  inviteDevice(id) {
    this.log('Invite requested: ' + String(id).slice(0, 16))

    if (this.state.inviteRole !== 'idle') {
      this.send({ type: 'error', message: 'Already in a session' })
      return
    }

    this.state.inviteRole = 'inviter'

    if (!this.central.connect(id)) {
      this.state.inviteRole = 'idle'
      return
    }

    this.startConnectTimeout()
  }

  startConnectTimeout() {
    this.clearConnectTimeout()
    this.state.connectTimer = setTimeout(() => {
      this.state.connectTimer = null
      if (this.state.inviteRole !== 'inviter' || this.state.link) return

      this.teardown()
      this.send({ type: 'error', message: 'Connection timed out' })
      this.send({ type: 'disconnected' })
      this.central.setScan(true)
    }, CONNECT_TIMEOUT_MS)
  }

  clearConnectTimeout() {
    if (this.state.connectTimer) {
      clearTimeout(this.state.connectTimer)
      this.state.connectTimer = null
    }
  }

  acceptInvite() {
    if (this.state.inviteRole !== 'invitee' || !this.state.link) {
      this.send({ type: 'error', message: 'No invite to accept' })
      return
    }
    this.state.link.send({ t: 'accept' })
    this.send({ type: 'chatStarted' })
  }

  rejectInvite() {
    if (this.state.inviteRole !== 'invitee') return
    if (this.state.link) this.state.link.send({ t: 'reject' })
    this.teardown()
    this.send({ type: 'inviteRejected' })
  }

  sendMessage(text) {
    if (this.state.inviteRole === 'idle' || !this.state.link) {
      this.send({ type: 'error', message: 'Not connected' })
      return
    }
    this.state.link.send({ t: 'msg', d: text })
    this.send({ type: 'message', text, from: 'local' })
  }

  disconnect() {
    this.clearConnectTimeout()
    if (this.state.link) this.state.link.send({ t: 'disconnect' })
    this.teardown()
    this.send({ type: 'disconnected' })
  }

  // We only release our own state here (connect timer + L2CAP link). We should
  // also call server.destroy()/central.destroy() to own their teardown, but the
  // native module's on_cleanup double-frees the same V8 handle at runtime
  // teardown and crashes (EXC_BAD_ACCESS in central__on_cleanup).
  // TODO: restore server.destroy()/central.destroy() once bare-bluetooth-apple
  // makes on_cleanup idempotent w.r.t. an explicit destroy().
  destroy() {
    dbg('Session: destroy')
    this.clearConnectTimeout()
    if (this.state.link) {
      this.state.link.close()
      this.state.link = null
    }
  }
}

dbg('worklet: starting, platform=' + Bare.platform + ' name=' + (Bare.argv[0] || 'BareDevice'))

// Surface any uncaught error: an unhandled throw here tears the runtime down
// (bare_runtime_teardown), which is exactly when in-flight BLE threadsafe
// callbacks crash. Always on (not DEBUG-gated): it fires only on error, so it
// can't hide the teardown race the way the hot-path traces do.
Bare.on('uncaughtException', (err) => {
  console.log('[bt] !!! uncaughtException:', (err && err.stack) || err)
})

const ipc = new FramedStream(BareKit.IPC)

const central = new BLECentral({ serviceUUID: SERVICE_UUID, psmUUID: PSM_UUID })
const server = new BLEServer({ serviceUUID: SERVICE_UUID, psmUUID: PSM_UUID })

const session = new Session({
  central,
  server,
  deviceName: Bare.argv[0] || 'BareDevice',
  send: (msg) => ipc.write(Buffer.from(JSON.stringify(msg)))
})

ipc.on('data', (data) => {
  try {
    const msg = JSON.parse(data.toString())
    dbg('IPC <-', msg.type, msg.type === 'invite' ? String(msg.id).slice(0, 12) : '')

    switch (msg.type) {
      case 'setAdvertising':
        session.setAdvertising(msg.enabled)
        break
      case 'setScan':
        session.setScan(msg.enabled)
        break
      case 'removeAllServices':
        session.removeAllServices()
        break
      case 'invite':
        session.inviteDevice(msg.id)
        break
      case 'accept':
        session.acceptInvite()
        break
      case 'reject':
        session.rejectInvite()
        break
      case 'send':
        session.sendMessage(msg.text)
        break
      case 'disconnect':
        session.disconnect()
        break
      case 'setLogsEnabled':
        DEBUG = msg.enabled
        break
    }
  } catch (e) {
    session.send({ type: 'error', message: 'IPC parse error: ' + e.message })
  }
})

Bare.on('exit', () => {
  // Always on (not DEBUG-gated): a single marker at teardown start tells us
  // whether the worklet got a clean Bare exit at all - without the hot-path
  // traces that hide the native teardown race.
  console.log('[bt] === Bare exit: runtime teardown starting ===')
  session.destroy()
})
