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
        await element.load(page, opts)

        const isDocumentationPage = pathname.startsWith('/documentation')
        if (isDocumentationPage && !!opts.header) {
          const anchor = opts.header
          if (anchor) {
            const element = this.routes['/documentation'].shadowRoot.getElementById(anchor)
            element.scrollIntoView()
            const elementY = Math.floor(element.getBoundingClientRect().y)
            const pearHeaderHeight = 170
            const extraScroll = 80
            const isUnderPearHeader = elementY < pearHeaderHeight + extraScroll
            if (isUnderPearHeader) {
              window.scrollBy(0, -1 * (pearHeaderHeight + extraScroll - elementY))
            }
          }
        }

        if (!opts.back) history.pushState({ pathname, header: opts.header }, null, pathname)
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
    if (evt.target.pathname.startsWith(route)) {
      const header = evt.target.href.split('#')[1]
      this.load(evt.target.pathname, { header }).catch(console.error)
    } else {
      this.load(route + evt.target.pathname).catch(console.error)
    }
  }

  connectedCallback () {
    for (const { name, value } of Array.from(this.attributes)) {
      if (name.startsWith('data-')) continue
      this.routes[value] = this.querySelector(name)
      this.routes[value].router = this
    }

    this.addEventListener('click', (evt) => this.link(evt))

    window.addEventListener('popstate', (evt) => {
      this.load(evt.state?.pathname, { back: true, header: evt.state?.header }).catch(console.error)
    })

    window.addEventListener('load', () => {
      if (Pear.config.link.indexOf('pear://runtime/') === 0) {
        this.load(Pear.config.link.slice(14)).catch(console.error)
      } else {
        this.load('/')
      }
    })
  }
})
