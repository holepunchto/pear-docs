const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API to the sandboxed renderer (no direct Node or worker access)
contextBridge.exposeInMainWorld('chat', {
  send(text) {
    return ipcRenderer.invoke('chat:send', text) // → ipcMain.handle in main
  },
  onMessage(listener) {
    const wrap = (_evt, payload) => listener(JSON.parse(payload))
    ipcRenderer.on('chat:from-worker', wrap) // ← webContents.send from main
    return () => ipcRenderer.removeListener('chat:from-worker', wrap)
  }
})
