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

/** Runaway-loop backstop, set far above any plausible page. */
const MAX_PRAGMAS = 500;

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

/** A bare numeric version: `3`, `3.1`, `3.1.0`. No `v` prefix, no range. */
const VERSION_RE = /^\d+(\.\d+){0,2}$/;

/**
 * Plain string attributes only — `since="3.1.0"`, never `since={expr}`.
 *
 * `VFile#fail` THROWS, so problems are collected and reported in one go rather
 * than failing on the first one — an author fixing a pragma sees everything
 * wrong with it in a single build.
 */
function readAttrs(node: MdxJsxFlowElement, file: VFile): MdxJsxAttribute[] {
  const out: MdxJsxAttribute[] = [];
  const errors: string[] = [];

  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') {
      errors.push(
        `takes only plain string attributes (${GATE_ATTRS.join(', ')})`,
      );
    } else if (!GATE_ATTRS.includes(attr.name as (typeof GATE_ATTRS)[number])) {
      errors.push(
        `has no "${attr.name}" attribute; expected ${GATE_ATTRS.join(' or ')}`,
      );
    } else if (typeof attr.value !== 'string') {
      errors.push(
        `${attr.name} must be a literal string, e.g. ${attr.name}="3.1.0"`,
      );
    } else if (!VERSION_RE.test(attr.value)) {
      // Without this a typo compiles to a gate whose `data-version-*` can never
      // match any selection, so the section stays visible in every version with
      // no build error — the failure mode is silence.
      errors.push(
        `${attr.name}="${attr.value}" is not a version; use a bare number like ${attr.name}="3.1.0" (no "v", no range)`,
      );
    } else {
      out.push(attr);
    }
  }

  if (out.length === 0 && errors.length === 0) {
    errors.push(
      `needs ${GATE_ATTRS.join(' or ')}, e.g. <${PRAGMA} since="3.1.0" />`,
    );
  }
  if (errors.length > 0) {
    file.fail(`<${PRAGMA}> ${errors.join('; ')}.`, node);
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

/**
 * Catch a pragma written INLINE on the heading line:
 *
 *     ### `pear cores` <VersionSection since="3.1.0" />
 *
 * MDX parses that as an `mdxJsxTextElement` (phrasing) rather than an
 * `mdxJsxFlowElement`, so `isPragma` does not match, the rewrite never happens,
 * and the node survives into the output. `VersionSection` is deliberately not
 * registered in `src/mdx-components.tsx`, so the build does fail — but with
 * "Expected component `VersionSection` to be defined", which says nothing about
 * the real mistake. Fail with the actual instruction instead.
 */
function failOnInlinePragma(parent: Parent, file: VFile): void {
  for (const child of parent.children) {
    if (child.type === 'mdxJsxTextElement' && child.name === PRAGMA) {
      file.fail(
        `<${PRAGMA}> must be on its own line directly BELOW the heading, not inline in it.`,
        child,
      );
    }
    if ('children' in child && Array.isArray(child.children)) {
      failOnInlinePragma(child as unknown as Parent, file);
    }
  }
}

export function remarkVersionSections() {
  return (root: Root, file: VFile) => {
    failOnInlinePragma(root as unknown as Parent, file);

    // Each rewrite splices `children`, so re-scan from the top rather than
    // holding indices across mutations. Sections per page are in the single
    // digits; the guard is only there to make a bug loud instead of infinite.
    //
    // `<=`, because N pragmas need N+1 scans: the last one is the scan that
    // finds nothing and returns. With `<` a file holding exactly MAX_PRAGMAS
    // rewrote them all and then fell through to the "this is a bug" failure.
    for (let scans = 0; scans <= MAX_PRAGMAS; scans++) {
      const found = findPragma(root as unknown as Parent);
      if (!found) return;

      const { parent, index, node } = found;
      const attrs = readAttrs(node, file);

      const heading = parent.children[index - 1];
      if (!heading || heading.type !== 'heading') {
        // Throws.
        file.fail(
          `<${PRAGMA}> must come directly after the heading of the section it gates. ` +
            `To gate a block that is not a whole section, use <${GATE}> around it instead.`,
          node,
        );
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
      `Gave up rewriting <${PRAGMA}> pragmas after ${MAX_PRAGMAS} rewrites — this is a bug in remark-version-sections.`,
    );
  };
}
