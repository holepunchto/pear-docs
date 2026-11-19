const { MemoryDirectory } = require('bare-wasi/memory')

module.exports = (url) => ({
  version: 'preview1',
  preopens: {
    '/': new MemoryDirectory()
  }
})
