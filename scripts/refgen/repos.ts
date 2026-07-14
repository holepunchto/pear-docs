// scripts/refgen/repos.ts
//
// Single source of truth for docs-slug -> upstream-repo mapping used by the
// reference generator. Mirrors the maps in scripts/add-api-github-links.ts and
// scripts/audit-reference-docs.ts; consolidated here so `refs:gen --all` and the
// existing link/audit scripts can converge on one list over time.
//
// Only library (class-API) repos are listed for now — that is the pilot's scope.
// CLI tools (drives, hyperbeam, hypershell, hyperssh, hypertele) document
// commands, not classes, and need a different extractor; they are intentionally
// omitted until the library pipeline is proven.

export interface RepoConfig {
  org: string;
  repo: string;
  /** Override default-branch name when a repo has no tags (fallback ref). */
  branch?: string;
  /**
   * Override the receiver used when reconstructing AST-only member signatures
   * (`<receiver>.member(...)`). Normally the receiver is inferred by majority
   * vote over README signatures, falling back to the lowercased class name. Set
   * this for module-of-functions packages whose conventional namespace alias is
   * not derivable from the source — e.g. compact-encoding is imported as `cenc`,
   * but the README documents the encoder *contract* methods on a generic `enc`
   * instance, so the vote picks `enc` and applies it to the namespace encoders
   * too. README-sourced signatures are kept verbatim, so the encoder contract
   * stays `enc.preencode(...)` while reconstructed members become `cenc.uint64`.
   */
  receiver?: string;
}

/** Library / helper reference pages — slug matches the reference page filename. */
export const REPOS: Record<string, RepoConfig> = {
  // building-blocks
  autobase: { org: 'holepunchto', repo: 'autobase' },
  hyperbee: { org: 'holepunchto', repo: 'hyperbee' },
  hypercore: { org: 'holepunchto', repo: 'hypercore' },
  hyperdht: { org: 'holepunchto', repo: 'hyperdht' },
  hyperdrive: { org: 'holepunchto', repo: 'hyperdrive' },
  hyperswarm: { org: 'holepunchto', repo: 'hyperswarm' },
  // helpers
  'compact-encoding': { org: 'holepunchto', repo: 'compact-encoding', receiver: 'cenc' },
  corestore: { org: 'holepunchto', repo: 'corestore' },
  localdrive: { org: 'holepunchto', repo: 'localdrive' },
  mirrordrive: { org: 'holepunchto', repo: 'mirror-drive' },
  protomux: { org: 'holepunchto', repo: 'protomux' },
  // README documents the instance as `s`; prefer the clearer `stream` for reconstructed signatures.
  secretstream: { org: 'holepunchto', repo: 'hyperswarm-secret-stream', receiver: 'stream' },
};

export function repoUrl(cfg: RepoConfig): string {
  return `https://github.com/${cfg.org}/${cfg.repo}.git`;
}

export function githubBlobUrl(cfg: RepoConfig, ref: string, file: string, line: number): string {
  return `https://github.com/${cfg.org}/${cfg.repo}/blob/${ref}/${file}#L${line}`;
}
