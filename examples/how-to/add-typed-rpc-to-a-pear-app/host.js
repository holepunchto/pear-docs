const HRPC = require('./spec/hrpc')

const IPC = pear.run('./workers/rpc-worker.js', [pear.storage])
const rpc = new HRPC(IPC)

rpc.onLog(({ message }) => console.log('[worker]', message))

const status = await rpc.getStatus('')
console.log(`${status.peers} peer(s), up ${status.uptimeSeconds}s`)
