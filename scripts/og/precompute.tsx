// Vendored from @tetherto/docs-seo-og@1.1.1 (src/build/precompute.tsx).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import matter from 'gray-matter';
import { getSlugs } from 'fumadocs-core/source';
import { ImageResponse } from '@takumi-rs/image-response';
import type { ImageResponseOptions } from '@takumi-rs/image-response';
import { generate as OgTemplate } from 'fumadocs-ui/og';

/**
 * Context provided to a custom {@link PrecomputeTakumiOgImagesOptions.renderTemplate}.
 */
export type RenderTemplateContext = {
  /** Frontmatter `title` (empty string if missing). */
  title: string;
  /** Frontmatter `description` (empty string if missing). */
  description: string;
  /** Slug segments for the page (e.g. `['building-blocks', 'hyperbee']`). */
  slugs: string[];
  /** Same `site` value passed to {@link precomputeTakumiOgImages}. */
  site: string;
  /** Raw frontmatter object for advanced templates. */
  frontmatter: Record<string, unknown>;
};

export type PrecomputeTakumiOgImagesOptions = {
  /** Absolute or cwd-relative path to `content/docs` */
  contentDocsDir: string;
  /** Absolute or cwd-relative path to Next `public` */
  publicDir: string;
  /** Takumi `site` prop (e.g. `Tether`) */
  site: string;
  /** Must match `getPageImage` / metadata (default `/og/docs`) */
  ogRouteBase?: string;
  /** Parallel renders; Takumi uses WASM so keep modest (default 3) */
  concurrency?: number;
  /**
   * Custom JSX template. Defaults to `fumadocs-ui/og`'s `generate()`.
   * Use this to brand OG images per site (logo, fonts, colors).
   */
  renderTemplate?: (ctx: RenderTemplateContext) => React.ReactElement;
  /**
   * Forwarded to `ImageResponse` (e.g. `fonts`, `format`, `emoji`).
   * `width`, `height`, and `format: 'webp'` are set by default and may be
   * overridden here.
   */
  imageResponseOptions?: Partial<ImageResponseOptions>;
};

function posixRelative(from: string, to: string): string {
  return path.relative(from, to).split(path.sep).join('/');
}

function outputFilePath(
  publicDir: string,
  ogRouteBase: string,
  segments: string[],
): string {
  const base = ogRouteBase.replace(/^\//, '').replace(/\/$/, '');
  return path.join(publicDir, ...base.split('/'), ...segments);
}

async function renderOne(
  absFile: string,
  contentDocsDir: string,
  publicDir: string,
  ogRouteBase: string,
  site: string,
  renderTemplate: (ctx: RenderTemplateContext) => React.ReactElement,
  imageResponseOptions: Partial<ImageResponseOptions>,
): Promise<void> {
  const rel = posixRelative(contentDocsDir, absFile);
  const slugs = getSlugs(rel);
  const raw = await readFile(absFile, 'utf8');
  const { data } = matter(raw);
  const title = typeof data.title === 'string' ? data.title : '';
  const description =
    typeof data.description === 'string' ? data.description : '';

  const segments = [...slugs, 'image.webp'];
  const outPath = outputFilePath(publicDir, ogRouteBase, segments);
  await mkdir(path.dirname(outPath), { recursive: true });

  const element = renderTemplate({
    title,
    description,
    slugs,
    site,
    frontmatter: data,
  });

  const response = new ImageResponse(element, {
    width: 1200,
    height: 630,
    format: 'webp',
    ...imageResponseOptions,
  });

  await response.ready;
  const buf = await response.arrayBuffer();
  await writeFile(outPath, Buffer.from(buf));
}

/**
 * Generate static WebP OG images under `public/og/docs/.../image.webp` for static export.
 * Uses the same slug rules as Fumadocs (`getSlugs`) and the same path layout as `getPageImage`.
 */
export async function precomputeTakumiOgImages(
  options: PrecomputeTakumiOgImagesOptions,
): Promise<void> {
  const {
    contentDocsDir,
    publicDir,
    site,
    ogRouteBase = '/og/docs',
    concurrency = 3,
    renderTemplate = ({ title, description, site: ogSite }) => (
      <OgTemplate title={title} description={description} site={ogSite} />
    ),
    imageResponseOptions = {},
  } = options;

  const docsRoot = path.resolve(contentDocsDir);
  const pubRoot = path.resolve(publicDir);

  const { glob } = await import('glob');
  // `_`-prefixed files are snippets, not pages (see `files` in source.config.ts).
  const absFiles = await glob('**/*.{md,mdx}', {
    cwd: docsRoot,
    ignore: '**/_*.{md,mdx}',
    nodir: true,
    absolute: true,
  });

  for (let i = 0; i < absFiles.length; i += concurrency) {
    const batch = absFiles.slice(i, i + concurrency);
    await Promise.all(
      batch.map((absFile) =>
        renderOne(
          absFile,
          docsRoot,
          pubRoot,
          ogRouteBase,
          site,
          renderTemplate,
          imageResponseOptions,
        ),
      ),
    );
  }
}
