import fs from 'fs'
import path from 'path'
import { config } from 'pear'

const pearBin = path.join(config.pearDir, 'bin')

const paths = process.env.PATH.split(path.delimiter)

customElements.define('system-status', class extends HTMLElement {
  constructor () {
    super()
    this.vianode = false
    this.installed = paths.some((p) => {
      if (p.includes('node') && p.includes('bin')) this.vianode = fs.existsSync(path.join(p, 'pear'))
      return p === pearBin
    })
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
        this.installed ? `
          <blockquote>
           <p>Pear is installed.</p>
          </blockquote>
          <p>✔ Pear is in the system PATH and ready to go.</p>
        ` : `
          <blockquote>
           <p>Pear setup is nearly complete.</p>
          </blockquote>
          <p><button> Complete Pear Setup </button><p>
          <p id=tip><small>Click the button to add </small><code>${pearBin}</code><small> to the system PATH<small></p>
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

      }
      this.button.addEventListener('click', listener)
    }
  
  }

})
