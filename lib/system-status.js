/* eslint-env browser */
import os from 'os'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { config } from 'pear'

const BIN = path.join(config.pearDir, 'bin')
const isWin = process.platform === 'win32'

customElements.define('pear-welcome', class extends HTMLElement {
  constructor () {
    super()
    this.template = document.createElement('template')
    this.template.innerHTML = `
      <blockquote>
        <p>Pear is installed.</p>
      </blockquote>
      <p>✔ Pear is in the system PATH and ready to go.</p>
    `
    this.root = this.attachShadow({ mode: 'open' })

    this.root.appendChild(this.template.content.cloneNode(true))
  }
})

customElements.define('system-status', class extends HTMLElement {
  constructor () {
    super()
    this.zsh = false
    this.bash = false
    this.statement = `export PATH="${BIN}":$PATH`
    this.stmtrx = new RegExp(`^export PATH="${BIN}":\\$PATH$`, 'm')
    this.shellProfiles = null
    this.installed = this.#installed()
    this.template = document.createElement('template')
    this.template.innerHTML = `
    <div id="panel">
      <style>
        #panel { user-select: none; }
        blockquote { outline: 1px solid #323532; margin-inline-start: 0; margin-inline-end: 0; display: block; margin-block-start: 1rem; margin-block-end: 0; padding: 1px; font-size: .825rem }
        blockquote::before { content: "ℹ"; float: left; font-size: 1.625rem; margin-left: 1rem; margin-right: 0.625rem; }
        button { background: #151517; color: #B0D944; border: 1px solid; padding: .575em .65em; cursor: pointer; margin-top: 2.65rem; font-size: 1.25rem; }
        #tip { text-indent: 4px; margin-top: -.25rem }
        code { padding: .25rem; }
        #tip > p { margin: 0; padding: 0}
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
      ${
        this.installed
? '<pear-welcome></pear-welcome>'
: `
          <blockquote>
           <p>Pear setup is nearly complete.</p>
          </blockquote>
          <p><button> Complete Pear Setup </button><p>
          <p id=tip><small>Click the button to add </small><code>${BIN}</code><small> to the system PATH<small></p>
        `
      }
    </div>
    `
    this.root = this.attachShadow({ mode: 'open' })

    this.root.appendChild(this.template.content.cloneNode(true))

    this.button = this.root.querySelector('button')

    if (this.button) {
      const listener = () => {
        this.button.removeEventListener('click', listener)
        this.#install()
          .then(() => {
            this.replaceWith(new this.constructor())
            console.log('now show version info, and a gif showing pear command line help output run through')
          })
          .catch((err) => this.#error(err))
      }
      this.button.addEventListener('click', listener)
    }
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
        console.log('hi', contents, hasPear, this.stmtrx, this.shellProfiles[file])
      }
      if (hasPear) process.env.PATH = `${BIN}:${process.env.PATH}`
    }

    this.paths = process.env.PATH.split(path.delimiter)

    return this.paths.some((bin) => {
      return bin === BIN && fs.existsSync(path.join(BIN, isWin ? 'pear.cmd' : 'pear'))
    })
  }

  #install () {
    const runtime = path.join(config.pearDir, 'current', 'by-arch', process.platform + '-' + process.arch, 'bin', 'bare', 'pear')
    fs.mkdirSync(BIN, { recursive: true })
    if (isWin) {
      const ps1tmp = path.join(BIN, Math.floor(Math.random() * 1000) + '.pear')
      fs.writeFileSync(ps1tmp, `function pear { & "${runtime}" }; Export-ModuleMember -Function pear`)
      fs.renameSync(ps1tmp, path.join(BIN, 'pear.ps1'))
      const cmdtmp = path.join(BIN, Math.floor(Math.random() * 1000) + '.pear')
      fs.writeFileSync(cmdtmp, `@echo off\n"${runtime}" %*`)
      fs.renameSync(cmdtmp, path.join(BIN, 'pear.cmd'))
      return new Promise((resolve, reject) => {
        spawn('cmd', ['/c', `setx PATH "${BIN};%PATH%"`]).on('exit', (code) => {
          const codes = [code]
          spawn('powershell', ['-Command', `$env:PATH = "${BIN};$env:PATH"`]).on('exit', (code) => {
            codes.push(code)
            if (codes[0] + codes[1] !== 0) {
              reject(new Error(
                'Failed to set PATH in' + [
                  codes[0] ? ' cmd - exit code: ' + codes[0] : '',
                  codes[1] ? ' powershell - exit code:' + codes[1] : ''
                ].filter(Boolean)
              ))
              return
            }
            process.env.PATH = `${BIN};${process.env.PATH}`
            resolve()
          })
        })
      })
    }

    const profiles = Object.values(this.shellProfiles)
    if (profiles.length > 0) {
      for (const { filepath, hasPear } of profiles) {
        if (hasPear === false) fs.writeFileSync(filepath, this.statement, { flags: 'a' })
      }
    } else {
      const bash = this.paths.some((bin) => fs.existsSync(path.join(bin, 'bash')))
      const zsh = this.paths.some((bin) => fs.existsSync(path.join(bin, 'zsh')))
      fs.writeFileSync(path.join(os.homedir(), bash ? '.bashrc' : '.profile'), this.statement + '\n', { flags: 'a' })
      if (zsh) fs.writeFileSync(path.join(os.homedir(), '.zshrc'), this.statement + '\n', { flags: 'a' })
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
