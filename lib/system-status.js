/* eslint-env browser */
import os from 'os'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
const { config } = Pear

const BIN = path.join(config.pearDir, 'bin')
const isWin = process.platform === 'win32'

customElements.define('pear-welcome', class extends HTMLElement {
  constructor () {
    super()
    this.template = document.createElement('template')
    this.template.innerHTML = `
      <style>
        blockquote { outline: 1px solid #323532; margin-inline-start: 0; margin-inline-end: 0; display: block; margin-block-start: 1rem; margin-block-end: 0; padding: 1px; font-size: .825rem; margin-top: -1rem; margin-bottom: 1rem; border-radius: 2px; }
        blockquote::before { content: "✔"; float: left; font-size: 1.625rem; margin-left: 1rem; margin-right: 0.625rem; }
        video { float: right; outline: 1px solid #323532; border-radius: 2px; }
        #welcome { float: left; width: calc(100% - 420px); }
        code {
          background: #3a4816;
          color: #efeaea;
          padding: 0.25rem;
          padding-top: 0.1rem;
          padding-bottom: 0.15rem;
          font-family: 'overpass-mono';
          border-radius: 1px;
        }
      </style>
      <blockquote>
        <p> Pear is in the system PATH and ready to go .</p>
      </blockquote>
      <div id="welcome">
        <h2> Welcome... </h2>
        <p> ...to the Internet of Peers. <p>
        <p> Pear provides the <code>pear</code> Command-line Interface as the primary interface for developing, sharing & maintaining unstoppable peer-to-peer applications and systems. </p>
        <p> To get started, open a terminal, type <code>pear</code> and hit return. </p>
      </div>
      <video width="380" height="390" autoplay muted style="background:#000">
        <source src="./assets/usage.mp4" type="video/mp4">
      </video>
    `
    this.root = this.attachShadow({ mode: 'open' })

    this.root.appendChild(this.template.content.cloneNode(true))
  }
})

customElements.define('system-status', class extends HTMLElement {
  router = null

  connectedCallback () {
    this.root.addEventListener('click', (evt) => {
      this.router.link(evt)
    })
  }

  load () {
    this.style.display = ''
  }

  unload () {
    this.style.display = 'none'
  }

  constructor () {
    super()
    this.zsh = false
    this.bash = false
    this.statement = `export PATH="${BIN}":$PATH`
    this.stmtrx = new RegExp(`^export PATH="${BIN}":\\$PATH$`, 'm')
    this.shellProfiles = null
    this.root = this.attachShadow({ mode: 'open' })
    this.update = null
    this.#render()
  }

  #render () {
    this.shadowRoot.innerHTML = `
    <div id="panel">
      <style>
        #panel { user-select: none; }
        blockquote { outline: 1px solid #323532; margin-inline-start: 0; margin-inline-end: 0; display: block; margin-block-start: 1rem; margin-block-end: 0; padding: 1px; font-size: .825rem; border-radius: 2px; }
        blockquote::before { content: "ℹ"; float: left; font-size: 1.625rem; margin-left: 1rem; margin-right: 0.625rem; }
        button { background: #151517; color: #B0D944; border: 1px solid; padding: .575em .65em; cursor: pointer; margin-top: 2rem; font-size: 1.20rem; }
        #tip { text-indent: 4px; margin-top: -.25rem }
        code {
          background: #3a4816;
          color: #efeaea;
          padding: 0.25rem;
          padding-top: 0.1rem;
          padding-bottom: 0.15rem;
          font-family: 'overpass-mono';
          border-radius: 1px;
          user-select: text;
        }
        #tip > p { margin-top: 6px; margin-bottom: 6px; padding: 0}
        #tip {
          margin-top: 3rem;
        }
        #update-button {
          position: fixed;
          left: 893px;
          top: 170px;
          width: 171px;
        }
        h1 {
          padding: 0.5rem;
          display: inline-block;
          padding-right: 0.75em;
          font-weight: bold;
          font-size: 2.46rem;
          margin-left: -0.7rem;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
        }
      </style>
      <h1>System Status</h1>
      <button id="update-button"> Update Available </button>
      ${
        this.#installed()
        ? '<pear-welcome></pear-welcome>'
        : `
          <blockquote>
           <p>Pear setup is nearly complete.</p>
          </blockquote>
          <p>To finish installing Pear Runtime set your system path to</p>
          <p><code>${BIN}</code></p>
          <p>${!isWin ? ' or click the button.' : ''}</p>
          ${!isWin ? '<p><button id="setup-button"> Automatic Setup Completion </button><p>' : ''}
        `
      }
    </div>
    `

    this.updateButton = this.shadowRoot.querySelector('#update-button')
    this.updateButton.style.display = 'none'

    this.updateButton.addEventListener('mouseenter', (e) => {
      e.target.innerText = 'Click to Restart'
    })
    this.updateButton.addEventListener('mouseout', (e) => {
      e.target.innerText = 'Update Available'
    })

    this.shadowRoot.querySelector('#setup-button')?.addEventListener('click', () => {
      this.#install().then(() => this.#render()).catch((err) => this.#error(err))
    })

    Pear.updates((update) => {
      this.update = update
      this.updateButton.style.display = ''

      if (this.updateButtonListener) {
        this.updateButton.removeEventListener('click', this.updateButtonListener)
      }

      this.updateButtonListener = () => Pear.restart({ platform: this.update.app === false }).catch(console.error)
      this.updateButton.addEventListener('click', this.updateButtonListener)
    })
  }

  #error (err) {
    console.error(err)
  }

  #installed () {
    if (isWin === false) {
      let hasPear = false
      this.shellProfiles = {}
      for (const file of ['.zshrc', '.zshenv', '.zshprofile', '.zlogin', '.profile', '.bashrc']) {
        const filepath = path.join(os.homedir(), file)
        let contents = null
        try { contents = fs.readFileSync(filepath, { encoding: 'utf-8' }) } catch {}
        if (contents !== null) {
          this.shellProfiles[file] = { filepath, hasPear: this.stmtrx.test(contents) }
          hasPear = hasPear || this.shellProfiles[file].hasPear
        }
      }
      if (hasPear) process.env.PATH = `${BIN}:${process.env.PATH}`
    }

    this.paths = process.env.PATH.split(path.delimiter)

    return this.paths.some((bin) => {
      return bin === BIN && fs.existsSync(path.join(BIN, isWin ? 'pear.cmd' : 'pear'))
    })
  }

  #install () {
    const runtime = path.join('..', 'current', 'by-arch', process.platform + '-' + process.arch, 'bin', 'pear-runtime')
    fs.mkdirSync(BIN, { recursive: true })
    if (isWin) {
      const ps1tmp = path.join(BIN, Math.floor(Math.random() * 1000) + '.pear')
      fs.writeFileSync(ps1tmp, `function pear { & "${runtime}" }; Export-ModuleMember -Function pear`)
      fs.renameSync(ps1tmp, path.join(BIN, 'pear.ps1'))
      const cmdtmp = path.join(BIN, Math.floor(Math.random() * 1000) + '.pear')
      fs.writeFileSync(cmdtmp, `@echo off\n"${runtime}" %*`)
      fs.renameSync(cmdtmp, path.join(BIN, 'pear.cmd'))
      return new Promise((resolve, reject) => {
        spawn('powershell', ['-Command', `[System.Environment]::SetEnvironmentVariables("PATH", "${BIN};${process.env.PATH}", "User")`]).on('exit', (code) => {
          if (code !== 0) {
            reject(new Error('Failed to set PATH'))
            return
          }
          process.env.PATH = `${BIN};${process.env.PATH}`
          resolve()
        })
      })
    }
    const comment = '# Added by Pear Runtime, configures system with Pear CLI\n'
    const profiles = Object.values(this.shellProfiles)
    if (profiles.length > 0) {
      for (const { filepath, hasPear } of profiles) {
        if (hasPear === false) fs.writeFileSync(filepath, '\n' + comment + this.statement + '\n', { flag: 'a' })
      }
    } else {
      const bash = this.paths.some((bin) => fs.existsSync(path.join(bin, 'bash')))
      const zsh = this.paths.some((bin) => fs.existsSync(path.join(bin, 'zsh')))
      fs.writeFileSync(path.join(os.homedir(), bash ? '.bashrc' : '.profile'), this.statement + '\n', { flag: 'a' })
      if (zsh) fs.writeFileSync(path.join(os.homedir(), '.zshrc'), '\n' + comment + this.statement + '\n', { flag: 'a' })
    }

    const pear = path.join(BIN, 'pear')
    const tmp = path.join(BIN, Math.floor(Math.random() * 1000) + '.pear')
    fs.symlinkSync(runtime, tmp)
    fs.renameSync(tmp, pear)
    fs.chmodSync(pear, 0o755)

    process.env.PATH = `${BIN}:${process.env.PATH}`
    return Promise.resolve()
  }
})
