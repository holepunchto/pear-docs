/**
 * Adds or refreshes GitHub links on library reference API entries:
 *
 *   - `[API definition on GitHub]` under each `#### \`...\`` heading
 *   - `([GitHub](url))` on Signature, Parameters, and Returns bullets
 *
 * All links target upstream **source files only** (index.js, lib/*.js, bin.js).
 *
 * Usage:
 *   UPSTREAM_ROOT=/tmp/pear-upstream npm run add-api-github-links
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const WRITE = process.argv.includes('--write');
const VERBOSE = process.argv.includes('--verbose');
const UPSTREAM_ROOT = process.env.UPSTREAM_ROOT ?? '/tmp/pear-upstream';

type RepoConfig = {
  org: string;
  repo: string;
  branch?: string;
};

type SourceHit = { file: string; line: number };

const REPOS: Record<string, RepoConfig> = {
  autobase: { org: 'holepunchto', repo: 'autobase' },
  hyperbee: { org: 'holepunchto', repo: 'hyperbee' },
  hypercore: { org: 'holepunchto', repo: 'hypercore' },
  hyperdht: { org: 'holepunchto', repo: 'hyperdht' },
  hyperdrive: { org: 'holepunchto', repo: 'hyperdrive' },
  hyperswarm: { org: 'holepunchto', repo: 'hyperswarm' },
  'compact-encoding': { org: 'holepunchto', repo: 'compact-encoding' },
  corestore: { org: 'holepunchto', repo: 'corestore' },
  localdrive: { org: 'holepunchto', repo: 'localdrive' },
  mirrordrive: { org: 'holepunchto', repo: 'mirror-drive' },
  protomux: { org: 'holepunchto', repo: 'protomux' },
  secretstream: { org: 'holepunchto', repo: 'hyperswarm-secret-stream' },
};

const UPSTREAM_DIR: Record<string, string> = {
  mirrordrive: 'mirror-drive',
  secretstream: 'hyperswarm-secret-stream',
};

const API_DEF_LINK = /^\[API definition on GitHub\]\([^)]+\)\s*$/;
const GITHUB_SUFFIX = /\s*\(\[GitHub\]\([^)]+\)\)\s*$/;
const GITHUB_IN_LABEL = /\s*\(\[GitHub\]\([^)]+\)\)(?=:\s*$)/;
const SOURCE_EXT = /\.(js|mjs|cjs)$/i;

function parseApiHeadingLine(line: string): string | null {
  const prefix = '#### `';
  if (!line.startsWith(prefix) || !line.endsWith('`')) return null;
  return line.slice(prefix.length, -1).trim();
}

function isSectionBoundary(line: string): boolean {
  return /^#{2,3}\s/.test(line) && !line.startsWith('#### ');
}

function stripGithubLink(line: string): string {
  return line.replace(GITHUB_SUFFIX, '').replace(GITHUB_IN_LABEL, '');
}

function withGithubLink(line: string, url: string): string {
  const base = stripGithubLink(line).trimEnd();
  if (/^- Parameters:\s*$/.test(base)) {
    return `- Parameters ([GitHub](${url})):`;
  }
  return `${base} ([GitHub](${url}))`;
}

function apiTokens(text: string): string[] {
  const tokens: string[] = [];
  const ctor = text.match(/new\s+([A-Za-z_$][\w$]*)/);
  if (ctor) tokens.push(`new ${ctor[1]}`);
  for (const m of text.matchAll(/\.([a-zA-Z_$][\w$]*)\s*(?:\(|\[|=|$)/g)) {
    tokens.push(`.${m[1]}`);
  }
  const bare = text.match(/^([a-zA-Z_$][\w$]*)\./);
  if (bare) tokens.push(bare[1]);
  return tokens;
}

function primaryName(heading: string): string | null {
  const methods = [...heading.matchAll(/\.([a-zA-Z_$][\w$]*)\s*(?:\(|$)/g)];
  if (methods.length > 0) return methods[methods.length - 1][1];

  const fn = heading.match(/^([a-zA-Z_$][\w$]*)\s*\(/);
  if (fn && fn[1] !== 'const' && fn[1] !== 'let') return fn[1];

  if (/^[a-zA-Z_$][\w$]*$/.test(heading.trim())) return heading.trim();

  const staticProp = heading.match(/\.([A-Z_][A-Z0-9_]*)$/);
  if (staticProp) return staticProp[1];

  const trailingProp = heading.match(/\.([a-zA-Z_$][\w$]*)$/);
  if (trailingProp) return trailingProp[1];

  return null;
}

function classNameFromHeading(heading: string): string | null {
  const ctor = heading.match(/new\s+([A-Za-z_$][\w$]*)/);
  if (!ctor) return null;
  if (ctor[1] === 'DHT') return 'HyperDHT';
  if (ctor[1] === 'SecretStream') return 'NoiseSecretStream';
  if (ctor[1] === 'MirrorDrive') return 'MirrorDrive';
  return ctor[1];
}

function githubBlobUrl(cfg: RepoConfig, file: string, line: number): string {
  const branch = cfg.branch ?? 'main';
  return `https://github.com/${cfg.org}/${cfg.repo}/blob/${branch}/${file}#L${line}`;
}

function collectImplFiles(upstreamDir: string): { path: string; lines: string[] }[] {
  const out: { path: string; lines: string[] }[] = [];
  const seen = new Set<string>();

  function add(rel: string) {
    if (seen.has(rel)) return;
    const p = join(upstreamDir, rel);
    if (!existsSync(p)) return;
    seen.add(rel);
    out.push({ path: rel, lines: readFileSync(p, 'utf8').split('\n') });
  }

  function walk(dir: string, depth = 0) {
    if (depth > 3) return;
    let entries;
    try {
      entries = readdirSync(join(upstreamDir, dir), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'test' || e.name === 'tests') continue;
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (e.name === 'lib' || depth > 0) walk(rel, depth + 1);
      } else if (SOURCE_EXT.test(e.name) && !/\.test\.|test\.js$|^test\./i.test(e.name)) {
        add(rel);
      }
    }
  }

  for (const root of ['index.js', 'index.mjs', 'index.cjs', 'bin.js']) add(root);
  walk('lib', 0);
  walk('', 0);

  return out;
}

function getFileLines(
  implFiles: { path: string; lines: string[] }[],
  hit: SourceHit
): string[] | null {
  return implFiles.find((f) => f.path === hit.file)?.lines ?? null;
}

function findSignatureLine(
  heading: string,
  implFiles: { path: string; lines: string[] }[]
): SourceHit | null {
  const names = new Set<string>();
  for (const t of apiTokens(heading)) {
    if (t.startsWith('.')) names.add(t.slice(1));
  }
  const primary = primaryName(heading);
  if (primary) names.add(primary);
  for (const m of heading.matchAll(/cenc\.([a-zA-Z0-9]+)/g)) names.add(m[1]);

  const ctor = heading.match(/new\s+([A-Za-z_$][\w$]*)/);
  const className = classNameFromHeading(heading);
  if (className) names.add(className);

  const staticCall = heading.match(/^([A-Za-z_$][\w$]*)\.([a-zA-Z_$][\w$]*)/);
  if (staticCall) {
    names.add(staticCall[2]);
    if (staticCall[1] === 'DHT') names.add('HyperDHT');
    if (staticCall[1] === 'Hypercore') names.add('Hypercore');
  }
  const staticMethod = heading.match(/([A-Za-z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\s*\(/);
  if (staticMethod) names.add(staticMethod[2]);

  const eventOn = heading.match(/\.on\(['"]([\w-]+)['"]/);
  if (eventOn) names.add(eventOn[1]);

  for (const { path, lines } of implFiles) {
    if (className) {
      for (let i = 0; i < lines.length; i++) {
        if (
          new RegExp(`class\\s+${className}\\b`).test(lines[i]) ||
          new RegExp(`module\\.exports\\s*=\\s*class\\s+${className}\\b`).test(lines[i])
        ) {
          return { file: path, line: i + 1 };
        }
      }
    }

    if (staticCall?.[2] === 'bootstrapper') {
      for (let i = 0; i < lines.length; i++) {
        if (/\.bootstrapper\s*\(/.test(lines[i])) return { file: path, line: i + 1 };
      }
    }

    if (eventOn) {
      const ev = eventOn[1];
      for (let i = 0; i < lines.length; i++) {
        if (
          new RegExp(`\\.on\\(['"]${ev}['"]`).test(lines[i]) ||
          new RegExp(`emit\\(['"]${ev}['"]`).test(lines[i]) ||
          new RegExp(`['"]${ev}['"]`).test(lines[i])
        ) {
          return { file: path, line: i + 1 };
        }
      }
    }

    if (primary === 'write' || primary === 'end') {
      for (let i = 0; i < lines.length; i++) {
        if (new RegExp(`^\\s*_${primary}\\s*\\(`).test(lines[i])) {
          return { file: path, line: i + 1 };
        }
      }
      if (primary === 'end') {
        for (let i = 0; i < lines.length; i++) {
          if (
            /^\s*_final\s*\(/.test(lines[i]) ||
            /this\._rawStream\.end\s*\(/.test(lines[i])
          ) {
            return { file: path, line: i + 1 };
          }
        }
      }
    }

    if (primary === 'ready' || primary === 'close') {
      for (let i = 0; i < lines.length; i++) {
        if (new RegExp(`^\\s*async\\s+${primary}\\s*\\(`).test(lines[i])) {
          return { file: path, line: i + 1 };
        }
      }
      for (let i = 0; i < lines.length; i++) {
        if (new RegExp(`this\\.${primary}\\(\\)`).test(lines[i])) {
          return { file: path, line: i + 1 };
        }
      }
    }

    if (/for await|for \(const .* of /.test(heading)) {
      for (let i = 0; i < lines.length; i++) {
        if (/\[Symbol\.asyncIterator\]|\[Symbol\.iterator\]/.test(lines[i])) {
          return { file: path, line: i + 1 };
        }
      }
    }

    for (const name of names) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          new RegExp(`static\\s+async\\s+${name}\\s*\\(`).test(line) ||
          new RegExp(`static\\s+${name}\\s*\\(`).test(line) ||
          new RegExp(`static\\s+${name}\\b`).test(line) ||
          new RegExp(`static\\s+${name}\\s*=`).test(line)
        ) {
          return { file: path, line: i + 1 };
        }
        if (
          new RegExp(`exports\\.${name}\\s*=`).test(line) ||
          new RegExp(`exports\\.${name}\\b`).test(line)
        ) {
          return { file: path, line: i + 1 };
        }
        // Method definitions only — avoid matching identifiers inside strings (e.g. "Cannot append to").
        if (
          new RegExp(`^\\s*async\\s+\\*${name}\\s*\\(`).test(line) ||
          new RegExp(`^\\s*async\\s+${name}\\s*\\(`).test(line) ||
          new RegExp(`^\\s*${name}\\s*\\(`).test(line) ||
          new RegExp(`^\\s*get\\s+${name}\\s*\\(`).test(line) ||
          new RegExp(`^\\s*set\\s+${name}\\s*\\(`).test(line)
        ) {
          return { file: path, line: i + 1 };
        }
        if (
          new RegExp(`\\b${name}\\s*=`).test(line) &&
          /\bonopen|onclose|ondestroy|ondrain|metadataEquals|transformers|entries|encoding|onmessage/.test(
            name
          )
        ) {
          return { file: path, line: i + 1 };
        }
        if (new RegExp(`this\\.${name}\\s*=`).test(line)) {
          return { file: path, line: i + 1 };
        }
      }
    }
  }

  return null;
}

function findParamsLine(
  heading: string,
  sig: SourceHit,
  implFiles: { path: string; lines: string[] }[]
): SourceHit {
  const lines = getFileLines(implFiles, sig);
  if (!lines) return sig;

  const start = sig.line - 1;
  for (let i = start; i < Math.min(start + 50, lines.length); i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? '';
    if (/^\s*const\s+\{/.test(line) && /opts|options/.test(line + next)) {
      return { file: sig.file, line: i + 1 };
    }
    if (/^\s*@param\b/.test(line)) return { file: sig.file, line: i + 1 };
  }

  return sig;
}

function findReturnsLine(
  heading: string,
  sig: SourceHit,
  implFiles: { path: string; lines: string[] }[]
): SourceHit {
  const lines = getFileLines(implFiles, sig);
  if (!lines) return sig;

  const name = primaryName(heading);
  const start = sig.line - 1;

  if (name && !heading.includes('(') && heading.includes('.')) {
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`get\\s+${name}\\s*\\(`).test(lines[i])) {
        return { file: sig.file, line: i + 1 };
      }
      if (new RegExp(`this\\.${name}\\s*=`).test(lines[i])) {
        return { file: sig.file, line: i + 1 };
      }
    }
  }

  let braceLine = start;
  while (braceLine < lines.length && !/[{]/.test(lines[braceLine])) braceLine++;
  if (braceLine >= lines.length) return sig;

  let depth = 0;
  let lastReturn: number | null = null;
  let started = false;
  for (let i = braceLine; i < Math.min(braceLine + 200, lines.length); i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') {
        depth++;
        started = true;
      } else if (ch === '}') {
        depth--;
      }
    }
    if (started && /\breturn\b/.test(line) && !/^\s*\/\//.test(line.trim())) {
      lastReturn = i + 1;
    }
    if (started && depth <= 0 && i > braceLine) break;
  }

  return lastReturn ? { file: sig.file, line: lastReturn } : sig;
}

function resolveApiTargets(
  heading: string,
  implFiles: { path: string; lines: string[] }[]
): { signature: SourceHit | null; params: SourceHit | null; returns: SourceHit | null } {
  const signature = findSignatureLine(heading, implFiles);
  if (!signature) return { signature: null, params: null, returns: null };
  return {
    signature,
    params: findParamsLine(heading, signature, implFiles),
    returns: findReturnsLine(heading, signature, implFiles),
  };
}

function processMdx(
  mdxPath: string,
  cfg: RepoConfig,
  upstreamDir: string
): { updated: number; missed: string[] } {
  const implFiles = collectImplFiles(upstreamDir);
  const content = readFileSync(mdxPath, 'utf8');
  const apiStart = content.indexOf('## API Reference');
  if (apiStart === -1) return { updated: 0, missed: [] };

  const before = content.slice(0, apiStart);
  const section = content.slice(apiStart);
  const lines = section.split('\n');
  const out: string[] = [];
  const missed: string[] = [];
  let updated = 0;
  let i = 0;

  let targets: ReturnType<typeof resolveApiTargets> | null = null;

  while (i < lines.length) {
    const line = lines[i];
    const heading = parseApiHeadingLine(line);

    if (heading) {
      targets = resolveApiTargets(heading, implFiles);
      out.push(line);
      i++;

      while (i < lines.length && lines[i].trim() === '') i++;
      if (i < lines.length && API_DEF_LINK.test(lines[i].trim())) i++;
      while (i < lines.length && lines[i].trim() === '') i++;

      if (!targets.signature) {
        missed.push(heading);
      } else {
        const url = githubBlobUrl(cfg, targets.signature.file, targets.signature.line);
        out.push('');
        out.push(`[API definition on GitHub](${url})`);
        updated++;
      }
      continue;
    }

    if (isSectionBoundary(line)) {
      targets = null;
      out.push(line);
      i++;
      continue;
    }

    if (targets?.signature) {
      if (/^- Signature:\s*/.test(line)) {
        const url = githubBlobUrl(cfg, targets.signature.file, targets.signature.line);
        out.push(withGithubLink(line, url));
        updated++;
        i++;
        continue;
      }
      if (/^- Parameters(?::|\s+\(\[GitHub\])/.test(line)) {
        const hit = targets.params ?? targets.signature;
        const url = githubBlobUrl(cfg, hit.file, hit.line);
        out.push(withGithubLink(line, url));
        updated++;
        i++;
        continue;
      }
      if (/^- Returns:\s*/.test(line)) {
        const hit = targets.returns ?? targets.signature;
        const url = githubBlobUrl(cfg, hit.file, hit.line);
        out.push(withGithubLink(line, url));
        updated++;
        i++;
        continue;
      }
    }

    out.push(line);
    i++;
  }

  const next = before + out.join('\n');
  if (WRITE && next !== content) writeFileSync(mdxPath, next);
  return { updated, missed };
}

const dirs = [
  'content/reference/building-blocks',
  'content/reference/helpers',
];

let totalUpdated = 0;
const allMissed: Record<string, string[]> = {};

for (const dir of dirs) {
  const fullDir = join(process.cwd(), dir);
  for (const file of readdirSync(fullDir).filter((f) => f.endsWith('.mdx'))) {
    const slug = basename(file, '.mdx');
    const cfg = REPOS[slug];
    if (!cfg) continue;

    const upstreamName = UPSTREAM_DIR[slug] ?? slug;
    const upstreamDir = join(UPSTREAM_ROOT, upstreamName);
    if (!existsSync(upstreamDir)) {
      console.warn(`skip ${slug}: missing ${upstreamDir}`);
      continue;
    }

    const result = processMdx(join(fullDir, file), cfg, upstreamDir);
    totalUpdated += result.updated;
    if (result.missed.length) allMissed[slug] = result.missed;
    console.log(
      `${slug}: ${result.updated} links${result.missed.length ? `, ${result.missed.length} unmatched` : ''}`
    );
    if (VERBOSE && result.missed.length) {
      for (const h of result.missed) console.log(`    ? ${h}`);
    }
  }
}

if (Object.keys(allMissed).length) {
  console.log('\nUnmatched headings (no source line found):');
  for (const [slug, items] of Object.entries(allMissed)) {
    for (const h of items) console.log(`  ${slug}: ${h}`);
  }
}

console.log(
  `\n${WRITE ? 'Wrote' : 'Would update'} ${totalUpdated} links (source files only). Pass --write to apply.`
);
