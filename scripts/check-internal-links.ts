// scripts/check-internal-links.ts
import { readFile } from 'fs/promises';
import {
  CONTENT_DIR,
  getFiles,
  extractLinks,
  buildSlugSet,
  buildAnchorMap,
  fileToSlug,
  isAssetLink,
  assetExists,
} from './helpers';

interface BrokenLink {
  file: string;
  link: string;
  type: 'page' | 'asset' | 'fragment';
  detail?: string;
}

async function main() {
  console.log('🔍 Checking internal links...\n');

  const files = await getFiles(CONTENT_DIR);
  const allSlugs = buildSlugSet(files);
  const anchorMap = await buildAnchorMap(files);
  const brokenLinks: BrokenLink[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const { internal } = extractLinks(content);
    const currentSlug = fileToSlug(file);

    for (const link of internal) {
      // Asset links bypass slug + fragment validation; they live in /public.
      if (link.path && isAssetLink(link.path)) {
        const exists = await assetExists(link.path);
        if (!exists) {
          brokenLinks.push({ file, link: link.raw, type: 'asset' });
        }
        continue;
      }

      // Resolve the slug to look up in the anchor map.
      const targetSlug = link.path === '' ? currentSlug : link.path;

      // Validate the page itself exists (skip for in-page links since they
      // always target the current file, which exists by construction).
      if (link.path && !allSlugs.has(link.path)) {
        brokenLinks.push({ file, link: link.raw, type: 'page' });
        continue;
      }

      // Validate the fragment, if any, against the target file's anchor set.
      if (link.fragment) {
        const anchors = anchorMap.get(targetSlug);
        if (!anchors || !anchors.has(link.fragment)) {
          brokenLinks.push({
            file,
            link: link.raw,
            type: 'fragment',
            detail: `target page ${targetSlug} has no anchor "${link.fragment}"`,
          });
        }
      }
    }
  }

  console.log(`Checked ${files.length} files\n`);

  if (brokenLinks.length > 0) {
    const brokenPages = brokenLinks.filter((l) => l.type === 'page');
    const brokenAssets = brokenLinks.filter((l) => l.type === 'asset');
    const brokenFragments = brokenLinks.filter((l) => l.type === 'fragment');

    if (brokenPages.length > 0) {
      console.log('❌ Broken page links:\n');
      for (const { file, link } of brokenPages) {
        console.log(`   ${file}`);
        console.log(`   → ${link}\n`);
      }
    }

    if (brokenAssets.length > 0) {
      console.log('❌ Missing assets in /public:\n');
      for (const { file, link } of brokenAssets) {
        console.log(`   ${file}`);
        console.log(`   → ${link}\n`);
      }
    }

    if (brokenFragments.length > 0) {
      console.log('❌ Broken fragment links:\n');
      for (const { file, link, detail } of brokenFragments) {
        console.log(`   ${file}`);
        console.log(`   → ${link}`);
        if (detail) console.log(`     ${detail}`);
        console.log('');
      }
    }

    process.exit(1);
  }

  console.log('✅ All internal links and assets are valid!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
