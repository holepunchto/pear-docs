// scripts/check-examples.ts
/**
 * check-examples — extract, validate, and execute the code examples in
 * `content/how-to/**`.
 *
 * Every fenced code block under `content/how-to/` must declare its intent via
 * meta on the opening fence:
 *
 *   ```javascript example=hyperdht-chat step=write file=server-app/index.js
 *   ...
 *   ```
 *
 *   ```sh example=hyperdht-chat step=run process=server expect="listening on:" capture-key="listening on: ([0-9a-f]+)"
 *   bare server-app
 *   ```
 *
 *   ```sh skip="live-dht"
 *   pear touch
 *   ```
 *
 * Block kinds (set via `step=`):
 *   - setup : run body as a bash script in the scenario cwd.
 *   - write : write body to `file=<rel>` (relative to scenario cwd).
 *   - run   : spawn `body` (or `cmd=`) as a long-lived process named
 *             `process=<name>`. Supports `expect=`, `capture-<name>="regex"`,
 *             `stdin="..."`, `timeout=<ms>`, `cwd=<rel>`.
 *
 * Cross-process orchestration (sends, late asserts) is expressed as JSX
 * comments which are invisible in the rendered docs:
 *
 *   {@harness step=send process=writer data="hello\n" delay=500}
 *   {@harness step=expect process=reader contains="Block 0: hello" timeout=15000}
 *
 * Any fence without `example=` or `skip=` is a hard error: we don't want to
 * silently lose coverage. Use `skip="reason"` for blocks that are not
 * realistically runnable in CI (live DHT, signed installers, multisig, etc).
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, delimiter } from 'node:path';
import { spawn, ChildProcess, spawnSync } from 'node:child_process';
import { CONTENT_DIR, getFiles } from './helpers';

const HOW_TO_DIR = join(CONTENT_DIR, 'how-to');
const TMP_DIR = '.examples-tmp';
const DEFAULT_TIMEOUT_MS = 30_000;
const SYSTEM_BASH = '/bin/bash';
const RESOLVED_BASH = commandPath('bash') ?? SYSTEM_BASH;
const RESOLVED_NPM = commandPath('npm') ?? 'npm';
const RESOLVED_NODE = process.execPath;

type Meta = Record<string, string>;

interface Fence {
  file: string;
  line: number;
  lang: string;
  meta: Meta;
  body: string;
}

interface Directive {
  file: string;
  line: number;
  meta: Meta;
}

type Step =
  | { kind: 'setup'; fence: Fence }
  | { kind: 'write'; fence: Fence; file: string }
  | { kind: 'run'; fence: Fence; process: string }
  | { kind: 'send'; directive: Directive; process: string }
  | { kind: 'expect'; directive: Directive; process: string }
  | { kind: 'copy'; directive: Directive; from: string; to: string };

interface Scenario {
  id: string;
  docFile: string;
  steps: Step[];
}

interface SkippedFence {
  fence: Fence;
  reason: string;
}

interface ScenarioReport {
  id: string;
  docFile: string;
  status: 'ok' | 'failed';
  failure?: { step: string; message: string; tail: string };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Fence + directive parsing
// ---------------------------------------------------------------------------

const FENCE_RE = /^(`{3,})([^\s`]*)([^\n]*)\n([\s\S]*?)^\1\s*$/gm;

// Directives live inside JSX comments so they don't render or trip up MDX's
// expression parser:
//   {/* @harness example=foo step=send process=writer data="hello\n" */}
const DIRECTIVE_RE = /\{\/\*\s*@harness\s+([\s\S]+?)\s*\*\/\}/g;

/** Tokenize a meta string like `step=run process=server expect="listening on:"`. */
function parseMeta(metaStr: string): Meta {
  const out: Meta = {};
  const re = /([\w-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s"']+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(metaStr)) !== null) {
    const key = m[1];
    const raw = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
    out[key] = unescape(raw);
  }
  return out;
}

function unescape(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseFences(file: string, content: string): Fence[] {
  const fences: Fence[] = [];
  // Strip JSX comments before scanning so a fenced block embedded in a
  // commented-out section isn't picked up.
  const withoutComments = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) =>
    '\n'.repeat((m.match(/\n/g) || []).length)
  );
  let m: RegExpExecArray | null;
  while ((m = FENCE_RE.exec(withoutComments)) !== null) {
    const lang = (m[2] || '').trim();
    const metaStr = (m[3] || '').trim();
    const body = m[4];
    const line = withoutComments.slice(0, m.index).split('\n').length;
    fences.push({ file, line, lang, meta: parseMeta(metaStr), body });
  }
  return fences;
}

function parseDirectives(file: string, content: string): Directive[] {
  const out: Directive[] = [];
  let m: RegExpExecArray | null;
  while ((m = DIRECTIVE_RE.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    out.push({ file, line, meta: parseMeta(m[1]) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface Classified {
  scenarios: Map<string, Scenario>;
  skipped: SkippedFence[];
  errors: string[];
}

async function classify(): Promise<Classified> {
  const files = await getFiles(HOW_TO_DIR);
  const scenarios = new Map<string, Scenario>();
  const skipped: SkippedFence[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const fences = parseFences(file, content);
    const directives = parseDirectives(file, content);

    // Build a single line-ordered queue of "thing to classify" so fence-driven
    // and directive-driven steps interleave in their MDX-source order. This
    // matters when a directive (e.g. `step=copy`) needs to land before a
    // later `step=run` that depends on the copied fixture.
    type Item =
      | { kind: 'fence'; line: number; fence: Fence }
      | { kind: 'directive'; line: number; directive: Directive };
    const items: Item[] = [
      ...fences.map((f): Item => ({ kind: 'fence', line: f.line, fence: f })),
      ...directives.map(
        (d): Item => ({ kind: 'directive', line: d.line, directive: d })
      ),
    ].sort((a, b) => a.line - b.line);

    for (const item of items) {
      if (item.kind === 'fence') {
        const { fence } = item;
        const { meta } = fence;

        if (meta.skip) {
          skipped.push({ fence, reason: meta.skip });
          continue;
        }

        if (!meta.example) {
          errors.push(
            `${file}:${fence.line}: code fence is missing \`example=\` or \`skip=\` meta (lang=${fence.lang || 'none'})`
          );
          continue;
        }

        const step = parseStep(fence);
        if ('error' in step) {
          errors.push(`${file}:${fence.line}: ${step.error}`);
          continue;
        }

        const id = `${file}::${meta.example}`;
        let scenario = scenarios.get(id);
        if (!scenario) {
          scenario = { id: meta.example, docFile: file, steps: [] };
          scenarios.set(id, scenario);
        }
        scenario.steps.push(step.step);
      } else {
        const { directive } = item;
        const { meta } = directive;
        if (!meta.example) {
          errors.push(
            `${file}:${directive.line}: @harness directive is missing \`example=\``
          );
          continue;
        }
        const step = parseDirectiveStep(directive);
        if ('error' in step) {
          errors.push(`${file}:${directive.line}: ${step.error}`);
          continue;
        }
        const id = `${file}::${meta.example}`;
        let scenario = scenarios.get(id);
        if (!scenario) {
          scenario = { id: meta.example, docFile: file, steps: [] };
          scenarios.set(id, scenario);
        }
        scenario.steps.push(step.step);
      }
    }
  }

  return { scenarios, skipped, errors };
}

function parseStep(fence: Fence): { step: Step } | { error: string } {
  const kind = fence.meta.step;
  switch (kind) {
    case 'setup':
      return { step: { kind: 'setup', fence } };
    case 'write': {
      const file = fence.meta.file;
      if (!file) return { error: '`step=write` requires `file=<path>`' };
      return { step: { kind: 'write', fence, file } };
    }
    case 'run': {
      const proc = fence.meta.process || 'main';
      return { step: { kind: 'run', fence, process: proc } };
    }
    case undefined:
      return { error: 'fence has `example=` but no `step=`' };
    default:
      return { error: `unknown step kind: ${kind}` };
  }
}

function parseDirectiveStep(d: Directive): { step: Step } | { error: string } {
  const kind = d.meta.step;
  switch (kind) {
    case 'send': {
      const proc = d.meta.process;
      if (!proc) return { error: '`step=send` requires `process=<name>`' };
      return { step: { kind: 'send', directive: d, process: proc } };
    }
    case 'expect': {
      const proc = d.meta.process;
      if (!proc) return { error: '`step=expect` requires `process=<name>`' };
      if (!d.meta.contains)
        return { error: '`step=expect` requires `contains="..."`' };
      return { step: { kind: 'expect', directive: d, process: proc } };
    }
    case 'copy': {
      const from = d.meta.from;
      const to = d.meta.to;
      if (!from || !to)
        return { error: '`step=copy` requires `from=` and `to=`' };
      return { step: { kind: 'copy', directive: d, from, to } };
    }
    case undefined:
      return { error: 'directive missing `step=`' };
    default:
      return { error: `unknown @harness step kind: ${kind}` };
  }
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

interface RunningProc {
  name: string;
  child: ChildProcess;
  buffer: string;
  exited: { code: number | null; signal: NodeJS.Signals | null } | null;
}

function substitute(input: string, captures: Map<string, string>): string {
  return input.replace(/\$\{(\w[\w-]*)\}/g, (_, name) => {
    const v = captures.get(name);
    if (v === undefined)
      throw new Error(`unresolved capture: \${${name}} (have: ${[...captures.keys()].join(', ') || 'none'})`);
    return v;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollFor(
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs = 100
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(intervalMs);
  }
  return predicate();
}

function tail(buf: string, lines = 40): string {
  return buf.split('\n').slice(-lines).join('\n');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function childEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // The repo .npmrc reads `${GITHUB_TOKEN}`. Default it to an empty string so
    // scenario-local installs parse cleanly without requiring private-package auth.
    GITHUB_TOKEN: '',
    // Pin Node/npm resolution so scenario setup does not accidentally fall back
    // to an older globally-installed npm (for example npm@6 under Node 25).
    PATH: [dirname(RESOLVED_NODE), process.env.PATH || '']
      .filter(Boolean)
      .join(delimiter),
    npm_execpath: RESOLVED_NPM,
    npm_node_execpath: RESOLVED_NODE,
  } as NodeJS.ProcessEnv;
}

function shellPreamble(): string {
  return [
    `export PATH=${shellQuote(childEnv().PATH || '')}`,
    `export npm_execpath=${shellQuote(RESOLVED_NPM)}`,
    `export npm_node_execpath=${shellQuote(RESOLVED_NODE)}`,
    `npm() { ${shellQuote(RESOLVED_NPM)} "$@"; }`,
    `node() { ${shellQuote(RESOLVED_NODE)} "$@"; }`,
  ].join('\n');
}

async function runScenario(scenario: Scenario): Promise<ScenarioReport> {
  const start = Date.now();
  const slug = `${scenario.docFile
    .replace(/^content\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')}__${scenario.id}`;
  const cwd = resolve(TMP_DIR, slug);

  await rm(cwd, { recursive: true, force: true });
  await mkdir(cwd, { recursive: true });

  const procs = new Map<string, RunningProc>();
  const captures = new Map<string, string>();
  let lastStepLabel = 'init';

  const killTree = (pid: number, signal: NodeJS.Signals) => {
    try {
      // Negative PID targets the entire process group (set up via `detached: true`).
      process.kill(-pid, signal);
    } catch {
      try {
        process.kill(pid, signal);
      } catch {
        /* already gone */
      }
    }
  };
  const teardown = async () => {
    for (const p of procs.values()) {
      if (p.exited || !p.child.pid) continue;
      killTree(p.child.pid, 'SIGTERM');
    }
    await sleep(2_000);
    for (const p of procs.values()) {
      if (p.exited || !p.child.pid) continue;
      killTree(p.child.pid, 'SIGKILL');
    }
  };

  try {
    for (const step of scenario.steps) {
      lastStepLabel = labelFor(step);
      switch (step.kind) {
        case 'setup':
          await execSetup(step.fence.body, cwd);
          break;
        case 'write':
          await execWrite(step.file, step.fence.body, cwd);
          break;
        case 'run':
          await execRun(step, cwd, procs, captures);
          break;
        case 'send':
          await execSend(step, procs, captures);
          break;
        case 'expect':
          await execExpect(step, procs, captures);
          break;
        case 'copy':
          await execCopy(step, cwd);
          break;
      }
    }

    return {
      id: scenario.id,
      docFile: scenario.docFile,
      status: 'ok',
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const tails = [...procs.entries()]
      .map(([name, p]) => `--- ${name} ---\n${tail(p.buffer)}`)
      .join('\n');
    return {
      id: scenario.id,
      docFile: scenario.docFile,
      status: 'failed',
      failure: { step: lastStepLabel, message, tail: tails },
      durationMs: Date.now() - start,
    };
  } finally {
    await teardown();
  }
}

function labelFor(step: Step): string {
  switch (step.kind) {
    case 'setup':
      return `setup (${step.fence.file}:${step.fence.line})`;
    case 'write':
      return `write ${step.file} (${step.fence.file}:${step.fence.line})`;
    case 'run':
      return `run ${step.process} (${step.fence.file}:${step.fence.line})`;
    case 'send':
      return `send to ${step.process} (${step.directive.file}:${step.directive.line})`;
    case 'expect':
      return `expect from ${step.process} (${step.directive.file}:${step.directive.line})`;
    case 'copy':
      return `copy ${step.from} -> ${step.to} (${step.directive.file}:${step.directive.line})`;
  }
}

async function execCopy(
  step: Extract<Step, { kind: 'copy' }>,
  scenarioCwd: string
): Promise<void> {
  const src = resolve(process.cwd(), step.from);
  const dst = resolve(scenarioCwd, step.to);
  await mkdir(dirname(dst), { recursive: true });
  const { copyFile } = await import('node:fs/promises');
  await copyFile(src, dst);
}

async function execSetup(body: string, cwd: string): Promise<void> {
  await new Promise<void>((resolveP, rejectP) => {
    const child = spawn(
      RESOLVED_BASH,
      ['-eu', '-o', 'pipefail', '-c', `${shellPreamble()}\n${body}`],
      {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: childEnv(),
      }
    );
    let out = '';
    child.stdout?.on('data', (d) => (out += d.toString()));
    child.stderr?.on('data', (d) => (out += d.toString()));
    child.on('error', rejectP);
    child.on('exit', (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`setup script exited with code ${code}\n${tail(out)}`));
    });
  });
}

async function execWrite(file: string, body: string, cwd: string): Promise<void> {
  const target = resolve(cwd, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
}

async function execRun(
  step: Extract<Step, { kind: 'run' }>,
  scenarioCwd: string,
  procs: Map<string, RunningProc>,
  captures: Map<string, string>
): Promise<void> {
  const { fence, process: name } = step;
  if (procs.has(name)) {
    throw new Error(`process \`${name}\` is already running`);
  }
  const rawCmd = fence.meta.cmd ?? firstNonEmptyLine(fence.body);
  if (!rawCmd) throw new Error('run step has no command');
  const cmd = substitute(rawCmd, captures);
  const runCwd = fence.meta.cwd
    ? resolve(scenarioCwd, fence.meta.cwd)
    : scenarioCwd;
  const stdinValue = fence.meta.stdin
    ? substitute(fence.meta.stdin, captures)
    : undefined;
  const timeout = Number(fence.meta.timeout || DEFAULT_TIMEOUT_MS);

  // Always pipe stdin so later @harness `step=send` directives can write to it.
  // `detached: true` puts the bash + its descendants in a new process group so
  // teardown can SIGTERM/SIGKILL the whole tree via `kill(-pid)`. Without this,
  // signals only reach the bash wrapper and the actual `bare ...` grandchild
  // can outlive the harness.
  const child = spawn(RESOLVED_BASH, ['-c', `${shellPreamble()}\n${cmd}`], {
    cwd: runCwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: childEnv(),
    detached: true,
  });
  const rp: RunningProc = { name, child, buffer: '', exited: null };
  procs.set(name, rp);
  child.stdout?.on('data', (d) => (rp.buffer += d.toString()));
  child.stderr?.on('data', (d) => (rp.buffer += d.toString()));
  child.on('exit', (code, signal) => {
    rp.exited = { code, signal };
  });
  child.stdin?.on('error', () => {
    /* swallow EPIPE after child exits */
  });

  if (stdinValue !== undefined) {
    child.stdin?.write(stdinValue);
    if (fence.meta['stdin-close'] === 'true') child.stdin?.end();
  }

  const expect = fence.meta.expect;
  if (expect) {
    const ok = await pollFor(
      () => rp.buffer.includes(expect) || rp.exited !== null,
      timeout
    );
    if (rp.exited && !rp.buffer.includes(expect)) {
      throw new Error(
        `process \`${name}\` exited (code=${rp.exited.code} signal=${rp.exited.signal}) before output included \`${expect}\``
      );
    }
    if (!ok) {
      throw new Error(
        `timed out after ${timeout}ms waiting for \`${name}\` to emit \`${expect}\``
      );
    }
    applyCaptures(fence.meta, rp.buffer, captures);
  }

  const aliveFor = Number(fence.meta['expect-alive'] || 0);
  if (aliveFor > 0) {
    await sleep(aliveFor);
    if (rp.exited) {
      throw new Error(
        `process \`${name}\` was expected to stay alive for ${aliveFor}ms but exited (code=${rp.exited.code} signal=${rp.exited.signal})`
      );
    }
  }
}

function applyCaptures(
  meta: Meta,
  buffer: string,
  captures: Map<string, string>
): void {
  for (const [key, value] of Object.entries(meta)) {
    if (!key.startsWith('capture-')) continue;
    const name = key.slice('capture-'.length);
    const re = new RegExp(value);
    const m = buffer.match(re);
    if (!m || m[1] === undefined) {
      throw new Error(
        `capture \`${name}\` regex did not match: /${value}/`
      );
    }
    captures.set(name, m[1]);
  }
}

function firstNonEmptyLine(body: string): string {
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#')) return t;
  }
  return '';
}

async function execSend(
  step: Extract<Step, { kind: 'send' }>,
  procs: Map<string, RunningProc>,
  captures: Map<string, string>
): Promise<void> {
  const proc = procs.get(step.process);
  if (!proc)
    throw new Error(`send: process \`${step.process}\` is not running`);
  if (proc.exited)
    throw new Error(`send: process \`${step.process}\` has exited`);
  const data = step.directive.meta.data ?? '';
  const delay = Number(step.directive.meta.delay || 0);
  if (delay > 0) await sleep(delay);
  const value = substitute(data, captures);
  proc.child.stdin?.write(value);
  if (step.directive.meta['stdin-close'] === 'true')
    proc.child.stdin?.end();
}

async function execExpect(
  step: Extract<Step, { kind: 'expect' }>,
  procs: Map<string, RunningProc>,
  captures: Map<string, string>
): Promise<void> {
  const proc = procs.get(step.process);
  if (!proc)
    throw new Error(`expect: process \`${step.process}\` is not running`);
  const contains = step.directive.meta.contains;
  const timeout = Number(step.directive.meta.timeout || DEFAULT_TIMEOUT_MS);
  const ok = await pollFor(
    () => proc.buffer.includes(contains) || proc.exited !== null,
    timeout
  );
  if (proc.exited && !proc.buffer.includes(contains)) {
    throw new Error(
      `expect: process \`${step.process}\` exited (code=${proc.exited.code}) before output included \`${contains}\``
    );
  }
  if (!ok) {
    throw new Error(
      `expect: timed out after ${timeout}ms waiting for \`${step.process}\` to emit \`${contains}\``
    );
  }
  applyCaptures(step.directive.meta, proc.buffer, captures);
}

// ---------------------------------------------------------------------------
// Preflight & main
// ---------------------------------------------------------------------------

function commandPath(cmd: string): string | null {
  const r = spawnSync(SYSTEM_BASH, ['-lc', `command -v ${cmd}`], {
    encoding: 'utf-8',
  });
  if (r.status !== 0) return null;
  const path = r.stdout.trim();
  return path ? path : null;
}

function commandExists(cmd: string): boolean {
  return commandPath(cmd) !== null;
}

function preflight(): string[] {
  const missing: string[] = [];
  for (const tool of ['bash', 'npm', 'pear', 'bare']) {
    if (!commandExists(tool)) missing.push(tool);
  }
  return missing;
}

interface Args {
  noExecute: boolean;
  filter?: string;
  strict: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { noExecute: false, strict: true };
  for (const a of argv) {
    if (a === '--no-execute') out.noExecute = true;
    else if (a === '--no-strict') out.strict = false;
    else if (a.startsWith('--filter=')) out.filter = a.slice('--filter='.length);
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return out;
}

function printHelp(): void {
  console.log(`\nUsage: check-examples [options]

Validates code fence annotations under content/how-to/** and executes every
runnable scenario end-to-end.

Options:
  --no-execute       Validate annotations only; don't spawn processes
  --no-strict        Allow unannotated fences (warning instead of error)
  --filter=<substr>  Only run scenarios whose id or doc path contains <substr>
  -h, --help         Show this help

Required runtimes when executing: bash, npm, pear, bare on PATH.
Workspaces are created under ${TMP_DIR}/ (gitignored) and torn down on failure.
`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const { scenarios, skipped, errors } = await classify();

  if (errors.length > 0) {
    console.error('\n[check-examples] annotation errors:');
    for (const e of errors) console.error('  ' + e);
    if (args.strict) {
      console.error(
        `\n${errors.length} fences are missing meta. Add \`example=\` (runnable) or \`skip="reason"\` (non-runnable) to every code fence under ${HOW_TO_DIR}.\n`
      );
      process.exit(1);
    }
  }

  console.log(
    `[check-examples] ${scenarios.size} scenarios, ${skipped.length} skipped fences across ${(await getFiles(HOW_TO_DIR)).length} how-to files`
  );

  if (args.noExecute) {
    console.log('[check-examples] --no-execute set; skipping process spawn');
    return;
  }

  const missing = preflight();
  if (missing.length > 0) {
    console.error(
      `[check-examples] missing required commands on PATH: ${missing.join(', ')}.\n` +
        `  pear-runtime: https://docs.pears.com/getting-started/install\n` +
        `  bare:         npm i -g bare-runtime\n`
    );
    process.exit(1);
  }

  await mkdir(TMP_DIR, { recursive: true });

  const reports: ScenarioReport[] = [];
  let failed = 0;
  for (const scenario of scenarios.values()) {
    if (args.filter) {
      const haystack = `${scenario.docFile} ${scenario.id}`;
      if (!haystack.includes(args.filter)) continue;
    }
    process.stdout.write(
      `\n[check-examples] ▶ ${scenario.docFile}#${scenario.id} ... `
    );
    const r = await runScenario(scenario);
    reports.push(r);
    if (r.status === 'ok') {
      process.stdout.write(`ok (${r.durationMs}ms)\n`);
    } else {
      failed++;
      process.stdout.write(`FAILED (${r.durationMs}ms)\n`);
      console.error(`  step: ${r.failure!.step}`);
      console.error(`  ${r.failure!.message.replace(/\n/g, '\n  ')}`);
      if (r.failure!.tail) console.error(`  output:\n  ${r.failure!.tail.replace(/\n/g, '\n  ')}`);
    }
  }

  await writeFile(
    join(TMP_DIR, 'report.json'),
    JSON.stringify(
      {
        skipped: skipped.map((s) => ({
          file: s.fence.file,
          line: s.fence.line,
          reason: s.reason,
        })),
        scenarios: reports,
      },
      null,
      2
    )
  );

  console.log(
    `\n[check-examples] done — ${reports.length - failed} ok, ${failed} failed, ${skipped.length} fences skipped`
  );
  // Spawned children may have left grandchildren holding the event loop open
  // (libuv handles in bare, fd-locks, etc.). The report is already written
  // and any failures recorded — exit explicitly so the shell pipeline closes.
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
