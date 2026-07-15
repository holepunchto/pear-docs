// scripts/bare-refgen/emit-jsdoc.ts
//
// Turn the author-written descriptions in the layout manifests into upstream
// TSDoc: for each generated module, clone its repo into ../ts-doc-upstream/<name>,
// create a `chore/ts-doc` branch, splice a `/** … */` block above each matching
// declaration in the shipped `.d.ts` files, and commit. NEVER pushes.
//
// The descriptions are the single source of truth once merged upstream — the
// doc pages then read them straight from the .d.ts and the manifest `describe`
// entries can be removed. This mirrors the building-blocks emit-jsdoc pattern.
//
// Run: npm run emit:ts-doc            (all generated modules)
//      npm run emit:ts-doc -- --only bare-os

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { OUT_DIR, readmePolicyOf } from './config';
import { loadLayout } from './layout';
import { renderReadmeApi } from './render';
import type { BareModel } from './model';

const execFile = promisify(execFileCb);

const WORK_DIR = resolve('..', 'ts-doc-upstream');
const BRANCH = 'chore/ts-doc';
const COMMIT_MSG =
  'chore: document the public API (TSDoc + README) from the type declarations\n\n' +
  'Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>';

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFile('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 });
  return stdout.trim();
}

/** A `throws` bullet → a TSDoc `@throws {Type} rest` line (Type from a leading `` `X` ``). */
function throwsTag(bullet: string): string {
  const m = bullet.match(/^\s*`([^`]+)`\s*(?:—|-|:)?\s*(.*)$/);
  return m ? ` * @throws {${m[1].trim()}} ${m[2].trim()}`.trimEnd() : ` * @throws ${bullet.trim()}`;
}

/** Build a JSDoc comment (single-line only when there is nothing but a description). */
function jsDocLines(
  description: string,
  params: Record<string, string>,
  returns?: string,
  throwsArr: string[] = [],
): string[] {
  const paramNames = Object.keys(params);
  if (paramNames.length === 0 && !returns && throwsArr.length === 0) return [`/** ${description} */`];
  const lines = ['/**'];
  if (description) lines.push(` * ${description}`);
  for (const p of paramNames) lines.push(` * @param ${p} - ${params[p]}`);
  if (returns) lines.push(` * @returns ${returns}`);
  for (const t of throwsArr) lines.push(throwsTag(t));
  lines.push(' */');
  return lines;
}

/**
 * Also index each map entry under its bare last segment (`DatabaseSync.prepare`
 * → `prepare`), so a manifest keyed with the MODEL's names still matches when
 * emit walks a `.d.ts` whose declaration is named differently (e.g. the
 * interface is `SQLiteDatabaseSync`). Skipped when the bare segment is already a
 * key or is ambiguous (two qualified keys share it), to avoid mis-attribution.
 */
function withBareAliases<T>(map: Record<string, T>): Record<string, T> {
  const count: Record<string, number> = {};
  for (const k of Object.keys(map)) {
    const b = k.split('.').pop()!;
    if (b !== k) count[b] = (count[b] ?? 0) + 1;
  }
  const out: Record<string, T> = { ...map };
  for (const k of Object.keys(map)) {
    const b = k.split('.').pop()!;
    if (b !== k && count[b] === 1 && !Object.hasOwn(out, b)) out[b] = map[k];
  }
  return out;
}

/** Insert TSDoc above every top-level declaration named in `describe`/`params`/`returns`, and
 *  above class/interface members — Bare's `.d.ts` files declare instance methods via
 *  `interface Foo { method(...) }` merged with `declare class Foo {}`, so a member's
 *  documentation lives one level below the statements `walk` used to see. */
function injectJsDoc(
  src: string,
  describe: Record<string, string>,
  params: Record<string, Record<string, string>>,
  returns: Record<string, string>,
  throwsMap: Record<string, string[]>,
): string {
  const sf = ts.createSourceFile('d.ts', src, ts.ScriptTarget.ESNext, true);
  const edits: { pos: number; text: string }[] = [];
  // A merged `interface Foo` / `declare class Foo` / `declare namespace Foo` shares one
  // describe key ("Foo") across up to three declaration sites — document it once, on
  // whichever site is encountered first, instead of stamping the same comment 3x.
  const documented = new Set<string>();

  // Object.hasOwn throughout — a declaration named `toString`/`constructor`
  // would otherwise pick up the Object.prototype member.
  const consider = (node: ts.Node, names: string[]) => {
    const key = names.find(
      (n) =>
        Object.hasOwn(describe, n) || Object.hasOwn(params, n) ||
        Object.hasOwn(returns, n) || Object.hasOwn(throwsMap, n),
    );
    if (!key || documented.has(key)) return;
    const description = Object.hasOwn(describe, key) ? describe[key] : undefined;
    const paramMap = Object.hasOwn(params, key) ? params[key] : {};
    const returnsDesc = Object.hasOwn(returns, key) ? returns[key] : undefined;
    const throwsArr = Object.hasOwn(throwsMap, key) ? throwsMap[key] : [];
    if (!description && Object.keys(paramMap).length === 0 && !returnsDesc && throwsArr.length === 0) return;
    if (ts.getJSDocCommentsAndTags(node).length > 0) return; // already documented
    documented.add(key);
    const start = node.getStart(sf);
    const indent = ' '.repeat(sf.getLineAndCharacterOfPosition(start).character);
    edits.push({
      pos: start,
      text: jsDocLines(description ?? '', paramMap, returnsDesc, throwsArr).join(`\n${indent}`) + `\n${indent}`,
    });
  };

  // A member may be keyed bare (`parse`) or qualified (`URL.parse`) — try both.
  const qualified = (prefix: string, name: string) => (prefix ? [`${prefix}.${name}`, name] : [name]);

  const memberName = (member: ts.ClassElement | ts.TypeElement): string | undefined => {
    if (ts.isConstructorDeclaration(member) || ts.isConstructSignatureDeclaration(member)) return 'constructor';
    if ('name' in member && member.name) return member.name.getText(sf);
    return undefined;
  };

  // Instance members of a class/interface — the `interface Foo { method(...) }` /
  // `declare class Foo {}` merge pattern Bare uses for every stateful export.
  const walkMembers = (members: ts.NodeArray<ts.ClassElement | ts.TypeElement>, containerPrefix: string) => {
    for (const member of members) {
      if (
        ts.isMethodDeclaration(member) || ts.isMethodSignature(member) ||
        ts.isPropertyDeclaration(member) || ts.isPropertySignature(member) ||
        ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member) ||
        ts.isConstructorDeclaration(member) || ts.isConstructSignatureDeclaration(member)
      ) {
        const name = memberName(member);
        if (name) consider(member, qualified(containerPrefix, name));
      }
    }
  };

  const walk = (statements: ts.NodeArray<ts.Statement>, prefix: string) => {
    for (const stmt of statements) {
      if (ts.isModuleDeclaration(stmt) && stmt.body && ts.isModuleBlock(stmt.body)) {
        const ns = stmt.name.getText(sf);
        consider(stmt, qualified(prefix, ns));
        walk(stmt.body.statements, prefix ? `${prefix}.${ns}` : ns); // recurse into the namespace
      } else if (ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt)) {
        const name = stmt.name?.getText(sf);
        if (name) {
          consider(stmt, qualified(prefix, name));
          walkMembers(stmt.members, prefix ? `${prefix}.${name}` : name);
        }
      } else if (
        ts.isFunctionDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) || ts.isEnumDeclaration(stmt)
      ) {
        const name = stmt.name?.getText(sf);
        if (name) consider(stmt, qualified(prefix, name));
      } else if (ts.isVariableStatement(stmt)) {
        const name = stmt.declarationList.declarations[0]?.name.getText(sf);
        if (name) consider(stmt, qualified(prefix, name));
      }
    }
  };
  walk(sf.statements, '');

  // Apply high-to-low so earlier offsets stay valid.
  edits.sort((a, b) => b.pos - a.pos);
  let out = src;
  for (const e of edits) out = out.slice(0, e.pos) + e.text + out.slice(e.pos);
  return out;
}

const MARK_START = '<!-- bare-refgen:api start -->';
const MARK_END = '<!-- bare-refgen:api end -->';

/** Replace the README's `## API` section (level-2) with `body`, else append it. */
function replaceApiSection(readme: string, body: string): string {
  const lines = readme.split('\n');
  const start = lines.findIndex((l) => /^##\s+API\b/.test(l));
  if (start === -1) return `${readme.trimEnd()}\n\n${body}`;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return [...lines.slice(0, start), body.trimEnd(), '', ...lines.slice(end)].join('\n');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Update the README per policy. 'markers' (default) owns only a fenced region,
 * preserving surrounding prose; 'replace' overwrites the whole `## API` section;
 * 'skip' leaves it alone. Returns the new text, or null if nothing changed.
 */
function syncReadme(readme: string, apiMd: string, policy: 'markers' | 'replace' | 'skip'): string | null {
  if (policy === 'skip') return null;
  if (policy === 'replace') {
    const next = replaceApiSection(readme, apiMd);
    return next === readme ? null : next;
  }
  // 'markers'
  const block = `${MARK_START}\n${apiMd.trimEnd()}\n${MARK_END}`;
  let next: string;
  if (readme.includes(MARK_START) && readme.includes(MARK_END)) {
    const re = new RegExp(`${escapeRe(MARK_START)}[\\s\\S]*?${escapeRe(MARK_END)}`);
    next = readme.replace(re, block);
  } else {
    // Establish the fenced region where `## API` currently is (or append it).
    next = replaceApiSection(readme, block);
  }
  return next === readme ? null : next;
}

async function ensureClone(name: string, repoUrl: string): Promise<{ dir: string; base: string }> {
  const dir = join(WORK_DIR, name);
  if (!existsSync(join(dir, '.git'))) {
    await mkdir(WORK_DIR, { recursive: true });
    console.log(`  cloning ${repoUrl} …`);
    await execFile('git', ['clone', '--depth', '1', `${repoUrl}.git`, dir], { maxBuffer: 64 * 1024 * 1024 });
  }
  // The repo's default branch — so re-runs reset cleanly rather than stacking.
  const base =
    (await git(dir, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).catch(() => '')).replace(
      /^origin\//,
      '',
    ) || 'main';
  return { dir, base };
}

async function openPr(dir: string, model: BareModel): Promise<void> {
  const pat = process.env.UPSTREAM_PAT;
  const fork = process.env.UPSTREAM_FORK_OWNER;
  if (!pat || !fork) {
    console.log('    (skipping PR: set UPSTREAM_PAT + UPSTREAM_FORK_OWNER to push to your fork)');
    return;
  }
  const repoPath = model.repoUrl!.split('github.com/')[1]; // e.g. holepunchto/bare-os
  const repoName = repoPath.split('/')[1];
  const forkUrl = `https://x-access-token:${pat}@github.com/${fork}/${repoName}.git`;
  await git(dir, ['remote', 'remove', 'fork']).catch(() => {});
  await git(dir, ['remote', 'add', 'fork', forkUrl]);
  await git(dir, ['push', '--force', 'fork', BRANCH]);
  await execFile('gh', ['pr', 'create', '--repo', repoPath, '--head', `${fork}:${BRANCH}`,
    '--title', 'Document the public API from the type declarations',
    '--body', 'Generated TSDoc + regenerated README `## API` from the shipped type declarations.'],
    { cwd: dir, env: { ...process.env, GH_TOKEN: pat } });
  console.log(`    → PR opened against ${repoPath} from ${fork}:${BRANCH}`);
}

async function emitOne(name: string, pr: boolean): Promise<void> {
  const modelPath = join(OUT_DIR, name, 'api-model.json');
  if (!existsSync(modelPath)) {
    console.log(`  ⚠ ${name}: no api-model.json (run gen:bare-refs first) — skipping`);
    return;
  }
  const model = JSON.parse(await readFile(modelPath, 'utf8')) as BareModel;
  if (!model.repoUrl) {
    console.log(`  ⚠ ${name}: no repo URL in model — skipping`);
    return;
  }
  const layout = await loadLayout(name);
  // Alias model-qualified keys to their bare segment so they match when emit
  // walks a `.d.ts` whose declaration names differ from the model's.
  const describe = withBareAliases(layout?.describe ?? {});
  const params = withBareAliases(layout?.params ?? {});
  const returns = withBareAliases(layout?.returns ?? {});
  const throwsMap = withBareAliases(layout?.throws ?? {});

  const { dir, base } = await ensureClone(name, model.repoUrl);
  // Reset onto the default branch so re-runs produce one clean commit; fall back
  // to a plain branch create if that ref isn't present (e.g. odd shallow clones).
  await git(dir, ['checkout', '-B', BRANCH, `origin/${base}`]).catch(() =>
    git(dir, ['checkout', '-B', BRANCH]),
  );

  // 1) TSDoc into the shipped declarations.
  let dtsTouched = 0;
  const dtsFiles = (await git(dir, ['ls-files', '*.d.ts'])).split('\n').filter(Boolean);
  for (const rel of dtsFiles) {
    const abs = join(dir, rel);
    const src = await readFile(abs, 'utf8');
    const next = injectJsDoc(src, describe, params, returns, throwsMap);
    if (next !== src) {
      await writeFile(abs, next);
      dtsTouched++;
    }
  }

  // 2) Regenerate the README `## API` from the same model (policy-controlled).
  let readmeTouched = false;
  const readmePath = join(dir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf8');
    const next = syncReadme(readme, renderReadmeApi(model, layout), readmePolicyOf(name));
    if (next !== null) {
      await writeFile(readmePath, next);
      readmeTouched = true;
    }
  }

  await git(dir, ['add', '-A']);
  const staged = await git(dir, ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log(`  • ${name}: branch ${BRANCH} created (nothing to change)`);
    return;
  }
  await execFile('git', ['-C', dir, 'commit', '-m', COMMIT_MSG], { maxBuffer: 64 * 1024 * 1024 });
  console.log(
    `  ✓ ${name}: ${BRANCH} — TSDoc in ${dtsTouched} file(s)` +
      `${readmeTouched ? ' + README ## API' : ''} (committed, not pushed)`,
  );
  if (pr) await openPr(dir, model);
}

async function main(): Promise<void> {
  const pr = process.argv.includes('--pr');
  const onlyIdx = process.argv.indexOf('--only');
  let names: string[];
  if (onlyIdx !== -1) {
    names = (process.argv[onlyIdx + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    names = (await readdir(OUT_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }
  console.log(`📝 Emitting TSDoc + README to ${BRANCH} for: ${names.join(', ')}\n   work dir: ${WORK_DIR}${pr ? ' · will open PRs' : ''}\n`);
  for (const name of names) {
    try {
      await emitOne(name, pr);
    } catch (err) {
      console.error(`  ✗ ${name}: ${(err as Error).message}`);
    }
  }
  const tail = pr ? '' : ' Nothing was pushed';
  console.log(`\n✅ Done. Review with: git -C ../ts-doc-upstream/<name> show.${tail}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
