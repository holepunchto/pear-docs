import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config';
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import { metaSchema } from 'fumadocs-core/source/schema';
import { tetherSeoFrontmatterSchema } from '@tetherto/docs-seo-schema';

const execFile = promisify(execFileCb);

/**
 * Resolve the last commit date for an MDX page, with three fallbacks the
 * default `git`-mode of `fumadocs-mdx/plugins/last-modified` doesn't handle:
 *
 *  1. `--follow` so renames (e.g. `.md` → `.mdx`) walk through history.
 *  2. If the `.mdx` rename isn't committed yet (or git only kept the `.md`
 *     blob due to a shallow clone), query the matching `.md` path.
 *  3. If neither resolves (e.g. Sevalla / managed CI doing a shallow clone
 *     where per-file history is truncated), fall back to the HEAD commit's
 *     timestamp. That's still a meaningful "last deploy" date for the
 *     sitemap and avoids dropping `<lastmod>` entirely.
 */
async function gitLastModified(filePath: string): Promise<Date | null> {
  const tryGit = async (args: string[]): Promise<Date | null> => {
    try {
      const { stdout } = await execFile('git', args, { cwd: process.cwd() });
      const trimmed = stdout.trim();
      if (!trimmed) return null;
      const d = new Date(trimmed);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const fileLog = (target: string) => [
    'log',
    '-1',
    '--follow',
    '--format=%cI',
    '--',
    target,
  ];

  const direct = await tryGit(fileLog(filePath));
  if (direct) return direct;
  if (filePath.endsWith('.mdx')) {
    const md = await tryGit(fileLog(filePath.slice(0, -1)));
    if (md) return md;
  }
  return tryGit(['log', '-1', '--format=%cI', 'HEAD']);
}

// SEO frontmatter is layered on top of Fumadocs' base schema:
// `description` becomes required, plus optional `noIndex`, `ogImage`,
// `schemaType`, `docType`, `lastModified`. Drives metadata, sitemap, robots,
// JSON-LD, and Takumi OG via @tetherto/docs-seo-*.
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content',
  docs: {
    schema: frontmatterSchema
      .extend(tetherSeoFrontmatterSchema.shape)
      .passthrough(),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  // `lastModified` injects `page.data.lastModified` from the latest `git log`
  // commit time of each MDX file, which @tetherto/docs-seo-* feeds into the
  // sitemap (`<lastmod>`) and JSON-LD (`dateModified` / `datePublished`).
  // No per-page frontmatter required.
  // On Vercel, set `VERCEL_DEEP_CLONE=true` so git history is available.
  plugins: [lastModified({ versionControl: gitLastModified })],
  mdxOptions: {
    // `remarkImage` rewrites `![alt](url)` to `mdxJsxFlowElement` inside paragraphs.
    // That breaks `remark-structure` → mdast-util-to-markdown when building processed
    // markdown (postprocess.includeProcessedMarkdown). Use plain markdown images, or
    // opt into `<Image />` / `<img />` as block-level JSX where you need Next-optimized images.
    remarkImageOptions: false,
  },
});
