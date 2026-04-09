// scripts/helpers.ts
import { readdir, access } from 'fs/promises';
import { join } from 'path';

export const CONTENT_DIR = 'content';
export const PUBLIC_DIR = 'public';

/**
 * Recursively get all MDX and MD files from a directory
 */
export async function getFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(path)));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(path);
    }
  }

  return files;
}

/**
 * Extract all links from MDX/MD content
 * Returns both internal and external links separately
 */
export function extractLinks(content: string): {
  internal: string[];
  external: string[];
} {
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

  const internal: string[] = [];
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

      // Skip empty, anchor-only, or mailto links
      if (!rawLink || rawLink.startsWith('#') || rawLink.startsWith('mailto:')) continue;

      // External links - keep full URL including query params
      if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
        external.push(rawLink);
      }
      // Internal links - strip hash and query params for slug matching
      else if (rawLink.startsWith('/')) {
        const cleanedLink = rawLink.split('#')[0].split('?')[0];
        if (cleanedLink) internal.push(cleanedLink);
      }
    }
  }

  return {
    internal: [...new Set(internal)],
    external: [...new Set(external)],
  };
}

/**
 * Build a set of all valid page slugs from file paths
 * Example: content/docs/getting-started/index.mdx → /getting-started
 */
export function buildSlugSet(files: string[]): Set<string> {
  const slugs = new Set<string>();

  for (const file of files) {
    let slug = file
      .replace(CONTENT_DIR, '')        // Remove content dir prefix
      .replace(/\/index\.mdx$/, '')    // index.mdx → folder slug
      .replace(/\/index\.md$/, '')     // index.md → folder slug
      .replace(/\.mdx$/, '')           // page.mdx → /page
      .replace(/\.md$/, '');           // page.md → /page

    // Root index becomes /
    if (slug === '') slug = '/';
    slugs.add(slug);
  }

  return slugs;
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