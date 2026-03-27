// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
var docs = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true
    }
  },
  meta: {
    schema: metaSchema
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    // `remarkImage` rewrites `![alt](url)` to `mdxJsxFlowElement` inside paragraphs.
    // That breaks `remark-structure` → mdast-util-to-markdown when building processed
    // markdown (postprocess.includeProcessedMarkdown). Use plain markdown images, or
    // opt into `<Image />` / `<img />` as block-level JSX where you need Next-optimized images.
    remarkImageOptions: false
  }
});
export {
  source_config_default as default,
  docs
};
