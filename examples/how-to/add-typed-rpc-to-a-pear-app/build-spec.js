const Hyperschema = require('hyperschema')

const schema = Hyperschema.from('./spec/hyperschema')
const schemaNs = schema.namespace('worker')

schemaNs.register({
  name: 'status-response',
  fields: [
    { name: 'peers', type: 'uint' },
    { name: 'uptimeSeconds', type: 'uint' }
  ]
})

schemaNs.register({
  name: 'log-event',
  fields: [
    { name: 'message', type: 'string' }
  ]
})

Hyperschema.toDisk(schema)

const HRPCBuilder = require('hrpc')

const hrpc = HRPCBuilder.from('./spec/hyperschema', './spec/hrpc')
const ns = hrpc.namespace('worker')

ns.register({
  name: 'get-status',
  request: { name: 'string', stream: false },
  response: { name: '@worker/status-response', stream: false }
})

ns.register({
  name: 'log',
  request: { name: '@worker/log-event', send: true }
})

HRPCBuilder.toDisk(hrpc)

console.log('generated spec/hyperschema and spec/hrpc')
