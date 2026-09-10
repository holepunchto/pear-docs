// scripts/helpers.ts
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import GithubSlugger from 'github-slugger';

export const CONTENT_DIR = 'content';
export const PUBLIC_DIR = 'public';

/**
 * Recursively get all MDX and MD files from a directory.
 *
 * Underscore-prefixed files and directories are treated as Fumadocs partials
 * (inlined via `<include>./_partial.mdx</include>`) and skipped — they are not
 * standalone pages and shouldn't be checked for docType, slugs, OG metadata,
 * or redirects. This mirrors the `files: ['!**\/_*.{md,mdx}']` filter on the
 * Fumadocs `defineDocs` collection in `source.config.ts`.
 */
export async function getFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(path)));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(path);
    }
  }

  return files;
}

export interface InternalLink {
  /** Original href as written in the source, e.g. `/reference/api#foo` or `#foo`. */
  raw: string;
  /** Path portion: `/reference/api`, or `''` for in-page anchor links. */
  path: string;
  /** Fragment portion without the leading `#`. Empty when the link has no fragment. */
  fragment: string;
  /**
   * The `?v=` platform version the link asks for, or `''` for none.
   *
   * An unversioned link is checked against the current stable release — see
   * `STABLE_DOCS_VERSION`. A link that deliberately points at older content
   * carries `?v=`, and is checked against that release instead.
   */
  version: string;
}

/** Read `v` out of a `?a=b&v=3.0` style string. Returns `''` when absent. */
function readVersionParam(withQuery: string): string {
  const qIdx = withQuery.indexOf('?');
  if (qIdx === -1) return '';
  const match = /(?:^|&)v=([^&]*)/.exec(withQuery.slice(qIdx + 1));
  return match ? decodeURIComponent(match[1]) : '';
}

/** For in-page links, where any query trails the fragment (`#foo?v=3.0`). */
function splitFragmentAndQuery(rest: string): { fragment: string; version: string } {
  return { fragment: rest.split('?')[0], version: readVersionParam(`?${rest.split('?')[1] ?? ''}`) };
}

/**
 * Extract all links from MDX/MD content.
 *
 * Internal links are returned with their path, fragment and `?v=` version split
 * apart so callers can validate fragments against per-page anchor sets, and
 * against version gating. Anchor-only links (`#foo`) come back with empty `path`.
 */
export function extractLinks(content: string): {
  internal: InternalLink[];
  external: string[];
} {
  // Strip JSX comments ({/* ... */}) before scanning. JSX comments don't render,
  // so links commented out for "re-enable later" shouldn't fail the link check.
  // Multi-line; non-greedy.
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // Matches markdown links: [text](url)
  // Example: [Getting Started](/getting-started) → captures "/getting-started"
  // Note: captures everything up to the next ')' without attempting to fully balance nested parentheses
  const linkRegex = /\[.*?\]\(((?:[^)(]|\([^)]*\))*)\)/g;

  // Matches HTML href attributes: href="url" or href='url'
  // Example: <a href="/about"> → captures "/about"
  const hrefRegex = /href=["']([^"']+)["']/g;

  // Matches HTML/JSX src attributes: src="url" or src='url'
  // Example: <img src="/images/logo.png" /> → captures "/images/logo.png"
  const srcAttrRegex = /src=["']([^"']+)["']/g;

  // Matches markdown images: ![alt](url)
  // Example: ![Logo](/images/logo.png) → captures "/images/logo.png"
  const imgRegex = /!\[.*?\]\(([^)]+)\)/g;

  // Matches JSX object property: src: "/path" or src: '/path'
  // Example: { src: "/images/logo.png", alt: "Logo" } → captures "/images/logo.png"
  const jsxSrcRegex = /src:\s*["']([^"']+)["']/g;

  // Matches Image component src prop: <Image src="/path" />
  // Example: <Image src="/images/logo.png" size="mobile" /> → captures "/images/logo.png"
  const imageSrcRegex = /<Image[^>]*src=["']([^"']+)["']/g;

  const internal: InternalLink[] = [];
  const external: string[] = [];
  const allRegexes = [
    linkRegex,
    hrefRegex,
    srcAttrRegex,
    imgRegex,
    jsxSrcRegex,
    imageSrcRegex,
  ];

  for (const regex of allRegexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      // Strip optional markdown title: url "title" or url 'title'
      const rawLink = match[1].trim().replace(/\s+["'][^"']*["']\s*$/, '');

      if (!rawLink || rawLink.startsWith('mailto:')) continue;

      if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
        external.push(rawLink);
        continue;
      }

      // In-page anchor (`#foo`)
      if (rawLink.startsWith('#')) {
        const { fragment, version } = splitFragmentAndQuery(rawLink.slice(1));
        if (fragment) internal.push({ raw: rawLink, path: '', fragment, version });
        continue;
      }

      // Absolute internal link, possibly with query and/or fragment.
      if (rawLink.startsWith('/')) {
        // Hash FIRST, then query. Splitting on `?` first truncated the fragment
        // of every version-qualified link (`/x?v=3.0#anchor` lost `#anchor`
        // entirely), so those links silently skipped anchor validation.
        const hashIdx = rawLink.indexOf('#');
        const beforeHash = hashIdx === -1 ? rawLink : rawLink.slice(0, hashIdx);
        const afterHash = hashIdx === -1 ? '' : rawLink.slice(hashIdx + 1);

        const path = beforeHash.split('?')[0];
        // `?v=` may sit before the hash (the normal shape) or, in sloppy hrefs,
        // after it. Accept either.
        const version =
          readVersionParam(beforeHash) || readVersionParam(`?${afterHash.split('?')[1] ?? ''}`);
        const fragment = afterHash.split('?')[0];

        if (path) internal.push({ raw: rawLink, path, fragment, version });
      }
    }
  }

  // Dedupe internal links by their raw form so each unique link is reported once.
  const seenRaw = new Set<string>();
  const dedupedInternal = internal.filter((link) => {
    if (seenRaw.has(link.raw)) return false;
    seenRaw.add(link.raw);
    return true;
  });

  return {
    internal: dedupedInternal,
    external: [...new Set(external)],
  };
}

/**
 * Build a set of all valid page slugs from file paths
 * Example: content/docs/getting-started/index.mdx → /getting-started
 */
export function buildSlugSet(files: string[]): Set<string> {
  const slugs = new Set<string>();
  for (const file of files) slugs.add(fileToSlug(file));
  return slugs;
}

/**
 * Convert a content file path to its docs-site slug.
 *
 * Mirrors `buildSlugSet` exactly so every code path agrees on which slug a
 * file represents.
 */
export function fileToSlug(file: string): string {
  let slug = file
    .replace(CONTENT_DIR, '')        // Remove content dir prefix
    .replace(/\/index\.mdx$/, '')    // index.mdx → folder slug
    .replace(/\/index\.md$/, '')     // index.md → folder slug
    .replace(/\.mdx$/, '')           // page.mdx → /page
    .replace(/\.md$/, '');           // page.md → /page

  if (slug === '') slug = '/';
  return slug;
}

/**
 * Extract every fragment anchor a page exposes.
 *
 * Three sources are recognized — they cover everything Fumadocs / rehype-slug
 * surfaces in the rendered HTML:
 *   1. ATX headings (`## Title`) slugged via `github-slugger`, matching
 *      Fumadocs' default behaviour.
 *   2. Explicit `<a name="..."></a>` markers (used heavily in the legacy
 *      reference pages to override the auto-slug).
 *   3. Explicit `id="..."` attributes on JSX/HTML elements.
 *
 * Headings inside fenced code blocks are ignored so a `# comment` inside a
 * shell snippet doesn't pollute the anchor set.
 */
export function extractAnchors(content: string): Set<string> {
  const anchors = new Set<string>();

  // Drop YAML frontmatter so a `description: # foo` line can't masquerade as a heading.
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Drop fenced code blocks (``` and ~~~) before scanning for headings.
  const withoutFences = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '');

  const slugger = new GithubSlugger();

  // ATX headings: leading 1-6 hashes + space + text, optional trailing closing #s.
  const headingRegex = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(withoutFences)) !== null) {
    const text = stripInlineMarkdown(m[2]);
    if (!text) continue;
    anchors.add(slugger.slug(text));
  }

  // Scan the original content (not the fence-stripped version) for explicit
  // anchor markers — they're sometimes embedded inside larger blocks we'd
  // otherwise have stripped.
  const nameAnchorRegex = /<a\s+[^>]*\bname=["']([^"']+)["'][^>]*>/gi;
  while ((m = nameAnchorRegex.exec(withoutFrontmatter)) !== null) {
    anchors.add(m[1]);
  }

  const idAttrRegex = /\bid=["']([^"']+)["']/g;
  while ((m = idAttrRegex.exec(withoutFrontmatter)) !== null) {
    anchors.add(m[1]);
  }

  return anchors;
}

/** One `since`/`until` constraint an anchor sits under. */
export interface AnchorGate {
  since?: string;
  until?: string;
}

/**
 * Map every anchor to the version gates enclosing it.
 *
 * An anchor with an empty array is ungated and always resolves. An anchor with
 * gates only resolves for readers on a version all of those gates apply to —
 * which is what makes `?v=3.0#pear-cores` checkable, and what makes a BARE link
 * to 3.0-only content a real defect rather than an invisible one.
 *
 * Line-scanned rather than parsed, to match the rest of this checker (it
 * deliberately avoids booting the MDX pipeline). Two mechanisms to track:
 *
 *   <VersionGate since="…">…</VersionGate>   explicit, nestable
 *   <VersionSection since="…" />             the heading above it, until the
 *                                            next heading of the same or higher
 *                                            level
 */
export function extractAnchorGates(content: string): Map<string, AnchorGate[]> {
  // Strip JSX comments FIRST, exactly as extractLinks does. The cli.mdx
  // maintainer note documents this very syntax, so without this the note's
  // placeholder `<VersionSection since="x.y.z" />` is read as real markup — and
  // because its illustrative closing tag is `</…>` rather than `</VersionGate>`
  // the stack never popped, leaking a phantom gate onto every later anchor.
  const withoutFrontmatter = content
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^---\n[\s\S]*?\n---\n/, '');
  const gates = new Map<string, AnchorGate[]>();

  /** Explicit `<VersionGate>` nesting. */
  const stack: AnchorGate[] = [];
  /** Gate contributed by a `<VersionSection>` pragma, plus its heading depth. */
  let section: { depth: number; gate: AnchorGate } | null = null;
  /** Depth of the heading immediately preceding the current line. */
  let lastHeadingDepth = 0;

  const readGate = (tag: string): AnchorGate => ({
    since: /\bsince=["']([^"']+)["']/.exec(tag)?.[1],
    until: /\buntil=["']([^"']+)["']/.exec(tag)?.[1],
  });

  const record = (anchor: string) => {
    const active = [...stack, ...(section ? [section.gate] : [])];
    // Keep the WIDEST claim if an anchor somehow appears twice: an anchor that is
    // ungated anywhere is reachable, so do not let a gated duplicate mask that.
    const existing = gates.get(anchor);
    if (!existing || existing.length > active.length) gates.set(anchor, active);
  };

  const slugger = new GithubSlugger();
  /** Heading slug awaiting a possible `<VersionSection>` on a following line. */
  let pendingHeading: string | null = null;
  const flushHeading = () => {
    if (pendingHeading === null) return;
    record(pendingHeading);
    pendingHeading = null;
  };

  let inFence = false;
  for (const line of withoutFrontmatter.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    // Explicit anchors are scanned even inside fences elsewhere in this file, but
    // gating only makes sense for real markup, so fenced lines are skipped here.
    if (!inFence) {
      const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (heading) {
        // Flush any previous heading that turned out to carry no pragma.
        flushHeading();
        lastHeadingDepth = heading[1].length;
        // A section gate ends at the next heading of the same or higher level.
        if (section && lastHeadingDepth <= section.depth) section = null;
        const text = stripInlineMarkdown(heading[2]);
        // HELD, not recorded: the pragma that gates this section sits on the NEXT
        // line, so recording the heading here marked it ungated and — because
        // `record` keeps the widest claim — that stuck even once the pragma was
        // seen. Hold it until we know whether a pragma follows.
        if (text) pendingHeading = slugger.slug(text);
      }

      const pragma = /<VersionSection\b[^>]*\/?>/.exec(line);
      if (pragma) {
        section = { depth: lastHeadingDepth, gate: readGate(pragma[0]) };
        // Now the held heading can be recorded, under the gate it declares.
        flushHeading();
      }

      for (const open of line.matchAll(/<VersionGate\b[^>]*>/g)) {
        stack.push(readGate(open[0]));
      }
      for (const _ of line.matchAll(/<\/VersionGate>/g)) stack.pop();

      // Any other content line settles it: no pragma is coming.
      if (!heading && !pragma && line.trim() !== '') flushHeading();
    }

    for (const m of line.matchAll(/<a\s+[^>]*\bname=["']([^"']+)["'][^>]*>/gi)) record(m[1]);
    for (const m of line.matchAll(/\bid=["']([^"']+)["']/g)) record(m[1]);
  }

  // A heading on the very last line never meets a settling line.
  flushHeading();

  return gates;
}

/** Build a slug → (anchor → gates) map for every content file. */
export async function buildAnchorGateMap(
  files: string[],
): Promise<Map<string, Map<string, AnchorGate[]>>> {
  const map = new Map<string, Map<string, AnchorGate[]>>();
  for (const file of files) {
    map.set(fileToSlug(file), extractAnchorGates(await readFile(file, 'utf-8')));
  }
  return map;
}

/**
 * Build a slug → anchor-set map for every content file.
 */
export async function buildAnchorMap(
  files: string[]
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    map.set(fileToSlug(file), extractAnchors(content));
  }
  return map;
}

/**
 * Strip inline markdown that affects heading text but not the eventual slug.
 *
 * This mirrors what Fumadocs / rehype-slug produces after parsing MDX. We
 * can't fully parse MDX in a regex-only checker, but covering links and
 * emphasis is enough for the headings we author. Crucially we do *not* strip
 * `<…>` patterns: in our reference pages they're type-signature notation
 * (`<Object>`, `<link|dir>`) that github-slugger reduces to bare words.
 */
function stripInlineMarkdown(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url)
    .replace(/[*_`~]+/g, '')                  // emphasis / code spans
    .trim();
}

/**
 * Check if link points to an asset (image, video, etc.)
 */
export function isAssetLink(link: string): boolean {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|mp4|webm|avif|json)$/i.test(link);
}

/**
 * Check if a file exists in the public folder
 * Example: /images/logo.png → checks public/images/logo.png
 */
export async function assetExists(link: string): Promise<boolean> {
  try {
    // Remove leading slash and join with public dir
    const filePath = join(PUBLIC_DIR, link);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
