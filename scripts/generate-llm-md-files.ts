/**
 * Post-build: reads `out/llm-md-manifest.json` and writes per-page `.md` files
 * so clients can fetch Markdown via `pageMarkdownUrl()` (e.g. `/ship.md`).
 *
 * The `Accept: text/markdown` content-negotiation flow is configured in
 * `public/_redirects` (same strategy as qvac docs).
 *
 * Run after `next build`: `tsx scripts/generate-llm-md-files.ts`
 */
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const MANIFEST_PATH = path.join(OUT_DIR, 'llm-md-manifest.json');

interface ManifestEntry {
  url: string;
  slugs: string[];
  content: string;
}

export function urlToMarkdownRelativePath(url: string): string {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(`Invalid manifest entry url: ${JSON.stringify(url)}`);
  }
  const trimmed = url.replace(/^\/+/, '').replace(/\/+$/, '');
  if (trimmed.length === 0) return 'index.md';
  return `${trimmed}.md`;
}

async function main(): Promise<void> {
  console.log(`Generating per-page .md files from ${MANIFEST_PATH}…`);

  let entries: ManifestEntry[];
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected manifest array, got ${typeof parsed}`);
    }
    entries = parsed as ManifestEntry[];
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not read ${MANIFEST_PATH}: ${msg}. Did \`next build\` run first?`,
    );
  }

  if (entries.length === 0) {
    console.warn('Manifest is empty — no .md files written.');
  }

  for (const entry of entries) {
    const rel = urlToMarkdownRelativePath(entry.url);
    const target = path.join(OUT_DIR, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, entry.content, 'utf-8');
    console.log(`  wrote out/${rel}`);
  }

  await unlink(MANIFEST_PATH);
  console.log(`Removed ${MANIFEST_PATH}`);
  console.log(`Wrote ${entries.length} .md file(s)`);
}

main().catch((error) => {
  console.error('Error generating .md files:', error);
  process.exit(1);
});
