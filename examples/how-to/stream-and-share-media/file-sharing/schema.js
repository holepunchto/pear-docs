const Hyperschema = require('hyperschema')
const HyperdbBuilder = require('hyperdb/builder')
const Hyperdispatch = require('hyperdispatch')

const SCHEMA_DIR = './spec/schema'
const DB_DIR = './spec/db'
const DISPATCH_DIR = './spec/dispatch'

const hyperSchema = Hyperschema.from(SCHEMA_DIR)
const schema = hyperSchema.namespace('pear-file-sharing')
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
  name: 'drive',
  fields: [
    { name: 'key', type: 'buffer', required: true },
    { name: 'info', type: 'json' }
  ]
})
schema.register({
  name: 'drives',
  array: true,
  type: '@pear-file-sharing/drive'
})
schema.register({
  name: 'file',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'uri', type: 'string', required: true },
    { name: 'info', type: 'json' }
  ]
})
Hyperschema.toDisk(hyperSchema)

const hyperdb = HyperdbBuilder.from(SCHEMA_DIR, DB_DIR)
const db = hyperdb.namespace('pear-file-sharing')
db.collections.register({
  name: 'invites',
  schema: '@pear-file-sharing/invite',
  key: ['id']
})
db.collections.register({
  name: 'drives',
  schema: '@pear-file-sharing/drive',
  key: ['key']
})
HyperdbBuilder.toDisk(hyperdb)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR, { offset: 0 })
const dispatch = hyperdispatch.namespace('pear-file-sharing')
dispatch.register({ name: 'add-writer', requestType: '@pear-file-sharing/writer' })
dispatch.register({ name: 'add-invite', requestType: '@pear-file-sharing/invite' })
dispatch.register({ name: 'add-drive', requestType: '@pear-file-sharing/drive' })
Hyperdispatch.toDisk(hyperdispatch)
