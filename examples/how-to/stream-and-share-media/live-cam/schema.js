const Hyperschema = require('hyperschema')
const HyperdbBuilder = require('hyperdb/builder')
const Hyperdispatch = require('hyperdispatch')

const SCHEMA_DIR = './spec/schema'
const DB_DIR = './spec/db'
const DISPATCH_DIR = './spec/dispatch'

const hyperSchema = Hyperschema.from(SCHEMA_DIR)
const schema = hyperSchema.namespace('pear-live-cam')
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
  name: 'video',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'blob', type: 'json', required: true },
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
const db = hyperdb.namespace('pear-live-cam')
db.collections.register({
  name: 'invites',
  schema: '@pear-live-cam/invite',
  key: ['id']
})
db.collections.register({
  name: 'videos',
  schema: '@pear-live-cam/video',
  key: ['id']
})
db.collections.register({
  name: 'messages',
  schema: '@pear-live-cam/message',
  key: ['id']
})
HyperdbBuilder.toDisk(hyperdb)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR, { offset: 0 })
const dispatch = hyperdispatch.namespace('pear-live-cam')
dispatch.register({ name: 'add-writer', requestType: '@pear-live-cam/writer' })
dispatch.register({ name: 'add-invite', requestType: '@pear-live-cam/invite' })
dispatch.register({ name: 'add-video', requestType: '@pear-live-cam/video' })
dispatch.register({ name: 'add-message', requestType: '@pear-live-cam/message' })
Hyperdispatch.toDisk(hyperdispatch)
