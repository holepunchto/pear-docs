import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  params: {
    resolve: {
      specifier: 'The module specifier to resolve.',
      parentURL: 'The URL to resolve `specifier` relative to.',
      readPackage:
        'Called with the URL of each package manifest encountered; must return the parsed manifest or `null`. Returning a promise disables synchronous iteration.',
    },
    'AddonResolveError.INVALID_ADDON_SPECIFIER': {
      msg: 'The error message.',
    },
    'AddonResolveError.INVALID_PACKAGE_NAME': {
      msg: 'The error message.',
    },
  },
  returns: {
    resolve:
      'Yields candidate resolution `URL`s for the caller to test, in the order the algorithm tries them.',
    'AddonResolveError.INVALID_ADDON_SPECIFIER':
      'A new `AddonResolveError` with code `INVALID_ADDON_SPECIFIER`.',
    'AddonResolveError.INVALID_PACKAGE_NAME':
      'A new `AddonResolveError` with code `INVALID_PACKAGE_NAME`.',
  },
  throws: {
    resolve: [
      "`INVALID_ADDON_SPECIFIER` — the addon specifier is not a valid package name or contains an invalid escape sequence.",
      "`INVALID_PACKAGE_NAME` — a package manifest's `name` field is invalid (for example contains `__`).",
    ],
  },
};

export default layout;
