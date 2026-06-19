// eslint-jsdoc.config.mjs
//
// Shareable ESLint flat-config that enforces the JSDoc convention
// (./JSDOC_CONVENTION.md) in a SOURCE repo, so the generated reference docs can
// render fully-typed entries. Copy this into each module repo (or publish it as a
// shared package) and extend it from that repo's eslint.config.mjs:
//
//   import jsdocDocs from './eslint-jsdoc.config.mjs'
//   export default [ ...jsdocDocs ]
//
// Requires: npm i -D eslint eslint-plugin-jsdoc
//
// It requires a type + description on every @param and @returns of an exported/
// public member, so missing or half-written JSDoc fails lint as code lands.
// `@example` is a warning (not always needed), and internal `_`-prefixed members
// are exempt.

import jsdoc from 'eslint-plugin-jsdoc'

export default [
  {
    files: ['index.js', 'lib/**/*.js'],
    ignores: ['**/*.test.js', 'test/**', 'tests/**'],
    plugins: { jsdoc },
    settings: {
      jsdoc: { mode: 'jsdoc' },
    },
    rules: {
      // Require JSDoc on public class members and exported functions.
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, MethodDefinition: true, ClassDeclaration: false },
          // Don't force JSDoc on private (`_`-prefixed) or trivial accessors.
          exemptEmptyFunctions: false,
          checkConstructors: true,
          checkGetters: false,
          checkSetters: false,
        },
      ],

      // Params: every documented param needs a name match, a type, and a description.
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/check-param-names': 'error',

      // Returns: non-void members need a typed, described @returns.
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/require-returns-description': 'error',

      // Examples: strongly encouraged, but a warning so it doesn't block.
      'jsdoc/require-example': ['warn', { exemptedBy: ['private', 'internal'] }],

      // Hygiene.
      'jsdoc/check-types': 'warn',
      'jsdoc/no-undefined-types': 'off', // cross-module types (Hypercore, Buffer) are fine
      'jsdoc/require-description': 'error',
      'jsdoc/check-tag-names': ['warn', { definedTags: ['typedef', 'property', 'memberof'] }],
    },
  },
]
