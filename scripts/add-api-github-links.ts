/**
 * Adds or refreshes a single GitHub definition link per library reference API entry:
 *
 *   - `[API definition on GitHub]` under each `#### \`...\`` heading (one per method)
 *   - any legacy `([GitHub](url))` suffixes on Signature/Parameters/Returns bullets
 *     are stripped — the heading link is the single source of truth.
 *
 * Links target upstream **source files only** (index.js, lib/*.js, bin.js) and are
 * pinned to the cloned **release tag** (via `git describe --tags`), falling back to
 * the checked-out commit SHA when a repo has no tags (e.g. bitfinexcom/hypertele).
 * Clone each upstream repo at its tag before running (see the review plan, Phase 0).
 *
 * Usage:
 *   UPSTREAM_ROOT=/tmp/pear-upstream npm run add-api-github-links -- --write
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
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

// CLI tool docs: `## `<command>`` sections link to the command's bin entry file.
const TOOL_REPOS: Record<string, RepoConfig> = {
  drives: { org: 'holepunchto', repo: 'drives' },
  hyperbeam: { org: 'holepunchto', repo: 'hyperbeam' },
  hypershell: { org: 'holepunchto', repo: 'hypershell' },
  hyperssh: { org: 'holepunchto', repo: 'hyperssh', branch: 'master' },
  hypertele: { org: 'bitfinexcom', repo: 'hypertele' },
};

// Configuration doc: each documented `package.json` `pear.*` field links to where
// its value is consumed upstream. Fields span two repos — the `pear` block is parsed
// by `pear-state`; the `pear.stage.*` build options and `pear.assets` are consumed by
// `pear`'s sidecar staging op. Each field resolves by a code-search pattern (anchored
// to a specific file) so line numbers self-heal when the repos are re-pinned. Anchors
// not listed here (e.g. prose sections, or keys handled in UI-integration libraries
// like `pear.gui`/`pear.pre`) are intentionally left unlinked.
type ConfigField = { anchor: string; repo: string; file: string; pattern: RegExp };
const CONFIG_FIELDS: ConfigField[] = [
  { anchor: 'pear', repo: 'pear-state', file: 'index.js', pattern: /state\.options\s*=\s*state\.pkg\?\.pear/ },
  { anchor: 'pear-name', repo: 'pear-state', file: 'index.js', pattern: /pkg\?\.pear\?\.name/ },
  { anchor: 'pear-stage-entrypoints', repo: 'pear-state', file: 'index.js', pattern: /options\.stage\?\.entrypoints/ },
  { anchor: 'pear-routes', repo: 'pear-state', file: 'index.js', pattern: /state\.options\.routes/ },
  { anchor: 'pear-unrouted', repo: 'pear-state', file: 'index.js', pattern: /options\.unrouted/ },
  { anchor: 'pear-links', repo: 'pear-state', file: 'index.js', pattern: /state\.options\.links/ },
  { anchor: 'pear-stage-ignore', repo: 'pear', file: 'subsystems/sidecar/ops/stage.js', pattern: /options\?\.stage\?\.ignore/ },
  { anchor: 'pear-stage-include', repo: 'pear', file: 'subsystems/sidecar/ops/stage.js', pattern: /options\?\.stage\?\.include\b/ },
  { anchor: 'pear-stage-defer', repo: 'pear', file: 'subsystems/sidecar/ops/stage.js', pattern: /options\?\.stage\?\.defer/ },
  { anchor: 'pear-assets', repo: 'pear', file: 'subsystems/sidecar/lib/pod.js', pattern: /pkg\?\.pear\?\.assets/ },
];

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

function resolvePinRef(upstreamDir: string, cfg: RepoConfig): string {
  const run = (cmd: string): string | null => {
    try {
      return execSync(cmd, { cwd: upstreamDir, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  };
  // Prefer the release tag the repo was cloned at; fall back to the commit SHA.
  return run('git describe --tags --exact-match') ?? run('git rev-parse HEAD') ?? cfg.branch ?? 'main';
}

function githubBlobUrl(cfg: RepoConfig, ref: string, file: string, line: number): string {
  return `https://github.com/${cfg.org}/${cfg.repo}/blob/${ref}/${file}#L${line}`;
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
  upstreamDir: string,
  pinRef: string
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
        const url = githubBlobUrl(cfg, pinRef, targets.signature.file, targets.signature.line);
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

    // One link per method: strip any legacy per-bullet GitHub links inside a method block.
    if (targets) {
      if (
        /^- Signature:\s*/.test(line) ||
        /^- Parameters(?::|\s+\(\[GitHub\])/.test(line) ||
        /^- Returns:\s*/.test(line)
      ) {
        out.push(stripGithubLink(line));
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

const CLI_DEF_LINK = /^\[Command source on GitHub\]\([^)]+\)\s*$/;
const CLI_HEADING = /^## `([^`]+)`\s*$/;

type CliResolver = (headingCommand: string) => SourceHit | null;

/** Reads the `bin` map from an upstream package.json (name -> entry file). */
function readBinMap(upstreamDir: string): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync(join(upstreamDir, 'package.json'), 'utf8'));
    if (typeof pkg.bin === 'string') return { [pkg.name]: pkg.bin };
    return pkg.bin ?? {};
  } catch {
    return {};
  }
}

/** Tool docs: heading's executable (first token) -> its bin entry file. */
function binResolver(upstreamDir: string): CliResolver {
  const bin = readBinMap(upstreamDir);
  return (heading) => {
    const exec = heading.split(/\s+/)[0];
    const entry = bin[exec];
    return entry ? { file: entry.replace(/^\.\//, ''), line: 0 } : null;
  };
}

/**
 * Pear CLI: `pear <cmd>` -> `cmd/<cmd>.js`, falling back to the registration line
 * in `cmd/index.js` (e.g. `build: require('pear-build')`). Unmapped commands (e.g.
 * a documented command that no longer exists upstream) are reported as misses.
 */
function pearResolver(upstreamDir: string): CliResolver {
  const indexRel = 'cmd/index.js';
  const indexPath = join(upstreamDir, indexRel);
  const indexLines = existsSync(indexPath) ? readFileSync(indexPath, 'utf8').split('\n') : [];
  return (heading) => {
    const cmd = heading.split(/\s+/)[1];
    if (!cmd) return null;
    if (existsSync(join(upstreamDir, 'cmd', `${cmd}.js`))) return { file: `cmd/${cmd}.js`, line: 0 };
    for (let i = 0; i < indexLines.length; i++) {
      if (
        new RegExp(`^\\s*${cmd}:\\s*require`).test(indexLines[i]) ||
        new RegExp(`command\\('${cmd}'`).test(indexLines[i])
      ) {
        return { file: indexRel, line: i + 1 };
      }
    }
    return null;
  };
}

/**
 * CLI docs: under each `## `<command>`` heading, insert one `[Command source on
 * GitHub]` link resolved by `resolve`, pinned to the tag/SHA.
 */
function processCliMdx(
  mdxPath: string,
  cfg: RepoConfig,
  pinRef: string,
  resolve: CliResolver
): { updated: number; missed: string[] } {
  const content = readFileSync(mdxPath, 'utf8');
  const lines = content.split('\n');
  const out: string[] = [];
  const missed: string[] = [];
  let updated = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(CLI_HEADING);
    if (m) {
      out.push(line);
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
      if (i < lines.length && CLI_DEF_LINK.test(lines[i].trim())) i++;
      while (i < lines.length && lines[i].trim() === '') i++;

      const hit = resolve(m[1].trim());
      if (!hit) {
        missed.push(m[1]);
      } else {
        const url =
          hit.line > 0
            ? githubBlobUrl(cfg, pinRef, hit.file, hit.line)
            : githubBlobUrl(cfg, pinRef, hit.file, 0).replace(/#L0$/, '');
        out.push('');
        out.push(`[Command source on GitHub](${url})`);
        out.push('');
        updated++;
      }
      continue;
    }
    out.push(line);
    i++;
  }

  const next = out.join('\n');
  if (WRITE && next !== content) writeFileSync(mdxPath, next);
  return { updated, missed };
}

/** Returns the first line in `upstreamDir/file` matching `pattern` (1-based), or null. */
function findInFile(upstreamDir: string, file: string, pattern: RegExp): SourceHit | null {
  const p = join(upstreamDir, file);
  if (!existsSync(p)) return null;
  const lines = readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return { file, line: i + 1 };
  }
  return null;
}

const CONFIG_DEF_LINK = /^\[Field source on GitHub\]\([^)]+\)\s*$/;
const ANCHOR_LINE = /^<a name="([^"]+)"><\/a>\s*$/;

/**
 * Configuration doc: under each mapped `<a name="…">` field anchor, insert one
 * `[Field source on GitHub]` link resolved from `urls`. Anchors absent from `urls`
 * (prose sections, UI-library-defined keys) are left untouched.
 */
function processConfigMdx(
  mdxPath: string,
  urls: Map<string, string>
): { updated: number; missed: string[] } {
  const content = readFileSync(mdxPath, 'utf8');
  const lines = content.split('\n');
  const out: string[] = [];
  let updated = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const am = line.match(ANCHOR_LINE);
    const url = am ? urls.get(am[1]) : undefined;
    if (am && url) {
      out.push(line);
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
      if (i < lines.length && CONFIG_DEF_LINK.test(lines[i].trim())) i++;
      while (i < lines.length && lines[i].trim() === '') i++;
      out.push('');
      out.push(`[Field source on GitHub](${url})`);
      out.push('');
      updated++;
      continue;
    }
    out.push(line);
    i++;
  }

  const next = out.join('\n');
  if (WRITE && next !== content) writeFileSync(mdxPath, next);
  return { updated, missed: [] };
}

const dirs = [
  'content/bare/reference/building-blocks',
  'content/bare/reference/helpers',
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

    const pinRef = resolvePinRef(upstreamDir, cfg);
    const result = processMdx(join(fullDir, file), cfg, upstreamDir, pinRef);
    totalUpdated += result.updated;
    if (result.missed.length) allMissed[slug] = result.missed;
    console.log(
      `${slug} @ ${pinRef}: ${result.updated} links${result.missed.length ? `, ${result.missed.length} unmatched` : ''}`
    );
    if (VERBOSE && result.missed.length) {
      for (const h of result.missed) console.log(`    ? ${h}`);
    }
  }
}

// CLI tool docs.
const toolsDir = join(process.cwd(), 'content/bare/reference/tools');
if (existsSync(toolsDir)) {
  for (const file of readdirSync(toolsDir).filter((f) => f.endsWith('.mdx'))) {
    const slug = basename(file, '.mdx');
    const cfg = TOOL_REPOS[slug];
    if (!cfg) continue;

    const upstreamDir = join(UPSTREAM_ROOT, slug);
    if (!existsSync(upstreamDir)) {
      console.warn(`skip ${slug}: missing ${upstreamDir}`);
      continue;
    }

    const pinRef = resolvePinRef(upstreamDir, cfg);
    const result = processCliMdx(join(toolsDir, file), cfg, pinRef, binResolver(upstreamDir));
    totalUpdated += result.updated;
    if (result.missed.length) allMissed[slug] = result.missed;
    console.log(
      `${slug} @ ${pinRef}: ${result.updated} command links${result.missed.length ? `, ${result.missed.length} unmatched` : ''}`
    );
    if (VERBOSE && result.missed.length) {
      for (const h of result.missed) console.log(`    ? ${h}`);
    }
  }
}

// Pear CLI doc (content/pear/reference/pear/cli.mdx -> holepunchto/pear cmd/*.js).
const cliPath = join(process.cwd(), 'content/pear/reference/pear/cli.mdx');
const pearDir = join(UPSTREAM_ROOT, 'pear');
if (existsSync(cliPath) && existsSync(pearDir)) {
  const cfg: RepoConfig = { org: 'holepunchto', repo: 'pear' };
  const pinRef = resolvePinRef(pearDir, cfg);
  const result = processCliMdx(cliPath, cfg, pinRef, pearResolver(pearDir));
  totalUpdated += result.updated;
  if (result.missed.length) allMissed['cli'] = result.missed;
  console.log(
    `cli @ ${pinRef}: ${result.updated} command links${result.missed.length ? `, ${result.missed.length} unmatched` : ''}`
  );
}

// Configuration doc (content/pear/reference/pear/configuration.mdx -> pear-state + pear).
const configPath = join(process.cwd(), 'content/pear/reference/pear/configuration.mdx');
if (existsSync(configPath)) {
  const urls = new Map<string, string>();
  const configMissed: string[] = [];
  for (const f of CONFIG_FIELDS) {
    const dir = join(UPSTREAM_ROOT, f.repo);
    if (!existsSync(dir)) {
      console.warn(`skip config field ${f.anchor}: missing ${dir}`);
      continue;
    }
    const cfg: RepoConfig = { org: 'holepunchto', repo: f.repo };
    const pinRef = resolvePinRef(dir, cfg);
    const hit = findInFile(dir, f.file, f.pattern);
    if (!hit) {
      configMissed.push(f.anchor);
      continue;
    }
    urls.set(f.anchor, githubBlobUrl(cfg, pinRef, hit.file, hit.line));
  }
  const result = processConfigMdx(configPath, urls);
  totalUpdated += result.updated;
  if (configMissed.length) allMissed['configuration'] = configMissed;
  console.log(
    `configuration: ${result.updated} field links${configMissed.length ? `, ${configMissed.length} unresolved` : ''}`
  );
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
