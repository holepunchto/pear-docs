/**
 * SEO output checker. Runs against the built `out/` directory after
 * `npm run build` (prebuild OG images + next build + postbuild).
 *
 * Default: invariants that hold for any content, safe to run in CI. For every
 * page in sitemap.xml it asserts a title, a description, a self-canonical,
 * index/follow robots, og:title/description/url/image (the image file must
 * exist), a twitter card, and parseable JSON-LD whose `url` is the page. It
 * also asserts robots.txt points at the sitemap and carries Content-Signal,
 * that the sitemap lists exactly the indexable pages under out/, and that
 * llms.txt links every page's built .md twin on the same origin.
 *
 *   --snapshot <file>  write every page's SEO head, JSON-LD, robots.txt,
 *                      sitemap.xml and OG image hashes to <file>
 *   --compare <file>   diff the current build against a snapshot; any
 *                      difference fails. Use it around refactors of SEO code.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pageMarkdownUrl } from '../src/lib/page-markdown-url';

const OUT_DIR = 'out';
const OG_DIR = join(OUT_DIR, 'og', 'docs');

interface PageSeo {
  title: string | null;
  meta: [string, string][];
  links: [string, string][];
  jsonLd: unknown[];
}

interface Snapshot {
  pages: Record<string, PageSeo>;
  robots: string;
  sitemap: string;
  ogImages: Record<string, string>;
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as object)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

function parsePage(html: string): PageSeo {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;
  const meta: [string, string][] = [];
  for (const m of html.matchAll(/<meta\s[^>]*>/g)) {
    const a = attrs(m[0]);
    const key = a.name ?? a.property;
    if (key && a.content !== undefined) meta.push([key, a.content]);
  }
  const links: [string, string][] = [];
  for (const m of html.matchAll(/<link\s[^>]*>/g)) {
    const a = attrs(m[0]);
    if (a.rel === 'canonical' || a.rel === 'alternate') {
      links.push([a.type ? `${a.rel} ${a.type}` : a.rel, a.href]);
    }
  }
  const jsonLd: unknown[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      jsonLd.push(sortKeys(JSON.parse(m[1])));
    } catch {
      jsonLd.push({ invalid: m[1].slice(0, 80) });
    }
  }
  meta.sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y));
  links.sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y));
  return { title, meta, links, jsonLd };
}

function htmlPathFor(url: URL): string {
  return join(OUT_DIR, decodeURIComponent(url.pathname), 'index.html');
}

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function collect(): { snapshot: Snapshot; urls: string[] } {
  const sitemap = readFileSync(join(OUT_DIR, 'sitemap.xml'), 'utf-8');
  const robots = readFileSync(join(OUT_DIR, 'robots.txt'), 'utf-8');
  const urls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const pages: Record<string, PageSeo> = {};
  for (const url of urls) {
    const file = htmlPathFor(new URL(url));
    if (existsSync(file)) pages[url] = parsePage(readFileSync(file, 'utf-8'));
  }
  const ogImages: Record<string, string> = {};
  for (const file of walk(OG_DIR).sort()) {
    ogImages[relative(OUT_DIR, file)] = createHash('sha256').update(readFileSync(file)).digest('hex');
  }
  return { snapshot: { pages, robots, sitemap, ogImages }, urls };
}

function checkInvariants(snapshot: Snapshot, urls: string[]): string[] {
  const failures: string[] = [];
  const origin = urls.length ? new URL(urls[0]).origin : '';

  for (const url of urls) {
    const page = snapshot.pages[url];
    if (!page) {
      failures.push(`${url}: in sitemap.xml but ${htmlPathFor(new URL(url))} is missing`);
      continue;
    }
    const meta = new Map(page.meta);
    const fail = (reason: string) => failures.push(`${url}: ${reason}`);
    if (!page.title?.trim()) fail('missing <title>');
    if (!meta.get('description')?.trim()) fail('missing meta description');
    const canonical = page.links.find(([rel]) => rel === 'canonical')?.[1];
    if (!canonical) fail('missing canonical');
    else if (decode(canonical) !== url) fail(`canonical is ${canonical}`);
    if (meta.get('robots')?.includes('noindex')) fail(`robots meta is "${meta.get('robots')}"`);
    for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
      if (!meta.get(key)?.trim()) fail(`missing ${key}`);
    }
    const ogImage = meta.get('og:image');
    if (ogImage) {
      const { pathname, origin: imageOrigin } = new URL(decode(ogImage), origin);
      if (imageOrigin === origin && !existsSync(join(OUT_DIR, decodeURIComponent(pathname)))) {
        fail(`og:image ${pathname} is not in out/`);
      }
    }
    if (page.jsonLd.length === 0) fail('no JSON-LD');
    for (const ld of page.jsonLd as Record<string, unknown>[]) {
      if ('invalid' in ld) fail('JSON-LD does not parse');
      else if (!ld['@type']) fail('JSON-LD has no @type');
      else if (ld.url !== url) fail(`JSON-LD url is ${String(ld.url)}`);
    }
  }

  if (!snapshot.robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
    failures.push('robots.txt: no Sitemap line for this origin');
  }
  if (!/^Content-Signal: /m.test(snapshot.robots)) failures.push('robots.txt: no Content-Signal line');

  // Every indexable built page must be in the sitemap.
  const listed = new Set(urls);
  for (const file of walk(OUT_DIR)) {
    if (!file.endsWith('index.html') || file.startsWith(join(OUT_DIR, '_next'))) continue;
    const html = readFileSync(file, 'utf-8');
    if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
    const path = '/' + relative(OUT_DIR, file).replace(/index\.html$/, '');
    if (!listed.has(origin + path)) failures.push(`${path}: indexable page missing from sitemap.xml`);
  }

  // llms.txt must link each page's .md twin, on this origin, and the file must exist.
  const llmsFile = join(OUT_DIR, 'llms.txt');
  if (!existsSync(llmsFile)) {
    failures.push('llms.txt is missing');
  } else {
    const linked = new Set<string>();
    for (const m of readFileSync(llmsFile, 'utf-8').matchAll(/^- \[.*?\]\((\S+?)\)/gm)) {
      const href = m[1];
      linked.add(href);
      if (!href.startsWith(`${origin}/`)) failures.push(`llms.txt: ${href} is not on ${origin}`);
      else if (!existsSync(join(OUT_DIR, decodeURIComponent(new URL(href).pathname)))) {
        failures.push(`llms.txt: ${href} is not in out/`);
      }
    }
    for (const url of urls) {
      const twin = origin + pageMarkdownUrl(new URL(url).pathname);
      if (!linked.has(twin)) failures.push(`llms.txt: no link to ${twin}`);
    }
  }
  return failures;
}

// source.getPages() order varies between builds, so compare entries as a set.
function normalizeSitemap(xml: string): string {
  const entries = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]).sort();
  return xml.replace(/<url>[\s\S]*<\/url>/, () => entries.join(''));
}

function diffSnapshots(before: Snapshot, after: Snapshot): string[] {
  const diffs: string[] = [];
  const keys = new Set([...Object.keys(before.pages), ...Object.keys(after.pages)]);
  for (const url of [...keys].sort()) {
    const a = JSON.stringify(before.pages[url] ?? null);
    const b = JSON.stringify(after.pages[url] ?? null);
    if (a === b) continue;
    const pa = before.pages[url];
    const pb = after.pages[url];
    if (!pa || !pb) {
      diffs.push(`${url}: ${pa ? 'removed' : 'added'}`);
      continue;
    }
    for (const field of ['title', 'meta', 'links', 'jsonLd'] as const) {
      const x = JSON.stringify(pa[field]);
      const y = JSON.stringify(pb[field]);
      if (x !== y) diffs.push(`${url}: ${field} differs\n    - ${x.slice(0, 300)}\n    + ${y.slice(0, 300)}`);
    }
  }
  if (before.robots !== after.robots) diffs.push('robots.txt differs');
  if (normalizeSitemap(before.sitemap) !== normalizeSitemap(after.sitemap)) {
    diffs.push('sitemap.xml differs');
  }
  const images = new Set([...Object.keys(before.ogImages), ...Object.keys(after.ogImages)]);
  for (const image of [...images].sort()) {
    if (before.ogImages[image] !== after.ogImages[image]) {
      diffs.push(`${image}: ${!before.ogImages[image] ? 'added' : !after.ogImages[image] ? 'removed' : 'bytes differ'}`);
    }
  }
  return diffs;
}

function main(): void {
  if (!existsSync(join(OUT_DIR, 'sitemap.xml'))) {
    console.error(`❌ ${OUT_DIR}/sitemap.xml is missing. Run \`npm run build\` first.`);
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const i = args.indexOf(name);
    if (i < 0) return undefined;
    const value = args[i + 1];
    if (!value || value.startsWith('--')) {
      console.error(`❌ ${name} needs a file path.`);
      process.exit(1);
    }
    return value;
  };
  const { snapshot, urls } = collect();

  const snapshotPath = flag('--snapshot');
  if (snapshotPath) {
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 1));
    console.log(
      `📸 Wrote ${snapshotPath}: ${Object.keys(snapshot.pages).length} pages, ` +
        `${Object.keys(snapshot.ogImages).length} OG images`,
    );
    return;
  }

  const comparePath = flag('--compare');
  if (comparePath) {
    const before = JSON.parse(readFileSync(comparePath, 'utf-8')) as Snapshot;
    const diffs = diffSnapshots(before, snapshot);
    if (diffs.length) {
      console.error(`❌ ${diffs.length} SEO difference(s) against ${comparePath}:\n`);
      for (const d of diffs.slice(0, 50)) console.error(`  ${d}`);
      if (diffs.length > 50) console.error(`  … and ${diffs.length - 50} more`);
      process.exit(1);
    }
    console.log(
      `✅ SEO output matches ${comparePath}: ${Object.keys(snapshot.pages).length} pages, ` +
        `robots.txt, sitemap.xml, ${Object.keys(snapshot.ogImages).length} OG images.`,
    );
    return;
  }

  const failures = checkInvariants(snapshot, urls);
  if (failures.length) {
    console.error(`❌ ${failures.length} SEO problem(s):\n`);
    for (const f of failures.slice(0, 100)) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`✅ SEO invariants hold for ${urls.length} pages.`);
}

main();
