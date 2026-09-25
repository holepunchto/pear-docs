const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const PearRuntime = require('pear-runtime') // spawn Bare workers from Node

// Deterministic per-username topic so two local windows meet,
// while other readers running the same example stay separate by default
const topic = crypto
  .createHash('sha256')
  .update('pear-getting-started-chat:' + os.userInfo().username)
  .digest('hex')

let worker = null // Bare worker handle (duplex stream)

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  const workerPath = path.join(__dirname, '..', 'workers', 'main.mjs')
  worker = PearRuntime.run(workerPath, [topic]) // argv[2] in the worker is the topic hex

  worker.on('data', (data) => {
    if (!win.isDestroyed()) win.webContents.send('chat:from-worker', data.toString())
  })

  worker.stderr.on('data', (data) => {
    console.error('[worker]', data.toString())
  })

  ipcMain.handle('chat:send', (_evt, text) => {
    worker.write(Buffer.from(text)) // forwarded to Bare.IPC in the worker
  })

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (worker) worker.destroy()
  app.quit()
})
