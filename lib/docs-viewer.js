/* eslint-env browser */
import { marked } from 'marked'

customElements.define('docs-viewer', class extends HTMLElement {
  static get observedAttributes () { return ['data-load'] }
  attributeChangedCallback (name, _, page) { if (name === 'data-load') this.load(page).catch((err) => this.#error(err)) }
  constructor () {
    super()

    this.template = document.createElement('template')
    this.template.innerHTML = `
    <div>
      <style>
        ul { list-style-type: none; }
        ul li::before { content: '❥ '; margin-right: 0.5em; }
        a:visited, a:active, a { color: #B0D944; outline: none; text-decoration: none }
        h1 { padding: .5rem; border-right: 1px solid #B0D944; border-bottom: 1px solid #B0D944; display: inline-block; padding-right: 0.75em; padding-left: 0.5em; }
        code {  background: #333; color: #eee; padding: .25rem; }
        pre > code { display: block; line-height: 1.025rem; padding-left: 1em; }
        h1, h2, h3, h4, h5, h6 { font-weight: bold; }
        h1 { font-size: 1.6rem; }
        h2 { font-size: 1.4rem; }
        h3 { font-size: 1.2rem; }
        h4 { font-size: 1rem; }
        h5 { font-size: .8rem; }
        h6 { font-size: .7rem; }
        blockquote { outline: 1px solid #323532; margin-inline-start: 0; margin-inline-end: 0; display: block; margin-block-start: 1rem; margin-block-end: 0; padding: 1px; font-size: .825rem }
        blockquote::before { content: "ℹ"; float: left; font-size: 1.625rem; margin-left: 1rem; margin-right: 0.625rem; }
        img { display: block; max-width: 63em; margin: 0 auto; margin-block-start: 1.625rem; margin-block-end: 1.625rem; box-shadow: rgb(123 115 168 / 15%) 0px 13px 24px 0px; }
        #panel { margin-top: 4px; }
      </style>
      <div id="panel"><slot></slot></div>
    </div>
    `
    this.root = this.attachShadow({ mode: 'open' })

    this.root.appendChild(this.template.content.cloneNode(true))

    this.panel = this.root.querySelector('#panel')
    this.header = this.root.querySelector('header')

    this.panel.addEventListener('click', (evt) => {
      if (evt.target?.tagName !== 'A') return
      const href = evt.target.getAttribute('href')
      const { origin } = new URL(location.href)
      const url = new URL(href, location.href)
      if (url.origin !== origin) return window.open(href)
      evt.preventDefault()
      document.documentElement.scrollTo(0, 0)
      this.load(url.pathname).catch((err) => this.#error(err)).finally(() => {
        this.header.querySelector('a').style.display = 'inline-block'
      })
    })

    window.addEventListener('popstate', (evt) => {
      document.documentElement.scrollTo(0, 0)
      if (evt.state?.page === 'readme.md') this.header.querySelector('a').style.display = 'none'
      evt.preventDefault()
      this.load(evt.state?.page || this.page, true).catch((err) => this.#error(err))
    })
    window.onbeforeunload = (e) => {
      this.#load()
      e.returnValue = false
    }
    this.page = this.dataset.load
    this.load(this.page).catch((err) => this.#error(err))
  }

  #error (err) {
    try { this.panel.querySelector('slot').innerHTML = err.stack } catch (e) { console.error(err, e) }
  }

  load (page = 'readme.md', replace) {
    if (replace) history.replaceState({ page }, page, page)
    else history.pushState({ page }, page, page)
    this.page = page
    return this.#load()
  }

  async #load () {
    this.panel.querySelector('slot').innerHTML = marked.parse(await (await fetch(this.page)).text(), {headerIds: false, mangle: false})
  }
})