import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config';
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import { metaSchema } from 'fumadocs-core/source/schema';
import {
  remarkMdxMermaid,
  rehypeCodeDefaultOptions,
} from 'fumadocs-core/mdx-plugins';
import { transformerMetaHighlight } from '@shikijs/transformers';
import codeImport from 'remark-code-import';
import { z } from 'zod';
import { remarkVersionSections } from './src/lib/remark-version-sections';
import { transformerVersionLines } from './src/lib/shiki-version-lines';

const execFile = promisify(execFileCb);

// Inlined from `@tetherto/docs-seo-schema`. The package is published with raw
// TypeScript as its entry (`main: ./src/index.ts`), and Node ≥24 refuses to
// strip types from anything inside `node_modules` — so importing it from this
// file (which fumadocs-mdx loads via raw Node, before Next's webpack /
// `transpilePackages` get a chance) crashes the build with
// `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Inlining keeps source.config.ts
// pure-zod and decouples this file from the package's distribution shape.
// Keep in sync with the upstream definition.
const jsonLdSchemaTypeSchema = z.enum([
  'TechArticle',
  'APIReference',
  'WebPage',
]);

const docTypeSchema = z.enum([
  'tutorial',
  'how-to',
  'reference',
  'explanation',
  'page',
  'faq',
  'getting-started',
]);

const tetherSeoFrontmatterSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'description is required for SEO (meta, Open Graph, JSON-LD)'),
  // Optional SEO override for the <title> only (not the on-page <h1>, which
  // stays `title`). Descriptive part WITHOUT the brand suffix — the root
  // layout's title template appends " | Pear Docs". Use it to lengthen short,
  // single-word titles that Semrush flags as too short.
  seoTitle: z.string().trim().min(1).optional(),
  noIndex: z.boolean().optional(),
  ogImage: z.string().optional(),
  schemaType: jsonLdSchemaTypeSchema.optional(),
  docType: docTypeSchema.optional(),
  lastModified: z.union([z.string(), z.coerce.date()]).optional(),
  // The upstream release this reference page was written and verified against.
  // Bare SemVer, no leading `v` (e.g. "11.34.0"); prereleases allowed.
  //
  // Reference pages track their own upstream module's version, NOT the Pear
  // platform version — hypercore's API doesn't change when Pear does. See
  // docs/plans/DOCS-VERSIONING-DESIGN.md §1.
  //
  // Two consumers:
  //   1. `npm run check:upstream-pins` grades drift against npm latest
  //      (patch = info, minor = warn, major = needs a new versioned page).
  //   2. The page template renders a "documented against" marker from it, so
  //      readers can tell whether the page matches their installed version.
  upstreamVersion: z
    .string()
    .trim()
    .regex(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/,
      'upstreamVersion must be a bare SemVer without a leading "v" (e.g. "11.34.0")',
    )
    .optional(),
});

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
    // Underscore-prefixed `.mdx` files are partials — meant to be inlined via
    // <include>./_partial.mdx</include> (see https://fumadocs.dev/docs/markdown#include)
    // rather than rendered as their own page, so we skip them from the collection.
    files: ['**/*.{md,mdx}', '!**/_*.{md,mdx}'],
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
    // Extend Fumadocs' default Shiki transformers (notation highlight/diff/focus/word)
    // with meta-range highlighting, so ` ```js {16,22-23} ` highlights those lines.
    // This is the only way to highlight `file=`-imported snippets without polluting the
    // runnable example source with `// [!code highlight]` comments.
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerMetaHighlight(),
        // Strips `[!version since=3.1.0]` from a fence row and stamps the
        // version onto that line, so the client filter can hide single flags.
        transformerVersionLines(),
      ],
    },
    // `remarkImage` rewrites `![alt](url)` to `mdxJsxFlowElement` inside paragraphs.
    // That breaks `remark-structure` → mdast-util-to-markdown when building processed
    // markdown (postprocess.includeProcessedMarkdown). Use plain markdown images, or
    // opt into `<Image />` / `<img />` as block-level JSX where you need Next-optimized images.
    remarkImageOptions: false,
    // Convert ` ```mermaid ` fenced code blocks into `<Mermaid chart="…" />`
    // JSX so they render via the client component in `src/components/mermaid.tsx`.
    // `remark-code-import` lets fences pull their body from a file via
    // ` ```js file=<rootDir>/examples/... ` so doc code stays in sync with the
    // runnable apps under `examples/`. `<rootDir>` resolves to the project root.
    // `remarkVersionSections` expands the `<VersionSection since="…" />` pragma
    // into a `<VersionGate>` around the whole section. It runs before Fumadocs'
    // defaults, which is fine for the TOC: `remarkHeading` uses `visit`, so it
    // still finds headings nested inside the gate — the TOC is filtered on the
    // client instead (see src/components/version/filter.tsx).
    remarkPlugins: (v) => [
      remarkMdxMermaid,
      [codeImport, { rootDir: process.cwd() }],
      remarkVersionSections,
      ...v,
    ],
  },
});
