import { DatabaseSync } from 'bare-sqlite' with { host: 'wasi-wasm32', wasi: './wasi.js' }

const db = new DatabaseSync('/books.db')

console.log(db.prepare('SELECT count(*) AS books FROM books').get())
