/**
 * Detect new upstream module releases and insert draft changelog entries.
 *
 * Reads the watch list from scripts/upstream-releases.json and the last-seen
 * release tag per repo from scripts/upstream-releases-state.json. For every
 * release published since the recorded tag, a draft entry block is inserted
 * under the `{/* changelog:insert *\/}` marker in content/release-overview/index.mdx
 * and the state file is advanced.
 *
 * The generated blocks are DRAFTS: upstream release notes are terse and not
 * migration-oriented, so a human curates the wording, flags Breaking items,
 * and adds migration links before merge. The upstream-releases workflow
 * (.github/workflows/upstream-releases.yml) runs this on a schedule and opens
 * a review PR when anything changed.
 *
 * First run for a newly watched repo baselines its latest release without
 * generating an entry (otherwise adding a repo would dump its entire history).
 *
 * Stdlib-only on purpose: CI cannot `npm install` this repo's token-gated
 * dependencies (see docs-lint.yml), so the workflow installs just `tsx`.
 *
 * Usage: npx tsx scripts/check-upstream-releases.ts
 * Auth:  set GITHUB_TOKEN to lift the anonymous API rate limit (required in CI).
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CONFIG_PATH = path.join(root, 'scripts/upstream-releases.json');
const STATE_PATH = path.join(root, 'scripts/upstream-releases-state.json');
const CHANGELOG_PATH = path.join(root, 'content/release-overview/index.mdx');
const MARKER = '{/* changelog:insert';
const MAX_RELEASES_PER_REPO = 10;
const MAX_BODY_LINES = 12;

interface Watched {
  repo: string;
  name: string;
}

interface Release {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pear-docs-changelog-watcher',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function api<T>(pathname: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${pathname}`, { headers: apiHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${pathname}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/**
 * Prefer GitHub releases (they carry notes). Several holepunchto repos
 * (pear, pear-electron, pear-build) publish version tags without creating
 * releases, so fall back to the tags list — synthesised into note-less
 * Release records whose drafts link to the compare view instead.
 */
async function fetchReleases(repo: string): Promise<Release[]> {
  const releases =
    (await api<Release[]>(`/repos/${repo}/releases?per_page=${MAX_RELEASES_PER_REPO}`)) ?? [];
  const published = releases.filter((r) => !r.draft);
  if (published.length > 0) return published;

  const tags =
    (await api<{ name: string }[]>(`/repos/${repo}/tags?per_page=${MAX_RELEASES_PER_REPO}`)) ?? [];
  return tags
    .filter((t) => /^v?\d/.test(t.name)) // version tags only
    .map((t) => ({
      tag_name: t.name,
      name: t.name,
      body: null,
      html_url: `https://github.com/${repo}/releases/tag/${t.name}`,
      published_at: '',
      draft: false,
      prerelease: false,
    }));
}

/**
 * Make upstream release-note lines safe to embed in MDX. Braces and angle
 * brackets would otherwise be parsed as JSX expressions/elements. These are
 * drafts—reviewers restore any formatting that matters during curation.
 */
function sanitizeMdx(line: string): string {
  return line
    .replace(/\{/g, '(')
    .replace(/\}/g, ')')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Pull the bullet lines out of a release body, falling back to plain lines. */
function bodyBullets(body: string | null): string[] {
  if (!body) return [];
  const lines = body.split(/\r?\n/).map((l) => l.trim());
  let bullets = lines.filter((l) => /^[-*]\s+/.test(l)).map((l) => l.replace(/^[-*]\s+/, ''));
  if (bullets.length === 0) {
    bullets = lines.filter((l) => l.length > 0 && !l.startsWith('#'));
  }
  return bullets.slice(0, MAX_BODY_LINES).map(sanitizeMdx);
}

function renderDraftBlock(module: Watched, releases: Release[]): string {
  const chunks: string[] = [];
  for (const release of releases) {
    const date = release.published_at ? release.published_at.slice(0, 10) : 'undated tag';
    const bullets = bodyBullets(release.body);
    chunks.push(
      [
        `### ${module.name} — ${release.tag_name}`,
        '',
        `{/* TODO(curate): draft from the ${date} upstream release — reword for readers, flag Breaking items, add migration links. Source: ${release.html_url} */}`,
        '',
        ...(bullets.length > 0
          ? bullets.map((b) => `- ${b}`)
          : [`- See the [upstream release notes](${release.html_url}).`]),
      ].join('\n'),
    );
  }
  return chunks.join('\n\n');
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as { watched: Watched[] };
  const state: Record<string, string> = fs.existsSync(STATE_PATH)
    ? JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    : {};

  const drafts: string[] = [];
  const detected: string[] = [];

  for (const module of config.watched) {
    const releases = await fetchReleases(module.repo);
    if (releases.length === 0) {
      console.log(`· ${module.repo}: no releases`);
      continue;
    }

    const lastSeen = state[module.repo];
    if (!lastSeen) {
      // First run for this repo: baseline without generating history entries.
      state[module.repo] = releases[0].tag_name;
      console.log(`· ${module.repo}: baselined at ${releases[0].tag_name}`);
      continue;
    }

    const seenIx = releases.findIndex((r) => r.tag_name === lastSeen);
    const fresh = seenIx === -1 ? releases : releases.slice(0, seenIx);
    if (fresh.length === 0) {
      console.log(`· ${module.repo}: up to date (${lastSeen})`);
      continue;
    }

    drafts.push(renderDraftBlock(module, fresh));
    detected.push(...fresh.map((r) => `${module.repo}@${r.tag_name}`));
    state[module.repo] = releases[0].tag_name;
    console.log(`✚ ${module.repo}: ${fresh.map((r) => r.tag_name).join(', ')}`);
  }

  if (drafts.length > 0) {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const markerIx = changelog.indexOf(MARKER);
    if (markerIx === -1) {
      console.error(`✖ insertion marker "${MARKER}" not found in ${CHANGELOG_PATH}`);
      process.exit(1);
    }
    const markerEnd = changelog.indexOf('\n', markerIx) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const block = `\n## ${today} — Upstream releases (draft)\n\n${drafts.join('\n\n')}\n`;
    fs.writeFileSync(
      CHANGELOG_PATH,
      changelog.slice(0, markerEnd) + block + changelog.slice(markerEnd),
    );
  }

  // Persist baselines even when no drafts were generated.
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');

  if (detected.length > 0) {
    console.log(`\nInserted ${detected.length} draft release entr${detected.length === 1 ? 'y' : 'ies'}:`);
    for (const d of detected) console.log(`  - ${d}`);
  } else {
    console.log('\nNo new releases.');
  }
}

main().catch((err) => {
  console.error('✖', err.message ?? err);
  process.exit(1);
});
