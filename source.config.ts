import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // `remarkImage` rewrites `![alt](url)` to `mdxJsxFlowElement` inside paragraphs.
    // That breaks `remark-structure` → mdast-util-to-markdown when building processed
    // markdown (postprocess.includeProcessedMarkdown). Use plain markdown images, or
    // opt into `<Image />` / `<img />` as block-level JSX where you need Next-optimized images.
    remarkImageOptions: false,
  },
});
