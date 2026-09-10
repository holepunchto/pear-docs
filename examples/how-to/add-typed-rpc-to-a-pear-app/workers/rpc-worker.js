const HRPC = require('../spec/hrpc')

const rpc = new HRPC(Bare.IPC)
const startedAt = Date.now()

rpc.onGetStatus(() => ({
  peers: swarm.connections.size,
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
}))

rpc.log({ message: 'worker ready' })
