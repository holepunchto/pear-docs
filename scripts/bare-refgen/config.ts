// scripts/bare-refgen/config.ts
//
// Static configuration for the bare-module reference generator. Kept free of
// pear-docs specifics (paths aside) so the pipeline can be lifted into other
// doc repos: change ORG / the stability seed and it works elsewhere.

/** GitHub org the modules live under (for repo links). */
export const ORG = 'holepunchto';

/** Default number of modules to document (override per run with `--top N`). */
export const TOP_N = 10;

/**
 * Modules always documented regardless of download rank (curated picks). These
 * are unioned with the top-N-by-downloads selection.
 */
export const ALLOWLIST: string[] = [];

/**
 * If set, include every candidate with at least this many last-month downloads
 * (in addition to the allowlist), ignoring TOP_N. Null = rank by downloads and
 * take TOP_N.
 */
export const MIN_DOWNLOADS: number | null = null;

/** Research dossier produced by scripts/research-bare-modules.ts. */
export const RESEARCH_JSON = 'docs/bare-modules-research.json';

/** Version cache: module → last-generated version, for the release poll. */
export const VERSIONS_JSON = 'scripts/bare-refgen/versions.json';

/**
 * Downloads cache: module → last-month downloads. Persisted so selection is
 * reproducible when the npm stats API rate-limits — a failed fetch falls back
 * to the cached count instead of dropping the module to zero.
 */
export const DOWNLOADS_JSON = 'scripts/bare-refgen/downloads.json';

/** The bare-* catalog table kept in sync on `--write`. */
export const CATALOG_MDX = 'content/reference/modules/bare-modules.mdx';

/** Where generated previews land (NOT content/ — see the plan). */
export const OUT_DIR = 'generated/bare-refs';

/** Live docs location, written only under `--write` (CI regeneration). */
export const CONTENT_DIR = 'content/reference/bare/modules';

/** Directory holding the optional per-module layout manifests. */
export const LAYOUTS_DIR = 'scripts/bare-refgen/layouts';

export type Stability = 'stable' | 'experimental' | 'deprecated' | 'unstable';

/** Inline `<mark>` background colours matching the existing bare pages. */
export const STABILITY_COLORS: Record<Stability, string> = {
  stable: '#7dde9a',
  experimental: '#8484ff',
  deprecated: '#f0e57a',
  unstable: '#ff4242',
};

/**
 * Stability per module, seeded from the Stability column of
 * content/reference/modules/bare-modules.mdx. Modules absent here default to
 * `stable`. This is editorial metadata (like the layout manifests), not AI.
 *
 * TODO(human): confirm the stability of each documented module and add any that
 * aren't `stable` here — the default assumes stable. `bare-refs:todo` lists
 * modules that fall back to the default.
 */
export const STABILITY: Record<string, Stability> = {
  'bare-stream': 'stable',
  'bare-events': 'stable',
  'bare-path': 'stable',
  'bare-fs': 'stable',
  'bare-os': 'stable',
  'bare-url': 'stable',
  'bare-subprocess': 'stable',
  'bare-module': 'stable',
  'bare-bundle': 'stable',
  'bare-process': 'stable',
};

export function stabilityOf(name: string): Stability {
  return STABILITY[name] ?? 'stable';
}

/**
 * Bare modules that mirror a Node.js core module. Used to render a parity link
 * ("Mirrors the Node.js `fs` module") in the intro. Page-level only — Node's
 * per-method anchors embed the parameter list and aren't safe to synthesize.
 */
export const NODE_PARITY: Record<string, string> = {
  'bare-fs': 'fs',
  'bare-os': 'os',
  'bare-path': 'path',
  'bare-url': 'url',
  'bare-events': 'events',
  'bare-stream': 'stream',
  'bare-process': 'process',
  'bare-buffer': 'buffer',
  'bare-http1': 'http',
  'bare-https': 'https',
  'bare-tls': 'tls',
  'bare-tcp': 'net',
  'bare-dgram': 'dgram',
  'bare-dns': 'dns',
  'bare-timers': 'timers',
  'bare-tty': 'tty',
  'bare-crypto': 'crypto',
  'bare-zlib': 'zlib',
  'bare-assert': 'assert',
  'bare-console': 'console',
  'bare-inspector': 'inspector',
  'bare-repl': 'repl',
  'bare-readline': 'readline',
};

export function nodeParityUrl(name: string): string | null {
  const mod = NODE_PARITY[name];
  return mod ? `https://nodejs.org/api/${mod}.html` : null;
}

/**
 * How `emit-jsdoc` updates each repo's README `## API`:
 *   'markers' (default) — own only a `<!-- bare-refgen:api … -->` fenced region,
 *                         preserving any hand-written prose around it;
 *   'replace'           — overwrite the whole `## API` section;
 *   'skip'              — leave the README untouched.
 * List a module here only to override the default.
 */
export type ReadmePolicy = 'markers' | 'replace' | 'skip';
export const README_POLICY: Record<string, ReadmePolicy> = {};

export function readmePolicyOf(name: string): ReadmePolicy {
  return README_POLICY[name] ?? 'markers';
}
