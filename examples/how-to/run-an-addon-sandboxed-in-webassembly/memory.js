const { DatabaseSync } = require('bare-sqlite', {
  with: { host: 'wasi-wasm32', wasi: './wasi-memory.js' }
})

const db = new DatabaseSync('/books.db')

db.exec("CREATE TABLE books (title TEXT); INSERT INTO books VALUES ('Hyperion')")

console.log(db.prepare('SELECT title FROM books').all())
