const { app, BrowserWindow, ipcMain, clipboard } = require('electron')
const os = require('os')
const path = require('path')
const PearRuntime = require('pear-runtime')
const FramedStream = require('framed-stream')

const { isMac, isLinux, isWindows } = require('which-runtime')
const pkg = require('../package.json')
const { name, productName, version, upgrade } = pkg

const protocol = name
const updaterSpecifier = '/workers/main.js'

const workers = new Map()
let updaterPipe = null

const appName = productName ?? name

const rawArgs = app.isPackaged ? process.argv.slice(1) : process.argv.slice(2)
const { pearStore: rawPearStore, updates, passthroughArgs } = parseArgs(rawArgs)

// Namespace storage by app name so a single --storage dir can host multiple
// apps without their corestores colliding.
const pearStore = rawPearStore ? path.join(rawPearStore, appName) : null

if (!app.isPackaged && rawPearStore) {
  app.setName(appName + '-' + path.basename(rawPearStore))
}

function parseArgs (argv) {
  const platformFlags = new Set(['--storage', '--no-updates', '--no-sandbox'])
  let pearStore = null
  let updates = true
  const passthrough = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--storage') {
      pearStore = argv[++i]
    } else if (arg === '--no-updates') {
      updates = false
    } else if (arg === '--no-sandbox') {
      // consumed by chromium upstream
    } else if (platformFlags.has(arg)) {
      // skip
    } else {
      passthrough.push(arg)
    }
  }
  return { pearStore, updates, passthroughArgs: passthrough }
}

if (pearStore) app.setPath('userData', pearStore)

ipcMain.on('pkg', (evt) => {
  evt.returnValue = pkg
})

function getAppPath () {
  if (!app.isPackaged) return null
  if (isLinux && process.env.APPIMAGE) return process.env.APPIMAGE
  if (isWindows) return process.execPath
  return path.join(process.resourcesPath, '..', '..')
}

// Platform storage root. The updater corestore lives at `<dir>/pear-runtime`
// and per pear-runtime the app store lives at `<dir>/app-storage`.
function getStorageDir () {
  const appPath = getAppPath()
  if (pearStore) {
    console.log('pear store: ' + pearStore)
    return pearStore
  }
  if (appPath === null) {
    return path.join(os.tmpdir(), 'pear', appName)
  }
  const isSnap = !!process.env.SNAP_USER_COMMON
  const linuxConfigHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
  return isMac
    ? path.join(os.homedir(), 'Library', 'Application Support', appName)
    : isLinux
      ? isSnap
        ? path.join(process.env.SNAP_USER_COMMON, appName)
        : path.join(linuxConfigHome, appName)
      : path.join(os.homedir(), 'AppData', 'Local', appName)
}

function sendToAll (name, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(name, data)
  }
}

// App workers (e.g. the chat worker). Bare.IPC is a raw byte stream, so the
// main process wraps the worker in a FramedStream and forwards deframed bytes.
function getWorker (specifier) {
  if (workers.has(specifier)) return workers.get(specifier)
  const storage = path.join(getStorageDir(), 'app-storage')
  const worker = PearRuntime.run(require.resolve('..' + specifier), [storage, ...passthroughArgs])
  const pipe = new FramedStream(worker)
  function sendWorkerStdout (data) {
    process.stdout.write(data)
    sendToAll('pear:worker:stdout:' + specifier, data)
  }
  function sendWorkerStderr (data) {
    process.stderr.write(data)
    sendToAll('pear:worker:stderr:' + specifier, data)
  }
  function sendWorkerIPC (data) {
    sendToAll('pear:worker:ipc:' + specifier, data)
  }
  function onBeforeQuit () {
    pipe.destroy()
  }
  ipcMain.handle('pear:worker:writeIPC:' + specifier, (evt, data) => {
    return pipe.write(data)
  })
  workers.set(specifier, pipe)
  pipe.on('data', sendWorkerIPC)
  worker.stdout.on('data', sendWorkerStdout)
  worker.stderr.on('data', sendWorkerStderr)
  worker.once('exit', (code) => {
    app.removeListener('before-quit', onBeforeQuit)
    ipcMain.removeHandler('pear:worker:writeIPC:' + specifier)
    pipe.removeListener('data', sendWorkerIPC)
    worker.stdout.removeListener('data', sendWorkerStdout)
    worker.stderr.removeListener('data', sendWorkerStderr)
    sendToAll('pear:worker:exit:' + specifier, code)
    workers.delete(specifier)
  })
  app.on('before-quit', onBeforeQuit)
  return pipe
}

// Updater worker. pear-runtime + the updater swarm/store run in bare, mirroring
// hello-pear-electron. The main process only spawns it and relays messages.
function getUpdaterPipe () {
  if (updaterPipe) return updaterPipe
  const dir = getStorageDir()
  const appPath = getAppPath()
  const extension = isLinux ? '.AppImage' : isMac ? '.app' : '.msix'
  const worker = PearRuntime.run(require.resolve('..' + updaterSpecifier), [
    updates,
    version,
    upgrade,
    productName + extension,
    dir,
    appPath
  ])
  const pipe = new FramedStream(worker)

  function onData (data) {
    const message = data.toString()
    if (message === 'updating') sendToAll('pear:event:updating', 'updating')
    else if (message === 'updated') sendToAll('pear:event:updated', 'updated')
  }
  function onStderr (data) {
    process.stderr.write(data)
  }
  function onBeforeQuit () {
    pipe.destroy()
  }
  pipe.on('data', onData)
  worker.stderr.on('data', onStderr)
  worker.once('exit', () => {
    app.removeListener('before-quit', onBeforeQuit)
    pipe.removeListener('data', onData)
    worker.stderr.removeListener('data', onStderr)
    updaterPipe = null
  })
  app.on('before-quit', onBeforeQuit)
  updaterPipe = pipe
  return pipe
}

async function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 500,
    minWidth: 500,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.webContents.on('console-message', (evt, level, message, line, sourceId) => {
    const levels = ['log', 'warn', 'error']
    console.log(`[renderer ${levels[level] || level}] ${message}`)
  })
  win.webContents.on('render-process-gone', (evt, details) => {
    console.error('[renderer] gone:', details)
  })

  const devServerUrl = process.env.PEAR_DEV_SERVER_URL

  if (devServerUrl) {
    await win.loadURL(devServerUrl)
    win.webContents.openDevTools()
    return
  }

  await win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
  if (!app.isPackaged) win.webContents.openDevTools({ mode: 'detach' })
}

ipcMain.handle('pear:applyUpdate', () => {
  const pipe = getUpdaterPipe()

  return new Promise((resolve) => {
    function onData (data) {
      if (data.toString() === 'pear:updateApplied') {
        pipe.removeListener('data', onData)
        resolve()
      }
    }

    pipe.on('data', onData)
    pipe.write('pear:applyUpdate')
  })
})
ipcMain.handle('pear:startWorker', (evt, filename) => {
  getWorker(filename)
  return true
})
ipcMain.handle('app:afterUpdate', () => {
  if (isLinux && process.env.APPIMAGE) {
    app.relaunch({
      execPath: process.env.APPIMAGE,
      args: [
        '--appimage-extract-and-run',
        ...process.argv.slice(1).filter((arg) => arg !== '--appimage-extract-and-run')
      ]
    })
  } else if (!isWindows) {
    app.relaunch()
  }
  app.quit()
})

function handleDeepLink (url) {
  console.log('deep link:', url)
}

app.setAsDefaultProtocolClient(protocol)

app.on('open-url', (evt, url) => {
  evt.preventDefault()
  handleDeepLink(url)
})

const lock = app.requestSingleInstanceLock()

if (!lock) {
  app.quit()
} else {
  app.on('second-instance', (evt, args) => {
    const url = args.find((arg) => arg.startsWith(protocol + '://'))
    if (url) handleDeepLink(url)
  })

  app.whenReady().then(() => {
    createWindow()
      .then(() => getUpdaterPipe())
      .catch((err) => {
        console.error('Failed to create window:', err)
        app.quit()
      })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow().catch((err) => {
          console.error('Failed to create window:', err)
        })
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

ipcMain.handle('clipboard:write', (evt, text) => clipboard.writeText(text))
