// scripts/check-external-links.ts
import { readFile } from 'fs/promises';
import { CONTENT_DIR, getFiles, extractLinks } from './helpers';

// Number of links to check simultaneously
const CONCURRENCY = 5;

// Request timeout in milliseconds (10 seconds)
const TIMEOUT = 10000;

interface LinkResult {
  link: string;
  files: string[];
  status: 'ok' | 'broken' | 'error';
  statusCode?: number;
  error?: string;
}

/**
 * Check if an external URL is accessible
 * Returns status 'ok' for valid links, 'broken' for 404s, 'error' for network issues
 */
async function checkLink(url: string): Promise<{
  status: 'ok' | 'broken' | 'error';
  statusCode?: number;
  error?: string;
}> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    // Use HEAD request first (faster, less bandwidth)
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        // Some servers block requests without a user agent
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
      },
    });

    clearTimeout(timeout);

    // Some servers don't support HEAD requests, fall back to GET
    // 405 = Method Not Allowed
    if (response.status === 405) {
      const getResponse = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
        },
      });

      return {
        status: getResponse.status === 404 ? 'broken' : 'ok',
        statusCode: getResponse.status,
      };
    }

    return {
      status: response.status === 404 ? 'broken' : 'ok',
      statusCode: response.status,
    };
  } catch (error) {
    // Network errors, timeouts, DNS failures, etc.
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process links in batches to avoid overwhelming servers
 * and hitting rate limits
 */
async function checkLinksInBatches(
  links: [string, string[]][],
  concurrency: number
): Promise<LinkResult[]> {
  const results: LinkResult[] = [];

  for (let i = 0; i < links.length; i += concurrency) {
    // Get next batch of links
    const batch = links.slice(i, i + concurrency);

    // Check all links in batch simultaneously
    const batchResults = await Promise.all(
      batch.map(async ([link, files]) => {
        const result = await checkLink(link);
        return { link, files, ...result };
      })
    );

    // Log progress and collect results
    for (const result of batchResults) {
      results.push(result);

      if (result.status === 'broken') {
        console.log(`❌ 404: ${result.link}`);
      } else if (result.status === 'error') {
        console.log(`⚠️  Error: ${result.link} - ${result.error}`);
      } else {
        console.log(`✅ ${result.statusCode}: ${result.link}`);
      }
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Checking external links...\n');

  const files = await getFiles(CONTENT_DIR);

  // Map of link → list of files containing that link
  // This helps us report which files have broken links
  const linkMap = new Map<string, string[]>();

  // Collect all external links from all files
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const { external } = extractLinks(content);

    for (const link of external) {
      if (!linkMap.has(link)) {
        linkMap.set(link, []);
      }
      linkMap.get(link)!.push(file);
    }
  }

  console.log(`Found ${linkMap.size} unique external links\n`);

  // Convert map to array for batch processing
  const links = Array.from(linkMap.entries());

  // Check all links with concurrency limit
  const results = await checkLinksInBatches(links, CONCURRENCY);

  // Filter to only broken links (404s)
  const brokenLinks = results.filter((r) => r.status === 'broken');

  console.log('\n' + '='.repeat(50) + '\n');

  if (brokenLinks.length > 0) {
    console.log('❌ Broken external links (404):\n');
    for (const { link, files, statusCode } of brokenLinks) {
      console.log(`   ${link} (${statusCode})`);
      console.log(`   Found in: ${files.join(', ')}\n`);
    }
    process.exit(1);
  }

  console.log('✅ All external links are valid!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});