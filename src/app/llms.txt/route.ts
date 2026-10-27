import { source } from '@/lib/source';
import { pageMarkdownUrl } from '@/lib/page-markdown-url';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const dynamic = 'force-static';
export const revalidate = false;

// Sections follow the URL: product (first segment), then quadrant (second),
// in this order. Segments missing here still get a section, sorted last.
const PRODUCTS: [key: string, title: string][] = [
  ['pear', 'Pear'],
  ['p2p', 'P2P'],
  ['bare', 'Bare'],
];

const QUADRANTS: [key: string, title: string][] = [
  ['getting-started', 'Getting started'],
  ['how-to', 'How-to guides'],
  ['reference', 'Reference'],
  ['explanation', 'Explanation'],
  ['release-overview', 'Release overview'],
];

const SUMMARY =
  'Pear loads applications remotely from peers and lets anyone create and share them. ' +
  'P2P is the set of building blocks it is made from (Hypercore, Hyperswarm, Hyperbee, ' +
  'Hyperdrive, Autobase, HyperDHT, Corestore), usable with or without Pear. Bare is the ' +
  'small JavaScript runtime underneath, for desktop, mobile, and embedded use.';

type Entry = { url: string; line: string };

function rank(list: [string, string][], key: string): number {
  const i = list.findIndex(([k]) => k === key);
  return i < 0 ? list.length : i;
}

function label(list: [string, string][], key: string): string {
  const known = list.find(([k]) => k === key)?.[1];
  return known ?? key.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

const byUrl = (a: Entry, b: Entry) => a.url.localeCompare(b.url);

export async function GET() {
  const { metadataBase, siteName } = getDocsSeoConfig();

  // Root and product landing pages, root first.
  const overview: (Entry & { rank: number })[] = [];
  const sections = new Map<string, { rank: number; entries: Entry[] }>();
  for (const page of source.getPages()) {
    const [product = '', quadrant = ''] = page.url.split('/').filter(Boolean);
    const href = new URL(pageMarkdownUrl(page.url), metadataBase).toString();
    const description = page.data.description.replace(/\s+/g, ' ').trim();
    const entry = { url: page.url, line: `- [${page.data.title}](${href}): ${description}` };

    if (!quadrant) {
      overview.push({ ...entry, rank: product ? rank(PRODUCTS, product) + 1 : 0 });
      continue;
    }
    const title = `${label(PRODUCTS, product)}: ${label(QUADRANTS, quadrant)}`;
    const section = sections.get(title) ?? {
      rank: rank(PRODUCTS, product) * 100 + rank(QUADRANTS, quadrant),
      entries: [],
    };
    section.entries.push(entry);
    sections.set(title, section);
  }

  const lines = [`# ${siteName}`, '', `> ${SUMMARY}`, ''];
  lines.push('Every page link below points at its Markdown version.', '');
  const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL?.trim().replace(/\/+$/, '');
  if (mcpUrl) {
    const card = new URL('/.well-known/mcp/server-card.json', metadataBase);
    lines.push(
      `MCP server: ${mcpUrl} (streamable HTTP, no authentication). Tools: search_docs for semantic search, fetch_doc for a page as Markdown. Server card: ${card}`,
      '',
    );
  }
  overview.sort((a, b) => a.rank - b.rank);
  lines.push('## Overview', '', ...overview.map((e) => e.line), '');
  for (const [title, { entries }] of [...sections].sort(([, a], [, b]) => a.rank - b.rank)) {
    lines.push(`## ${title}`, '', ...entries.sort(byUrl).map((e) => e.line), '');
  }
  lines.push(
    '## Optional',
    '',
    `- [Full documentation](${new URL('/llms-full.txt', metadataBase)}): every page above in one file`,
    '',
  );
  return new Response(lines.join('\n'));
}
