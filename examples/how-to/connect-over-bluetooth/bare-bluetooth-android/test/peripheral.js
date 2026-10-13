const test = require('brittle')
const Central = require('../lib/central')
const Peripheral = require('../lib/peripheral')
const Device = require('../lib/device')
const { isCI } = require('./helpers')

test('connect and discover services', { skip: isCI }, async (t) => {
  const central = new Central()
  t.teardown(() => central.destroy())

  const state = await new Promise((resolve) => {
    central.on('stateChange', resolve)
  })

  if (state !== 'on') {
    t.comment('bluetooth not on: ' + state + ', skipping')
    return
  }

  central.startScan()

  const discovered = await new Promise((resolve) => {
    central.on('discover', resolve)

    setTimeout(() => resolve(null), 10000)
  })

  central.stopScan()

  if (discovered === null) {
    t.comment('no peripheral advertising, skipping')
    return
  }

  central.connect(discovered)

  const result = await new Promise((resolve) => {
    central.on('connect', (peripheral) => resolve({ peripheral }))
    central.on('error', () => resolve({ failed: true }))
    setTimeout(() => resolve({ timeout: true }), 10000)
  })

  if (result.timeout || result.failed) {
    t.comment('could not connect to nearby peripheral, skipping')
    return
  }

  const peripheral = result.peripheral

  t.ok(peripheral instanceof Peripheral, 'connect emits a Peripheral instance')
  t.teardown(() => {
    peripheral.destroy()
  })

  t.ok(typeof peripheral.id === 'string', 'peripheral id is string')
  t.is(peripheral.serviceData, discovered.serviceData, 'peripheral keeps discovered serviceData')

  peripheral.discoverServices()

  const servicesResult = await new Promise((resolve) => {
    peripheral.on('servicesDiscover', (services, error) => {
      resolve({ services, error })
    })
    setTimeout(() => resolve({ timeout: true }), 10000)
  })

  if (servicesResult.timeout) {
    t.comment('service discovery timed out (device may not respond to unknown centrals), skipping')
    return
  }

  const { services, error: servicesError } = servicesResult

  t.absent(servicesError, 'no error discovering services')
  t.ok(Array.isArray(services), 'services is array')
  t.ok(services.length > 0, 'at least one service discovered')

  const service = services[0]
  t.ok(typeof service.uuid === 'string', 'service has uuid')
  t.ok(service.uuid.length > 0, 'service uuid is non-empty')

  peripheral.discoverCharacteristics(service)

  const charsResult = await new Promise((resolve) => {
    peripheral.on('characteristicsDiscover', (svc, chars, error) => {
      resolve({ service: svc, characteristics: chars, error })
    })
    setTimeout(() => resolve({ timeout: true }), 10000)
  })

  if (charsResult.timeout) {
    t.comment('characteristic discovery timed out, skipping')
    return
  }

  const { service: discoveredService, characteristics, error: charsError } = charsResult

  t.absent(charsError, 'no error discovering characteristics')
  t.ok(discoveredService !== null, 'characteristicsDiscover includes service')
  t.is(discoveredService, service, 'characteristicsDiscover service matches requested service')
  t.ok(Array.isArray(characteristics), 'characteristics is array')

  if (characteristics.length > 0) {
    const char = characteristics[0]
    t.ok(typeof char.uuid === 'string', 'characteristic has uuid')
    t.ok(typeof char.properties === 'number', 'characteristic has properties bitmask')
  }
})

test('peripheral property constants', (t) => {
  t.is(Peripheral.PROPERTY_READ, 0x02)
  t.is(Peripheral.PROPERTY_WRITE_WITHOUT_RESPONSE, 0x04)
  t.is(Peripheral.PROPERTY_WRITE, 0x08)
  t.is(Peripheral.PROPERTY_NOTIFY, 0x10)
  t.is(Peripheral.PROPERTY_INDICATE, 0x20)
})

test('peripheral from a device has no advertisement', (t) => {
  const device = new Device({ address: 'AA:BB:CC:DD:EE:FF', name: 'bonded' })
  const peripheral = new Peripheral({ device })

  t.is(peripheral.id, device.address)
  t.is(peripheral.name, device.name)
  t.is(peripheral.scanResult, null)
  t.is(peripheral.rssi, null)
  t.is(peripheral.serviceData, null)
})

test('peripheral without a device or a scan result throws', (t) => {
  t.exception(() => new Peripheral(), /needs a device/)
  t.exception(() => new Peripheral({}), /needs a device/)
})

test('dial a bonded device', { skip: isCI, timeout: 30000 }, async (t) => {
  const central = new Central()
  t.teardown(() => central.destroy())

  const state = await new Promise((resolve) => {
    central.on('stateChange', resolve)
  })

  if (state !== 'on') {
    t.comment('bluetooth not on: ' + state + ', skipping')
    return
  }

  const [device] = central.getBondedDevices().filter((d) => d.type !== Device.DEVICE_TYPE_CLASSIC)

  if (!device) {
    t.comment('no bonded LE device, skipping')
    return
  }

  const peripheral = new Peripheral({ device })

  central.on('error', () => {})
  central.connect(peripheral)

  t.ok(peripheral.connecting, 'dial is in flight')

  const connected = await new Promise((resolve) => {
    central.once('connect', (p) => resolve(p === peripheral))

    setTimeout(() => resolve(false), 15000)
  })

  if (!connected) {
    t.comment('bonded device not reachable, skipping')
    central.disconnect(peripheral)
    return
  }

  t.ok(peripheral.connected, 'peripheral is connected')
  t.is(peripheral.id, device.address)

  central.disconnect(peripheral)
})
