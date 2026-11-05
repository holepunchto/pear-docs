const { DatabaseSync } = require('bare-sqlite', {
  with: { host: 'wasi-wasm32', wasi: './wasi.js' }
})

const db = new DatabaseSync('/books.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT);
  INSERT OR IGNORE INTO books (id, title) VALUES (1, 'Dune'), (2, 'Foundation');
`)

for (const row of db.prepare('SELECT id, title FROM books').iterate()) {
  console.log(row)
}

db.close()
