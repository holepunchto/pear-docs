const { command, flag } = require('paparam')
const storageAPI = require('bare-storage')
const pkg = require('./package.json')
const os = require('bare-os')
const { isWindows } = require('which-runtime')
const path = require('bare-path')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const PearRuntime = require('pear-runtime')

const appName = pkg.productName || pkg.name

const cmd = command(
  appName,
  flag('--storage <dir>', 'custom storage directory for pear-runtime'),
  flag('--no-updates', 'disable OTA updates for this run')
)

cmd.parse(global.Bare.argv.slice(2))

const updates = cmd.flags.updates
const isDev = path.basename(Bare.argv[0] || '').startsWith('bare')
const storage = cmd.flags.storage || (isDev ? null : path.join(storageAPI.persistent(), appName))
const dir = storage || path.join(os.tmpdir(), 'pear', appName)
const store = new Corestore(path.join(dir, 'pear-runtime', 'corestore'))
const swarm = new Hyperswarm()

console.log(`${appName} v${pkg.version}`)
console.log(`Updates: ${updates === false ? 'disabled' : 'enabled'}`)

function getRunningAppPath() {
  if (isDev) return null
  return os.execPath()
}

const pear = new PearRuntime({
  dir,
  app: getRunningAppPath(),
  updates,
  version: pkg.version,
  upgrade: pkg.upgrade,
  name: isWindows ? appName + '.exe' : appName,
  store,
  swarm
})

if (updates !== false) {
  pear.updater.on('updating', () => console.log('[updater] getting new update'))

  pear.updater.on('updating-delta', (d) => console.log('[updater]', d))

  pear.updater.on('updated', async () => {
    console.log('[updater] update complete... appling')
    await pear.updater.applyUpdate()
    console.log('[updater] applied update, restart to run latest version')
  })

  swarm.on('connection', (connection) => store.replicate(connection))

  swarm.join(pear.updater.drive.core.discoveryKey, {
    client: true,
    server: false
  })
}

pear.on('error', (err) => {
  console.error('[pear-runtime:error]', err)
})

let tearingDown = false
async function teardown(code = 0) {
  if (tearingDown) return
  tearingDown = true
  try {
    await pear?.close()
  } catch {}
  global.Bare.exit(code)
}

global.Bare.on('SIGHUP', () => teardown(129))
global.Bare.on('SIGINT', () => teardown(130))
global.Bare.on('SIGQUIT', () => teardown(131))
global.Bare.on('SIGTERM', () => teardown(143))

console.log('CLI ready. Press Ctrl+C to stop.')
