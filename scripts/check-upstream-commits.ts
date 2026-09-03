// scripts/check-upstream-commits.ts
//
// Daily heads-up: has the latest commit touching each watched repo's
// SOURCE-OF-TRUTH FILE changed since we last looked? This is deliberately
// COMMIT-level, not release-level — every other check in this repo
// (check-upstream-releases.ts, check-upstream-pins.ts, gen-bare-docs-states.ts)
// only notices a TAGGED release. That means real API changes sit invisible
// on a default branch for however long it takes upstream to cut a release —
// this check exists to surface them earlier, before there's even a tag to
// react to.
//
// "Source-of-truth file" is scripts/upstream-commits.json's `file` per entry
// — a .d.ts when the repo ships one (scripts/resolve-upstream-commits-config.ts
// resolves and VERIFIES this, mirroring bare-refgen/fetch.ts's own resolution
// order), falling back to the real entry source file for repos with none
// (bare-cli's bin/bare.js, Pear's cmd/index.js, the 12 pure-JS
// building-blocks/helpers repos). Scoping to ONE file's commit history (via
// GitHub's `?path=` filter) rather than the whole repo's HEAD is what keeps
// this from being noise on a 70-repo watch list — unrelated commits
// (tests, CI, docs) never trigger it.
//
// Advisory only, matches this repo's established rule: a commit moving is
// not itself something to act on, let alone auto-fix — it is a prompt for a
// human to go read the diff and decide whether content needs updating. See
// docs/plans/DOCS-VERSIONING-DESIGN.md and the "Report Bare doc-state drift"
// step next to this one in upstream-releases.yml.
//
// Usage:
//   npx tsx scripts/check-upstream-commits.ts            # check + write new state
//   npx tsx scripts/check-upstream-commits.ts --check    # report only, write NOTHING
//
// Re-run scripts/resolve-upstream-commits-config.ts (separately, not part of
// the daily job) whenever the watched module list itself changes — a new
// bare-* module added to bare-refgen, a new building-blocks repo, etc.
//
// Auth: set GITHUB_TOKEN to lift the anonymous rate limit (required in CI —
// this makes ~86 requests per run).

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CONFIG_PATH = path.join(root, 'scripts/upstream-commits.json');
const STATE_PATH = path.join(root, 'scripts/upstream-commits-state.json');

interface WatchEntry {
  key: string;
  name: string;
  repo: string;
  branch: string;
  file: string;
  dts: boolean;
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pear-docs-upstream-commits-checker',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

/** Latest commit touching `file` on `branch`, or null if the path/branch has no history (moved/renamed). */
async function latestCommitForPath(repo: string, branch: string, file: string): Promise<{ sha: string; date: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(file)}&sha=${encodeURIComponent(branch)}&per_page=1`,
    { headers: apiHeaders() },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo} commits?path=${file}: ${await res.text()}`);
  const commits = (await res.json()) as Array<{ sha: string; commit: { committer: { date: string } } }>;
  if (commits.length === 0) return null;
  return { sha: commits[0].sha, date: commits[0].commit.committer.date };
}

interface Change {
  entry: WatchEntry;
  from: string | null;
  to: string;
  date: string;
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(
      `✖ ${path.relative(root, CONFIG_PATH)} not found — run scripts/resolve-upstream-commits-config.ts first.`,
    );
    process.exitCode = 1;
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as { entries: WatchEntry[] };
  const state: Record<string, string> = fs.existsSync(STATE_PATH)
    ? JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    : {};

  console.log(`🔍 Checking ${config.entries.length} watched files for new commits...\n`);

  const changed: Change[] = [];
  const baselined: string[] = [];
  const unresolved: string[] = [];
  const nextState: Record<string, string> = { ...state };

  for (const entry of config.entries) {
    let latest: { sha: string; date: string } | null;
    try {
      latest = await latestCommitForPath(entry.repo, entry.branch, entry.file);
    } catch (err) {
      unresolved.push(`${entry.key}: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    if (latest === null) {
      unresolved.push(`${entry.key}: no commit history for ${entry.file} on ${entry.branch} (moved or renamed?)`);
      continue;
    }

    const seen = state[entry.key];
    if (!seen) {
      // First run for this entry: baseline without alarming, same convention
      // as check-upstream-releases.ts.
      baselined.push(entry.key);
      nextState[entry.key] = latest.sha;
      continue;
    }
    if (seen !== latest.sha) {
      changed.push({ entry, from: seen, to: latest.sha, date: latest.date });
      nextState[entry.key] = latest.sha;
    }
  }

  // .d.ts-backed entries first — PRIORITIZED per instruction, since a shipped
  // .d.ts changing is the closer thing to "the public surface changed" than a
  // plain source file's commit history moving.
  const dtsChanges = changed.filter((c) => c.entry.dts);
  const otherChanges = changed.filter((c) => !c.entry.dts);

  function printGroup(title: string, items: Change[]) {
    if (items.length === 0) return;
    console.log(title);
    for (const c of items) {
      const shortFrom = c.from!.slice(0, 7);
      const shortTo = c.to.slice(0, 7);
      console.log(
        `  ${c.entry.name} (${c.entry.key}) — ${c.entry.file} moved ${shortFrom} -> ${shortTo}`,
      );
      console.log(
        `    https://github.com/${c.entry.repo}/commits/${c.entry.branch}/${c.entry.file}`,
      );
    }
    console.log('');
  }

  printGroup('🔴 .d.ts source-of-truth changed (higher-confidence signal):', dtsChanges);
  printGroup('🟡 entry source file changed (no .d.ts to prioritize for this repo):', otherChanges);

  if (baselined.length > 0) {
    console.log(`⬜ Baselined ${baselined.length} new entr${baselined.length === 1 ? 'y' : 'ies'} (no prior state, no alarm).\n`);
  }
  if (unresolved.length > 0) {
    console.log(`⚠️  ${unresolved.length} entr${unresolved.length === 1 ? 'y' : 'ies'} could not be checked:`);
    for (const u of unresolved) console.log(`   ${u}`);
    console.log('');
  }

  console.log(
    `Checked ${config.entries.length} entries: ${changed.length} changed ` +
      `(${dtsChanges.length} .d.ts, ${otherChanges.length} other), ${baselined.length} baselined, ` +
      `${unresolved.length} unresolved.`,
  );

  if (changed.length === 0) {
    console.log('✅ Nothing new since the last check.');
  }

  if (check) {
    console.log('\n(--check: state not written)');
    return;
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2) + '\n');
  console.log(`\n✅ Wrote ${path.relative(root, STATE_PATH)}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
