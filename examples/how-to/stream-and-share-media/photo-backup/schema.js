const Hyperschema = require('hyperschema')
const HyperdbBuilder = require('hyperdb/builder')
const Hyperdispatch = require('hyperdispatch')

const SCHEMA_DIR = './spec/schema'
const DB_DIR = './spec/db'
const DISPATCH_DIR = './spec/dispatch'

const hyperSchema = Hyperschema.from(SCHEMA_DIR)
const schema = hyperSchema.namespace('pear-photo-backup')
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
    { name: 'name', type: 'string', required: true },
    { name: 'type', type: 'string', required: true },
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
const db = hyperdb.namespace('pear-photo-backup')
db.collections.register({
  name: 'invites',
  schema: '@pear-photo-backup/invite',
  key: ['id']
})
db.collections.register({
  name: 'videos',
  schema: '@pear-photo-backup/video',
  key: ['id']
})
db.collections.register({
  name: 'messages',
  schema: '@pear-photo-backup/message',
  key: ['id']
})
HyperdbBuilder.toDisk(hyperdb)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR, { offset: 0 })
const dispatch = hyperdispatch.namespace('pear-photo-backup')
dispatch.register({ name: 'add-writer', requestType: '@pear-photo-backup/writer' })
dispatch.register({ name: 'add-invite', requestType: '@pear-photo-backup/invite' })
dispatch.register({ name: 'add-video', requestType: '@pear-photo-backup/video' })
dispatch.register({ name: 'add-message', requestType: '@pear-photo-backup/message' })
Hyperdispatch.toDisk(hyperdispatch)
