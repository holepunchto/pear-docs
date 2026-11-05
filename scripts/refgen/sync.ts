// scripts/refgen/sync.ts
//
// Curated-page sync — keep the hand-authored content/reference pages factually in
// step with upstream WITHOUT touching prose, groupings, ordering or hand-authored
// entries.
//
// Why so light-touch: the upstream READMEs are flat (no semantic groups), and the
// curated pages' groupings, reading order and per-method prose are richer than
// anything the model can synthesize. So a generated block can only regress them.
// The single thing the model knows better than a curated page is where each member
// lives in source at the current release. The sync therefore makes exactly one
// kind of edit: it repoints each pinned `[API definition on GitHub](…/blob/vX/…)`
// link to the member's current tag + line. Everything else is preserved verbatim.
//
// New upstream members and page-only (hand-authored) entries are reported, never
// edited — where a member belongs and how it reads are human decisions.

import type { ApiModel } from './model';
import { symbolId, memberId, pageSymbols } from './identity';

export interface SyncResult {
  content: string;
  /** Links repointed to the current release. */
  updatedLinks: number;
  /** Documented model members with no matching heading on the page (candidate additions). */
  additions: string[];
  /** Page methods whose source link has no matching model member (hand-authored beyond upstream). */
  unmatched: string[];
}

const HEADING_RE = /^####\s+`(.+)`\s*$/;
// A pinned holepunch blob link: capture [1] full URL and [2] the `vX.Y.Z` tag.
const LINK_RE = /\((https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/(v[\w.-]+)\/[^)]+)\)/;

/** Refresh the pinned GitHub source links on a curated page; preserve all else. */
export function syncSourceLinks(mdx: string, model: ApiModel): SyncResult {
  const linkById = new Map<string, string>(); // identity -> current sourceLink
  const present = new Set<string>(); // every model member identity
  const documented = new Set<string>(); // README-documented identities only
  for (const cls of model.classes) {
    for (const m of cls.methods) {
      const id = memberId(m);
      present.add(id);
      if (m.source.includes('readme')) documented.add(id);
      if (m.sourceLink) linkById.set(id, m.sourceLink);
    }
  }

  // Every documented symbol on the page (headings + compact bullets), so events
  // and properties written as bullets aren't mistaken for missing coverage.
  const seen = pageSymbols(mdx);

  const lines = mdx.split('\n');
  let currentId: string | null = null;
  let updatedLinks = 0;
  const unmatched = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(HEADING_RE);
    if (h) {
      currentId = symbolId(h[1].trim());
      continue;
    }
    if (!currentId) continue;

    const link = lines[i].match(LINK_RE);
    if (!link) continue;

    const fresh = linkById.get(currentId);
    if (!fresh) {
      // A source link under a heading the model doesn't know: hand-authored.
      if (!present.has(currentId)) unmatched.add(currentId);
      continue;
    }
    // Only repoint when the pinned tag is behind the model's release. Leaving
    // already-current links alone avoids churning line numbers needlessly.
    if (link[2] === model.tag || link[1] === fresh) continue;
    lines[i] = lines[i].slice(0, link.index) + lines[i].slice(link.index!).replace(link[1], fresh);
    updatedLinks++;
  }

  return {
    content: lines.join('\n'),
    updatedLinks,
    additions: [...documented].filter((id) => !seen.has(id)).sort(),
    unmatched: [...unmatched].sort(),
  };
}
