// scripts/test-examples.ts
/**
 * test-examples — smoke-test the runnable terminal examples under `examples/`.
 *
 * Unlike `check-examples.ts` (which derives scenarios from doc fences), this
 * runner is driven by an explicit manifest over the example app directories.
 * It launches each terminal `bare` app exactly as the docs describe, asserts
 * the known startup output, threads captured keys/topics between apps, then
 * tears everything down.
 *
 * Each app is run with its own directory as cwd (`bare index.js`), so the
 * relative paths the apps use for storage (`./storage`, `./*-storage`) and
 * fixtures (`./writer-dir`, `./dict.json`) resolve to the files committed
 * beside each app.
 *
 * Usage:
 *   tsx scripts/test-examples.ts                 # run every scenario
 *   tsx scripts/test-examples.ts --filter=<id>   # run one scenario (CI matrix)
 *
 * Required on PATH: bash, npm, and the latest `bare` (`npm i -g bare-runtime`).
 */

import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, delimiter } from 'node:path';
import { spawn, ChildProcess, spawnSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const EXAMPLES_DIR = resolve(REPO_ROOT, 'examples');
const DEFAULT_TIMEOUT_MS = 30_000;
const SYSTEM_BASH = '/bin/bash';
const RESOLVED_BASH = commandPath('bash') ?? SYSTEM_BASH;
const RESOLVED_NPM = commandPath('npm') ?? 'npm';
const RESOLVED_NODE = process.execPath;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

interface RunStep {
  kind: 'run';
  /** Logical process name, referenced by later send/expect steps. */
  process: string;
  /** App subdirectory (relative to the scenario `dir`) used as cwd. */
  app: string;
  /** Command to run inside `app`; supports `${capture}` substitution. */
  cmd: string;
  /** Substring expected on stdout/stderr before the step succeeds. */
  expect?: string;
  /** name -> regex (first capture group) recorded for later substitution. */
  capture?: Record<string, string>;
  timeoutMs?: number;
  /** Assert the process is still alive after this many ms (no `expect`). */
  expectAliveMs?: number;
}

interface SendStep {
  kind: 'send';
  process: string;
  data: string;
  delayMs?: number;
}

interface ExpectStep {
  kind: 'expect';
  process: string;
  contains: string;
  timeoutMs?: number;
}

type Step = RunStep | SendStep | ExpectStep;

interface Scenario {
  id: string;
  /** Scenario root, relative to `examples/`. */
  dir: string;
  /** App subdirs to `npm install` before running. */
  installs: string[];
  /** Generated dirs (relative to scenario `dir`) removed after the run. */
  artifacts: string[];
  steps: Step[];
}

const CONNECT = 'how-to/connect-to-peers';
const STORE = 'how-to/store-and-replicate';
const STREAM = 'how-to/stream-and-share-media';
const GETTING = 'getting-started';

const SCENARIOS: Scenario[] = [
  {
    // hello-pear-bare: the three-layer template (bin.mjs entry -> app.js host
    // -> Bare worker). Asserts the worker's "Hello from worker" reaches the
    // host over IPC — i.e. the full PearRuntime.run spawn + argv + FramedStream
    // round-trip works. `--no-updates` keeps it off the network.
    //
    // Uses the PATH `bare` (preflight requires it) rather than the local
    // `bare-runtime` devDep: `./node_modules/.bin/bare` cannot be relied on.
    // `bare-runtime` and its per-platform package (e.g. bare-runtime-linux-x64)
    // both declare the same `bin` name, so npm skips the conflicting shim on
    // Linux, and the platform binary lands without the executable bit — the
    // local path fails with either ENOENT or EACCES there while working on
    // macOS. All the other scenarios below already invoke `bare` from PATH.
    id: 'hello-pear-bare',
    dir: `${GETTING}/hello-pear-bare`,
    installs: ['.'],
    artifacts: [],
    steps: [
      {
        kind: 'run',
        process: 'app',
        app: '.',
        cmd: 'bare bin.mjs --no-updates',
        expect: 'Hello from worker',
        expectAliveMs: 1500,
        timeoutMs: 45_000,
      },
    ],
  },
  {
    // hello-pear-bare's `variant/single-thread` branch: same App ready-resource
    // shape as `main`, but `_open()` constructs PearRuntime directly instead of
    // spawning a Bare worker — no worker, no FramedStream IPC. There's no
    // separate worker holding demo peer-to-peer code, so unlike `hello-pear-bare`
    // there's no "Hello from worker" line; asserts the CLI's own ready log
    // instead, then (like `main`) stays alive since Corestore/Hyperswarm/
    // PearRuntime hold the event loop open.
    id: 'hello-pear-bare-single-thread',
    dir: `${GETTING}/hello-pear-bare-single-thread`,
    installs: ['.'],
    artifacts: [],
    steps: [
      {
        kind: 'run',
        process: 'app',
        app: '.',
        cmd: 'bare bin.mjs --no-updates',
        expect: 'CLI ready. Press Ctrl+C to stop.',
        expectAliveMs: 1500,
        timeoutMs: 45_000,
      },
    ],
  },
  {
    // hello-pear-bare's `variant/daemon` branch: `--no-updates` skips
    // `App.spawnUpdater(...)` entirely (bin.mjs's `if (updates !== false)`
    // guard), so no `App`/PearRuntime is ever constructed on this path and the
    // foreground command exits on its own right after logging — unlike `main`
    // and `single-thread`, this scenario must NOT assert `expectAliveMs`.
    id: 'hello-pear-bare-daemon',
    dir: `${GETTING}/hello-pear-bare-daemon`,
    installs: ['.'],
    artifacts: [],
    steps: [
      {
        kind: 'run',
        process: 'app',
        app: '.',
        cmd: 'bare bin.mjs --no-updates',
        expect: 'CLI ready.',
        timeoutMs: 45_000,
      },
    ],
  },
  {
    id: 'hyperdht-chat',
    dir: `${CONNECT}/connect-two-peers-by-key-with-hyperdht`,
    installs: ['server-app', 'client-app'],
    artifacts: [],
    steps: [
      {
        kind: 'run',
        process: 'server',
        app: 'server-app',
        cmd: 'bare index.js',
        expect: 'listening on:',
        capture: { key: 'listening on: ([0-9a-f]+)' },
        timeoutMs: 20_000,
      },
      {
        kind: 'run',
        process: 'client',
        app: 'client-app',
        cmd: 'bare index.js ${key}',
        expect: 'Connecting to:',
        timeoutMs: 15_000,
      },
      {
        kind: 'expect',
        process: 'server',
        contains: 'got a connection from:',
        timeoutMs: 30_000,
      },
    ],
  },
  {
    id: 'hyperswarm-chat',
    dir: `${CONNECT}/connect-to-many-peers-by-topic-with-hyperswarm`,
    installs: ['peer-app'],
    artifacts: [],
    steps: [
      {
        kind: 'run',
        process: 'peer1',
        app: 'peer-app',
        cmd: 'bare index.js',
        expect: 'joined topic:',
        capture: { topic: 'joined topic: ([0-9a-f]+)' },
        timeoutMs: 45_000,
      },
      {
        kind: 'run',
        process: 'peer2',
        app: 'peer-app',
        cmd: 'bare index.js ${topic}',
        expect: 'got a connection from:',
        timeoutMs: 45_000,
      },
    ],
  },
  {
    id: 'hypercore-replicate',
    dir: `${STORE}/replicate-and-persist-with-hypercore`,
    installs: ['writer-app', 'reader-app'],
    artifacts: ['writer-app/storage', 'reader-app/storage'],
    steps: [
      {
        kind: 'run',
        process: 'writer',
        app: 'writer-app',
        cmd: 'bare index.js',
        expect: 'hypercore key:',
        capture: { key: 'hypercore key: ([0-9a-f]+)' },
        timeoutMs: 20_000,
      },
      {
        kind: 'run',
        process: 'reader',
        app: 'reader-app',
        cmd: 'bare index.js ${key}',
        expect: 'Skipping',
        timeoutMs: 45_000,
      },
    ],
  },
  {
    id: 'corestore-multi',
    dir: `${STORE}/work-with-many-hypercores-using-corestore`,
    installs: ['multicore-writer-app', 'multicore-reader-app'],
    artifacts: [
      'multicore-writer-app/multicore-writer-storage',
      'multicore-reader-app/multicore-reader-storage',
    ],
    steps: [
      {
        kind: 'run',
        process: 'writer',
        app: 'multicore-writer-app',
        cmd: 'bare index.js',
        expect: 'main core key:',
        capture: { key: 'main core key: ([0-9a-f]+)' },
        timeoutMs: 20_000,
      },
      {
        kind: 'run',
        process: 'reader',
        app: 'multicore-reader-app',
        cmd: 'bare index.js ${key}',
        expectAliveMs: 8_000,
        timeoutMs: 45_000,
      },
    ],
  },
  {
    id: 'hyperbee-kv',
    dir: `${STORE}/share-append-only-databases-with-hyperbee`,
    installs: ['bee-writer-app', 'bee-reader-app', 'core-reader-app'],
    artifacts: [
      'bee-writer-app/bee-writer-storage',
      'bee-reader-app/bee-reader-storage',
      'core-reader-app/reader-storage',
    ],
    steps: [
      {
        kind: 'run',
        process: 'writer',
        app: 'bee-writer-app',
        cmd: 'bare index.js',
        expect: 'bee key:',
        capture: { key: 'bee key: ([0-9a-f]+)' },
        timeoutMs: 60_000,
      },
      {
        kind: 'run',
        process: 'reader',
        app: 'bee-reader-app',
        cmd: 'bare index.js ${key}',
        expect: 'core key here is:',
        timeoutMs: 45_000,
      },
      {
        kind: 'run',
        process: 'core-reader',
        app: 'core-reader-app',
        cmd: 'bare index.js ${key}',
        expect: 'Raw Block',
        timeoutMs: 45_000,
      },
    ],
  },
  {
    id: 'hyperdrive-fs',
    dir: `${STREAM}/create-a-full-peer-to-peer-filesystem-with-hyperdrive`,
    installs: ['drive-writer-app', 'drive-reader-app', 'drive-bee-reader-app'],
    artifacts: [
      'drive-writer-app/drive-writer-storage',
      'drive-reader-app/drive-reader-storage',
      'drive-bee-reader-app/drive-bee-reader-storage',
    ],
    steps: [
      {
        kind: 'run',
        process: 'writer',
        app: 'drive-writer-app',
        cmd: 'bare index.js',
        expect: 'drive key:',
        capture: { key: 'drive key: ([0-9a-f]+)' },
        timeoutMs: 45_000,
      },
      {
        kind: 'run',
        process: 'reader',
        app: 'drive-reader-app',
        cmd: 'bare index.js ${key}',
        expect: 'started mirroring remote drive',
        timeoutMs: 45_000,
      },
      { kind: 'send', process: 'writer', data: '\n', delayMs: 500 },
      {
        kind: 'expect',
        process: 'writer',
        contains: "started mirroring changes from './writer-dir' into the drive...",
        timeoutMs: 45_000,
      },
      {
        kind: 'run',
        process: 'bee-reader',
        app: 'drive-bee-reader-app',
        cmd: 'bare index.js ${key}',
        expect: 'hyperbee entry:',
        timeoutMs: 45_000,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Execution engine (ported from scripts/check-examples.ts)
// ---------------------------------------------------------------------------

interface RunningProc {
  name: string;
  child: ChildProcess;
  buffer: string;
  exited: { code: number | null; signal: NodeJS.Signals | null } | null;
}

interface ScenarioReport {
  id: string;
  status: 'ok' | 'failed';
  failure?: { step: string; message: string; tail: string };
  durationMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function substitute(input: string, captures: Map<string, string>): string {
  return input.replace(/\$\{(\w[\w-]*)\}/g, (_, name) => {
    const v = captures.get(name);
    if (v === undefined)
      throw new Error(
        `unresolved capture: \${${name}} (have: ${[...captures.keys()].join(', ') || 'none'})`
      );
    return v;
  });
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
    // app-local installs parse cleanly without requiring private-package auth.
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? '',
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

function applyCaptures(
  capture: Record<string, string> | undefined,
  buffer: string,
  captures: Map<string, string>
): void {
  if (!capture) return;
  for (const [name, pattern] of Object.entries(capture)) {
    const m = buffer.match(new RegExp(pattern));
    if (!m || m[1] === undefined) {
      throw new Error(`capture \`${name}\` regex did not match: /${pattern}/`);
    }
    captures.set(name, m[1]);
  }
}

function npmInstall(appDir: string): void {
  if (existsSync(join(appDir, 'node_modules'))) return;
  process.stdout.write(`    npm install (${appDir.replace(EXAMPLES_DIR + '/', '')}) ... `);
  const r = spawnSync(RESOLVED_NPM, ['install', '--no-audit', '--no-fund'], {
    cwd: appDir,
    env: childEnv(),
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf-8',
  });
  if (r.status !== 0) {
    process.stdout.write('FAILED\n');
    throw new Error(`npm install failed in ${appDir}\n${tail(r.stderr || '')}`);
  }
  process.stdout.write('ok\n');
}

function labelFor(step: Step): string {
  switch (step.kind) {
    case 'run':
      return `run ${step.process} (${step.app}: ${step.cmd})`;
    case 'send':
      return `send to ${step.process}`;
    case 'expect':
      return `expect from ${step.process} (${step.contains})`;
  }
}

async function execRun(
  step: RunStep,
  scenarioDir: string,
  procs: Map<string, RunningProc>,
  captures: Map<string, string>
): Promise<void> {
  if (procs.has(step.process)) {
    throw new Error(`process \`${step.process}\` is already running`);
  }
  const cmd = substitute(step.cmd, captures);
  const runCwd = resolve(scenarioDir, step.app);
  const timeout = step.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // `detached: true` puts bash + its `bare` descendants in their own process
  // group so teardown can SIGTERM/SIGKILL the whole tree via `kill(-pid)`.
  const child = spawn(RESOLVED_BASH, ['-c', `${shellPreamble()}\n${cmd}`], {
    cwd: runCwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: childEnv(),
    detached: true,
  });
  const rp: RunningProc = { name: step.process, child, buffer: '', exited: null };
  procs.set(step.process, rp);
  child.stdout?.on('data', (d) => (rp.buffer += d.toString()));
  child.stderr?.on('data', (d) => (rp.buffer += d.toString()));
  child.on('exit', (code, signal) => {
    rp.exited = { code, signal };
  });
  child.stdin?.on('error', () => {
    /* swallow EPIPE after child exits */
  });

  if (step.expect) {
    const ok = await pollFor(
      () => rp.buffer.includes(step.expect!) || rp.exited !== null,
      timeout
    );
    if (rp.exited && !rp.buffer.includes(step.expect)) {
      throw new Error(
        `process \`${step.process}\` exited (code=${rp.exited.code} signal=${rp.exited.signal}) before output included \`${step.expect}\``
      );
    }
    if (!ok) {
      throw new Error(
        `timed out after ${timeout}ms waiting for \`${step.process}\` to emit \`${step.expect}\``
      );
    }
    applyCaptures(step.capture, rp.buffer, captures);
  }

  if (step.expectAliveMs && step.expectAliveMs > 0) {
    await sleep(step.expectAliveMs);
    if (rp.exited) {
      throw new Error(
        `process \`${step.process}\` was expected to stay alive for ${step.expectAliveMs}ms but exited (code=${rp.exited.code} signal=${rp.exited.signal})\n${tail(rp.buffer)}`
      );
    }
  }
}

async function execSend(
  step: SendStep,
  procs: Map<string, RunningProc>,
  captures: Map<string, string>
): Promise<void> {
  const proc = procs.get(step.process);
  if (!proc) throw new Error(`send: process \`${step.process}\` is not running`);
  if (proc.exited) throw new Error(`send: process \`${step.process}\` has exited`);
  if (step.delayMs && step.delayMs > 0) await sleep(step.delayMs);
  proc.child.stdin?.write(substitute(step.data, captures));
}

async function execExpect(
  step: ExpectStep,
  procs: Map<string, RunningProc>
): Promise<void> {
  const proc = procs.get(step.process);
  if (!proc) throw new Error(`expect: process \`${step.process}\` is not running`);
  const timeout = step.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ok = await pollFor(
    () => proc.buffer.includes(step.contains) || proc.exited !== null,
    timeout
  );
  if (proc.exited && !proc.buffer.includes(step.contains)) {
    throw new Error(
      `expect: process \`${step.process}\` exited (code=${proc.exited.code}) before output included \`${step.contains}\``
    );
  }
  if (!ok) {
    throw new Error(
      `expect: timed out after ${timeout}ms waiting for \`${step.process}\` to emit \`${step.contains}\``
    );
  }
}

async function runScenario(scenario: Scenario): Promise<ScenarioReport> {
  const start = Date.now();
  const scenarioDir = resolve(EXAMPLES_DIR, scenario.dir);
  const procs = new Map<string, RunningProc>();
  const captures = new Map<string, string>();
  let lastStepLabel = 'install';

  const killTree = (pid: number, signal: NodeJS.Signals) => {
    try {
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
    for (const rel of scenario.artifacts) {
      await rm(resolve(scenarioDir, rel), { recursive: true, force: true });
    }
  };

  try {
    for (const app of scenario.installs) {
      npmInstall(resolve(scenarioDir, app));
    }

    for (const step of scenario.steps) {
      lastStepLabel = labelFor(step);
      switch (step.kind) {
        case 'run':
          await execRun(step, scenarioDir, procs, captures);
          break;
        case 'send':
          await execSend(step, procs, captures);
          break;
        case 'expect':
          await execExpect(step, procs);
          break;
      }
    }

    return { id: scenario.id, status: 'ok', durationMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const tails = [...procs.entries()]
      .map(([name, p]) => `--- ${name} ---\n${tail(p.buffer)}`)
      .join('\n');
    return {
      id: scenario.id,
      status: 'failed',
      failure: { step: lastStepLabel, message, tail: tails },
      durationMs: Date.now() - start,
    };
  } finally {
    await teardown();
  }
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

function preflight(): string[] {
  const missing: string[] = [];
  for (const tool of ['bash', 'npm', 'bare']) {
    if (commandPath(tool) === null) missing.push(tool);
  }
  return missing;
}

/**
 * The `hello-pear-*` scenarios boot `pear-runtime`, whose native addon needs a
 * reasonably current Bare. An older PATH `bare` (e.g. the standalone `bare`
 * package at 1.28.0) dies with an opaque V8 abort — "Cannot construct
 * SharedArrayBuffer with BackingStore of ArrayBuffer" — rather than anything
 * naming a version. Warn instead of failing: the other scenarios run fine on
 * older runtimes, so this must not block them.
 */
const MIN_BARE_FOR_PEAR_RUNTIME = [1, 29, 0];

function warnOnOldBare(): void {
  const r = spawnSync('bare', ['--version'], { encoding: 'utf-8', env: childEnv() });
  const raw = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const m = raw.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return;

  const found = [Number(m[1]), Number(m[2]), Number(m[3])];

  if (compareVersion(found, MIN_BARE_FOR_PEAR_RUNTIME) < 0) {
    console.error(
      `[test-examples] warning: PATH bare is v${found.join('.')}, older than ` +
        `v${MIN_BARE_FOR_PEAR_RUNTIME.join('.')}.\n` +
        `  The hello-pear-* scenarios boot pear-runtime and will abort inside V8 on this version.\n` +
        `  Fix: npm i -g bare-runtime (uninstall a conflicting global \`bare\` package first —\n` +
        `  both provide a \`bare\` bin, and npm silently keeps the existing one).\n`
    );
  }
}

function compareVersion(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

interface Args {
  filter?: string;
}

function parseArgs(): Args {
  const out: Args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--filter=')) out.filter = a.slice('--filter='.length);
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
  console.log(`\nUsage: test-examples [--filter=<scenario-id>]

Runs the terminal example apps under examples/ on the latest Bare runtime and
asserts their known startup output. Scenarios:
${SCENARIOS.map((s) => `  - ${s.id}`).join('\n')}

Required on PATH: bash, npm, bare (npm i -g bare-runtime).
`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  const missing = preflight();
  if (missing.length > 0) {
    console.error(
      `[test-examples] missing required commands on PATH: ${missing.join(', ')}.\n` +
        `  bare: npm i -g bare-runtime\n`
    );
    process.exit(1);
  }
  warnOnOldBare();

  const selected = args.filter
    ? SCENARIOS.filter((s) => s.id === args.filter)
    : SCENARIOS;

  if (args.filter && selected.length === 0) {
    console.error(
      `[test-examples] no scenario matches --filter=${args.filter}.\n` +
        `  available: ${SCENARIOS.map((s) => s.id).join(', ')}`
    );
    process.exit(2);
  }

  console.log(`[test-examples] running ${selected.length} scenario(s)`);

  let failed = 0;
  for (const scenario of selected) {
    process.stdout.write(`\n[test-examples] ▶ ${scenario.id}\n`);
    const r = await runScenario(scenario);
    if (r.status === 'ok') {
      process.stdout.write(`[test-examples] ✓ ${scenario.id} (${r.durationMs}ms)\n`);
    } else {
      failed++;
      process.stdout.write(`[test-examples] ✗ ${scenario.id} (${r.durationMs}ms)\n`);
      console.error(`  step: ${r.failure!.step}`);
      console.error(`  ${r.failure!.message.replace(/\n/g, '\n  ')}`);
      if (r.failure!.tail)
        console.error(`  output:\n  ${r.failure!.tail.replace(/\n/g, '\n  ')}`);
    }
  }

  console.log(
    `\n[test-examples] done — ${selected.length - failed} ok, ${failed} failed`
  );
  // Spawned grandchildren (bare/libuv handles) can keep the loop open; the
  // result is already known, so exit explicitly.
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
