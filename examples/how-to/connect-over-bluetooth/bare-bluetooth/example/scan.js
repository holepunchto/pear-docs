const { Central } = require('..')

const central = new Central()

central.on('stateChange', (state) => {
  console.log('state:', state)
  if (state === 'poweredOn') central.startScan()
})

central.on('discover', (peripheral) => {
  console.log('found:', peripheral.id, peripheral.name, peripheral.rssi)
})

central.on('error', (err) => console.error('error:', err.message))

setTimeout(() => {
  central.stopScan()
  central.destroy()
}, 10000)
