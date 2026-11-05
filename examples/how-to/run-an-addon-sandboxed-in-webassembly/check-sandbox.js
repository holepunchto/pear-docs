const { DatabaseSync } = require('bare-sqlite', {
  with: { host: 'wasi-wasm32', wasi: './wasi.js' }
})

try {
  new DatabaseSync('/tmp/escape.db')
} catch (err) {
  console.log('Blocked:', err.code)
}
