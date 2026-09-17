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

// ---- module families -------------------------------------------------------
//
// The pipeline documents two module families with identical machinery. Every
// CLI accepts `--family bare|pear` (or env REFGEN_FAMILY); the constants below
// resolve once at load, so downstream scripts stay family-agnostic.

export type FamilyKey = 'bare' | 'pear';

interface FamilyConfig {
  /** Package/repo name prefix, e.g. `bare-`. */
  prefix: string;
  /** Research dossier (null → derive candidates from the catalog table). */
  researchJson: string | null;
  versionsJson: string;
  downloadsJson: string;
  /** Catalog table kept in sync on `--write`. */
  catalogMdx: string;
  /** Docs route of that catalog, for See-also links. */
  catalogRoute: string;
  /** Extra default See-also bullet (docType-appropriate hub page). */
  extraSeeAlso: string | null;
  /** Where generated previews land (NOT content/). */
  outDir: string;
  /** Live docs location, written only under `--write`. */
  contentDir: string;
  /** Optional per-module layout manifests. */
  layoutsDir: string;
}

const FAMILIES: Record<FamilyKey, FamilyConfig> = {
  bare: {
    prefix: 'bare-',
    researchJson: 'docs/bare-modules-research.json',
    versionsJson: 'scripts/bare-refgen/versions.json',
    downloadsJson: 'scripts/bare-refgen/downloads.json',
    catalogMdx: 'content/reference/modules/bare-modules.mdx',
    catalogRoute: '/reference/modules/bare-modules',
    extraSeeAlso: '[Bare runtime API](/reference/bare/runtime) — the runtime these modules extend.',
    outDir: 'generated/bare-refs',
    contentDir: 'content/reference/bare/modules',
    layoutsDir: 'scripts/bare-refgen/layouts',
  },
  pear: {
    prefix: 'pear-',
    researchJson: null,
    versionsJson: 'scripts/bare-refgen/versions-pear.json',
    downloadsJson: 'scripts/bare-refgen/downloads-pear.json',
    catalogMdx: 'content/reference/modules/pear-modules.mdx',
    catalogRoute: '/reference/modules/pear-modules',
    extraSeeAlso: '[Pear API](/reference/pear/api) — the `Pear` global these modules build on.',
    outDir: 'generated/pear-refs',
    contentDir: 'content/reference/pear/modules',
    layoutsDir: 'scripts/bare-refgen/layouts-pear',
  },
};

function resolveFamily(): FamilyKey {
  const i = process.argv.indexOf('--family');
  const raw = (i !== -1 ? process.argv[i + 1] : process.env.REFGEN_FAMILY) ?? 'bare';
  if (raw !== 'bare' && raw !== 'pear') throw new Error(`unknown --family: ${raw}`);
  return raw;
}

export const FAMILY: FamilyKey = resolveFamily();
const F = FAMILIES[FAMILY];

export const PREFIX = F.prefix;
export const RESEARCH_JSON = F.researchJson;
export const VERSIONS_JSON = F.versionsJson;
export const DOWNLOADS_JSON = F.downloadsJson;
export const CATALOG_MDX = F.catalogMdx;
export const CATALOG_ROUTE = F.catalogRoute;
export const EXTRA_SEE_ALSO = F.extraSeeAlso;
export const OUT_DIR = F.outDir;
export const CONTENT_DIR = F.contentDir;
export const LAYOUTS_DIR = F.layoutsDir;

export type Stability = 'stable' | 'experimental' | 'deprecated' | 'unstable';

/** Inline `<mark>` background colours matching the existing bare pages. */
export const STABILITY_COLORS: Record<Stability, string> = {
  stable: '#7dde9a',
  experimental: '#8484ff',
  deprecated: '#f0e57a',
  unstable: '#ff4242',
};

/**
 * Stability per module. Verified 2026-07-02 against the Stability columns of
 * BOTH catalog tables (bare-modules.mdx, pear-modules.mdx): every cataloged
 * module is `stable` except the entries below. Modules absent here default to
 * `stable`; the todo report flags only modules missing from the catalog too
 * (stability truly unknown). Editorial metadata, not AI.
 */
export const STABILITY: Record<string, Stability> = {
  'pear-gunk': 'unstable',
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
 * How `emit-tsdoc` updates each repo's README `## API`:
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
