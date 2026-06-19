// scripts/refgen/model.ts
//
// The api-model: this project's own, tool-agnostic representation of a JS
// library's public API surface. It is deliberately NOT OpenAPI — these are
// JavaScript class/method APIs (constructors, async methods, streams, events),
// which have no HTTP surface to describe. A later phase renders this model into
// the reference MDX under content/reference/.
//
// The shape is the contract between the extractor (Stage 2) and everything
// downstream (validation, scoring, future MDX rendering), so it is also encoded
// as a JSON Schema (MODEL_SCHEMA) and checked with ajv in validate.ts.

export type MethodKind = 'constructor' | 'method' | 'getter' | 'setter' | 'event' | 'property';

/** Where a symbol was observed — drives drift detection in score.ts. */
export type SymbolSource = 'ast' | 'readme' | 'jsdoc';

export interface RefParam {
  name: string;
  /** Optional when it has a default value or is documented as `[name]`. */
  optional: boolean;
  /** Default value expression, source text (e.g. `{}`, `true`), if any. */
  default?: string;
  /** JSDoc `@param {Type}` — drives the typed param table and type cross-links. */
  type?: string;
  /** Prose pulled from the README parameter list or JSDoc, if matched. */
  description?: string;
}

/** A single field of an options object, parsed from the README options fence. */
export interface RefOption {
  name: string;
  /** Default value literal, when it is a simple token (number/bool/string/ident). */
  default?: string;
  /** Inline `// comment` describing the option. */
  description?: string;
}

export interface RefMethod {
  /** Primary identifier, e.g. `append`, or `constructor` for the ctor (`on` for events). */
  name: string;
  /** Event name when `kind === 'event'` (e.g. `close`); distinguishes events that share `name: on`. */
  event?: string;
  /** Human signature — README heading text, or AST-reconstructed. */
  signature: string;
  kind: MethodKind;
  /** Static (class-level) member, e.g. `Hypercore.createCore(...)`. */
  static: boolean;
  async: boolean;
  params: RefParam[];
  /** Return-value prose from the README or JSDoc, if documented. */
  returns?: string;
  /** JSDoc `@returns {Type}` — drives the typed "Returns" line and type cross-link. */
  returnType?: string;
  /** Description prose from the README or JSDoc, if documented. */
  description?: string;
  /** Fields of the member's options object, parsed from the README options fence. */
  options?: RefOption[];
  /** Fenced code blocks following the README entry. */
  examples: string[];
  /** Tag-pinned GitHub blob URL to the implementation, if found in source. */
  sourceLink?: string;
  /** Which inputs contributed this symbol (`ast`, `readme`, or both). */
  source: SymbolSource[];
}

export interface RefClass {
  name: string;
  methods: RefMethod[];
}

/** A `@typedef {Object} Name` + `@property` shape — a named, linkable object type. */
export interface RefTypedef {
  name: string;
  description?: string;
  /** Fields, reusing the param shape (name/type/optional/default/description). */
  properties: RefParam[];
}

/** A verbatim narrative section lifted from the upstream README. */
export interface RefSection {
  /** Cleaned heading text, e.g. `Install`, `Usage`. */
  title: string;
  /** Raw Markdown of the section (heading + body), as written upstream. */
  markdown: string;
}

export interface ApiModel {
  /** Docs slug, e.g. `hypercore`. */
  slug: string;
  repo: { org: string; repo: string };
  /** One-line upstream description (from package.json), if available. */
  description?: string;
  /** Release tag the source was generated from, e.g. `v11.33.1`. */
  tag: string;
  /** Commit SHA of that tag — the cache-gate key. */
  sha: string;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** README narrative (Install, Prerequisites, Usage, …), kept verbatim. */
  sections: RefSection[];
  classes: RefClass[];
  /** Named object types from `@typedef`, rendered as a linkable Types section. */
  typedefs?: RefTypedef[];
}

/** JSON Schema (draft-07, ajv 6 compatible) for ApiModel. */
export const MODEL_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['slug', 'repo', 'tag', 'sha', 'generatedAt', 'sections', 'classes'],
  additionalProperties: false,
  properties: {
    slug: { type: 'string', minLength: 1 },
    repo: {
      type: 'object',
      required: ['org', 'repo'],
      additionalProperties: false,
      properties: { org: { type: 'string' }, repo: { type: 'string' } },
    },
    description: { type: 'string' },
    tag: { type: 'string', minLength: 1 },
    sha: { type: 'string', minLength: 7 },
    generatedAt: { type: 'string', format: 'date-time' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'markdown'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1 },
          markdown: { type: 'string' },
        },
      },
    },
    classes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'methods'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          methods: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'signature', 'kind', 'static', 'async', 'params', 'examples', 'source'],
              additionalProperties: false,
              properties: {
                name: { type: 'string', minLength: 1 },
                event: { type: 'string', minLength: 1 },
                signature: { type: 'string' },
                kind: {
                  type: 'string',
                  enum: ['constructor', 'method', 'getter', 'setter', 'event', 'property'],
                },
                static: { type: 'boolean' },
                async: { type: 'boolean' },
                params: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name', 'optional'],
                    additionalProperties: false,
                    properties: {
                      name: { type: 'string' },
                      optional: { type: 'boolean' },
                      default: { type: 'string' },
                      type: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
                returns: { type: 'string' },
                returnType: { type: 'string' },
                description: { type: 'string' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name'],
                    additionalProperties: false,
                    properties: {
                      name: { type: 'string' },
                      default: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
                examples: { type: 'array', items: { type: 'string' } },
                sourceLink: { type: 'string' },
                source: {
                  type: 'array',
                  minItems: 1,
                  items: { type: 'string', enum: ['ast', 'readme', 'jsdoc'] },
                },
              },
            },
          },
        },
      },
    },
    typedefs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'properties'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          properties: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'optional'],
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                optional: { type: 'boolean' },
                default: { type: 'string' },
                type: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const;
