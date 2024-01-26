/* eslint-env browser */
import http from 'http'
import { WebSocketServer } from 'ws'
import { Session } from '@holepunchto/pear-inspect'

customElements.define('devtools-inspector', class extends HTMLElement {
  constructor () {
    super()
    this.template = document.createElement('template')
    this.template.innerHTML = `
      <div>
        <style>
          #add-key {
            width: 100%;
          }

          #add-key-error {
            color: red;
          }
        </style>

        <h1>Inspector</h1>
        <div>
          This acts as a link between chrome://inspect and debugging Pear apps
        </div>
        <ol>
          <li>Run a pear app with "pear dev . --inspect"</li>
          <li>The outputted key should be added here</li>
          <li>In Chrome, open chrome://inspect and the app should appear under Targets</li>
        </ol>
        <div>
          <form id="add-key-form">
            <input id="add-key" type="text" placeholder="Id given when running pear with --inspect"/>
            <p id="add-key-error"></p>
          </form>
        </div>
        <h3 id="no-apps">No apps availble. Add a key above, to start debugging.</h3>
        <div id="apps"></div>
      </div>
    `
    this.root = this.attachShadow({ mode: 'open' })
    this.root.appendChild(this.template.content.cloneNode(true))

    this.$addKeyForm = this.root.querySelector('#add-key-form')
    this.$addKey = this.root.querySelector('#add-key')
    this.$addKeyError = this.root.querySelector('#add-key-error')
    this.$apps = this.root.querySelector('#apps')
    this.$noApps = this.root.querySelector('#no-apps')
    this.apps = new Map()

    this.$addKeyForm.addEventListener('submit', e => {
      e.preventDefault()
      const publicKey = this.$addKey.value
      if (publicKey.length === 0) {
        this.$addKeyError.textContent = ''
        return
      }
      if (publicKey.length !== 64) {
        this.$addKeyError.textContent = 'Key needs to be 64 characters long'
        return
      }

      const sessionId = generateUuid()
      const inspectorSession = new Session({ publicKey: Buffer.from(publicKey, 'hex') })
      const app = {
        publicKey,
        title: '',
        url: '',
        inspectorSession
      }

      inspectorSession.on('close', () => {
        this.apps.delete(sessionId)
        this.renderApps()
      })
      inspectorSession.on('info', ({ filename }) => {
        app.url = filename
        app.title = filename.split('/').pop()
        this.apps.set(sessionId, app)
        this.renderApps()
      })

      this.$addKey.value = ''
      this.$addKeyError.textContent = ''
      this.renderApps()
    })

    const httpServer = http.createServer()
    const wsServer = new WebSocketServer({ noServer: true })

    httpServer.listen(9229, () => console.log('[httpServer] running on port 9229'))
    httpServer.on('request', (req, res) => {
      if (req.url !== '/json/list') {
        res.writeHead(404)
        res.end()
        return
      }

      const targets = [...this.apps].map(([sessionId, app]) => ({
        description: 'node.js instance', // `Pear app: ${app.name}`,
        devtoolsFrontendUrl: `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/${sessionId}`,
        devtoolsFrontendUrlCompat: `devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/${sessionId}`,
        faviconUrl: 'https://nodejs.org/static/images/favicons/favicon.ico',
        id: sessionId,
        title: app.title,
        type: 'node',
        url: app.url,
        webSocketDebuggerUrl: `ws://127.0.0.1:9229/${sessionId}`
      }))

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-cache',
        'Content-Length': JSON.stringify(targets).length
      })
      res.end(JSON.stringify(targets))
    })
    httpServer.on('upgrade', (request, socket, head) => {
      console.log(`[httpServer] UPGRADE. url=${request.url}`)
      const sessionId = request.url.substr(1)
      const sessionIdExists = this.apps.has(sessionId)
      if (!sessionIdExists) return socket.destroy()

      wsServer.handleUpgrade(request, socket, head, ws => wsServer.emit('connection', ws, request))
    })

    wsServer.on('connection', (devtoolsSocket, request) => {
      const sessionId = request.url.substr(1)
      const app = this.apps.get(sessionId)
      if (!app) return devtoolsSocket.destroy()

      const { publicKey, inspectorSession } = app

      const onMessage = msg => {
        const { pearInspectMethod } = msg
        const isACDPMessage = !pearInspectMethod

        if (isACDPMessage) return devtoolsSocket.send(JSON.stringify(msg))
      }
      inspectorSession.connect()
      inspectorSession.on('message', onMessage)
      devtoolsSocket.on('message', msg => inspectorSession.post(JSON.parse(msg)))
      devtoolsSocket.on('close', () => {
        inspectorSession.disconnect()
        inspectorSession.off('message', onMessage)
        app.connected = false
        this.renderApps()
      })

      app.connected = true
      this.renderApps()
    })
  }

  renderApps () {
    const content = [...this.apps.values()].map(app => `
      <div>
        <div>Title: ${app.title}</div>
        <div>URL: ${app.url}</div>
        <div>Public key: ${app.publicKey}</div>
        <div>Connected: ${app.connected ? 'Yes' : 'No'}</div>
      </div>
    `)
    this.$apps.innerHTML = content

    if (this.apps.size > 0) this.$noApps.remove()
  }

  load () {
    this.style.display = ''
  }

  unload () {
    this.style.display = 'none'
  }
})

// Can't use `uuid` module for some reason as it results in a throw with `crypto` when importing
function generateUuid () {
  var result, i, j
  result = ''
  for (j = 0; j < 32; j++) {
    if (j == 8 || j == 12 || j == 16 || j == 20)
      result = result + '-'
    i = Math.floor(Math.random() * 16).toString(16)
    result = result + i
  }
  return result
}
