// scripts/refgen/layout.ts
//
// The "editorial 20%" of a reference page, as structured data: the part that is
// NOT derivable from upstream (semantic groupings + order, conceptual prose,
// quickstart, per-member notes, see-also). A layout manifest is authored once per
// repo and changes only when the API surface is regrouped; the generator merges it
// with the model (the auto-refreshed factual 80%) to emit the whole curated page.
//
// Member ids reference the model via `memberKey` (e.g. `append`, `on:update`,
// `static:getUserData`). Members the manifest never lists are rendered into an
// "Ungrouped" bucket and reported, so newly documented upstream API can't silently
// vanish — a human just files it into a group.

export type StatusLevel =
  | 'stable'
  | 'unstable'
  | 'experimental'
  | 'deprecated'
  | 'removed'
  | 'upcoming';

export interface LayoutGroup {
  title: string;
  /** MDX prose rendered under the group heading, before its members. */
  intro?: string;
  /** Member keys, in display order. */
  members: string[];
}

/**
 * Full editorial override for one member, for entries the model can't document
 * from upstream — chiefly sub-object members (hyperbee `Batch.put`,
 * `Watcher.close`) whose prose lives only in the curated page, never the README.
 * Any field set here wins over the model. The model still supplies the signature
 * and source link.
 */
export interface MemberDoc {
  description?: string;
  /** Return-value prose (the leading "Returns " is added by the renderer). */
  returns?: string;
  /**
   * Errors the member throws, as ready-to-render bullet text (e.g.
   * "`SESSION_CLOSED` if the core is closed"). Use this editorial path when the
   * model has no `@throws` yet; it wins over the model's `throws`.
   */
  throws?: string[];
  /** A single JS example body (without the ```js fence). */
  example?: string;
}

export interface Layout {
  /** Frontmatter `description`. */
  description: string;
  status?: StatusLevel;
  /** MDX prose rendered right after the status badge. */
  intro: string;
  /** Narrative sections before the API reference, e.g. conceptual guides. */
  sections?: { title: string; body: string }[];
  /** Quickstart MDX (the `## Quickstart` heading is added by the renderer). */
  quickstart?: string;
  /** Ordered API groups. */
  groups: LayoutGroup[];
  /** Description override for members the README under-documents (model gap fill). */
  descriptions?: Record<string, string>;
  /** Full editorial overrides (description/returns/example) keyed by member key. */
  members?: Record<string, MemberDoc>;
  /** MDX appended after a member's entry, keyed by member key. */
  notes?: Record<string, string>;
  /** See-also bullet bodies (without the leading `- `). */
  seeAlso?: string[];
  /**
   * Keep the hand-curated content page; never overwrite it on `--write`. Set when
   * the generated output would regress the live page — e.g. hyperswarm, whose model
   * collapses `swarm.destroy` and `discovery.destroy` into one member (no
   * `PeerDiscovery` sub-object is extracted), so a regen drops the real
   * `swarm.destroy`. The preview still renders for the gate and for comparison.
   */
  keepCurated?: boolean;
}

/** Load a repo's layout manifest, or null when none has been authored yet. */
export async function loadLayout(slug: string): Promise<Layout | null> {
  try {
    const mod = await import(`./layouts/${slug}.ts`);
    return (mod.default ?? mod.layout ?? null) as Layout | null;
  } catch {
    return null;
  }
}
