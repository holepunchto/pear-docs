// scripts/bare-refgen/layouts/bare-collabora.ts
// Editorial layout for bare-collabora: param/throws prose grounded in the
// upstream README and lib/document.js. The open/save paths are native binding
// calls that throw plain errors (no error code), so the throws bullets are
// prose-only. `saveAs`'s declared `boolean` return is not documented (the JS
// wrapper does not return the binding result), so no `returns` override.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Document.constructor': {
      url: 'A local file path or `file:` URL pointing to a document in any format supported by Collabora.',
    },
    'Document.saveAs': {
      url: 'The destination path or `file:` URL to write to.',
      format: 'The output format; when omitted, it is inferred from the extension of `url`.',
      options: 'A comma-separated string of filter options forwarded to Collabora. See the Collabora documentation for the filters available for a given format.',
    },
  },
  throws: {
    'Document.constructor': ['The document at `url` cannot be opened.'],
    'Document.saveAs': ['The document cannot be saved.'],
  },
};

export default layout;
