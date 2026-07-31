/**
 * Version-gates a SINGLE LINE inside a code fence.
 *
 * The Pear CLI pages document flags as blocks of `pear <cmd> --help` output, so
 * "this flag arrived in 3.1.0" is a claim about one row of a fence — which no
 * JSX wrapper can express, since a fence's body is opaque text. Authors mark the
 * row inline and `remarkVersionCodeLines` moves that marker onto the fence's
 * info line, so by the time this transformer runs the fence carries:
 *
 *     ```text version-lines="2:since:3.1.0"
 *
 * This reads it back and stamps `data-version-since` / `data-version-until` onto
 * that line's `<span>`, which is the same contract `<VersionGate>` emits — so
 * `<VersionFilter>` hides fence rows and whole sections through one code path.
 *
 * Reading `meta` rather than stripping the marker here is what keeps the marker
 * out of the `.md` files served to LLMs: `includeProcessedMarkdown` serializes
 * the mdast, which is upstream of every rehype hook this transformer could use.
 * See remark-version-code-lines.ts for the full reasoning.
 *
 * The alternative — Shiki's comment-notation helpers (`[!code highlight]`) —
 * does not fit: these fences have no language of their own, so there is no
 * comment syntax to anchor to, and CLI help text is full of `--flag` that the
 * `--` comment matcher would try to claim.
 */

import type { ShikiTransformer } from 'shiki';
import { VERSION_LINES_META } from './remark-version-code-lines';

/** `version-lines="2:since:3.1.0,7:until:3.2.0"` on the fence info line. */
const META_RE = new RegExp(`${VERSION_LINES_META}="([^"]*)"`);

type Direction = 'since' | 'until';

/** Parse the meta into line number -> gate. Bad entries are skipped. */
function parseVersionLines(raw: string | undefined): Map<number, [Direction, string]> {
  const out = new Map<number, [Direction, string]>();
  const match = raw ? META_RE.exec(raw) : null;
  if (!match) return out;

  for (const entry of match[1].split(',')) {
    const [line, direction, version] = entry.split(':');
    const n = Number.parseInt(line, 10);
    if (!n || (direction !== 'since' && direction !== 'until') || !version) continue;
    out.set(n, [direction, version]);
  }
  return out;
}

export function transformerVersionLines(): ShikiTransformer {
  return {
    name: 'pear:version-lines',

    line(node, line) {
      // `__raw` is the fence's full info string; the same channel
      // `transformerMetaHighlight` uses for `{16,22-23}`.
      const hit = parseVersionLines(this.options.meta?.__raw).get(line);
      if (!hit) return;

      const [direction, version] = hit;
      node.properties[
        direction === 'since' ? 'data-version-since' : 'data-version-until'
      ] = version;
    },
  };
}
