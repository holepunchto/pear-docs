/**
 * Turns a one-line `<VersionSection>` pragma into a `<VersionGate>` wrapping the
 * whole section it labels — heading, body, and any deeper subsections.
 *
 * Authors write plain markdown plus one line:
 *
 *     ## pear cores
 *     <VersionSection since="3.1.0" />
 *
 *     Body, tables, fences, `###` subsections …
 *
 *     ## next command        <- gate ends here (same-or-higher heading level)
 *
 * and get:
 *
 *     <VersionGate since="3.1.0">
 *       ## pear cores
 *       … everything up to the next `##` or `#` …
 *     </VersionGate>
 *
 * Why a pragma instead of asking authors to hand-wrap the section in JSX: the
 * heading has to be INSIDE the wrapper (hiding a section but leaving its heading
 * is worse than not filtering), and hand-wrapping means remembering to move the
 * closing tag every time a section grows. The pragma is a single line that
 * cannot drift out of sync with the section's extent.
 *
 * Why not infer the extent from the existing childless `<Since>` badge, which
 * often sits at the top of exactly these sections: because that badge also
 * appears mid-paragraph as a pure annotation, so inferring would silently gate
 * whole sections an author only meant to annotate. Gating is consequential
 * enough to be explicit — see design §10 for the bug that made that lesson.
 *
 * The pragma is REMOVED from the output; the visible "New in 3.1.0" badge is
 * still the author's inline `<Since>` / `<Until>` marker in the prose.
 */

import type { Root, RootContent, Heading } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import type { VFile } from 'vfile';

/** Pragma authors write. Consumed here, never rendered. */
const PRAGMA = 'VersionSection';
/** Component the pragma compiles to. Registered in `src/mdx-components.tsx`. */
const GATE = 'VersionGate';

const GATE_ATTRS = ['since', 'until'] as const;

interface Parent {
  children: RootContent[];
}

function isPragma(node: RootContent): node is MdxJsxFlowElement {
  return (
    node.type === 'mdxJsxFlowElement' &&
    node.name === PRAGMA &&
    // A pragma with children would be a hand-wrapped block, not a pragma.
    node.children.length === 0
  );
}

/** Plain string attributes only — `since="3.1.0"`, never `since={expr}`. */
function readAttrs(node: MdxJsxFlowElement, file: VFile): MdxJsxAttribute[] {
  const out: MdxJsxAttribute[] = [];
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') {
      file.fail(
        `<${PRAGMA}> takes only plain string attributes (${GATE_ATTRS.join(', ')}).`,
        node,
      );
      continue;
    }
    if (!GATE_ATTRS.includes(attr.name as (typeof GATE_ATTRS)[number])) {
      file.fail(
        `<${PRAGMA}> has no "${attr.name}" attribute; expected ${GATE_ATTRS.join(' or ')}.`,
        node,
      );
      continue;
    }
    if (typeof attr.value !== 'string') {
      file.fail(
        `<${PRAGMA} ${attr.name}> must be a literal string, e.g. ${attr.name}="3.1.0".`,
        node,
      );
      continue;
    }
    out.push(attr);
  }
  if (out.length === 0) {
    file.fail(
      `<${PRAGMA}> needs ${GATE_ATTRS.join(' or ')}, e.g. <${PRAGMA} since="3.1.0" />.`,
      node,
    );
  }
  return out;
}

/** Walks every node that can contain a pragma, outermost first. */
function findPragma(
  parent: Parent,
): { parent: Parent; index: number; node: MdxJsxFlowElement } | null {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (isPragma(child)) return { parent, index: i, node: child };
    if ('children' in child && Array.isArray(child.children)) {
      const nested = findPragma(child as unknown as Parent);
      if (nested) return nested;
    }
  }
  return null;
}

export function remarkVersionSections() {
  return (root: Root, file: VFile) => {
    // Each rewrite splices `children`, so re-scan from the top rather than
    // holding indices across mutations. Sections per page are in the single
    // digits; the guard is only there to make a bug loud instead of infinite.
    for (let guard = 0; guard < 500; guard++) {
      const found = findPragma(root as unknown as Parent);
      if (!found) return;

      const { parent, index, node } = found;
      const attrs = readAttrs(node, file);

      const heading = parent.children[index - 1];
      if (!heading || heading.type !== 'heading') {
        file.fail(
          `<${PRAGMA}> must come directly after the heading of the section it gates. ` +
            `To gate a block that is not a whole section, use <${GATE}> around it instead.`,
          node,
        );
        return;
      }

      // The section runs to the next heading at the same level or higher, so a
      // gated `##` swallows its `###` subsections but stops at the next `##`.
      const depth = (heading as Heading).depth;
      let end = index + 1;
      while (end < parent.children.length) {
        const next = parent.children[end];
        if (next.type === 'heading' && next.depth <= depth) break;
        end++;
      }

      const section = parent.children
        .slice(index - 1, end)
        .filter((child) => child !== node);

      const gate: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: GATE,
        attributes: attrs,
        children: section as MdxJsxFlowElement['children'],
      };

      parent.children.splice(index - 1, end - (index - 1), gate);
    }

    file.fail(
      `Gave up rewriting <${PRAGMA}> pragmas after 500 passes — this is a bug in remark-version-sections.`,
    );
  };
}
