const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('bridge', {})
