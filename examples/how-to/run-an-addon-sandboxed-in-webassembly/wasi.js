const { DirectorySync } = require('bare-directory')
const { HostDirectory } = require('bare-wasi/host')

module.exports = (url) => ({
  version: 'preview1',
  preopens: {
    '/': new HostDirectory(DirectorySync.open(__dirname + '/data'))
  }
})
