import { source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

// Maps a page's top-level URL segment to its llms.txt section heading, in
// display order. A page whose first segment isn't one of these keys (just
// the root index today) falls into 'Overview'.
const SECTIONS: [key: string, title: string][] = [
  ['', 'Overview'],
  ['getting-started', 'Getting Started'],
  ['how-to', 'How-to Guides'],
  ['reference', 'Reference'],
  ['explanation', 'Explanation'],
  ['release-overview', 'Release Overview'],
];

export async function GET() {
  const bySection = new Map<string, string[]>();
  for (const page of source.getPages()) {
    const key = page.url.split('/')[1] ?? '';
    const line = `- [${page.data.title}](${page.url}): ${page.data.description}`;
    const entries = bySection.get(key);
    if (entries) entries.push(line);
    else bySection.set(key, [line]);
  }

  const lines: string[] = ['# Documentation', ''];
  for (const [key, title] of SECTIONS) {
    const entries = bySection.get(key);
    if (!entries?.length) continue;
    lines.push(`## ${title}`, '', ...entries, '');
  }
  return new Response(lines.join('\n'));
}
