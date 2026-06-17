// scripts/research-bare-modules.ts
//
// Research all Bare library + build-tool modules (every holepunch `bare-*`
// emit a documentation dossier. For each in-scope repo it pulls package.json
// and README via `gh api`, extracts the documentation-worthy fields, scores
// API richness and how foundational the module is, computes a doc disposition,
// and writes:
//   - docs/bare-modules-research.json  (structured dataset, one record/module)
//   - docs/bare-modules-research.md    (readable digest + catalog corrections)
//
// Run: npx tsx scripts/research-bare-modules.ts
// Requires `gh` authenticated on PATH (same dependency as source.config.ts).

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';

const execFile = promisify(execFileCb);

const ORG = 'holepunchto';
const OUT_JSON = 'docs/bare-modules-research.json';
const OUT_MD = 'docs/bare-modules-research.md';
const CATALOG = 'content/reference/modules/bare-modules.mdx';

// Scope: every holepunch repo whose name matches `bare-*` and is a library or
// build-tool module. EXCLUDE drops the native-integration kits and their
// platform example repos (documented under reference/bare/bare-kit) and
// example/meta repos. The runtime (`bare`) and false-positives like `bareclaw`
// don't match `bare-*`, so they're filtered out automatically.
const EXCLUDE = new Set([
  'bare-kit', 'bare-expo', 'bare-ios', 'bare-android', 'bare-snippets',
  'bare-native-awesome',
]);
const BUILD_TOOLS = ['bare-pack', 'bare-make', 'bare-build', 'bare-bundle', 'bare-runtime'];
const BUILD_SET = new Set(BUILD_TOOLS);

interface RepoMeta {
  name: string;
  stargazerCount: number;
  description: string | null;
  pushedAt: string;
  primaryLanguage: { name: string } | null;
}

interface Pkg {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string> | null;
  engines?: Record<string, string> | null;
  addon?: boolean | null;
  files?: string[] | null;
}

interface Record_ {
  name: string;
  repoUrl: string;
  stars: number;
  lastPush: string;
  language: string;
  category: 'stdlib' | 'build-tooling';
  hasPackageJson: boolean;
  version: string | null;
  description: string | null;
  native: boolean;
  minBare: string | null;
  bareDeps: string[];
  otherDeps: string[];
  hasTypes: boolean;
  hasPrebuilds: boolean;
  nodeCompat: boolean;
  hasApi: boolean;
  apiMethods: number;
  usage: string | null;
  api: string | null;
  inCatalog: boolean;
  catalogDescription: string | null;
  inboundDeps: number;
  disposition: 'full-page candidate' | 'catalog-row-only';
}

async function gh(args: string[]): Promise<string> {
  const { stdout } = await execFile('gh', args, { maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

async function ghContentText(repo: string, path: string): Promise<string | null> {
  try {
    const res = JSON.parse(await gh(['api', `repos/${ORG}/${repo}/contents/${path}`])) as { content: string };
    return Buffer.from(res.content, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

async function ghReadme(repo: string): Promise<string | null> {
  try {
    const res = JSON.parse(await gh(['api', `repos/${ORG}/${repo}/readme`])) as { content: string };
    return Buffer.from(res.content, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/** Body of a `## <headingRe>` section, up to the next `## ` heading. */
function sectionBody(md: string, headingRe: RegExp): string | null {
  const lines = md.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) && headingRe.test(lines[i].replace(/^#+\s*/, ''))) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim() || null;
}

/** Map module name -> catalog one-line description, parsed from the catalog tables. */
async function parseCatalog(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const text = await readFile(CATALOG, 'utf8');
  const rowRe = /\[(bare-[a-z0-9-]+)\]\([^)]*\)\s*\|\s*([^|]+?)\s*\|/g;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(text)) !== null) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim());
  }
  return map;
}

function esc(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

async function main(): Promise<void> {
  console.log('🔬 Researching all Bare modules...\n');

  const allRepos = JSON.parse(
    await gh(['repo', 'list', ORG, '--limit', '600', '--json', 'name,stargazerCount,description,pushedAt,primaryLanguage']),
  ) as RepoMeta[];
  const metaByName = new Map(allRepos.map((r) => [r.name, r]));
  const catalog = await parseCatalog();

  // Discover every bare-* module, most-starred first.
  const inScope = allRepos
    .map((r) => r.name)
    .filter((name) => /^bare-/.test(name) && !EXCLUDE.has(name))
    .sort((a, b) => metaByName.get(b)!.stargazerCount - metaByName.get(a)!.stargazerCount);
  console.log(`Found ${inScope.length} bare-* modules to research.\n`);

  const records: Record_[] = [];

  for (const name of inScope) {
    const meta = metaByName.get(name);
    if (!meta) {
      console.log(`  ⚠ ${name}: not found in org repo list (skipped)`);
      continue;
    }
    const pkgText = await ghContentText(name, 'package.json');
    const pkg: Pkg = pkgText ? JSON.parse(pkgText) : {};
    const readme = (await ghReadme(name)) ?? '';

    const deps = Object.keys(pkg.dependencies ?? {});
    const bareDeps = deps.filter((d) => /^bare-/.test(d)).sort();
    const otherDeps = deps.filter((d) => !/^bare-/.test(d)).sort();
    const files = pkg.files ?? [];
    const api = sectionBody(readme, /^API/i);
    const usage = sectionBody(readme, /^Usage/i);
    const apiMethods = api ? (api.match(/^####\s/gm) ?? []).length : 0;
    const descForCompat = `${pkg.description ?? ''} ${readme.slice(0, 500)}`;

    records.push({
      name,
      repoUrl: `https://github.com/${ORG}/${name}`,
      stars: meta.stargazerCount,
      lastPush: meta.pushedAt.slice(0, 10),
      language: meta.primaryLanguage?.name ?? '—',
      category: BUILD_SET.has(name) ? 'build-tooling' : 'stdlib',
      hasPackageJson: !!pkgText,
      version: pkg.version ?? null,
      description: pkg.description ?? meta.description ?? null,
      native: pkg.addon === true,
      minBare: pkg.engines?.bare ?? null,
      bareDeps,
      otherDeps,
      hasTypes: files.some((f) => f.endsWith('.d.ts')),
      hasPrebuilds: files.includes('prebuilds'),
      nodeCompat: /node\.js|node-compatible|node's\b/i.test(descForCompat),
      hasApi: !!api,
      apiMethods,
      usage,
      api,
      inCatalog: catalog.has(name),
      catalogDescription: catalog.get(name) ?? null,
      inboundDeps: 0, // filled below
      disposition: 'catalog-row-only',
    });
    process.stdout.write('.');
  }
  console.log('\n');

  // Foundational signal: how many in-scope modules depend on each one.
  const inboundCount = new Map<string, number>();
  for (const r of records) for (const d of r.bareDeps) inboundCount.set(d, (inboundCount.get(d) ?? 0) + 1);
  for (const r of records) {
    r.inboundDeps = inboundCount.get(r.name) ?? 0;
    // Full-page candidate: a real API surface (>=4 documented methods).
    r.disposition = r.hasApi && r.apiMethods >= 4 ? 'full-page candidate' : 'catalog-row-only';
  }

  records.sort((a, b) => b.stars - a.stars);

  await writeFile(OUT_JSON, JSON.stringify(records, null, 2) + '\n');
  await writeFile(OUT_MD, renderDigest(records));

  const candidates = records.filter((r) => r.disposition === 'full-page candidate');
  const missing = records.filter((r) => !r.inCatalog);
  console.log(`✅ ${records.length} modules researched`);
  console.log(`   ${candidates.length} full-page candidates · ${missing.length} missing from catalog`);
  console.log(`   wrote ${OUT_JSON} and ${OUT_MD}`);
}

function renderDigest(records: Record_[]): string {
  const candidates = records.filter((r) => r.disposition === 'full-page candidate');
  const missing = records.filter((r) => !r.inCatalog);
  const descDiffs = records.filter(
    (r) => r.inCatalog && r.catalogDescription && r.description && r.catalogDescription !== r.description,
  );
  const natives = records.filter((r) => r.native);
  const noPkg = records.filter((r) => !r.hasPackageJson).length;

  const lines: string[] = [];
  lines.push('# Bare modules research dossier');
  lines.push('');
  lines.push(
    `Generated by \`scripts/research-bare-modules.ts\` from each repo's \`package.json\` + README via the GitHub API. ` +
      `Scope: every holepunch repo matching bare-* that is a library or build-tool module (native-integration kits and example repos excluded). ` +
      `Do not hand-edit — re-run the script to refresh.`,
  );
  lines.push('');
  lines.push(`**${records.length}** modules · **${candidates.length}** full-page candidates · **${missing.length}** missing from catalog · **${natives.length}** native addons · **${noPkg}** without a published package.json.`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Module | Stars | Type | min Bare | Bare deps | Inbound | API methods | In catalog | Disposition |');
  lines.push('| --- | --: | --- | --- | --: | --: | --: | :-: | --- |');
  for (const r of records) {
    lines.push(
      `| [${r.name}](${r.repoUrl}) | ${r.stars} | ${r.native ? 'native' : 'pure-JS'}${r.category === 'build-tooling' ? ' · tool' : ''} | ${r.minBare ?? '—'} | ${r.bareDeps.length} | ${r.inboundDeps} | ${r.apiMethods} | ${r.inCatalog ? '✓' : '✗'} | ${r.disposition === 'full-page candidate' ? '**page**' : 'catalog row'} |`,
    );
  }
  lines.push('');

  lines.push('## Full-page candidates');
  lines.push('');
  lines.push('Modules with a substantive API surface (≥4 documented methods) that warrant a dedicated reference page:');
  lines.push('');
  for (const r of candidates) lines.push(`- **${r.name}** — ${r.apiMethods} methods · ${esc(r.description ?? '')}`);
  lines.push('');

  lines.push('## Catalog corrections (recommendations)');
  lines.push('');
  lines.push('### Missing from the catalog');
  lines.push('');
  for (const r of missing) lines.push(`- **${r.name}** (${r.stars}★) — ${esc(r.description ?? '')}`);
  lines.push('');
  lines.push('### Description differs from package.json');
  lines.push('');
  if (descDiffs.length === 0) lines.push('_None._');
  for (const r of descDiffs) {
    lines.push(`- **${r.name}**`);
    lines.push(`  - catalog: ${esc(r.catalogDescription ?? '')}`);
    lines.push(`  - package.json: ${esc(r.description ?? '')}`);
  }
  lines.push('');
  lines.push('### Native addons (verify platform support against prebuilds/CI)');
  lines.push('');
  lines.push(natives.map((r) => `\`${r.name}\``).join(', ') || '_None._');
  lines.push('');

  lines.push('## Per-module notes');
  lines.push('');
  for (const r of records) {
    lines.push(`### ${r.name}`);
    lines.push('');
    lines.push(`${esc(r.description ?? '(no description)')}`);
    lines.push('');
    lines.push(
      `- repo: ${r.repoUrl} · ${r.stars}★ · last push ${r.lastPush} · ${r.language}` +
        `\n- version: ${r.version ?? '—'} · ${r.native ? 'native addon' : 'pure-JS'} · min Bare: ${r.minBare ?? '—'} · types: ${r.hasTypes ? 'yes' : 'no'} · prebuilds: ${r.hasPrebuilds ? 'yes' : 'no'}` +
        `\n- node-compat: ${r.nodeCompat ? 'yes' : 'no'} · bare deps: ${r.bareDeps.join(', ') || 'none'} · inbound deps: ${r.inboundDeps}` +
        `\n- disposition: **${r.disposition}**${r.inCatalog ? '' : ' · ⚠ missing from catalog'}`,
    );
    lines.push('');
    if (r.api) {
      const trimmed = r.api.split('\n').slice(0, 50).join('\n');
      lines.push('<details><summary>API section (README)</summary>');
      lines.push('');
      lines.push(trimmed);
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }

  return lines.join('\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
