/**
 * Moves a `[!version …]` code-fence marker out of the fence BODY and onto the
 * fence's info line, before anything serializes the markdown.
 *
 * Authors keep writing the marker inline on the row it gates, because that is
 * self-anchoring — it cannot drift the way a line number in the info string
 * would when a flag is inserted above it:
 *
 *     ```
 *       --vanity <vanity>   Generate a vanity link  [!version since=3.1.0]
 *     ```
 *
 * This pass rewrites that to `meta`, leaving the body clean:
 *
 *     ```text version-lines="2:since:3.1.0"
 *       --vanity <vanity>   Generate a vanity link
 *     ```
 *
 * WHY it has to happen at the remark stage rather than in the Shiki transformer,
 * which is where it used to happen: `postprocess.includeProcessedMarkdown`
 * serializes the mdast, and Shiki runs later (rehype). So a marker stripped in
 * Shiki's `preprocess` was already baked into the `.md` files served to LLMs and
 * copied by "Copy page" — presenting `[!version since=3.1.0]` as a literal row
 * of `pear touch --help` output. Unlike a `<VersionGate>` wrapper, which a reader
 * discounts as a tag around content, that invents text inside a block claiming to
 * be verbatim. Stripping here fixes every consumer at once.
 *
 * A language is forced onto unlabelled fences (`text`) because mdast serializes
 * `meta` immediately after `lang`; with `lang` empty the info line would read
 * ```` ``` version-lines="…" ````, and re-parsing that would read the meta as the
 * language. `text` renders identically to no language in Shiki.
 */

import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

/** `[!version since=3.1.0]` / `[!version until=3.1.0]`, plus leading space. */
const MARKER = /[ \t]*\[!version[ \t]+(since|until)=([0-9][^\]\s]*)\]/;

/** Meta key the Shiki transformer reads back. */
export const VERSION_LINES_META = 'version-lines';

/** Fences with no language get this one, so `meta` cannot be read as `lang`. */
const DEFAULT_LANG = 'text';

export function remarkVersionCodeLines() {
  return (root: Root) => {
    visit(root, 'code', (node: Code) => {
      const found: string[] = [];

      const lines = node.value.split('\n').map((line, i) => {
        const match = MARKER.exec(line);
        if (!match) return line;
        // Lines are numbered from 1, matching Shiki's `line()` hook.
        found.push(`${i + 1}:${match[1]}:${match[2]}`);
        return line.replace(MARKER, '');
      });

      if (found.length === 0) return;

      node.value = lines.join('\n');
      node.lang ||= DEFAULT_LANG;
      const encoded = `${VERSION_LINES_META}="${found.join(',')}"`;
      node.meta = node.meta ? `${node.meta} ${encoded}` : encoded;
    });
  };
}
