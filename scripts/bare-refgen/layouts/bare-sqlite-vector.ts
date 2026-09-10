// scripts/bare-refgen/layouts/bare-sqlite-vector.ts
// Editorial layout for bare-sqlite-vector: `register` param/throws grounded in
// index.js (`if (!db.isOpen) throw errors.DATABASE_NOT_OPEN(...)`, then
// `binding.init(db._handle)`).

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    register: {
      db: 'An open `DatabaseSync` connection from `bare-sqlite` to register the vector functions and virtual table modules on.',
    },
  },
  throws: {
    register: ['`DATABASE_NOT_OPEN` — `db` is not open.'],
  },
};

export default layout;
