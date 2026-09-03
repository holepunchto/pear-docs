const test = require('brittle')
const App = require('../app.js')

test('App stores the runtime config the host passes', (t) => {
  const app = new App({
    dir: '/tmp/hello-pear-bare-test',
    app: null,
    updates: false,
    version: '1.0.0',
    upgrade: 'pear://<key>',
    name: 'hello-pear-bare'
  })
  t.is(app.version, '1.0.0')
  t.is(app.updates, false)
  t.is(app.name, 'hello-pear-bare')
  t.is(app.dir, '/tmp/hello-pear-bare-test')
  t.is(app.pipe, null, 'no worker pipe until open()')
})
