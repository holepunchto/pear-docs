/**
 * Maps a docs page URL to the static `.md` file path emitted by
 * `scripts/generate-llm-md-files.ts` after `next build`.
 */
export function pageMarkdownUrl(pageUrl: string): string {
  if (pageUrl === '/' || pageUrl === '') return '/index.md';
  const trimmed = pageUrl.replace(/\/+$/, '');
  return `${trimmed}.md`;
}
