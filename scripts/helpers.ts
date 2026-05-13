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
}

/**
 * Extract all links from MDX/MD content.
 *
 * Internal links are returned with their path and fragment split apart so
 * callers can validate fragments against per-page anchor sets. Anchor-only
 * links (`#foo`) come back with an empty `path`.
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
        const fragment = rawLink.slice(1).split('?')[0];
        if (fragment) internal.push({ raw: rawLink, path: '', fragment });
        continue;
      }

      // Absolute internal link, possibly with fragment
      if (rawLink.startsWith('/')) {
        const noQuery = rawLink.split('?')[0];
        const hashIdx = noQuery.indexOf('#');
        const path = hashIdx === -1 ? noQuery : noQuery.slice(0, hashIdx);
        const fragment = hashIdx === -1 ? '' : noQuery.slice(hashIdx + 1);
        if (path) internal.push({ raw: rawLink, path, fragment });
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
