const Hyperschema = require('hyperschema')
const HyperdbBuilder = require('hyperdb/builder')
const Hyperdispatch = require('hyperdispatch')

const SCHEMA_DIR = './spec/schema'
const DB_DIR = './spec/db'
const DISPATCH_DIR = './spec/dispatch'

const hyperSchema = Hyperschema.from(SCHEMA_DIR)
const schema = hyperSchema.namespace('pear-chat-multi-rooms')
schema.register({
  name: 'writer',
  fields: [
    { name: 'key', type: 'buffer', required: true }
  ]
})
schema.register({
  name: 'invite',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'invite', type: 'buffer', required: true },
    { name: 'publicKey', type: 'buffer', required: true },
    { name: 'expires', type: 'int', required: true }
  ]
})
schema.register({
  name: 'room',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'invite', type: 'string', required: true },
    { name: 'info', type: 'json' }
  ]
})
schema.register({
  name: 'message',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'text', type: 'string', required: true },
    { name: 'info', type: 'json' }
  ]
})
Hyperschema.toDisk(hyperSchema)

const hyperdb = HyperdbBuilder.from(SCHEMA_DIR, DB_DIR)
const db = hyperdb.namespace('pear-chat-multi-rooms')
db.collections.register({
  name: 'invites',
  schema: '@pear-chat-multi-rooms/invite',
  key: ['id']
})
db.collections.register({
  name: 'rooms',
  schema: '@pear-chat-multi-rooms/room',
  key: ['id']
})
db.collections.register({
  name: 'messages',
  schema: '@pear-chat-multi-rooms/message',
  key: ['id']
})
HyperdbBuilder.toDisk(hyperdb)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR, { offset: 0 })
const dispatch = hyperdispatch.namespace('pear-chat-multi-rooms')
dispatch.register({ name: 'add-writer', requestType: '@pear-chat-multi-rooms/writer' })
dispatch.register({ name: 'add-invite', requestType: '@pear-chat-multi-rooms/invite' })
dispatch.register({ name: 'add-room', requestType: '@pear-chat-multi-rooms/room' })
dispatch.register({ name: 'add-message', requestType: '@pear-chat-multi-rooms/message' })
Hyperdispatch.toDisk(hyperdispatch)
