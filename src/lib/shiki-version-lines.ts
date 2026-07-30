/**
 * Version-gates a SINGLE LINE inside a code fence.
 *
 * The Pear CLI pages document flags as blocks of `pear <cmd> --help` output, so
 * "this flag arrived in 3.1.0" is a claim about one row of a fence — which no
 * JSX wrapper can express, since a fence's body is opaque text. Authors mark the
 * row inline:
 *
 *     ```
 *       --json              Newline delimited JSON output
 *       --vanity <vanity>   Generate a vanity link  [!version since=3.1.0]
 *       --help|-h           Show help
 *     ```
 *
 * The marker is stripped from the rendered output and becomes
 * `data-version-since` / `data-version-until` on that line's `<span>`, which is
 * the same contract `<VersionGate>` emits — so `<VersionFilter>` hides fence
 * rows and whole sections through one code path.
 *
 * Implemented in `preprocess` (raw text, before tokenizing) rather than by
 * walking highlighted tokens: the marker can then be found with one regex per
 * line instead of being reassembled from however Shiki happened to split the
 * line into tokens. `preprocess` runs before `line`, and `this.meta` is
 * per-code-block, so the line map it stashes cannot leak between fences.
 *
 * The alternative — Shiki's comment-notation helpers (`[!code highlight]`) —
 * does not fit: these fences have no language, so there is no comment syntax to
 * anchor to, and CLI help text is full of `--flag` that the `--` comment matcher
 * would try to claim.
 */

import type { ShikiTransformer } from 'shiki';

/** `[!version since=3.1.0]` / `[!version until=3.1.0]`, plus leading space. */
const MARKER = /[ \t]*\[!version[ \t]+(since|until)=([0-9][^\]\s]*)\]/;

interface LineVersion {
  direction: 'since' | 'until';
  version: string;
}

interface VersionLineMeta {
  versionLines?: Map<number, LineVersion>;
}

export function transformerVersionLines(): ShikiTransformer {
  return {
    name: 'pear:version-lines',

    preprocess(code) {
      const versionLines = new Map<number, LineVersion>();

      const stripped = code.split('\n').map((line, i) => {
        const match = MARKER.exec(line);
        if (!match) return line;
        // Shiki numbers lines from 1.
        versionLines.set(i + 1, {
          direction: match[1] as 'since' | 'until',
          version: match[2],
        });
        return line.replace(MARKER, '');
      });

      if (versionLines.size === 0) return;
      (this.meta as VersionLineMeta).versionLines = versionLines;
      return stripped.join('\n');
    },

    line(node, line) {
      const hit = (this.meta as VersionLineMeta).versionLines?.get(line);
      if (!hit) return;
      node.properties[
        hit.direction === 'since' ? 'data-version-since' : 'data-version-until'
      ] = hit.version;
    },
  };
}
