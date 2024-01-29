/* eslint-env browser */
customElements.define('app-router', class AppRouter extends HTMLElement {
  constructor () {
    super()
    this.routes = {}
  }

  unload () {
    for (const element of Object.values(this.routes)) element?.unload && element.unload()
  }

  async load (pathname = '/', opts = {}) {
    for (const [route, element] of Object.entries(this.routes)) {
      if (pathname.startsWith(route)) {
        const page = pathname.slice(route.length) || '/'
        this.unload()
        document.documentElement.scrollTop = 0
        this.dataset.load = element.tagName.toLowerCase()
        await element.load(page)
        document.documentElement.scrollTop = 0
        if (!opts.back) history.pushState({ pathname }, null, pathname)
        break
      }
    }
  }

  link (evt) {
    if (evt.target?.tagName !== 'A') return
    evt.preventDefault()
    if (evt.target.origin !== location.origin) return window.open(evt.target.href)
    const { tagName } = evt.target.getRootNode().host || {}
    const route = tagName ? this.getAttribute(tagName) : ''
    this.load(route + evt.target.pathname).catch(console.error)
  }

  connectedCallback () {
    for (const { name, value } of Array.from(this.attributes)) {
      if (name.startsWith('data-')) continue
      this.routes[value] = this.querySelector(name)
      this.routes[value].router = this
    }

    this.addEventListener('click', (evt) => this.link(evt))

    window.addEventListener('popstate', (evt) => {
      this.load(evt.state?.pathname, { back: true }).catch(console.error)
    })

    window.addEventListener('load', () => {
      if (Pear.config.link.indexOf('pear://pulse') === 0) {
        this.load(Pear.config.link.slice(12)).catch(console.error)
      }
    })
  }
})
