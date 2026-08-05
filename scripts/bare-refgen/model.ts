// scripts/bare-refgen/model.ts
//
// Shape of the intermediate API model extracted from a bare module's TypeScript
// declaration files. This is the deterministic artifact written to
// generated/bare-refs/<name>/api-model.json; render.ts turns it into MDX.
//
// Nothing here is AI-generated: every field is derived from the .d.ts, the
// package.json, or the upstream README (usage) — see extract.ts / fetch.ts.

export type BareKind =
  | 'class'
  | 'interface'
  | 'function'
  | 'variable'
  | 'typeAlias'
  | 'namespace'
  | 'constructor'
  | 'method'
  | 'property'
  | 'accessor';

/** A single function/method parameter, read from the type signature. */
export interface BareParam {
  name: string;
  type: string;
  optional: boolean;
  /** Default value text (from `= …`), or null. */
  default: string | null;
  /** From an `@param` JSDoc tag, when the .d.ts carries one. */
  description: string | null;
}

/** Return type of a callable, from the signature (+ optional `@returns`). */
export interface BareReturns {
  type: string;
  description: string | null;
}

/** A documented failure mode, from an `@throws` tag or a layout override. */
export interface BareThrows {
  /** Error type/code, e.g. `ERR_INVALID_ARG_TYPE`, or null when uncoded. */
  type: string | null;
  condition: string;
}

/**
 * One exported symbol (or a nested class/interface/namespace member). Callable
 * kinds carry `params`/`returns`; overloads collapse into multiple `signatures`.
 */
export interface BareExport {
  /** Stable identity for layout-manifest matching, e.g. `open`, `URL.parse`. */
  key: string;
  name: string;
  kind: BareKind;
  /** True for class statics / namespace members (rendered qualified). */
  static: boolean;
  /** One entry per overload; a plain property/variable has exactly one. */
  signatures: string[];
  description: string | null;
  /** `@deprecated` note, or null. */
  deprecated: string | null;
  params: BareParam[];
  returns: BareReturns | null;
  throws: BareThrows[];
  /** Nested members (class/interface members, namespace exports). */
  members: BareExport[];
}

/** An additional published entry point, e.g. `bare-fs/promises`. */
export interface BareSubpath {
  /** The import specifier, e.g. `bare-fs/promises`. */
  name: string;
  exports: BareExport[];
}

/** The whole module, ready to render. */
export interface BareModel {
  name: string;
  version: string;
  description: string | null;
  repoUrl: string | null;
  npmUrl: string;
  /** `engines.bare` from package.json, e.g. `>=1.16.0`. */
  minBare: string | null;
  /** True when package.json has `"addon": true` (a native addon). */
  native: boolean;
  /** Upstream README `## Usage` section, verbatim, or null. */
  usage: string | null;
  exports: BareExport[];
  /** Additional published entry points (`bare-fs/promises`, `bare-stream/web`). */
  subpaths: BareSubpath[];
  /** ISO timestamp, stamped by the driver (not inside pure steps). */
  generatedAt: string | null;
}
