// scripts/check-upstream-pins.ts
//
// Grades how far each reference page's documented upstream version has drifted
// from npm latest. See docs/plans/DOCS-VERSIONING-DESIGN.md §5.
//
// Why this exists: reference pages are pinned to an upstream release, but
// nothing told us when that pin went stale. A 2026-07 audit found two pages
// silently behind (hypercore 11.34.0 vs 11.35.1, corestore 7.11.0 vs 7.12.0)
// and 37 bare module pages with no pin at all.
//
// This is deliberately NOT a pass/fail gate. An older pin is legitimate — the
// page is correct *for its pin*. Drift means "re-audit due", not "broken", so
// the script exits 0 unless --strict is passed. Severity is graded by SemVer
// because at a fortnightly release cadence a flat equality check is noise:
//
//   patch  info    bump the pin; re-verify [src] lines only if they moved
//   minor  warn    re-audit defaults/signatures — new API surface is likely
//   major  action  a new documented major -> mint a versioned page, don't just
//                  bump the pin (design doc §4, decision 6)
//
// A page's pin is resolved in two ways, in order:
//   1. `upstreamVersion` frontmatter — authoritative, and the only option for
//      pages with no line-level citations (all of content/reference/bare/*).
//   2. the tag in its `[src]`/definition GitHub links — a fallback so the
//      module refs work before they are backfilled.
// Pages that resolve neither are reported as `unpinned` rather than skipped;
// they are the actionable backlog, not a silent pass.
//
// Run as `npm run check:upstream-pins`.
//   --strict  exit 1 on any minor/major drift (for a scheduled job that should
//             open an issue)
//   --json    machine-readable output
import { readFile } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CONTENT_DIR, getFiles } from './helpers';

const exec = promisify(execFile);

/** Only reference pages track an upstream release. */
const REFERENCE_GLOBS = [
  `${CONTENT_DIR}/reference/building-blocks`,
  `${CONTENT_DIR}/reference/helpers`,
  `${CONTENT_DIR}/reference/bare`,
];

/**
 * GitHub repo -> npm package, for the cases where they differ.
 *
 * Both entries here are audit-confirmed traps that cost real time: the doc
 * slug, the repo name, and the package name are all different. Deriving the
 * package from the *repo* (not the filename) is why this map is small.
 */
const REPO_TO_NPM: Record<string, string> = {
  'mirror-drive': 'mirror-drive',
  'hyperswarm-secret-stream': '@hyperswarm/secret-stream',
};

type Severity = 'ok' | 'info' | 'warn' | 'action' | 'unpinned' | 'unknown';

interface Row {
  page: string;
  pkg: string | null;
  pinned: string | null;
  latest: string | null;
  source: 'frontmatter' | 'src-link' | 'none';
  severity: Severity;
  note: string;
}

function frontmatterBlock(content: string): string {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

function pinFromFrontmatter(content: string): string | null {
  const m = frontmatterBlock(content).match(
    /^\s*upstreamVersion:\s*["']?([^"'\s#]+)["']?\s*$/m,
  );
  return m ? m[1] : null;
}

/**
 * Recover (repo, tag) from GitHub blob links. Pages cite one repo at a
 * versioned tag; if a page somehow cites several distinct tags that is itself
 * a defect worth surfacing, so we report the disagreement rather than picking.
 */
function pinFromSrcLinks(content: string): {
  repo: string | null;
  tag: string | null;
  conflict: string[] | null;
} {
  const found = new Set<string>();
  const re = /github\.com\/holepunchto\/([A-Za-z0-9._-]+)\/blob\/v?([0-9][^/\s)]*)\//g;
  for (const m of content.matchAll(re)) found.add(`${m[1]}@${m[2]}`);

  if (found.size === 0) return { repo: null, tag: null, conflict: null };
  if (found.size > 1) return { repo: null, tag: null, conflict: [...found].sort() };

  const [only] = [...found];
  const at = only.lastIndexOf('@');
  return { repo: only.slice(0, at), tag: only.slice(at + 1), conflict: null };
}

/** Repo name guessed from the page's own links, else the filename. */
function repoFor(content: string, page: string): string | null {
  const m = content.match(/github\.com\/holepunchto\/([A-Za-z0-9._-]+)/);
  if (m) return m[1];
  const base = page.replace(/\.mdx?$/, '');
  return base.startsWith('bare-') ? base : null;
}

function npmNameFor(repo: string | null): string | null {
  if (!repo) return null;
  return REPO_TO_NPM[repo] ?? repo;
}

const semverCache = new Map<string, string | null>();

async function npmLatest(pkg: string): Promise<string | null> {
  if (semverCache.has(pkg)) return semverCache.get(pkg)!;
  let out: string | null = null;
  try {
    const { stdout } = await exec('npm', ['view', pkg, 'version'], {
      timeout: 60_000,
    });
    out = stdout.trim() || null;
  } catch {
    out = null; // unpublished, renamed, or private — reported as `unknown`
  }
  semverCache.set(pkg, out);
  return out;
}

function parts(v: string): [number, number, number] {
  const core = v.split('-')[0];
  const [a = '0', b = '0', c = '0'] = core.split('.');
  return [Number(a), Number(b), Number(c)];
}

function grade(pinned: string, latest: string): { severity: Severity; note: string } {
  if (pinned === latest) return { severity: 'ok', note: '' };
  const [pMaj, pMin] = parts(pinned);
  const [lMaj, lMin] = parts(latest);

  if (lMaj > pMaj) {
    return {
      severity: 'action',
      note: `major bump ${pMaj}.x -> ${lMaj}.x: mint a versioned page, do not just bump the pin`,
    };
  }
  if (lMaj === pMaj && lMin > pMin) {
    return {
      severity: 'warn',
      note: 'minor bump: re-audit defaults, signatures and new API surface',
    };
  }
  // Same major+minor, or npm is *behind* the pin (prerelease pinned ahead of
  // stable — legitimate, and not drift to chase).
  if (parts(pinned).join('.') > parts(latest).join('.')) {
    return { severity: 'ok', note: 'pinned ahead of npm latest (prerelease)' };
  }
  return { severity: 'info', note: 'patch bump: bump the pin; recheck [src] lines if they moved' };
}

async function main() {
  const strict = process.argv.includes('--strict');
  const asJson = process.argv.includes('--json');

  const files: string[] = [];
  for (const dir of REFERENCE_GLOBS) {
    try {
      files.push(...(await getFiles(dir)));
    } catch {
      // directory may not exist in every checkout
    }
  }
  const pages = files.filter((f) => /\.mdx?$/.test(f) && !/\/_/.test(f)).sort();

  const rows: Row[] = [];

  for (const file of pages) {
    const content = await readFile(file, 'utf8');
    const page = file.replace(`${CONTENT_DIR}/`, '');

    const fmPin = pinFromFrontmatter(content);
    const { repo, tag, conflict } = pinFromSrcLinks(content);
    const pkg = npmNameFor(repo ?? repoFor(content, page));

    if (conflict) {
      rows.push({
        page,
        pkg,
        pinned: null,
        latest: null,
        source: 'src-link',
        severity: 'warn',
        note: `page cites conflicting tags: ${conflict.join(', ')}`,
      });
      continue;
    }

    const pinned = fmPin ?? tag;
    const source: Row['source'] = fmPin ? 'frontmatter' : tag ? 'src-link' : 'none';

    if (!pinned) {
      rows.push({
        page,
        pkg,
        pinned: null,
        latest: null,
        source,
        severity: 'unpinned',
        note: 'no upstreamVersion frontmatter and no versioned [src] links',
      });
      continue;
    }

    if (!pkg) {
      rows.push({
        page, pkg: null, pinned, latest: null, source,
        severity: 'unknown',
        note: 'could not determine the npm package for this page',
      });
      continue;
    }

    const latest = await npmLatest(pkg);
    if (!latest) {
      rows.push({
        page, pkg, pinned, latest: null, source,
        severity: 'unknown',
        note: `npm view ${pkg} failed (unpublished, renamed or private?)`,
      });
      continue;
    }

    const { severity, note } = grade(pinned, latest);
    rows.push({ page, pkg, pinned, latest, source, severity, note });
  }

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    report(rows);
  }

  const actionable = rows.filter((r) => r.severity === 'warn' || r.severity === 'action');
  process.exit(strict && actionable.length > 0 ? 1 : 0);
}

const ICON: Record<Severity, string> = {
  ok: '✅', info: 'ℹ️ ', warn: '⚠️ ', action: '🚨', unpinned: '⬜', unknown: '❓',
};

function report(rows: Row[]) {
  console.log('🔍 Checking upstream version pins...\n');

  const order: Severity[] = ['action', 'warn', 'info', 'unknown', 'unpinned', 'ok'];
  const bySeverity = new Map<Severity, Row[]>();
  for (const r of rows) {
    if (!bySeverity.has(r.severity)) bySeverity.set(r.severity, []);
    bySeverity.get(r.severity)!.push(r);
  }

  const LABEL: Record<Severity, string> = {
    action: 'MAJOR drift — needs a new versioned page',
    warn: 'MINOR drift — re-audit due',
    info: 'patch drift — bump the pin',
    unknown: 'could not resolve',
    unpinned: 'no pin yet (backlog)',
    ok: 'up to date',
  };

  for (const sev of order) {
    const group = bySeverity.get(sev);
    if (!group?.length) continue;

    // The `ok` and `unpinned` groups are usually long and uninteresting
    // line-by-line; summarise them instead of dumping every page.
    if (sev === 'ok') {
      console.log(`${ICON[sev]} ${LABEL[sev]}: ${group.length} page(s)\n`);
      continue;
    }
    if (sev === 'unpinned') {
      console.log(`${ICON[sev]} ${LABEL[sev]}: ${group.length} page(s)`);
      const dirs = new Map<string, number>();
      for (const r of group) {
        const dir = r.page.split('/').slice(0, -1).join('/');
        dirs.set(dir, (dirs.get(dir) ?? 0) + 1);
      }
      for (const [dir, n] of [...dirs].sort((a, b) => b[1] - a[1])) {
        console.log(`     ${n.toString().padStart(3)}  ${dir}/`);
      }
      console.log('     → add `upstreamVersion:` frontmatter to bring these under the check\n');
      continue;
    }

    console.log(`${ICON[sev]} ${LABEL[sev]}`);
    for (const r of group) {
      const v = r.pinned && r.latest ? `${r.pinned} → ${r.latest}` : (r.pinned ?? '—');
      console.log(`     ${r.page}`);
      console.log(`       ${r.pkg ?? '?'}  ${v}  [${r.source}]`);
      if (r.note) console.log(`       ${r.note}`);
    }
    console.log();
  }

  const n = (s: Severity) => bySeverity.get(s)?.length ?? 0;
  console.log(
    `Checked ${rows.length} reference page(s): ` +
      `${n('ok')} current, ${n('info')} patch, ${n('warn')} minor, ` +
      `${n('action')} major, ${n('unpinned')} unpinned, ${n('unknown')} unresolved`,
  );
  if (n('action') === 0 && n('warn') === 0) {
    console.log('\n✅ No re-audit required.');
  } else {
    console.log('\nDrift is not a failure — an older pin is valid for the version it documents.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
