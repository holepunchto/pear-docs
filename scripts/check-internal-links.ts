// scripts/check-internal-links.ts
import { readFile } from 'fs/promises';
import {
  CONTENT_DIR,
  getFiles,
  extractLinks,
  buildSlugSet,
  isAssetLink,
  assetExists,
} from './helpers';

interface BrokenLink {
  file: string;
  link: string;
  type: 'page' | 'asset';
}

async function main() {
  console.log('🔍 Checking internal links...\n');

  const files = await getFiles(CONTENT_DIR);
  const allSlugs = buildSlugSet(files);
  const brokenLinks: BrokenLink[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const { internal } = extractLinks(content);

    for (const link of internal) {
      if (isAssetLink(link)) {
        // Check if asset exists in /public folder
        const exists = await assetExists(link);
        if (!exists) {
          brokenLinks.push({ file, link, type: 'asset' });
        }
      } else {
        // Check if page exists in slug set
        if (!allSlugs.has(link)) {
          brokenLinks.push({ file, link, type: 'page' });
        }
      }
    }
  }

  console.log(`Checked ${files.length} files\n`);

  if (brokenLinks.length > 0) {
    const brokenPages = brokenLinks.filter((l) => l.type === 'page');
    const brokenAssets = brokenLinks.filter((l) => l.type === 'asset');

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

    process.exit(1);
  }

  console.log('✅ All internal links and assets are valid!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});